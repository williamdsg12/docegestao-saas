const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function inspectQuotes() {
  console.log('--- QUOTES ---')
  const { data: quote, error: quoteError } = await supabase.from('quotes').select('*').limit(1).single()
  if (quoteError) console.error(quoteError)
  else console.log(Object.keys(quote))
}

inspectQuotes()
