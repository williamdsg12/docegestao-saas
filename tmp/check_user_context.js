const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const email = 'williamdsg12@gmail.com';
  console.log(`Checking Profiles for Email: ${email}`);

  // 1. Get User ID
  const { data: { users }, error: userErr } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.error('User not found');
    return;
  }

  console.log(`User ID: ${user.id}`);

  // 2. List all profiles for this ID
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id);

  if (profErr) {
    console.error('Profile Error:', profErr.message);
  } else {
    console.log('Profiles Found:', JSON.stringify(profiles, null, 2));
  }
  // Check if get_my_tenant_id works for this user via RPC if possible
  // Or just check if tenant_id in profile matches what we expect
}

main();
