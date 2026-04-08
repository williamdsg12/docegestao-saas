require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const queries = [
    `DROP POLICY IF EXISTS "entregador pode ver entregas" ON entregas;`,
    `CREATE POLICY "entregador pode ver entregas" ON entregas FOR SELECT TO authenticated USING (true);`,
    `DROP POLICY IF EXISTS "sistema pode inserir entregas" ON entregas;`,
    `CREATE POLICY "sistema pode inserir entregas" ON entregas FOR INSERT TO authenticated WITH CHECK (true);`
  ];

  for (const sql_query of queries) {
    console.log(`Executing: ${sql_query}`);
    const { error } = await supabase.rpc('exec_sql', { sql_query });
    if (error) console.error(`Error: ${error.message}`);
  }
}

run();
