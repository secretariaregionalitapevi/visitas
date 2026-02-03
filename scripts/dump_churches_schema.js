require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/dbConfig');
const conn = db.connection();

async function main(){
  try{
    const tablesSql = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name ILIKE '%church%';`;
    const [tables] = await conn.query(tablesSql);

    const out = { tables: tables, columns: {} };

    for (const t of tables) {
      const tbl = t.table_name;
      const sql = `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position;`;
      const [cols] = await conn.query(sql, [tbl]);
      out.columns[tbl] = cols;
    }

    const outPath = path.join(__dirname, '..', 'tmp');
    if (!fs.existsSync(outPath)) fs.mkdirSync(outPath);
    fs.writeFileSync(path.join(outPath, 'churches_schema.json'), JSON.stringify(out, null, 2));
    console.log('Wrote tmp/churches_schema.json');
  } catch (err){
    console.error('error describing churches:', err);
  } finally {
    process.exit(0);
  }
}

main();
