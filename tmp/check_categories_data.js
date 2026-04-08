const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkCategories() {
  const tenantId = 'd5c49dff-ecbe-4df3-9502-0a84093a5d42'
  console.log(`Checking categories for tenant: ${tenantId}`)
  
  const { data: categories, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('tenant_id', tenantId)
  
  if (error) {
    console.error("Error fetching categories:", error)
  } else {
    console.log(`Found ${categories.length} categories.`)
    categories.forEach(c => {
      console.log(`Category: ${c.name} (ID: ${c.id})`)
      console.log(` - active: ${c.active}`)
      console.log(` - tenant_id: ${c.tenant_id}`)
    })
  }
  
  // Also check if any products have invalid category_id
  const { data: prods } = await supabase.from('products').select('name, category_id').eq('tenant_id', tenantId)
  console.log("\nProducts in DB:")
  prods.forEach(p => {
    const catExists = categories.find(c => c.id === p.category_id)
    console.log(`Product: ${p.name}, category_id: ${p.category_id}, category exists: ${!!catExists}`)
  })
}

checkCategories()
