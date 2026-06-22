const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
  console.log("=== VERIFICANDO MIGRAÇÃO V35 NO BANCO DE DADOS ===");
  
  // Query customers table metadata/columns
  const { data, error } = await supabase
    .from('customers')
    .select('id, phone, telefone_normalizado, deleted_at')
    .limit(1);

  if (error) {
    console.error("❌ ERRO: A migração não parece ter sido aplicada no banco de dados.");
    console.error("Detalhe do erro:", error.message);
    console.log("\n👉 AÇÃO MANUAL REQUERIDA:");
    console.log("Por favor, execute o conteúdo de 'migration_v35_customers_fix.sql' no Editor SQL do seu Supabase Dashboard.");
  } else {
    console.log("✅ SUCESSO: Colunas 'telefone_normalizado' e 'deleted_at' encontradas na tabela 'customers'!");
    console.log("Amostra do registro retornado:", data);
  }
}

verify();
