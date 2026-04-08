
const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

function loadEnv() {
  const paths = [
    path.resolve(__dirname, '../.env.local'),
    path.resolve(__dirname, '../.env')
  ]
  for (const envPath of paths) {
    if (fs.existsSync(envPath)) {
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function inspectPayments() {
  console.log('Inspecting table structure for: payments')
  const { data, error } = await supabase.from('payments').select('*').limit(1).maybeSingle()
  if (error) {
    console.error('Error:', error.message)
  } else if (data) {
    console.log('Columns found in payments:', Object.keys(data))
  } else {
    // If no rows, try to get schema via an RPC or query that fails but shows columns
    const { error: queryError } = await supabase.from('payments').select('non_existent_column')
    console.log('Query error output (might contain schema info):', queryError.message)
  }
}

inspectPayments()
