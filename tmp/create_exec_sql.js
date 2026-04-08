const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createExecSql() {
    console.log("Creating exec_sql function...");
    // We can't use rpc to create a function that rpc uses.
    // But we can use the regular Supabase client to run a simple query if we have a way.
    // Actually, Supabase client doesn't support raw SQL unless via RPC.
    // So we HAVE to use the SQL Editor or psql.
    
    // Wait! I can use the 'postgres' library if I have the connection string.
    // I have DATABASE_URL in .env!
    
    const { DATABASE_URL } = process.env;
    if (DATABASE_URL) {
        const { Client } = require('pg');
        const client = new Client({ connectionString: DATABASE_URL });
        await client.connect();
        await client.query(`
            CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
            RETURNS void AS $$
            BEGIN
              EXECUTE sql_query;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
        `);
        console.log("exec_sql created successfully via pg!");
        await client.end();
    } else {
        console.error("Missing DATABASE_URL");
    }
}

createExecSql();
