console.log("TESTE INICIO");

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    console.log("VOU CONECTAR EM:", process.env.DB_HOST, process.env.DB_PORT);
    const res = await pool.query("select now() as agora");
    console.log("OK:", res.rows[0]);
  } catch (err) {
    console.error("ERRO:", err);
  } finally {
    await pool.end();
    console.log("TESTE FIM");
  }
})();
