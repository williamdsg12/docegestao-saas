
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey!)

async function debugPedidos() {
  console.log('--- Debugging Pedidos Relationships ---')
  
  // Try different relationship names
  const relations = [
    'clientes(nome, telefone)',
    'customers(name, phone)',
    'items:itens_pedido(count)',
    'items:order_items(count)'
  ]

  for (const rel of relations) {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`*, ${rel}`)
      .limit(1)
    
    if (error) {
      console.log(`❌ Relationship "${rel}": ${error.message} (${error.code})`)
    } else {
      console.log(`✅ Relationship "${rel}": Success`)
    }
  }
}

debugPedidos()
