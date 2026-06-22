const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  try {
    const { data, error } = await supabase
      .from('restaurant_tables')
      .insert({
        table_number: '999',
        name: 'Mesa de Teste',
        capacity: 4,
        status: 'free'
      })
      .select();

    if (error) {
      console.error("Error message:", error.message);
      console.error("Error details:", error.details);
      console.error("Error hint:", error.hint);
    } else {
      console.log("Success! Inserted row:", data);
      // Let's delete it so we don't leave junk
      await supabase.from('restaurant_tables').delete().eq('table_number', '999');
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
