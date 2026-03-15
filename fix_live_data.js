
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function fixData() {
  // 1. Get owner_id from company slug
  const { data: comp, error: compError } = await supabase
    .from('companies')
    .select('owner_id')
    .eq('menu_slug', 'deliciasmarcucci')
    .single()

  if (compError) {
    console.error('Error fetching company:', compError)
    return
  }

  const ownerId = comp.owner_id
  console.log('Owner ID:', ownerId)

  // 2. Update profiles.whatsapp
  // Assuming the number should be 45999365482 based on the screenshot (small text in logo)
  // Let's check if we can find any other number in the system for this user.
  const { data: profile, error: profError } = await supabase
    .from('profiles')
    .select('whatsapp, phone')
    .eq('id', ownerId)
    .single()
  
  console.log('Current profile data:', profile)

  const targetNumber = '45999365482' // Number from the logo in the screenshot
  
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ whatsapp: targetNumber, phone: targetNumber })
    .eq('id', ownerId)

  if (updateError) {
    console.error('Error updating profile:', updateError)
  } else {
    console.log('Profile updated with number:', targetNumber)
  }
}

fixData()
