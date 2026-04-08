
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey!)

async function checkView() {
  // We can't easily get view definition via PostgREST without a custom RPC.
  // But we can check if there's a table named 'recipes' or similar that it might be pointing to.
  const tables = ['recipes', 'receita', 'recipe_items', 'recipe_ingredients']
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1)
    if (!error) console.log(`✅ Table "${t}" exists.`)
  }
}
checkView()
