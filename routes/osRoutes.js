// ============================================
// ROTAS DE ORDEM DE SERVIÇO
// ============================================

import express from 'express';
const router = express.Router();
import osController from '../controllers/osController.js';
import { validarOS, validarID } from '../middlewares/validarDados.js';

// Criar nova Ordem de Serviço
// POST /api/os
router.post('/', validarOS, osController.criarOS);

// Listar todas as OS (com filtros e paginação)
// GET /api/os?pagina=1&limite=20&status=Agendamento
router.get('/', osController.listarOS);

// Buscar OS por ID (completa com todos os detalhes)
// GET /api/os/:id
router.get('/:id', validarID, osController.buscarOSPorID);

// Atualizar OS
// PUT /api/os/:id
router.put('/:id', validarID, osController.atualizarOS);

// Deletar (Cancelar) OS
// DELETE /api/os/:id
router.delete('/:id', validarID, osController.deletarOS);

export default router;
