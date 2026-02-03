require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'postgres'}`;

(async () => {
  const client = new Client({ connectionString, ssl: connectionString.includes('supabase.co') ? { rejectUnauthorized: false } : false });
  try {
    await client.connect();
    const { rows: tables } = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name ILIKE '%church%';");
    const out = { tables, columns: {} };
    for (const t of tables) {
      const tbl = t.table_name;
      const { rows: cols } = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position;", [tbl]);
      out.columns[tbl] = cols;
    }
    const outPath = path.join(__dirname, '..', 'tmp');
    if (!fs.existsSync(outPath)) fs.mkdirSync(outPath);
    fs.writeFileSync(path.join(outPath, 'churches_schema_client.json'), JSON.stringify(out, null, 2));
    console.log('Wrote tmp/churches_schema_client.json');
  } catch (err) {
    console.error('client error:', err);
  } finally {
    try { await client.end(); } catch (_) {}
    process.exit(0);
  }
})();
