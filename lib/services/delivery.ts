import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Cria uma entrega na tabela 'entregas' se ainda não existir para o pedido informado.
 * @param supabase Cliente Supabase para realizar as operações
 * @param pedido Objeto de pedido contendo ID e ID da Empresa (empresa_id, tenant_id ou company_id)
 */
export async function criarEntregaSeNaoExistir(supabase: SupabaseClient, pedido: any) {
  try {
    const pedidoId = pedido.id || pedido.pedido_id;
    const empresaId = pedido.empresa_id || pedido.company_id || pedido.tenant_id;

    if (!pedidoId || !empresaId) {
      console.error("❌ Erro: ID do pedido ou da empresa não identificado", { pedidoId, empresaId });
      return { error: "Dados incompletos para criar entrega" };
    }

    console.log("🔍 Verificando entrega para pedido:", pedidoId);

    // 1. Verifica se já existe entrega para este pedido (proteger contra duplicidade)
    const { data: existente, error: erroBusca } = await supabase
      .from("entregas")
      .select("id")
      .eq("pedido_id", pedidoId)
      .maybeSingle();

    if (erroBusca) {
      console.error("❌ Erro ao buscar entrega existente:", erroBusca);
      return { error: erroBusca };
    }

    if (existente) {
      console.log("⚠️ Entrega já existe para esse pedido:", pedidoId);
      return { success: true, message: "Entrega já existente", data: existente };
    }

    // 2. Criar entrega com status inicial 'aguardando'
    console.log("🚀 Criando nova entrega para o pedido:", pedidoId);
    const { data: novaEntrega, error: erroInsert } = await supabase
      .from("entregas")
      .insert({
        empresa_id: empresaId,
        pedido_id: pedidoId,
        status: "aguardando"
      })
      .select()
      .single();

    if (erroInsert) {
      console.error("❌ Erro ao criar entrega no banco:", erroInsert);
      return { error: erroInsert };
    }

    console.log("✅ Entrega criada com sucesso para o pedido:", pedidoId);
    return { success: true, data: novaEntrega };

  } catch (err) {
    console.error("❌ Erro geral no serviço de entrega:", err);
    return { error: err };
  }
}
