require('dotenv').config();

const db = require('../src/config/dbConfig');
const loginService = require('../src/services/login');

(async () => {
  try {
    const app = { connection: db.connection() };

    const email = process.argv[2] || process.env.TEST_EMAIL;
    const password = process.argv[3] || process.env.TEST_PASSWORD;

    if (!email || !password) {
      console.error('Usage: node scripts/test-login.js <email> <password> OR set TEST_EMAIL and TEST_PASSWORD');
      process.exit(1);
    }

    console.log('Tentando autenticar:', email);
    const resp = await loginService.authenticateUserService(app, email.trim().toLowerCase(), password);
    console.log('Autenticação sucedida. Response:');
    console.log(resp);

    // Fecha pool
    try { await db.pool.end(); } catch (e) {}
    process.exit(0);
  } catch (err) {
    console.error('Falha na autenticação:', err.message || err);
    try { await db.pool.end(); } catch (e) {}
    process.exit(1);
  }
})();
