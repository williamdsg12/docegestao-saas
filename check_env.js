const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

console.log("Environment variables keys:");
console.log(Object.keys(process.env).filter(k => 
  k.includes('DB') || k.includes('POSTGRES') || k.includes('URL') || k.includes('KEY') || k.includes('CONN')
));
