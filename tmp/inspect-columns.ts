
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey!)

const tables = [
  'receitas',
  'equipe',
  'pedidos',
  'financeiro',
  'transacoes',
  'company_team',
  'transactions'
]

async function inspectColumns() {
  console.log('--- Inspecting Columns ---')
  for (const table of tables) {
    // Try to get one row to see keys
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1)
    
    if (error) {
      console.log(`❌ Table "${table}": ${error.message}`)
    } else if (data.length > 0) {
      console.log(`✅ Table "${table}": Columns - ${Object.keys(data[0]).join(', ')}`)
    } else {
      console.log(`✅ Table "${table}": Exists but is empty.`)
      // Try to get columns via a dummy insert or another way? 
      // Safe way: query information_schema if we have permission, but we likely don't via PostgREST.
    }
  }
}

inspectColumns()
