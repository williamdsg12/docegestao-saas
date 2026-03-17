const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findEmpresaIdEverywhere() {
    console.log("Searching for 'empresa_id' column in ALL tables...");
    
    // This query lists all tables with 'empresa_id'
    const { data, error } = await supabase.rpc('get_tables_with_column', { target_column: 'empresa_id' });
    
    if (error) {
        console.warn("RPC 'get_tables_with_column' failed, trying to infer from all tables...");
        // Fallback: list all tables and then check columns
        // But since I don't have a generic list tables RPC, I'll use a script to check common tables.
        const tablesToCheck = [
            'pedidos', 'itens_pedido', 'produtos', 'empresas', 'clientes', 
            'entregadores', 'fila_impressao', 'fidelidade_clientes', 
            'historico_pontos', 'cupons', 'recompensas', 'orders', 'users', 'profiles'
        ];
        
        for (const table of tablesToCheck) {
            const { data: selectData, error: selectError } = await supabase.from(table).select('*').limit(1);
            if (!selectError && selectData && selectData.length > 0) {
                if ('empresa_id' in selectData[0]) {
                    console.log(`Table '${table}' STILL HAS 'empresa_id'`);
                } else if ('company_id' in selectData[0]) {
                    console.log(`Table '${table}' has 'company_id'`);
                }
            } else if (selectError && selectError.message.includes('column "empresa_id" does not exist')) {
                 // Good
            } else if (selectError) {
                // console.log(`Table '${table}' error: ${selectError.message}`);
            }
        }
    } else {
        console.log("Tables with 'empresa_id':", data);
    }
}

findEmpresaIdEverywhere();
