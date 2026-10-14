const ContaRepository = require('../repositories/contaRepository');
const bcrypt = require('bcrypt'); // 👈 Importação da biblioteca
const jwt = require('jsonwebtoken')

// O COFRE: Rota de Cadastro
const registrar = async (req, res) => {
    const { nome, email, senha } = req.body;

    // 1. Verifica se o usuário já existe
    const contaExistente = await ContaRepository.buscarContaPorEmail(email);
    if (contaExistente) return res.status(400).json({ mensagem: 'Email já cadastrado.' });

    // 2. Criptografando a senha com custo 10
    const senha_hash = await bcrypt.hash(senha, 10); // 👈 Gera o Salt aleatório e o Hash

    // 3. Salva no banco (enviando o HASH, nunca a senha em texto limpo)
    const novaConta = await ContaRepository.criarConta(nome, email, senha_hash);
    
    res.status(201).json(novaConta);
};

// A PORTARIA: Rota de Login
const login = async (req, res) => {
    const { email, senha } = req.body;

    // 1. Busca se o email existe no banco
    const conta = await ContaRepository.buscarContaPorEmail(email);
    if (!conta) {
        // Por segurança, não confirmamos qual campo errou.
        return res.status(401).json({ mensagem: 'Credenciais inválidas.' });
    }

    // 2. Comparando a senha (bcrypt cuida de extrair o Salt sozinho)
    const senhaValida = await bcrypt.compare(senha, conta.senha_hash); // 👈 Comparação segura

    if (!senhaValida) {
        return res.status(401).json({ mensagem: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
        {id: conta.id},
        process.env.JWT_SECRET,
        {expiresIn: '1h'}
    );

    // 3. Sucesso!
    res.json({
        mensagem: 'Login realizado com sucesso! Bem-vindo(a).', 
        token:token
        });
};

const listarContas = async (req, res) => {
     try {
        const resultado = await ContaRepository.getAllContas();
        return res.status(200).json({
            mensagem:"Contas cadastradas",
            contas:resultado
        });
    }catch (error) {
        console.error(error.message);
        return res.status(500).json({
            mensagem:"Erro interno"
        });
    };
};

const verPerfil = async (req, res) => {
    // O segurança (middleware) já fez o trabalho duro e pendurou o ID do usuário no "req"
    const id = req.usuario_id;
    
    // Busca os dados completos no banco (reaproveitando a função do repositório)
    const dadosUsuario = await ContaRepository.buscarContaPorId(id);
    
    res.json(dadosUsuario);
};

module.exports = { registrar, login, listarContas, verPerfil};