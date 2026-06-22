require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function probe() {
  const columns = [
    'id', 'user_id', 'tenant_id', 'company_id', 'nome', 
    'unidade', 'unidade_base', 'unidade_compra',
    'preco_total', 'valor_pago',
    'quantidade_total', 'quantidade_embalagem',
    'custo_unitario', 'custo_medio',
    'categoria', 'marca', 'fator_rendimento', 'estoque_atual', 'estoque_minimo'
  ];

  for (const col of columns) {
    const { error } = await supabase.from('ingredientes').select(col).limit(1);
    if (error) {
      console.log(`Column [${col}]: MISSING (${error.message})`);
    } else {
      console.log(`Column [${col}]: PRESENT`);
    }
  }
}

probe();
