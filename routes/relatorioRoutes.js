// ============================================
// ROTAS DE RELATÓRIOS
// ============================================

import express from 'express';
import relatorioController from '../controllers/relatorioController.js';
import { autenticar } from '../middlewares/autenticar.js';

const router = express.Router();

/**
 * POST /api/relatorios/os
 * Gera relatório de Ordens de Serviço
 */
router.post('/os', autenticar, relatorioController.gerarRelatorioOS);

/**
 * POST /api/relatorios/financeiro
 * Gera relatório financeiro (apenas OS pagas)
 */
router.post('/financeiro', autenticar, relatorioController.gerarRelatorioFinanceiro);

/**
 * POST /api/relatorios/estoque
 * Gera relatório de estoque com análises
 */
router.post('/estoque', autenticar, relatorioController.gerarRelatorioEstoque);

export default router;
