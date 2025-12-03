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

describe('Testes das Rotas de Veículos', () => {
  
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

  // Hook que roda DEPOIS DE TODOS os testes
  afterAll(async () => {
    // Fecha a conexão com o banco para o Jest não ficar travado
    await db.destroy();
  });

  test('POST /api/veiculos/rapido - Deve criar um novo veículo com sucesso', async () => {
    const createClientResponse = await criarClienteValido(app);
    const clienteId = createClientResponse.body.cliente.id;

    const response = await request(app)
      .post('/api/veiculos/rapido')
      .send({
        cliente_id: clienteId,
        placa: 'JST0001',
        marca: 'FIAT',
        modelo: 'Uno'
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.veiculo.placa).toBe('JST0001');
  });

  test('POST /api/veiculos/rapido - Deve falhar ao criar veículo com placa duplicada', async () => {
    const createClientResponse = await criarClienteValido(app);
    const clienteId = createClientResponse.body.cliente.id;

    await request(app)
      .post('/api/veiculos/rapido')
      .send({ cliente_id: clienteId, placa: 'DPE0001', marca: 'VW', modelo: 'Gol' });

    const response = await request(app)
      .post('/api/veiculos/rapido')
      .send({
        cliente_id: clienteId,
        placa: 'DPE0001',
        marca: 'FORD',
        modelo: 'Ka'
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Placa já cadastrada');
  });

  test('GET /api/veiculos?cliente_id=:id - Deve listar os veículos de um cliente', async () => {
    const createClientResponse = await criarClienteValido(app);
    const clienteId = createClientResponse.body.cliente.id;

    await request(app)
      .post('/api/veiculos/rapido')
      .send({ cliente_id: clienteId, placa: 'VEC0001', marca: 'VW', modelo: 'Gol' });
    await request(app)
      .post('/api/veiculos/rapido')
      .send({ cliente_id: clienteId, placa: 'VEC0002', marca: 'GM', modelo: 'Onix' });

    const response = await request(app).get(`/api/veiculos?cliente_id=${clienteId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.veiculos).toHaveLength(2);
  });

  test('GET /api/veiculos/:id - Deve buscar um veículo por ID', async () => {
    const createClientResponse = await criarClienteValido(app);
    const clienteId = createClientResponse.body.cliente.id;

    const createVehicleResponse = await request(app)
      .post('/api/veiculos/rapido')
      .send({ cliente_id: clienteId, placa: 'GBI0001', marca: 'RENAULT', modelo: 'Kwid' });
    const veiculo = createVehicleResponse.body.veiculo;

    const response = await request(app).get(`/api/veiculos/${veiculo.id}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.veiculo.id).toBe(veiculo.id);
    expect(response.body.veiculo.modelo).toBe('Kwid');
  });

  test('PUT /api/veiculos/:id - Deve atualizar um veículo', async () => {
    const createClientResponse = await criarClienteValido(app);
    const clienteId = createClientResponse.body.cliente.id;

    const createVehicleResponse = await request(app)
      .post('/api/veiculos/rapido')
      .send({ cliente_id: clienteId, placa: 'PUT0001', marca: 'HYUNDAI', modelo: 'HB20' });
    const veiculo = createVehicleResponse.body.veiculo;

    const response = await request(app)
      .put(`/api/veiculos/${veiculo.id}`)
      .send({
        placa: 'PUT0001',
        marca: 'HYUNDAI',
        modelo: 'Creta',
        cor: 'Prata'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.veiculo.modelo).toBe('Creta');
  });

  test('DELETE /api/veiculos/:id - Deve deletar um veículo', async () => {
    const createClientResponse = await criarClienteValido(app);
    const clienteId = createClientResponse.body.cliente.id;

    const createVehicleResponse = await request(app)
      .post('/api/veiculos/rapido')
      .send({ cliente_id: clienteId, placa: 'DEL0001', marca: 'TOYOTA', modelo: 'Corolla' });
    const veiculo = createVehicleResponse.body.veiculo;

    const deleteResponse = await request(app).delete(`/api/veiculos/${veiculo.id}`);
    expect(deleteResponse.statusCode).toBe(200);

    const getResponse = await request(app).get(`/api/veiculos/${veiculo.id}`);
    expect(getResponse.statusCode).toBe(404);
  });
});
