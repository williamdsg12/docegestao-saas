
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const tables = [
  'receitas',
  'company_team',
  'pedidos',
  'transactions',
  'affiliates',
  'affiliate_sales',
  'orders',
  'customers',
  'companies'
]

async function checkTables() {
  console.log('--- Checking Tables ---')
  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .limit(0)
    
    if (error) {
      console.log(`❌ Table "${table}": Error - ${error.message} (${error.code})`)
    } else {
      console.log(`✅ Table "${table}": Exists (Count: ${count})`)
    }
  }
}

checkTables()
