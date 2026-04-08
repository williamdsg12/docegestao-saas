
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function diagnostic() {
    console.log('--- Database Diagnostic ---')
    
    const tables = ['profiles', 'companies', 'orders', 'subscriptions', 'payments', 'plans']
    
    for (const table of tables) {
        const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
        
        if (error) {
            console.error(`Error checking table "${table}":`, error.message)
        } else {
            console.log(`Table "${table}": Found ${count} records.`)
            
            // Get one record to check structure
            const { data: sample } = await supabase.from(table).select('*').limit(1)
            if (sample && sample.length > 0) {
                console.log(`  Columns: ${Object.keys(sample[0]).join(', ')}`)
            }
        }
    }
}

diagnostic()
