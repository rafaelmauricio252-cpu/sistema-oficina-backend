// ============================================
// ROTAS DE FINANCEIRO (Módulo de Receitas)
// ============================================

import express from 'express';
const router = express.Router();
import financeiroController from '../controllers/financeiroController.js';
import { autenticar, verificarPermissao } from '../middlewares/autenticar.js';

// Proteger todas as rotas de financeiro
router.use(autenticar);
router.use(verificarPermissao('financeiro'));

// Dashboard Financeiro
// GET /api/financeiro/dashboard
router.get('/dashboard', financeiroController.getDashboard);

// Receitas com Filtros
// GET /api/financeiro/receitas
router.get('/receitas', financeiroController.getReceitas);

export default router;
