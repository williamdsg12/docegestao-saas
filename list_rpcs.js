const axios = require('axios');
require('dotenv').config();

async function listRPCs() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const response = await axios.get(url, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    const paths = Object.keys(response.data.paths || {});
    const rpcs = paths.filter(p => p.startsWith('/rpc/'));
    
    console.log("=== EXPOSED RPC FUNCTIONS ===");
    rpcs.forEach(rpc => {
      console.log(rpc);
    });
    
  } catch (error) {
    console.error("Error fetching OpenAPI:", error.message);
  }
}

listRPCs();
