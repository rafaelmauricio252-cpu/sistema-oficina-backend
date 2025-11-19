// ============================================
// SERVIDOR PRINCIPAL - Sistema de Oficina Mecânica
// ============================================

// Importar dependências
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Aplicar migrations automaticamente no ambiente de produção
if (process.env.NODE_ENV === 'production') {
  const { execSync } = require('child_process');
  try {
    console.log('🔄 Aplicando migrations antes de iniciar...');
    execSync('npx node-pg-migrate up', { stdio: 'inherit' });
    console.log('✅ Migrations aplicadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao aplicar migrations:', error.message);
    process.exit(1);
  }
}

// Importar configurações
const db = require('./config/db');

// Importar rotas
const clienteRoutes = require('./routes/clienteRoutes');
const veiculoRoutes = require('./routes/veiculoRoutes');
const osRoutes = require('./routes/osRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const auxiliarRoutes = require('./routes/auxiliarRoutes');
const estoqueRoutes = require('./routes/estoqueRoutes');

// ============================================
// CONFIGURAÇÃO DO SERVIDOR
// ============================================

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de segurança
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Middleware de CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173', // Vite default
    'http://127.0.0.1:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos de uploads
app.use('/uploads', express.static('uploads'));

// ============================================
// ROTAS DA API
// ============================================

// Rotas principais
app.use('/api/clientes', clienteRoutes);
app.use('/api/veiculos', veiculoRoutes);
app.use('/api/os', osRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', auxiliarRoutes);
app.use('/api/pecas', estoqueRoutes);  // Adicionado rota para peças/estoque

// Rota de saúde (para verificar se o serviço está rodando)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0'
  });
});

// Rota principal
app.get('/', (req, res) => {
  res.json({
    mensagem: '🚗 API da Oficina Mecânica está funcionando!',
    versao: '2.0.0',
    status: 'online',
    endpoints: {
      clientes: '/api/clientes',
      veiculos: '/api/veiculos', 
      servicos: '/api/servicos',
      pecas: '/api/pecas',
      os: '/api/os',
      mecanicos: '/api/mecanicos',
      dashboard: '/api/dashboard',
      health: '/health'
    }
  });
});

// Rota 404 para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================

const server = app.listen(PORT, async () => {
  console.log('\n==============================================');
  console.log('🚗  SERVIDOR DA OFICINA INICIADO!');
  console.log('==============================================');
  console.log(`📡 Rodando em: http://localhost:${PORT}`);
  console.log(`🕐 Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log('==============================================\n');

  console.log('📋 Endpoints disponíveis:');
  console.log('   - GET  http://localhost:' + PORT + '/');
  console.log('   - GET  http://localhost:' + PORT + '/health');
  console.log('   - GET  http://localhost:' + PORT + '/api/clientes');
  console.log('   - GET  http://localhost:' + PORT + '/api/veiculos');
  console.log('   - GET  http://localhost:' + PORT + '/api/os');
  console.log('   - GET  http://localhost:' + PORT + '/api/servicos');
  console.log('   - GET  http://localhost:' + PORT + '/api/pecas');
  console.log('   - GET  http://localhost:' + PORT + '/api/dashboard');
  console.log('\n💡 Pressione CTRL+C para parar o servidor');
  console.log('==============================================\n');
});

module.exports = { app, server };