const express = require('express');
const router = express.Router();
const contaController = require('../controllers/contaController');
const authMiddleware = require('../middlewares/middleware');

router.post('/registrar', contaController.registrar);
router.post('/login', contaController.login);
router.get('/', contaController.listarContas);
router.get('/perfil', authMiddleware, contaController.verPerfil);

module.exports = router;