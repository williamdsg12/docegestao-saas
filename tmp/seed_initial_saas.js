const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const email = 'williamdsg12@gmail.com';
  console.log(`Manually Seeding SaaS Data for: ${email}`);

  // 1. Get User ID
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.error('User not found');
    return;
  }
  console.log(`User ID: ${user.id}`);

  // 2. Ensure Tenant exists
  let { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!tenant) {
    console.log('Creating new tenant...');
    const { data: newTenant, error: tErr } = await supabase
      .from('tenants')
      .insert({ 
        name: 'Doce Gestão Store', 
        slug: 'doce-gestao-' + user.id.slice(0, 5),
        owner_id: user.id 
      })
      .select()
      .single();
    
    if (tErr) {
        console.error('Error creating tenant:', tErr.message);
        return;
    }
    tenant = newTenant;
  }
  console.log(`Tenant ID: ${tenant.id}`);

  // 3. Create/Update Profile
  console.log('Upserting profile...');
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      tenant_id: tenant.id,
      role: 'admin',
      name: 'William Souza'
    })
    .select()
    .single();

  if (pErr) {
    console.error('Error upserting profile:', pErr.message);
  } else {
    console.log('Profile created/updated successfully!');
    console.log(JSON.stringify(profile, null, 2));
  }
}

main();
