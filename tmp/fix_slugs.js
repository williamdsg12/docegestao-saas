require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Fetching companies with slug 'docesdowill'...");
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, created_at')
    .eq('menu_slug', 'docesdowill');

  if (error) {
    console.error("Error fetching companies:", error);
    return;
  }

  console.log(`Found ${companies.length} companies.`);
  
  for (const c of companies) {
    const { count: prodCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', c.id);
      
    console.log(`ID: ${c.id} | Name: ${c.name} | Created: ${c.created_at} | Products: ${prodCount}`);
    
    if (prodCount === 0) {
      console.log(`Renaming slug for empty company ${c.id}...`);
      const { error: updateError } = await supabase
        .from('companies')
        .update({ menu_slug: `docesdowill_old_${Date.now()}` })
        .eq('id', c.id);
      
      if (updateError) console.error("Update error:", updateError);
      else console.log("Successfully renamed!");
    }
  }
}

run();
