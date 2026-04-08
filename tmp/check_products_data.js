const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkProducts() {
  const tenantId = 'd5c49dff-ecbe-4df3-9502-0a84093a5d42'
  console.log(`Checking products for tenant: ${tenantId}`)
  
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
  
  if (error) {
    console.error("Error fetching products:", error)
  } else {
    console.log(`Found ${products.length} products.`)
    products.forEach(p => {
      console.log(`Product: ${p.name}`)
      console.log(` - active: ${p.active}`)
      console.log(` - ativo: ${p.ativo}`)
      console.log(` - category_id: ${p.category_id}`)
      console.log(` - categoria_id: ${p.categoria_id}`)
      console.log(` - tenant_id: ${p.tenant_id}`)
      console.log(` - company_id: ${p.company_id}`)
    })
  }
}

checkProducts()
