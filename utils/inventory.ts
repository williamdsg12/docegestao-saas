import { supabase } from "@/lib/supabase";

export type BaseUnit = 'g' | 'ml' | 'un';
export type InputUnit = 'kg' | 'g' | 'L' | 'ml' | 'un' | 'unid';

/**
 * Converte um valor de uma unidade qualquer para a unidade base (g, ml, un).
 */
export function convertToBaseUnit(value: number, unit: InputUnit): { value: number; unit: BaseUnit } {
    const normalizedUnit = unit.toLowerCase();
    
    switch (normalizedUnit) {
        case 'kg':
            return { value: value * 1000, unit: 'g' };
        case 'l':
            return { value: value * 1000, unit: 'ml' };
        case 'g':
            return { value, unit: 'g' };
        case 'ml':
            return { value, unit: 'ml' };
        case 'un':
        case 'unid':
            return { value, unit: 'un' };
        default:
            return { value, unit: 'un' };
    }
}

/**
 * Registra uma movimentação de estoque e atualiza o saldo do ingrediente.
 */
export async function handleStockMovement({
    ingredientId,
    type,
    quantity,
    unit,
    origin,
    referenceId,
    tenantId,
    userId
}: {
    ingredientId: string;
    type: 'entrada' | 'saida' | 'ajuste';
    quantity: number;
    unit: InputUnit;
    origin: 'compra' | 'producao' | 'ajuste_manual';
    referenceId?: string;
    tenantId: string;
    userId: string;
}) {
    // 1. Converter para unidade base
    const { value: quantityBase, unit: unitBase } = convertToBaseUnit(quantity, unit);

    // 2. Buscar estoque atual
    const { data: ingredient, error: fetchError } = await supabase
        .from('ingredientes')
        .select('estoque_atual, custo_medio')
        .eq('id', ingredientId)
        .single();

    if (fetchError) throw fetchError;

    const currentStock = Number(ingredient.estoque_atual || 0);
    const newStock = type === 'entrada' ? currentStock + quantityBase : Math.max(0, currentStock - quantityBase);

    // 3. Registrar movimentação
    const { error: moveError } = await supabase
        .from('estoque_movimentacoes')
        .insert({
            tenant_id: tenantId,
            ingrediente_id: ingredientId,
            tipo: type,
            quantidade: quantityBase,
            unidade: unitBase,
            origem: origin,
            referencia_id: referenceId,
            usuario_id: userId
        });

    if (moveError) throw moveError;

    // 4. Atualizar saldo no ingrediente
    const { error: updateError } = await supabase
        .from('ingredientes')
        .update({ 
            estoque_atual: newStock,
            updated_at: new Date().toISOString()
        })
        .eq('id', ingredientId);

    if (updateError) throw updateError;

    return { newStock };
}

/**
 * Calcula o custo total de uma receita baseado no custo médio atual dos ingredientes.
 */
export async function calculateRecipeCost(recipeId: string, tenantId: string) {
    const { data: recipeIngs, error } = await supabase
        .from('receita_ingredientes')
        .select(`
            quantidade,
            unidade,
            ingredientes (
                custo_medio,
                unidade_base,
                fator_rendimento
            )
        `)
        .eq('receita_id', recipeId);

    if (error) throw error;
    if (!recipeIngs) return 0;

    let totalCost = 0;
    for (const item of recipeIngs) {
        const ing = item.ingredientes as any;
        if (!ing || !ing.custo_medio) continue;

        // Converter quantidade da receita para unidade base do ingrediente
        const { value: quantityBase } = convertToBaseUnit(item.quantidade, item.unidade as InputUnit);
        
        // Custo = quantidade_base * custo_medio (que já está na unidade base)
        totalCost += quantityBase * Number(ing.custo_medio);
    }

    return totalCost;
}

/**
 * Produz uma receita, abatendo todos os ingredientes proporcionais do estoque e logando a sessão.
 */
