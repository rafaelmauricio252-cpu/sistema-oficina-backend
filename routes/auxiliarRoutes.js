// ============================================
// ROTAS AUXILIARES - Mecânicos, Serviços, Dashboard
// ============================================

import express from 'express';
const router = express.Router();
import auxiliarController from '../controllers/auxiliarController.js';
import { validarID } from '../middlewares/validarDados.js';
import { autenticar, verificarPermissao } from '../middlewares/autenticar.js';

// ============================================
// ROTAS DE MECÂNICOS
// ============================================

// Listar todos os mecânicos
// GET /api/mecanicos
router.get('/mecanicos', autenticar, verificarPermissao('mecanicos'), auxiliarController.listarMecanicos);

// Buscar mecânico por ID
// GET /api/mecanicos/:id
router.get('/mecanicos/:id', autenticar, verificarPermissao('mecanicos'), validarID, auxiliarController.buscarMecanicoPorID);

// Criar novo mecânico
// POST /api/mecanicos
router.post('/mecanicos', autenticar, verificarPermissao('mecanicos'), auxiliarController.criarMecanico);

// Atualizar mecânico
// PUT /api/mecanicos/:id
router.put('/mecanicos/:id', autenticar, verificarPermissao('mecanicos'), validarID, auxiliarController.atualizarMecanico);

// Deletar mecânico
// DELETE /api/mecanicos/:id
router.delete('/mecanicos/:id', autenticar, verificarPermissao('mecanicos'), validarID, auxiliarController.deletarMecanico);

// ============================================
// ROTAS DE SERVIÇOS
// ============================================

// Buscar serviços (autocomplete)
// GET /api/servicos/buscar?q=troca
router.get('/servicos/buscar', autenticar, verificarPermissao('servicos'), auxiliarController.buscarServicos);

// Listar todos os serviços
// GET /api/servicos
router.get('/servicos', autenticar, verificarPermissao('servicos'), auxiliarController.listarServicos);

// Buscar serviço por ID
// GET /api/servicos/:id
router.get('/servicos/:id', autenticar, verificarPermissao('servicos'), validarID, auxiliarController.buscarServicoPorID);

// Criar novo serviço
// POST /api/servicos
router.post('/servicos', autenticar, verificarPermissao('servicos'), auxiliarController.criarServico);

// Atualizar serviço
// PUT /api/servicos/:id
router.put('/servicos/:id', autenticar, verificarPermissao('servicos'), validarID, auxiliarController.atualizarServico);

// Deletar serviço
// DELETE /api/servicos/:id
router.delete('/servicos/:id', autenticar, verificarPermissao('servicos'), validarID, auxiliarController.deletarServico);

// ============================================
// ROTAS DE CATEGORIAS
// ============================================

// Listar categorias de peças
// GET /api/categorias
router.get('/categorias', autenticar, auxiliarController.listarCategorias);

// ============================================
// ROTA DE DASHBOARD
// ============================================

// Dashboard - Estatísticas gerais
// GET /api/dashboard
router.get('/dashboard', autenticar, auxiliarController.obterEstatisticas);

export default router;
