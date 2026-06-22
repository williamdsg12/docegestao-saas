const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function inspectTable(tableName) {
  console.log(`--- ${tableName.toUpperCase()} ---`)
  const { data, error } = await supabase.from(tableName).select('*').limit(1).single()
  if (error) {
      console.log(`Error or Table "${tableName}" empty:`, error.message)
      // Try to get columns anyway if table exists
      const { data: cols, error: colError } = await supabase.rpc('get_table_columns_v2', { t_name: tableName })
      if (colError) console.error('RPC Error:', colError.message)
      else console.log('Columns:', cols)
  }
  else console.log('Keys:', Object.keys(data))
}

async function run() {
    await inspectTable('orders')
    await inspectTable('pedidos')
    await inspectTable('quotes')
}
run()