export async function produceRecipe(recipeId: string, productionQuantity: number, tenantId: string, userId: string) {
    // 1. Buscar ingredientes da receita
    const { data: recipeIngredients, error: fetchError } = await supabase
        .from('receita_ingredientes')
        .select('*, ingredientes(id, nome, estoque_atual, unidade_base, custo_medio)')
        .eq('receita_id', recipeId);

    if (fetchError) throw fetchError;
    if (!recipeIngredients || recipeIngredients.length === 0) return { success: true };

    // 2. Calcular custo total da produção para o log
    let totalProductionCost = 0;
    for (const ri of recipeIngredients) {
        const totalNeededRaw = ri.quantidade * productionQuantity;
        const { value: neededBase } = convertToBaseUnit(totalNeededRaw, ri.unidade as InputUnit);
        totalProductionCost += neededBase * Number(ri.ingredientes.custo_medio || 0);

        // Verificar estoque
        if (ri.ingredientes.estoque_atual < neededBase) {
            throw new Error(`Estoque insuficiente para ${ri.ingredientes.nome}. Necessário: ${neededBase}${ri.ingredientes.unidade_base}, Disponível: ${ri.ingredientes.estoque_atual}`);
        }
    }

    // 3. Processar baixas
    for (const ri of recipeIngredients) {
        const totalNeededRaw = ri.quantidade * productionQuantity;
        
        await handleStockMovement({
            ingredientId: ri.ingrediente_id,
            type: 'saida',
            quantity: totalNeededRaw,
            unit: ri.unidade as InputUnit,
            origin: 'producao',
            referenceId: recipeId,
            tenantId,
            userId
        });
    }

    // 4. Registrar Sessão de Produção no ERP
    await supabase
        .from('producoes')
        .insert({
            tenant_id: tenantId,
            company_id: tenantId,
            receita_id: recipeId,
            quantidade: productionQuantity,
            custo_total: totalProductionCost,
            usuario_id: userId
        });

    return { success: true, cost: totalProductionCost };
}

/**
 * Registra uma venda calculando CMV e Lucro automaticamente.
 */
export async function registerSale({
    recipeId,
    quantity,
    priceUnit,
    customer,
    tenantId,
    userId
}: {
    recipeId: string,
    quantity: number,
    priceUnit: number,
    customer?: string,
    tenantId: string,
    userId: string
}) {
    // 1. Calcular CMV (Custo de Mercadoria Vendida)
    const unitCost = await calculateRecipeCost(recipeId, tenantId);
    const totalCMV = unitCost * quantity;
    const totalRevenue = priceUnit * quantity;
    const totalProfit = totalRevenue - totalCMV;

    // 2. Salvar Registro de Venda
    const { error } = await supabase
        .from('vendas')
        .insert({
            tenant_id: tenantId,
            company_id: tenantId,
            receita_id: recipeId,
            quantidade: quantity,
            valor_unitario: priceUnit,
            valor_total: totalRevenue,
            custo_total: totalCMV,
            lucro_total: totalProfit,
            cliente: customer,
            usuario_id: userId
        });

    if (error) throw error;
    
    return { success: true, profit: totalProfit, cmv: totalCMV };
}

/**
 * Finaliza a lista de compras, atualizando o estoque dos itens marcados como 'comprados'.
 */
