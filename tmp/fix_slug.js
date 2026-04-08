const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function fixSlug() {
  const oldSlug = 'doce-gestao-968ec'
  const newSlug = 'docesdowill'
  
  console.log(`Updating slug from ${oldSlug} to ${newSlug}...`)
  const { data, error } = await supabase
    .from('tenants')
    .update({ slug: newSlug })
    .eq('slug', oldSlug)
    .select()
  
  if (error) {
    console.error("Error updating slug:", error)
  } else {
    console.log("Update successful:", data)
  }
}

fixSlug()
