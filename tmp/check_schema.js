
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkSchema() {
  const tables = ['companies', 'empresas', 'profiles', 'pedidos', 'produtos', 'clientes', 'entregadores', 'itens_pedido']
  
  for (const table of tables) {
    console.log(`--- Checking table: ${table} ---`)
    const { data: row, error: rowError } = await supabase
      .from(table)
      .select('*')
      .limit(1)
      .maybeSingle()
    
    if (rowError) {
      console.error(`Error fetching table ${table}:`, rowError.message)
    } else if (row) {
      console.log(`Columns in ${table}:`, Object.keys(row))
    } else {
      console.log(`Table ${table} exists (or no error) but has no rows. Try fetching columns via RPC if available.`)
      // If no rows, we can't get columns via Object.keys(row)
      // For now, this is enough to see if the table exists.
    }
  }
}

checkSchema()