export async function finalizeShoppingList(itemIds: string[], tenantId: string, userId: string) {
    // 1. Buscar os itens da lista que serão finalizados
    const { data: items, error: fetchError } = await supabase
        .from('lista_compras')
        .select('*')
        .in('id', itemIds)
        .eq('status', 'comprado');

    if (fetchError) throw fetchError;
    if (!items || items.length === 0) return { success: true };

    for (const item of items) {
        let finalIngredientId = item.ingrediente_id;

        // Se o item NÃO está vinculado a um ingrediente, vamos criá-lo automaticamente
        if (!finalIngredientId) {
            const { data: newIng, error: ingError } = await supabase
                .from('ingredientes')
                .insert({
                    tenant_id: tenantId,
                    company_id: tenantId,
                    user_id: userId,
                    nome: item.nome_item,
                    unidade: item.unidade.toLowerCase(), // Coluna legada obrigatória
                    unidade_base: item.unidade.toLowerCase(), // Nova arquitetura
                    quantidade_total: 0,
                    preco_total: 0,
                    custo_unitario: item.preco_unitario || 0,
                    estoque_atual: 0, 
                    estoque_minimo: 1, 
                    custo_medio: item.preco_unitario || 0,
                    categoria: 'Geral'
                })
                .select('id')
                .single();

            if (ingError) {
                console.error("Erro ao criar ingrediente automático:", ingError);
                throw new Error(`Falha ao criar ingrediente: ${ingError.message}`);
            }
            finalIngredientId = newIng.id;
            
            // Vincular de volta na lista
            const { error: updateListError } = await supabase
                .from('lista_compras')
                .update({ ingrediente_id: finalIngredientId })
                .eq('id', item.id);
            
            if (updateListError) throw updateListError;
        }

        // Se o item está vinculado a um ingrediente (existente ou novo)
        const { data: ingredient, error: fetchIngError } = await supabase
            .from('ingredientes')
            .select('estoque_atual, custo_medio')
            .eq('id', finalIngredientId)
            .single();

        if (fetchIngError) throw fetchIngError;

        const currentStock = Number(ingredient?.estoque_atual || 0);
        const currentCusto = Number(ingredient?.custo_medio || 0);
        
        const { value: quantityBase } = convertToBaseUnit(item.quantidade, item.unidade as InputUnit);
        
        const totalQuantity = currentStock + quantityBase;
        let newCusto = currentCusto;
        
        if (item.preco_unitario > 0) {
            const pricePerBaseUnit = item.preco_unitario / (quantityBase / item.quantidade);
            newCusto = totalQuantity > 0 
                ? ((currentStock * currentCusto) + (quantityBase * pricePerBaseUnit)) / totalQuantity
                : pricePerBaseUnit;
        }

        // Atualizar Ingrediente (Sincronizando arquitetura nova e antiga)
        const { error: updateIngError } = await supabase
            .from('ingredientes')
            .update({ 
                estoque_atual: Number(totalQuantity),
                custo_medio: Number(newCusto),
                quantidade_total: Number(totalQuantity), // Legado
                custo_unitario: Number(newCusto), // Legado
                unidade: item.unidade.toLowerCase() // Legado
                // updated_at removido para compatibilidade imediata
            })
            .eq('id', finalIngredientId)
            .eq('tenant_id', tenantId); // Reforço para RLS

        if (updateIngError) {
            console.error("Erro ao atualizar estoque do ingrediente:", updateIngError);
            throw new Error(`Erro na atualização do estoque: ${updateIngError.message || JSON.stringify(updateIngError)}`);
        }

        // Registrar Movimentação
        const { error: moveError } = await supabase
            .from('estoque_movimentacoes')
            .insert({
                tenant_id: tenantId,
                company_id: tenantId,
                ingrediente_id: finalIngredientId,
                tipo: 'entrada',
                quantidade: Number(quantityBase),
                unidade: item.unidade.toLowerCase(),
                origem: 'compra',
                referencia_id: item.id,
                usuario_id: userId
            });

        if (moveError) {
            console.error("Erro ao registrar movimentação de estoque:", moveError);
            throw new Error(`Erro no registro de movimentação: ${moveError.message || JSON.stringify(moveError)}`);
        }

        // Marcar item como finalizado
        const { error: finishError } = await supabase
            .from('lista_compras')
            .update({ status: 'adicionado_estoque' }) // updated_at removido
            .eq('id', item.id);

        if (finishError) throw finishError;
    }

    return { success: true };
}

/**
 * Gera automaticamente itens na lista de compras para ingredientes que atingiram o estoque mínimo.
 */
export async function generateAutoShoppingList(tenantId: string, userId: string) {
    // 1. Buscar ingredientes com estoque baixo
    const { data: lowStockIngs, error: fetchError } = await supabase
        .from('ingredientes')
        .select('id, nome, estoque_atual, estoque_minimo, unidade_base, custo_medio')
        .eq('tenant_id', tenantId);
    
    if (fetchError) throw fetchError;

    const itemsToInsert = lowStockIngs
        ?.filter(ing => Number(ing.estoque_atual) <= Number(ing.estoque_minimo))
        .map(ing => {
            const diff = Math.max(0, Number(ing.estoque_minimo) - Number(ing.estoque_atual));
            // Sugerimos comprar o dobro da diferença ou pelo menos o mínimo para ter segurança
            const suggestedQty = diff > 0 ? diff : Number(ing.estoque_minimo);

            return {
                tenant_id: tenantId,
                company_id: tenantId,
                ingrediente_id: ing.id,
                nome_item: ing.nome,
                quantidade: suggestedQty,
                unidade: ing.unidade_base,
                preco_unitario: Number(ing.custo_medio || 0),
                valor_total: suggestedQty * Number(ing.custo_medio || 0),
                status: 'pendente',
                usuario_id: userId
            };
        });

    if (!itemsToInsert || itemsToInsert.length === 0) return { count: 0 };

    // 2. Inserir na lista de compras (evitando duplicados pendentes se desejar, mas aqui faremos simples)
    const { error: insertError } = await supabase
        .from('lista_compras')
        .insert(itemsToInsert);

    if (insertError) throw insertError;

    return { count: itemsToInsert.length };
}

/**
 * Faz o parsing de um XML de NF-e (Nota Fiscal Eletrônica) para extrair produtos.
 */
