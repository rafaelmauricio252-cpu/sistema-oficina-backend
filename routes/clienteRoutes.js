// ============================================
// ROTAS DE CLIENTES
// ============================================

const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const veiculoController = require('../controllers/veiculoController'); // Importar o controller de veículos
const { validarCliente, validarID } = require('../middlewares/validarDados');

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

// Buscar cliente por ID
// GET /api/clientes/:id
router.get('/:id', validarID, clienteController.buscarClientePorID);

// Buscar cliente + veículos (sem alterar a rota existente /:id)
router.get('/:id/completo', clienteController.buscarClienteCompleto);

// Atualizar cliente
// PUT /api/clientes/:id
router.put('/:id', validarID, validarCliente, clienteController.atualizarCliente);

// Deletar cliente
// DELETE /api/clientes/:id
router.delete('/:id', validarID, clienteController.deletarCliente);

export default router;

