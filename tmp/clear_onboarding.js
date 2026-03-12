require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function clearOnboarding() {
  const email = 'estudioparanavai@gmail.com'
  console.log(`Clearing onboarding for: ${email}...`)
  
  const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
  if (userError) {
    console.error('Error listing users:', userError)
    return
  }

  const user = userData.users.find(u => u.email === email)
  if (!user) {
    console.log('User not found')
    return
  }

  console.log('User id:', user.id)
  
  // Update user metadata to mark onboarding as complete
  const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { user_metadata: { ...user.user_metadata, has_completed_onboarding: true } }
  )

  if (updateError) {
    console.error('Error updating user metadata:', updateError.message)
  } else {
    console.log('User metadata updated successfully')
  }
}

clearOnboarding()
