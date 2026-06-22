const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Resetting failed queue items to 'pending'...");
  const { data, error } = await supabase
    .from('whatsapp_message_queue')
    .update({ status: 'pending', attempts: 0, error_message: null })
    .eq('status', 'failed');

  if (error) {
    console.error("Error resetting queue:", error.message);
  } else {
    console.log("Queue items reset successfully! Updates details:", data);
  }
}

run();
