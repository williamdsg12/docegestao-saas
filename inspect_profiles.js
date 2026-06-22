const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.error("Error profiles:", error);
    return;
  }

  console.log("Profiles count:", profiles.length);
  console.log("Profiles details:", JSON.stringify(profiles, null, 2));
}

inspect();
