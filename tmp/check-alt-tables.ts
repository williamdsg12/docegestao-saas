
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey!)

async function checkFinanceTables() {
  const potentials = ['expenses', 'revenue', 'financial_records', 'finances', 'financeiro', 'transactions']
  for (const t of potentials) {
    const { data, error } = await supabase.from(t).select('*').limit(1)
    if (error) {
      console.log(`❌ ${t}: ${error.message}`)
    } else {
      console.log(`✅ ${t}`)
    }
  }
}
async function checkTeamTables() {
  const potentials = ['company_team', 'team', 'equipe', 'staff', 'members']
  for (const t of potentials) {
    const { data, error } = await supabase.from(t).select('*').limit(1)
    if (error) {
      console.log(`❌ ${t}: ${error.message}`)
    } else {
      console.log(`✅ ${t}`)
    }
  }
}
async function run() {
  await checkFinanceTables();
  await checkTeamTables();
}
run();
