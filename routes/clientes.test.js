const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const { generateValidCpf } = require('../utils/cpfGenerator');

async function criarClienteValido(app, overrides = {}) {
  const novoCliente = {
    nome: 'Cliente Teste',
    cpf_cnpj: generateValidCpf(false), // Gerar um CPF válido e não formatado
    telefone: '11999990000',
    ...overrides
  };

  const response = await request(app)
    .post('/api/clientes/rapido')
    .send(novoCliente);
  return response;
}

describe('Testes das Rotas de Clientes', () => {
  beforeEach(async () => {
    await db.raw(`
      DELETE FROM os_fotos;
      DELETE FROM os_servicos;
      DELETE FROM os_pecas;
      DELETE FROM ordem_servico;
      DELETE FROM veiculos;
      DELETE FROM clientes;
      DELETE FROM mecanicos;
      DELETE FROM servicos;
      DELETE FROM pecas;
    `);
  });

  test('POST /api/clientes/rapido - Deve criar um novo cliente com sucesso', async () => {
    const createResponse = await criarClienteValido(app, {
      nome: 'Cliente Teste Jest',
      telefone: '11912345678'
    });
    
    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.body.sucesso).toBe(true);
    expect(createResponse.body.cliente).toHaveProperty('id');
    expect(createResponse.body.cliente.nome).toBe('Cliente Teste Jest');
  });

  test('POST /api/clientes/rapido - Deve falhar ao criar cliente com CPF/CNPJ duplicado', async () => {
    const uniqueCpfCnpj = generateValidCpf(false); // Gerar um CPF único para este teste
    // 1. Cria um cliente inicial via API
    const createResponse = await criarClienteValido(app, {
      nome: 'Cliente Original',
      cpf_cnpj: uniqueCpfCnpj,
      telefone: '11999999999'
    });
    const originalCpfCnpj = createResponse.body.cliente.cpf_cnpj;

    // 2. Tenta criar outro com o mesmo CPF
    const response = await request(app)
      .post('/api/clientes/rapido')
      .send({
        nome: 'Cliente Duplicado',
        cpf_cnpj: originalCpfCnpj,
        telefone: '11987654321'
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('CPF/CNPJ já cadastrado');
  });

  test('GET /api/clientes - Deve listar os clientes', async () => {
    // 1. Cria um cliente para garantir que ele exista na base
    const createResponse = await criarClienteValido(app, {
      nome: 'Cliente na Lista'
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toBeDefined();

    // Se sua API devolve { cliente: {...} }
    const clienteCriado = createResponse.body.cliente || createResponse.body;
    expect(clienteCriado).toBeDefined();

    // 2. Faz o GET
    const response = await request(app).get('/api/clientes');

    expect(response.status).toBe(200);
    const lista = Array.isArray(response.body)
      ? response.body
      : response.body.clientes;

    expect(Array.isArray(lista)).toBe(true);

    // 3. Procura pelo cliente criado
    const clienteEncontrado = lista.find(
      (c) => c.nome === 'Cliente Na Lista'
    );

    expect(clienteEncontrado).toBeDefined();
  });

  test('GET /api/clientes/:id - Deve buscar um cliente específico por ID', async () => {
    // 1. Cria um cliente e pega o ID via API
    const createResponse = await criarClienteValido(app, {
      nome: 'Cliente para Busca',
      telefone: '11999999999'
    });
    const cliente = createResponse.body.cliente;
    
    // 2. Busca pelo ID
    const response = await request(app).get(`/api/clientes/${cliente.id}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.cliente.id).toBe(cliente.id);
    expect(response.body.cliente.nome).toBe('Cliente Para Busca'); // Corrigido para case sensitivity
  });

  test('PUT /api/clientes/:id - Deve atualizar um cliente com sucesso', async () => {
    // 1. Cria um cliente e pega o ID via API
    const createResponse = await criarClienteValido(app, {
      nome: 'Cliente Original',
      telefone: '11999999999'
    });
    const cliente = createResponse.body.cliente;

    // 2. Atualiza o cliente
    const response = await request(app)
      .put(`/api/clientes/${cliente.id}`)
      .send({
        nome: 'Cliente Atualizado',
        cpf_cnpj: cliente.cpf_cnpj, // Usar o CPF/CNPJ do cliente criado
        telefone: '11911112222'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.cliente.nome).toBe('Cliente Atualizado');
    expect(response.body.cliente.telefone).toBe('11911112222');
  });

  test('DELETE /api/clientes/:id - Deve deletar um cliente com sucesso', async () => {
    // 1. Cria um cliente e pega o ID via API
    const createResponse = await criarClienteValido(app, {
      nome: 'Cliente a Deletar',
      telefone: '11999999999'
    });
    const cliente = createResponse.body.cliente;
    
    // 2. Deleta o cliente
    const response = await request(app).delete(`/api/clientes/${cliente.id}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    
    // 3. Verifica se foi realmente deletado
    const getResponse = await request(app).get(`/api/clientes/${cliente.id}`);
    expect(getResponse.statusCode).toBe(404);
  });
});
