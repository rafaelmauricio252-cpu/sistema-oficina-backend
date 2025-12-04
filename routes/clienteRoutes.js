// ============================================
// ROTAS DE CLIENTES
// ============================================

import express from 'express';
const router = express.Router();
import clienteController from '../controllers/clienteController.js';
import veiculoController from '../controllers/veiculoController.js'; // Importar o controller de veículos
import { validarCliente, validarID } from '../middlewares/validarDados.js';
import { autenticar, verificarPermissao } from '../middlewares/autenticar.js';

// Proteger todas as rotas de clientes
router.use(autenticar);
router.use(verificarPermissao('clientes'));

// Buscar clientes (autocomplete)
// GET /api/clientes/buscar?q=joao
router.get('/buscar', clienteController.buscarClientes);

// Listar veículos de um cliente específico
// GET /api/clientes/:id/veiculos
router.get('/:id/veiculos', validarID, (req, res, next) => {
    // Adapta o parâmetro da rota para a query esperada pelo controller
    req.query.cliente_id = req.params.id;
    veiculoController.listarVeiculosDoCliente(req, res, next);
});

// Cadastrar cliente rápido
// POST /api/clientes/rapido
router.post('/rapido', validarCliente, clienteController.cadastrarClienteRapido);

// Cadastrar cliente (rota padrão)
// POST /api/clientes
router.post('/', validarCliente, clienteController.cadastrarClienteRapido);

// Listar todos os clientes (com paginação)
// GET /api/clientes?pagina=1&limite=20
router.get('/', clienteController.listarClientes);

// Buscar cliente + veículos (sem alterar a rota existente /:id)
router.get('/:id/completo', clienteController.buscarClienteCompleto);

// Verificar se cliente tem ordens de serviço
// GET /api/clientes/:id/tem-os
router.get('/:id/tem-os', clienteController.verificarClienteTemOS);

// Buscar cliente por ID
// GET /api/clientes/:id
router.get('/:id', validarID, clienteController.buscarClientePorID);

// Atualizar cliente
// PUT /api/clientes/:id
router.put('/:id', validarID, validarCliente, clienteController.atualizarCliente);

// Deletar cliente
// DELETE /api/clientes/:id
router.delete('/:id', validarID, clienteController.deletarCliente);

export default router;

