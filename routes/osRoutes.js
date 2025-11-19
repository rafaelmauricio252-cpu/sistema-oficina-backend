// ============================================
// ROTAS DE ORDEM DE SERVIÇO
// ============================================

const express = require('express');
const router = express.Router();
const osController = require('../controllers/osController');
const { validarOS, validarID } = require('../middlewares/validarDados');

// Criar nova Ordem de Serviço
// POST /api/os
router.post('/', validarOS, osController.criarOS);

// Listar todas as OS (com filtros e paginação)
// GET /api/os?pagina=1&limite=20&status=Aguardando
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

module.exports = router;
