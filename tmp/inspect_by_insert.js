const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectByInsertion() {
  const dummyId = '00000000-0000-0000-0000-000000000000'; // This might fail if no user with this ID exists in auth.users
  
  // Let's find a real user ID first if possible
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  const userId = users?.users?.[0]?.id || dummyId;

  console.log("Using User ID for test:", userId);

  // Try to insert with just ID
  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .upsert({ id: userId })
    .select('*')
  
  if (insertError) {
    console.error("Insert failed:", insertError.message, insertError.details);
    // If it failed because of missing columns, it might tell us something
  } else {
    console.log("COLUMNS FOUND via SELECT *:", Object.keys(inserted[0]));
  }
}

inspectByInsertion();
