// ============================================
// ROTAS DE ESTOQUE
// ============================================

import express from 'express';
const router = express.Router();
import estoqueController from '../controllers/estoqueController.js';
import { darEntrada, darSaida } from '../controllers/estoqueController.js';
import { validarID } from '../middlewares/validarDados.js';
import { autenticar, verificarPermissao } from '../middlewares/autenticar.js';

// Proteger todas as rotas de peças/estoque
router.use(autenticar);
router.use(verificarPermissao('pecas'));

// Criar nova peça
// POST /api/pecas
router.post('/', estoqueController.criarPeca);

// Atualizar peça
// PUT /api/pecas/:id
router.put('/:id', validarID, estoqueController.atualizarPeca);

// Deletar peça
// DELETE /api/pecas/:id
router.delete('/:id', validarID, estoqueController.deletarPeca);

// Buscar peças (autocomplete)
// GET /api/pecas/buscar?q=filtro
router.get('/buscar', estoqueController.buscarPecas);

// Validar disponibilidade de estoque
// GET /api/estoque/validar?peca_id=5&quantidade=2
router.get('/validar', estoqueController.validarEstoque);

// Buscar peças com estoque baixo
// GET /api/estoque/baixo
router.get('/baixo', estoqueController.buscarEstoqueBaixo);

// Buscar histórico de movimentação de uma peça
// GET /api/pecas/:peca_id/historico
router.get('/:peca_id/historico', validarID, estoqueController.buscarHistoricoMovimentacao);

// Registrar entrada manual de estoque
// POST /api/pecas/entrada
router.post('/entrada', darEntrada);

// Registrar saída manual de estoque
// POST /api/pecas/saida
router.post('/saida', darSaida);

// Listar todas as peças (com paginação)
// GET /api/pecas?pagina=1&limite=20
router.get('/', estoqueController.listarPecas);

// Buscar peça por ID
// GET /api/pecas/:id
router.get('/:id', validarID, estoqueController.buscarPecaPorID);

export default router;
