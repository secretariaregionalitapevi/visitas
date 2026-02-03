const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users');

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
