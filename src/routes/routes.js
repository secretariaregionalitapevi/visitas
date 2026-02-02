const express = require('express');
const router = express.Router();

router.get('/ping', (req, res) => { res.send('pong'); });
router.use('/', require('./index'));
router.use('/restrito', require('./restrict'));

module.exports = router;