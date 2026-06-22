const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspect() {
  console.log("=== INSPECTING customers TABLE ===");
  const { data: custData, error: custErr } = await supabase.from('customers').select('*').limit(1);
  if (custErr) {
    console.error("Error customers:", custErr.message);
  } else if (custData && custData.length > 0) {
    console.log("customers columns:", Object.keys(custData[0]));
    console.log("Sample customer:", custData[0]);
  } else {
    console.log("customers table is empty.");
  }

  console.log("\n=== INSPECTING clientes VIEW ===");
  const { data: cliData, error: cliErr } = await supabase.from('clientes').select('*').limit(1);
  if (cliErr) {
    console.error("Error clientes:", cliErr.message);
  } else if (cliData && cliData.length > 0) {
    console.log("clientes columns:", Object.keys(cliData[0]));
    console.log("Sample cliente:", cliData[0]);
  } else {
    console.log("clientes view/table is empty.");
  }
}

inspect();
