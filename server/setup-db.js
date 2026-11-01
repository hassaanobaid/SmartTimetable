// Usage: npm run setup-db            (creates database + tables + time slots)
//        npm run setup-db -- --sample (also adds demo data)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });
  const files = ['database.sql'];
  if (process.argv.includes('--sample')) files.push('sample_data.sql');
  for (const f of files) {
    await conn.query(fs.readFileSync(path.join(__dirname, '..', 'database', f), 'utf8'));
    console.log('Ran ' + f);
  }
  await conn.end();
  console.log('Done. Database "smart_timetable" is ready.');
})().catch((e) => {
  console.error('Setup failed: ' + e.message);
  console.error('Is MySQL running in the XAMPP Control Panel?');
  process.exit(1);
});
