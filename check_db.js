import { supabaseAdmin } from './lib/supabaseAdmin.js'

async function checkSchema() {
    const tables = ['orders', 'clients', 'orcamentos', 'transactions', 'ingredients', 'recipes', 'products']
    
    for (const table of tables) {
        console.log(`Checking table: ${table}`)
        const { data, error } = await supabaseAdmin
            .from(table)
            .select('*')
            .limit(1)
        
        if (error) {
            console.error(`Error checking ${table}:`, error.message)
            continue
        }
        
        if (data && data.length > 0) {
            console.log(`Columns for ${table}:`, Object.keys(data[0]))
        } else {
            console.log(`Table ${table} is empty, could not determine columns via select.`)
        }
    }
}

checkSchema()
