const pool = require('../config/db');

// Salva o usuário no banco (recebe o hash pronto do Controller)
const criarConta = async (nome, email, senha_hash) => {
    const sql = 'INSERT INTO contas (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email';
    const resultado = await pool.query(sql, [nome, email, senha_hash]);
    return resultado.rows[0];
};

// Busca o usuário pelo email para podermos conferir a senha no login
const buscarContaPorEmail = async (email) => {
    const sql = 'SELECT * FROM contas WHERE email = $1';
    const resultado = await pool.query(sql, [email]);
    return resultado.rows[0];
};

const buscarContaPorId = async (id) => {
    const sql = 'SELECT id, nome, email FROM contas WHERE id = $1';
    const resultado = await pool.query(sql, [id]);
    return resultado.rows[0];
};

const getAllContas = async() => {
    const sql = 'SELECT nome, email FROM contas'
    const resultado = await pool.query(sql);

    return resultado.rows;
};

module.exports = {criarConta, buscarContaPorEmail, getAllContas, buscarContaPorId};