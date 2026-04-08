
const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

// Manual load of .env or .env.local
function loadEnv() {
  const paths = [
    path.resolve(__dirname, '../.env.local'),
    path.resolve(__dirname, '../.env')
  ]
  
  for (const envPath of paths) {
    if (fs.existsSync(envPath)) {
      console.log(`Loading env from: ${envPath}`)
      const content = fs.readFileSync(envPath, 'utf8')
      content.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
          process.env[key.trim()] = value
        }
      })
    }
  }
}

loadEnv()

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('ENV keys not found. Available keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')))
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function inspectClientes() {
  console.log('Inspecting table structure for: clientes')
  
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching from clientes:', error.message)
    
    // Try to see if it's because the table exists but the query failed
    if (error.message.includes('column') || error.message.includes('schema cache')) {
       console.log('Targeting the schema error directly.')
    }
  } else if (data) {
    console.log('Columns found in clientes:', Object.keys(data))
  } else {
    console.log('No rows in clientes.')
    // Try to get column names via an RPC or another way if possible
    // But usually Object.keys on a row is the easiest.
  }
}

inspectClientes()
