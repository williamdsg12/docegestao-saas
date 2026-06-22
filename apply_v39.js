const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("Missing DATABASE_URL environment variable");
    process.exit(1);
}

const client = new Client({ connectionString });

async function applyMigration() {
  const sqlPath = path.join(__dirname, 'migration_v39_delivery_tracking_fields.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log("Attempting to apply Migration V39 via PostgreSQL...");
  
  try {
    await client.connect();
    await client.query(sql);
    console.log("✅ Migration V39 applied successfully!");
  } catch (error) {
    console.error("❌ Error applying SQL:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
