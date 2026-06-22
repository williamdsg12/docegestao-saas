require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  console.log('--- INGREDIENTES ---');
  const { data: ingData, error: ingError } = await supabase.from('ingredientes').select('*').limit(1);
  if (ingError) console.error('Error fetching ingredientes:', ingError);
  else console.log('Keys:', ingData.length > 0 ? Object.keys(ingData[0]) : 'Table empty');

  console.log('--- RECEITAS ---');
  const { data: recData, error: recError } = await supabase.from('receitas').select('*').limit(1);
  if (recError) console.error('Error fetching receitas:', recError);
  else console.log('Keys:', recData.length > 0 ? Object.keys(recData[0]) : 'Table empty');
}

check();
