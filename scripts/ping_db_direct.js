require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'postgres'}`;

const pool = new Pool({ connectionString, ssl: connectionString.includes('supabase.co') ? { rejectUnauthorized: false } : false });

async function main(){
  try{
    const tablesSql = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name ILIKE '%church%';`;
    const { rows: tables } = await pool.query(tablesSql);

    const out = { tables: tables, columns: {} };

    for (const t of tables) {
      const tbl = t.table_name;
      const sql = `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position;`;
      const { rows: cols } = await pool.query(sql, [tbl]);
      out.columns[tbl] = cols;
    }

    const outPath = path.join(__dirname, '..', 'tmp');
    if (!fs.existsSync(outPath)) fs.mkdirSync(outPath);
    fs.writeFileSync(path.join(outPath, 'churches_schema_direct.json'), JSON.stringify(out, null, 2));
    console.log('Wrote tmp/churches_schema_direct.json');
  } catch (err){
    console.error('error describing churches direct:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
