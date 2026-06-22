require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testInsert() {
  console.log('Testing minimal insert...');
  const { error } = await supabase.from('ingredientes').insert([{ nome: 'TEST_INGREDIENT' }]);
  if (error) {
    console.error('Insert failed:', error.message);
    console.error('Error details:', error.details);
  } else {
    console.log('Insert successful! (No required columns other than nome)');
  }
}

testInsert();
