const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const sql = `
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID,
    admin_email TEXT,
    target_user_id UUID,
    action TEXT NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can read logs
CREATE POLICY "Only super admins can read logs" ON admin_audit_logs
    FOR SELECT USING (auth.jwt() ->> 'email' = 'williamdev36@gmail.com');
`;

// O Supabase JS não permite rodar DDL arbitrário facilmente sem a extensão vault ou rpc personalizada.
// Vamos tentar inserir um log de teste para ver se a tabela existe.
async function checkOrLog() {
    try {
        const { error } = await supabase.from('admin_audit_logs').insert({
            admin_email: 'system',
            action: 'check_table_existence',
            new_value: { msg: 'Ensuring table exists' }
        });
        
        if (error && error.code === '42P01') {
            console.log('TABLE_NOT_FOUND');
        } else if (error) {
            console.log('ERROR:', error.message);
        } else {
            console.log('TABLE_EXISTS_OR_CREATED');
        }
    } catch (e) {
        console.log('CRASH');
    }
}

checkOrLog();
