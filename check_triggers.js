const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggers() {
    console.log("Checking triggers on 'pedidos'...");
    const { data: triggers, error } = await supabase.rpc('get_table_triggers', { table_name: 'pedidos' });
    
    if (error) {
        console.warn("RPC 'get_table_triggers' failed, trying query via SQL...");
        // This query requires higher permissions usually, but let's try a simpler one if possible
        // Actually, if RPC fails, I'll try to find common triggers in the .sql files
        console.log("Reading .sql files for triggers...");
    } else {
        console.log("Triggers found:", triggers);
    }
}

// Fallback to searching migrations for trigger keywords
const fs = require('fs');
const path = require('path');

function searchSqlFiles() {
    const files = fs.readdirSync('d:/app/sistema confeitaria')
        .filter(f => f.endsWith('.sql'));
    
    for (const file of files) {
        const content = fs.readFileSync(path.join('d:/app/sistema confeitaria', file), 'utf8');
        if (content.includes('trigger') || content.includes('FUNCTION')) {
            if (content.includes('empresa_id')) {
                console.log(`Found 'empresa_id' in ${file} inside a potential trigger/function definition.`);
                // Show surrounding lines
                const lines = content.split('\n');
                lines.forEach((line, i) => {
                    if (line.includes('empresa_id')) {
                        console.log(`${file}:${i+1}: ${line.trim()}`);
                    }
                });
            }
        }
    }
}

searchSqlFiles();
checkTriggers();
