
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function fixTypo() {
  const { data, error } = await supabase
    .from('menu_products')
    .update({ name: 'BOLO DE POTE COM MOUSSE' })
    .eq('name', 'BOLO DE POTE VOM MUSSE')

  if (error) {
    console.error('Error fixing typo:', error)
  } else {
    console.log('Typo fixed (if found).')
  }
}

fixTypo()
