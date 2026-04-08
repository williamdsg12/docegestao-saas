const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
  const { data, error } = await supabase
    .from('order_items')
    .select('variation, extras, observation')
    .limit(1);

  if (error) {
    if (error.code === 'PGRST204') {
        console.log("❌ Colunas ainda não existem (PGRST204).");
    } else if (error.code === '42703') { // postgrest might use this too
        console.log("❌ Colunas ainda não existem (42703).");
    } else {
        console.log("⚠️ Outro erro:", error.message);
    }
  } else {
    console.log("✅ Colunas encontradas com sucesso!");
  }
}

checkColumns();
