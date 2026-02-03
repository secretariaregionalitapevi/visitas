require('dotenv').config();
const db = require('../src/config/dbConfig');
const conn = db.connection();

async function main(){
  try{
    const tablesSql = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name ILIKE '%church%';`;
    const [tables] = await conn.query(tablesSql);
    console.log('tables matching "%church%":', tables);

    if (tables.length === 0) {
      console.log('No tables found matching "church"');
    } else {
      for (const t of tables) {
        const tbl = t.table_name;
        const sql = `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position;`;
        const [cols] = await conn.query(sql, [tbl]);
        console.log(`columns for ${tbl}:`, JSON.stringify(cols, null, 2));
      }
    }
  } catch (err){
    console.error('error describing churches:', err);
  } finally {
    process.exit(0);
  }
}

main();
