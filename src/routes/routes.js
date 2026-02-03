const express = require('express');
const router = express.Router();
// Simple router-level logging to trace redirects during auth flow
router.use((req, res, next) => {
	console.log('ROUTES LOG:', { method: req.method, url: req.originalUrl, isLoggedIn: req.session && req.session.isLoggedIn });
	next();
});

router.get('/ping', (req, res) => { res.send('pong'); });
router.use('/', require('./index'));
router.use('/restrito', require('./restrict'));

module.exports = router;