// ============================================
// ROTAS DE VEÍCULOS
// ============================================

import express from 'express';
const router = express.Router();
import veiculoController from '../controllers/veiculoController.js';
import { validarVeiculo, validarID } from '../middlewares/validarDados.js';

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

// Verificar se veículo tem OS (para proteção de campos)
// GET /api/veiculos/:id/tem-os
router.get('/:id/tem-os', validarID, veiculoController.verificarVeiculoTemOS);

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

export default router;
