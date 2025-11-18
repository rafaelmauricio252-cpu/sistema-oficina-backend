// ============================================
// CONFIGURAÇÃO DE CORS PARA O BACKEND
// ============================================
// Arquivo: server.js (ou onde você inicializa o Express)

const express = require('express');
const cors = require('cors');
const app = express();

// ============================================
// OPÇÃO 1: CORS SIMPLES (Desenvolvimento)
// ============================================
// Permite TODAS as origens - use apenas em desenvolvimento
app.use(cors());

// ============================================
// OPÇÃO 2: CORS CONFIGURADO (Recomendado)
// ============================================
// Configure para aceitar apenas origens específicas
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5500', // Live Server
        'http://127.0.0.1:5500'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ============================================
// MIDDLEWARES
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// SUAS ROTAS
// ============================================
// ... suas rotas existentes ...

// ============================================
// TRATAMENTO DE ERROS CORS
// ============================================
app.use((err, req, res, next) => {
    if (err.name === 'CorsError') {
        res.status(403).json({
            erro: 'Acesso negado por política CORS',
            detalhes: err.message
        });
    } else {
        next(err);
    }
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
    console.log(`🌐 CORS habilitado para as origens configuradas`);
});

// ============================================
// INSTALAÇÃO DO CORS
// ============================================
// Se você ainda não tem o pacote cors instalado, execute:
// npm install cors

// ============================================
// TESTANDO CORS
// ============================================
// Depois de configurar, teste fazendo uma requisição do frontend:
// fetch('http://localhost:3000/api/clientes')
//   .then(response => response.json())
//   .then(data => console.log(data))
//   .catch(error => console.error('Erro:', error));
