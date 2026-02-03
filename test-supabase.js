require('dotenv').config();

const db = require('./src/config/dbConfig');

(async () => {
  try {
    const pool = db.pool;
    console.log('Tentando conectar usando:', process.env.DATABASE_URL || process.env.DB_HOST);
    const res = await pool.query('SELECT now() as now');
    console.log('Conectado, now =', res.rows[0].now);
  } catch (err) {
    console.error('Erro ao conectar:', err.message || err);
    process.exitCode = 1;
  } finally {
    try { await db.pool.end(); } catch(e){}
  }
})();
