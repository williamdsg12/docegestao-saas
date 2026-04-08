
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey!)

async function listTables() {
  console.log('--- Listing All Tables ---')
  const { data, error } = await supabase
    .rpc('get_tables') // This might not exist, I'll try raw query if possible or a common table
  
  if (error) {
    // If RPC fails, try selecting from postgres tables if possible or just use a known one to probe
    console.log('RPC get_tables failed, searching via common names...')
    const commonNames = ['users', 'profiles', 'companies', 'tenants', 'orders', 'pedidos', 'products', 'produtos', 'ingredients', 'insumos', 'receitas', 'recipes', 'team', 'equipe', 'staff', 'members', 'financeiro', 'transactions', 'transacoes', 'finance', 'financial_records']
    
    for (const name of commonNames) {
      const { data, error } = await supabase.from(name).select('*', { count: 'exact', head: true }).limit(0)
      if (!error) {
        console.log(`✅ ${name}`)
      }
    }
  } else {
    console.log(data)
  }
}

listTables()
