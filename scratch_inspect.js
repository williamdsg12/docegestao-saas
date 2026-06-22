const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();
    console.log("Connected successfully!");
    
    // 1. Describe restaurant_tables columns
    const tblRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'restaurant_tables'
    `);
    console.log("\nrestaurant_tables columns:");
    console.table(tblRes.rows);

    // 2. Describe orders columns
    const ordRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
    `);
    console.log("\norders columns:");
    console.table(ordRes.rows);

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

run();