export function parseNfeXml(xmlString: string) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    // 1. Extrair Dados do Emitente (Fornecedor)
    const emit = xmlDoc.getElementsByTagName("emit")[0];
    const fornecedor = emit?.getElementsByTagName("xNome")[0]?.textContent || "Fornecedor Desconhecido";
    const cnpj = emit?.getElementsByTagName("CNPJ")[0]?.textContent || "";

    // 2. Extrair Dados da Nota
    const ide = xmlDoc.getElementsByTagName("ide")[0];
    const nNF = ide?.getElementsByTagName("nNF")[0]?.textContent || "";
    const dataEmissao = ide?.getElementsByTagName("dhEmi")[0]?.textContent || new Date().toISOString();

    // 3. Extrair Produtos (det)
    const items = [];
    const dets = xmlDoc.getElementsByTagName("det");

    for (let i = 0; i < dets.length; i++) {
        const prod = dets[i].getElementsByTagName("prod")[0];
        const nome = prod.getElementsByTagName("xProd")[0]?.textContent || "";
        const quantidade = parseFloat(prod.getElementsByTagName("qCom")[0]?.textContent || "0");
        const unidade = prod.getElementsByTagName("uCom")[0]?.textContent || "un";
        const valorUnitario = parseFloat(prod.getElementsByTagName("vUnCom")[0]?.textContent || "0");
        const valorTotal = parseFloat(prod.getElementsByTagName("vProd")[0]?.textContent || "0");

        items.push({
            nome,
            quantidade,
            unidade,
            valorUnitario,
            valorTotal
        });
    }

    return {
        fornecedor,
        cnpj,
        numeroNota: nNF,
        dataEmissao,
        items
    };
}

/**
 * Finaliza a importação de uma compra vinda de NF-e, atualizando estoque e criando registro de compra.
 */
export async function processNfePurchase({
    items,
    fornecedor,
    numeroNota,
    valorTotal,
    tenantId,
    userId
}: {
    items: any[],
    fornecedor: string,
    numeroNota: string,
    valorTotal: number,
    tenantId: string,
    userId: string
}) {
    // 1. Criar Registro de Compra
    const { data: compra, error: compraError } = await supabase
        .from('compras')
        .insert({
            tenant_id: tenantId,
            company_id: tenantId,
            fornecedor,
            numero_nota: numeroNota,
            valor_total: valorTotal,
            usuario_id: userId
        })
        .select('id')
        .single();

    if (compraError) throw compraError;

    // 2. Processar cada item para estoque
    for (const item of items) {
        if (!item.ingrediente_id) continue;

        // Buscar dados atuais do ingrediente para média ponderada
        const { data: ing } = await supabase
            .from('ingredientes')
            .select('estoque_atual, custo_medio')
            .eq('id', item.ingrediente_id)
            .single();
        
        const currentStock = Number(ing?.estoque_atual || 0);
        const currentCost = Number(ing?.custo_medio || 0);

        // Entrada no estoque (handleStockMovement já faz a média ponderada simples?)
        // Na verdade, vamos fazer o cálculo explícito aqui para garantir precisão do ERP
        const quantityBase = item.quantidade_base || item.quantidade; // Assumindo que o mapeador já converteu
        const totalStock = currentStock + quantityBase;
        
        const newCost = totalStock > 0 
            ? ((currentStock * currentCost) + (quantityBase * item.valorUnitario)) / totalStock
            : item.valorUnitario;

        // Atualizar Ingrediente
        await supabase
            .from('ingredientes')
            .update({
                estoque_atual: totalStock,
                custo_medio: newCost,
                updated_at: new Date().toISOString()
            })
            .eq('id', item.ingrediente_id);

        // Registrar Movimentação vinculada à compra
        await supabase
            .from('estoque_movimentacoes')
            .insert({
                tenant_id: tenantId,
                company_id: tenantId,
                ingrediente_id: item.ingrediente_id,
                tipo: 'entrada',
                quantidade: quantityBase,
                unidade: item.unidade,
                origem: 'compra',
                referencia_id: compra.id,
                compra_id: compra.id,
                usuario_id: userId
            });
    }

    return { success: true, compraId: compra.id };
}

/**
 * Normaliza campos básicos de um item importado.
 */
export function normalizeImportItem(item: any) {
    const qty = parseFloat(String(item.quantidade || item.qtd || 0).replace(',', '.'));
    const total = parseFloat(String(item.valor_total || item.vl_total || 0).replace(',', '.'));
    let unitVal = parseFloat(String(item.valor_unitario || item.vl_unit || 0).replace(',', '.'));

    if ((isNaN(unitVal) || unitVal <= 0) && qty > 0) {
        unitVal = total / qty;
    }

    return {
        ...item,
        quantidade: isNaN(qty) ? 0 : qty,
        valor_unitario: isNaN(unitVal) ? 0 : unitVal,
        valor_total: isNaN(total) ? 0 : total,
        nome: item.nome || item.descricao || "Item Sem Nome",
        unidade: item.unidade || item.un || "un",
        fator_rendimento: parseFloat(String(item.fator_rendimento || 1.0))
    };
}

