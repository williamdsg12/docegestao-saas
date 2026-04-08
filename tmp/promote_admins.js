
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function parseEnv() {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
        }
    });
    return env;
}

const env = parseEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function promote() {
    console.log('--- Promoting Admins ---');
    const { data: users, error } = await supabase.from('profiles').select('id, email, name');
    
    if (error) {
        console.error('Error fetching users:', error.message);
        return;
    }
    
    if (!users || users.length === 0) {
        console.log('No users found to promote.');
        return;
    }
    
    console.log(`Found ${users.length} users. Promoting all to admin for testing...`);
    
    for (const user of users) {
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ is_admin: true, role: 'admin' })
            .eq('id', user.id);
            
        if (updateError) {
            console.error(`Error promoting ${user.email || user.id}:`, updateError.message);
        } else {
            console.log(`Promoted user: ${user.email || user.name || user.id}`);
        }
    }
}

promote();
