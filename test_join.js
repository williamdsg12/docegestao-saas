
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function testJoin() {
  const { data, error } = await supabase
    .from('companies')
    .select('*, profiles:owner_id(whatsapp)')
    .eq('menu_slug', 'deliciasmarcucci')
    .single()

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Company with profile found:', data)
  }
}

testJoin()