/**
 * Processa um lote de itens para importação no estoque.
 */
export async function processImportItems({
    items,
    tenantId,
    userId,
    fornecedor
}: {
    items: any[],
    tenantId: string,
    userId: string,
    fornecedor?: string
}) {
    // 1. Criar Registro de Compra (Cabeçalho)
    const totalCompra = items.reduce((acc, current) => acc + (current.valor_total || 0), 0);
    const { data: compra, error: compraError } = await supabase
        .from('compras')
        .insert({
            tenant_id: tenantId,
            company_id: tenantId,
            fornecedor: fornecedor || 'Importação Manual',
            valor_total: totalCompra,
            usuario_id: userId,
            data_compra: new Date().toISOString()
        })
        .select('id')
        .single();

    if (compraError) throw compraError;

    const results = [];

    for (const item of items) {
        const normalized = normalizeImportItem(item);
        if (!normalized.nome || normalized.quantidade <= 0) continue;

        let ingredientId = item.ingrediente_id;

        // Tentar encontrar ingrediente por Código ou Nome se não tiver ID
        if (!ingredientId) {
            const orFilter = [];
            if (item.codigo) orFilter.push(`codigo.eq.${item.codigo}`);
            if (normalized.nome) orFilter.push(`nome.ilike.${normalized.nome}`);

            if (orFilter.length > 0) {
                const { data: existing, error: searchError } = await supabase
                    .from('ingredientes')
                    .select('id')
                    .or(orFilter.join(','))
                    .eq('tenant_id', tenantId)
                    .limit(1); // Usar limit(1) em vez de maybeSingle para evitar erro de duplicados no search

                if (!searchError && existing && existing.length > 0) {
                    ingredientId = existing[0].id;
                }
            }
        }

        if (!ingredientId) {
            // Criar novo ingrediente
            const { data: newIng, error: createError } = await supabase
                .from('ingredientes')
                .insert({
                    tenant_id: tenantId,
                    company_id: tenantId,
                    user_id: userId,
                    nome: normalized.nome,
                    codigo: item.codigo || "",
                    unidade_base: normalized.unidade.toLowerCase(),
                    estoque_atual: 0,
                    custo_medio: normalized.valor_unitario,
                    categoria: 'Geral',
                    descricao: normalized.descricao || ""
                })
                .select('id')
                .single();

            if (createError) {
                console.error("Erro ao criar ingrediente:", createError);
                continue;
            }
            ingredientId = newIng.id;
        }

        // Atualizar estoque e custo médio
        const { data: ing } = await supabase
            .from('ingredientes')
            .select('estoque_atual, custo_medio, unidade_base, fator_rendimento')
            .eq('id', ingredientId)
            .single();

        const currentStock = Number(ing?.estoque_atual || 0);
        const currentCost = Number(ing?.custo_medio || 0);

        // Converter para unidade base se as unidades forem compatíveis
        const { value: quantityBase } = convertToBaseUnit(normalized.quantidade, normalized.unidade as InputUnit);
        
        const yieldFactor = Number(ing?.fator_rendimento || 1.0);
        const totalStock = currentStock + quantityBase;
        const newCost = totalStock > 0 
            ? ((currentStock * currentCost) + (quantityBase * normalized.valor_unitario)) / totalStock
            : normalized.valor_unitario;

        // Note: normalized.valor_unitario here might be package price if not handled by convertToBaseUnit.
        // We need to ensure the import normalization handles the "Bandeja -> base unit" conversion.

        await supabase
            .from('ingredientes')
            .update({
                estoque_atual: totalStock,
                custo_medio: newCost,
                updated_at: new Date().toISOString()
            })
            .eq('id', ingredientId);

        // Registrar Movimentação
        await supabase
            .from('estoque_movimentacoes')
            .insert({
                tenant_id: tenantId,
                company_id: tenantId,
                ingrediente_id: ingredientId,
                tipo: 'entrada',
                quantidade: quantityBase,
                unidade: ing?.unidade_base || normalized.unidade,
                origem: 'compra',
                referencia_id: compra.id,
                compra_id: compra.id,
                usuario_id: userId
            });

        results.push({ id: ingredientId, status: item.ingrediente_id ? 'updated' : 'created' });
    }

    return { success: true, compraId: compra.id, results };
}

