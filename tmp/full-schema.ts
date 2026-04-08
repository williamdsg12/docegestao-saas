
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey!)

async function getFullSchema() {
  console.log('--- Full Schema Discovery ---')
  
  // Try to use a custom RPC if it exists, or just query common tables to guess
  // Actually, we can try to run a raw SQL if we have a way, but we don't.
  // We'll use the "probe and describe" method more thoroughly.
  
  const tables = [
    'profiles', 'companies', 'tenants', 'plans', 'subscriptions', 'invoices',
    'customers', 'clientes', 'client_addresses', 'addresses',
    'categories', 'product_categories', 'products', 'produtos',
    'ingredientes', 'ingredients', 'recipe_ingredients', 'recipes', 'receitas',
    'orders', 'pedidos', 'order_items', 'itens_pedido', 'order_status_history',
    'expenses', 'transactions', 'transacoes', 'financeiro', 'financial_records',
    'company_team', 'team', 'equipe', 'staff', 'members',
    'notifications', 'dashboard_stats', 'affiliates', 'affiliate_sales'
  ]

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1)
    if (error) {
      if (error.code === 'PGRST204' || error.code === 'PGRST205') {
        // Not found
      } else {
        console.log(`⚠️ ${table}: ${error.message} (${error.code})`)
      }
    } else {
      const cols = data.length > 0 ? Object.keys(data[0]) : ['(empty)']
      console.log(`✅ ${table} [${cols.join(', ')}]`)
    }
  }
}

getFullSchema()
