// ============================================
// ROTAS DE VEÍCULOS
// ============================================

const express = require('express');
const router = express.Router();
const veiculoController = require('../controllers/veiculoController');
const { validarVeiculo, validarID } = require('../middlewares/validarDados');

// Buscar veículos (autocomplete por placa)
// GET /api/veiculos/buscar?q=ABC
router.get('/buscar', veiculoController.buscarVeiculos);

// Cadastrar veículo rápido
// POST /api/veiculos/rapido
router.post('/rapido', validarVeiculo, veiculoController.cadastrarVeiculoRapido);

// Cadastrar veículo (rota padrão)
// POST /api/veiculos
router.post('/', validarVeiculo, veiculoController.cadastrarVeiculoRapido);

// Buscar histórico de OS do veículo
// GET /api/veiculos/:id/historico
router.get('/:id/historico', validarID, veiculoController.buscarHistoricoVeiculo);

// Listar todos os veículos
// GET /api/veiculos
router.get('/', veiculoController.listarTodosVeiculos);

// Buscar veículo por ID
// GET /api/veiculos/:id
router.get('/:id', validarID, veiculoController.buscarVeiculoPorID);

// Atualizar veículo
// PUT /api/veiculos/:id
router.put('/:id', validarID, validarVeiculo, veiculoController.atualizarVeiculo);

// Deletar veículo
// DELETE /api/veiculos/:id
router.delete('/:id', validarID, veiculoController.deletarVeiculo);

module.exports = router;
