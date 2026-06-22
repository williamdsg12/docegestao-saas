const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars (URL or SERVICE_ROLE_KEY)");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function normalizePhone(phone) {
  if (!phone) return '';
  let normalized = phone.replace(/\D/g, '');
  if ((normalized.length === 12 || normalized.length === 13) && normalized.startsWith('55')) {
    normalized = normalized.slice(2);
  }
  return normalized;
}

async function runCleanup() {
  console.log("=== INICIANDO SANEAMENTO DE CLIENTES DUPLICADOS ===");
  
  // 1. Fetch all active customers (not deleted)
  // Note: deleted_at does not exist yet, so we select all.
  const { data: customers, error: fetchErr } = await supabase
    .from('customers')
    .select('id, tenant_id, name, phone, email, total_orders, total_spent, last_order_at');

  if (fetchErr) {
    console.error("Erro ao buscar clientes:", fetchErr.message);
    process.exit(1);
  }

  console.log(`Total de clientes cadastrados: ${customers.length}`);

  // 2. Group by tenant_id + normalized phone
  const groups = {};
  for (const c of customers) {
    const norm = normalizePhone(c.phone);
    if (!norm) continue; // Skip entries without valid phone digits
    
    const key = `${c.tenant_id}_${norm}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(c);
  }

  let totalAnalyzed = 0;
  let duplicatesFound = 0;
  let duplicatesRemoved = 0;
  const mergedReport = [];

  // 3. Process each group
  for (const key of Object.keys(groups)) {
    const list = groups[key];
    totalAnalyzed++;
    
    if (list.length <= 1) continue; // No duplicates in this group

    duplicatesFound += (list.length - 1);
    console.log(`\nGrupo duplicado encontrado para a chave [${key}] com ${list.length} registros.`);

    // Sort to choose the master customer:
    // 1. Most orders
    // 2. Most recently updated/last order
    // 3. First created (id/created_at fallback)
    list.sort((a, b) => {
      const ordersA = a.total_orders || 0;
      const ordersB = b.total_orders || 0;
      if (ordersA !== ordersB) return ordersB - ordersA;
      
      const dateA = a.last_order_at ? new Date(a.last_order_at).getTime() : 0;
      const dateB = b.last_order_at ? new Date(b.last_order_at).getTime() : 0;
      return dateB - dateA;
    });

    const master = list[0];
    const duplicates = list.slice(1);

    console.log(`-> Master selecionado: ID: ${master.id}, Nome: "${master.name}", Pedidos: ${master.total_orders}, Gasto: R$ ${master.total_spent}`);

    // Track metrics for update
    let newTotalOrders = master.total_orders || 0;
    let newTotalSpent = Number(master.total_spent || 0);
    let newLastOrderAt = master.last_order_at ? new Date(master.last_order_at) : null;

    for (const dup of duplicates) {
      console.log(`   Merging Duplicate: ID: ${dup.id}, Nome: "${dup.name}", Pedidos: ${dup.total_orders}, Gasto: R$ ${dup.total_spent}`);
      
      // Update order statistics
      newTotalOrders += (dup.total_orders || 0);
      newTotalSpent += Number(dup.total_spent || 0);
      if (dup.last_order_at) {
        const dupDate = new Date(dup.last_order_at);
        if (!newLastOrderAt || dupDate > newLastOrderAt) {
          newLastOrderAt = dupDate;
        }
      }

      // Merge Orders
      const { data: updatedOrders, error: orderErr } = await supabase
        .from('orders')
        .update({ customer_id: master.id })
        .eq('customer_id', dup.id)
        .select('id');
      
      if (orderErr) console.error(`      Erro ao atualizar pedidos do duplicado ${dup.id}:`, orderErr.message);
      else if (updatedOrders && updatedOrders.length > 0) {
        console.log(`      ${updatedOrders.length} pedidos re-vinculados ao Master.`);
      }

      // Merge Addresses
      const { data: updatedAddresses, error: addrErr } = await supabase
        .from('addresses')
        .update({ customer_id: master.id })
        .eq('customer_id', dup.id)
        .select('id');

      if (addrErr) console.error(`      Erro ao atualizar endereços do duplicado ${dup.id}:`, addrErr.message);
      else if (updatedAddresses && updatedAddresses.length > 0) {
        console.log(`      ${updatedAddresses.length} endereços re-vinculados ao Master.`);
      }

      // Merge Quotes
      const { data: updatedQuotes, error: quoteErr } = await supabase
        .from('quotes')
        .update({ client_id: master.id })
        .eq('client_id', dup.id)
        .select('id');

      if (quoteErr) console.error(`      Erro ao atualizar propostas/orçamentos do duplicado ${dup.id}:`, quoteErr.message);
      else if (updatedQuotes && updatedQuotes.length > 0) {
        console.log(`      ${updatedQuotes.length} orçamentos re-vinculados ao Master.`);
      }

      // Merge Fidelidade Points
      // 1. Fetch duplicate loyalty points
      const { data: dupLoyalty } = await supabase
        .from('fidelidade_clientes')
        .select('*')
        .eq('empresa_id', master.tenant_id)
        .eq('cliente_id', dup.id)
        .maybeSingle();

      if (dupLoyalty && dupLoyalty.pontos > 0) {
        // 2. Fetch master loyalty
        const { data: masterLoyalty } = await supabase
          .from('fidelidade_clientes')
          .select('*')
          .eq('empresa_id', master.tenant_id)
          .eq('cliente_id', master.id)
          .maybeSingle();

        if (masterLoyalty) {
          // Add points together
          const totalPoints = masterLoyalty.pontos + dupLoyalty.pontos;
          await supabase
            .from('fidelidade_clientes')
            .update({ pontos: totalPoints })
            .eq('id', masterLoyalty.id);
          
          // Delete duplicate loyalty record
          await supabase
            .from('fidelidade_clientes')
            .delete()
            .eq('id', dupLoyalty.id);
          console.log(`      Fidelidade mesclada: ${dupLoyalty.pontos} pontos somados ao Master (total: ${totalPoints}).`);
        } else {
          // Simply update cliente_id of duplicate to master
          await supabase
            .from('fidelidade_clientes')
            .update({ cliente_id: master.id })
            .eq('id', dupLoyalty.id);
          console.log(`      Fidelidade transferida: ${dupLoyalty.pontos} pontos vinculados ao Master.`);
        }
      }

      // Merge Historico Pontos
      const { data: updatedPointsHistory } = await supabase
        .from('historico_pontos')
        .update({ cliente_id: master.id })
        .eq('cliente_id', dup.id)
        .select('id');
      
      if (updatedPointsHistory && updatedPointsHistory.length > 0) {
        console.log(`      ${updatedPointsHistory.length} registros de histórico de fidelidade vinculados ao Master.`);
      }

      // Merge Uso Cupons
      const { data: updatedUsoCupons } = await supabase
        .from('uso_cupons')
        .update({ cliente_id: master.id })
        .eq('cliente_id', dup.id)
        .select('id');
      
      if (updatedUsoCupons && updatedUsoCupons.length > 0) {
        console.log(`      ${updatedUsoCupons.length} registros de uso de cupom vinculados ao Master.`);
      }

      // Delete the duplicate customer profile row
      const { error: deleteErr } = await supabase
        .from('customers')
        .delete()
        .eq('id', dup.id);
      
      if (deleteErr) {
        console.error(`      ❌ Erro ao deletar cliente duplicado ${dup.id}:`, deleteErr.message);
      } else {
        console.log(`      ✅ Registro de cliente duplicado deletado.`);
        duplicatesRemoved++;
      }
    }

    // 4. Update Master record with aggregated statistics
    const masterUpdate = {
      total_orders: newTotalOrders,
      total_spent: newTotalSpent,
      last_order_at: newLastOrderAt ? newLastOrderAt.toISOString() : null,
      updated_at: new Date().toISOString()
    };

    const { error: masterUpdateErr } = await supabase
      .from('customers')
      .update(masterUpdate)
      .eq('id', master.id);

    if (masterUpdateErr) {
      console.error(`   Erro ao atualizar estatísticas do Master ${master.id}:`, masterUpdateErr.message);
    } else {
      console.log(`   Estatísticas do Master atualizadas: Total Pedidos: ${newTotalOrders}, Gasto Total: R$ ${newTotalSpent.toFixed(2)}`);
    }

    mergedReport.push({
      phone: key.split('_')[1],
      masterId: master.id,
      masterName: master.name,
      duplicatesCount: duplicates.length,
      finalOrders: newTotalOrders,
      finalSpent: newTotalSpent
    });
  }

  console.log("\n=== RELATÓRIO FINAL DE SANEAMENTO ===");
  console.log(`Total analisado (chaves únicas): ${totalAnalyzed}`);
  console.log(`Clientes duplicados encontrados: ${duplicatesFound}`);
  console.log(`Clientes duplicados removidos: ${duplicatesRemoved}`);
  console.log(`Registros mesclados: ${mergedReport.length}`);
  console.log("=========================================\n");
}

runCleanup();
