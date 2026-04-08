import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function setup() {
  console.log('Reading SQL file...')
  const sql = fs.readFileSync(path.resolve(process.cwd(), 'tmp/setup-db-invoice.sql'), 'utf8')
  
  console.log('Executing SQL via RPC...')
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: sql
  })

  if (error) {
    console.warn('RPC exec_sql failed or not found. Please run the SQL manually in Supabase Dashboard:')
    console.log('--------------------------------------------------')
    console.log(sql)
    console.log('--------------------------------------------------')
  } else {
    console.log('Database setup successful!')
  }
}

setup()
