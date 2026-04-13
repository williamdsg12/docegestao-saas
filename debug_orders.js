const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
    console.log('\n--- LAST 5 ORDERS ---')
    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, tenant_id, company_id, status, created_at, customer_id')
        .order('created_at', { ascending: false })
        .limit(5)

    if (error) {
        console.error('Error fetching orders:', error.message)
    } else {
        console.table(orders)
    }
}

run()
