const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const dbUrl = process.env.DATABASE_URL || '';
console.log("DATABASE_URL length:", dbUrl.length);
if (dbUrl) {
  console.log("DATABASE_URL prefix:", dbUrl.slice(0, 25));
  console.log("DATABASE_URL contains placeholder?", dbUrl.includes('host') || dbUrl.includes('placeholder'));
}
