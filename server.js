// ============================================
// SERVIDOR PRINCIPAL - Sistema de Oficina Mecânica
// ============================================

// Importar dependências
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Aplicar migrations automaticamente no ambiente de produção
if (process.env.NODE_ENV === 'production') {
  const { execSync } = await import('child_process');
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
import db from './config/db.js';

// Importar rotas
import clienteRoutes from './routes/clienteRoutes.js';
import veiculoRoutes from './routes/veiculoRoutes.js';
import osRoutes from './routes/osRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import auxiliarRoutes from './routes/auxiliarRoutes.js';
import estoqueRoutes from './routes/estoqueRoutes.js';

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
  origin: process.env.CORS_ORIGIN || 'https://sistema-oficina-frontend-xpgo.onrender.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
};
app.use(cors(corsOptions));

// Preflight (OPTIONS)
app.options('*', cors(corsOptions));

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

export { app };