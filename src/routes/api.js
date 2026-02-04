const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users');

// Healthcheck DB (protected by optional token)
router.get('/health/db', async (req, res) => {
  try {
    const token = process.env.HEALTHCHECK_TOKEN;
    if (token && req.query.token !== token) {
      return res.status(401).json({ ok: false, message: 'Unauthorized' });
    }

    const app = req.app;
    const [citiesRes] = await app.connection.query('SELECT COUNT(*)::int AS count FROM cities');
    const [churchesRes] = await app.connection.query('SELECT COUNT(*)::int AS count FROM churches');
    const [usersRes] = await app.connection.query('SELECT COUNT(*)::int AS count FROM users');

    return res.json({
      ok: true,
      counts: {
        cities: citiesRes?.[0]?.count ?? 0,
        churches: churchesRes?.[0]?.count ?? 0,
        users: usersRes?.[0]?.count ?? 0
      }
    });
  } catch (err) {
    console.error('health/db error:', err && err.stack ? err.stack : err);
    return res.status(500).json({
      ok: false,
      message: 'DB error',
      error: {
        code: err && err.code ? err.code : undefined,
        detail: err && err.message ? err.message : String(err)
      }
    });
  }
});

// Rota pública para criar usuário (útil para testes)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, cities } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email and password are required' });
    }

    // Reutiliza serviço existente (faz hash internamente)
    await usersController.createUser({ session: {} , app: req.app, body: { name, email, password, role: role || 'user', cities } }, res);
    // Se o controller já realizou redirect/response, não continuar
  } catch (err) {
    console.error('API /register error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Erro ao criar usuário.' });
    }
  }
});

module.exports = router;
