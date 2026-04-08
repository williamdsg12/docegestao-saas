
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey!)

const tables = [
  'receitas',
  'company_team',
  'pedidos',
  'transactions',
  'affiliates',
  'affiliate_sales'
]

async function debugQueries() {
  console.log('--- Debugging Queries ---')
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1)
    
    if (error) {
      console.log(`❌ Table "${table}": Error - ${error.message} (${error.code})`)
    } else {
      console.log(`✅ Table "${table}": Query Success (Data: ${data.length} rows)`)
    }
  }
}

debugQueries()
