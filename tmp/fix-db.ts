import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function fix() {
  console.log('Adding unique constraint to payments.order_id...')
  const { error } = await supabase.rpc('exec_sql', {
    sql_query: 'ALTER TABLE payments ADD CONSTRAINT payments_order_id_key UNIQUE (order_id);'
  })
  
  if (error) {
    if (error.message.includes('rpc not found')) {
      console.log('RPC exec_sql not found. Trying via direct query (if possible)...')
      // Supabase JS SDK doesn't support direct SQL unless through RPC or a custom function
      // Let's try another way: maybe I can just do a normal insert and catch the error
      console.error('Cannot run direct SQL via JS SDK without RPC. Please run this in the Supabase Dashboard SQL Editor:')
      console.error('ALTER TABLE payments ADD CONSTRAINT payments_order_id_key UNIQUE (order_id);')
    } else {
      console.error('Error:', error.message)
    }
  } else {
    console.log('Success!')
  }
}

// Since I might not have RPC, I'll provide an alternative: if upsert fails, I'll try a manual check-then-insert/update in the API.
fix()
