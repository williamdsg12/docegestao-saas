const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const email = 'andressamarcucci45@gmail.com'

  console.log(`\n--- Searching for user with email: ${email} ---`)
  const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
  if (userError) {
    console.error('Error listing users:', userError.message)
    return
  }

  const user = userData.users.find(u => u.email === email)
  if (!user) {
    console.error('User not found')
    return
  }

  console.log('User ID:', user.id)

  console.log('\n--- PROFILE ---')
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Error fetching profile:', profileError.message)
  } else {
    console.log(profile)
  }

  console.log('\n--- COMPANIES ---')
  const tenantId = profile?.tenant_id || profile?.company_id
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (companyError) {
    console.error('Error fetching company:', companyError.message)
  } else {
    console.log('Company ID:', company.id)
    console.log('Company Name:', company.name)
    console.log('Menu Slug:', company.menu_slug)
  }
}

run()
