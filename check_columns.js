const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('pedidos').select('*').limit(1);
  if (error) {
    console.error("Error fetching pedidos:", error.message);
  } else {
    console.log("Success! Columns found in 'pedidos':");
    if (data.length > 0) {
      console.log(Object.keys(data[0]));
    } else {
      console.log("Table is empty, but we might be able to see columns if we use a different trick or just trust the error message.");
    }
  }
}

check();
