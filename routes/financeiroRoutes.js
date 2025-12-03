// ============================================
// ROTAS DE FINANCEIRO (Módulo de Receitas)
// ============================================

import express from 'express';
const router = express.Router();
import financeiroController from '../controllers/financeiroController.js';

// Dashboard Financeiro
// GET /api/financeiro/dashboard
router.get('/dashboard', financeiroController.getDashboard);

// Receitas com Filtros
// GET /api/financeiro/receitas
router.get('/receitas', financeiroController.getReceitas);

export default router;
