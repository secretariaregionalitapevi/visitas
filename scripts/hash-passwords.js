#!/usr/bin/env node
require('dotenv').config();

const db = require('../src/config/dbConfig');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    const pool = db.pool;
    console.log('Conectando ao banco...');
    const res = await pool.query('SELECT id, password FROM users');
    console.log(`Encontrados ${res.rowCount} usuários`);

    for (const row of res.rows) {
      const current = row.password || '';
      const needsHash = !(current.startsWith('$2a$') || current.startsWith('$2b$') || current.startsWith('$2y$'));
      if (needsHash) {
        const hash = await bcrypt.hash(current, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, row.id]);
        console.log(`Atualizado usuário id=${row.id} (senha convertida)`);
      } else {
        console.log(`Pulado id=${row.id} (já em hash)`);
      }
    }

    await pool.end();
    console.log('Concluído.');
  } catch (err) {
    console.error('Erro:', err.message || err);
    try { await db.pool.end(); } catch (e) {}
    process.exit(1);
  }
})();
