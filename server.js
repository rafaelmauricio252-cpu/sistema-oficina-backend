// ============================================
// SERVIDOR DA OFICINA - API COMPLETA
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();

// ============================================
// MIDDLEWARES
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (fotos)
app.use('/uploads', express.static('uploads'));

// ============================================
// IMPORTAR ROTAS
// ============================================
const clienteRoutes = require('./routes/clienteRoutes');
const veiculoRoutes = require('./routes/veiculoRoutes');
const estoqueRoutes = require('./routes/estoqueRoutes');
const osRoutes = require('./routes/osRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const auxiliarRoutes = require('./routes/auxiliarRoutes');

// ============================================
// USAR ROTAS
// ============================================
app.use('/api/clientes', clienteRoutes);
app.use('/api/veiculos', veiculoRoutes);
app.use('/api/pecas', estoqueRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/os', osRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', auxiliarRoutes);

// ============================================
// ROTA PRINCIPAL
// ============================================
app.get('/', (req, res) => {
  res.json({
    mensagem: '🚗 API da Oficina está funcionando!',
    versao: '2.0.0',
    status: 'online'
  });
});

// Rota de teste do banco
app.get('/api/teste-banco', async (req, res) => {
  try {
    const result = await db.raw('SELECT NOW()');
    res.json({
      mensagem: '✅ Banco de dados conectado!',
      horario_servidor: result.rows[0].now
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao conectar com o banco de dados' });
  }
});

// ============================================
// TRATAMENTO DE ERROS
// ============================================
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Exporta o app para ser usado pelo servidor principal e pelos testes
module.exports = app;
