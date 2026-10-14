const express = require('express');
const path = require('path');
const contaRoutes = require('../src/routes/contaRoutes');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Cadastra a rota base
app.use('/contas', contaRoutes);

module.exports = app;