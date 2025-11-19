// ============================================
// ROTAS AUXILIARES - Mecânicos, Serviços, Dashboard
// ============================================

const express = require('express');
const router = express.Router();
const auxiliarController = require('../controllers/auxiliarController');
const { validarID } = require('../middlewares/validarDados');

// ============================================
// ROTAS DE MECÂNICOS
// ============================================

// Listar todos os mecânicos
// GET /api/mecanicos
router.get('/mecanicos', auxiliarController.listarMecanicos);

// Buscar mecânico por ID
// GET /api/mecanicos/:id
router.get('/mecanicos/:id', validarID, auxiliarController.buscarMecanicoPorID);

// Criar novo mecânico
// POST /api/mecanicos
router.post('/mecanicos', auxiliarController.criarMecanico);

// Atualizar mecânico
// PUT /api/mecanicos/:id
router.put('/mecanicos/:id', validarID, auxiliarController.atualizarMecanico);

// Deletar mecânico
// DELETE /api/mecanicos/:id
router.delete('/mecanicos/:id', validarID, auxiliarController.deletarMecanico);

// ============================================
// ROTAS DE SERVIÇOS
// ============================================

// Buscar serviços (autocomplete)
// GET /api/servicos/buscar?q=troca
router.get('/servicos/buscar', auxiliarController.buscarServicos);

// Listar todos os serviços
// GET /api/servicos
router.get('/servicos', auxiliarController.listarServicos);

// Buscar serviço por ID
// GET /api/servicos/:id
router.get('/servicos/:id', validarID, auxiliarController.buscarServicoPorID);

// Criar novo serviço
// POST /api/servicos
router.post('/servicos', auxiliarController.criarServico);

// Atualizar serviço
// PUT /api/servicos/:id
router.put('/servicos/:id', validarID, auxiliarController.atualizarServico);

// Deletar serviço
// DELETE /api/servicos/:id
router.delete('/servicos/:id', validarID, auxiliarController.deletarServico);

// ============================================
// ROTAS DE CATEGORIAS
// ============================================

// Listar categorias de peças
// GET /api/categorias
router.get('/categorias', auxiliarController.listarCategorias);

// ============================================
// ROTA DE DASHBOARD
// ============================================

// Dashboard - Estatísticas gerais
// GET /api/dashboard
router.get('/dashboard', auxiliarController.obterEstatisticas);

module.exports = router;
