const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const { generateValidCpf } = require('../utils/cpfGenerator');

// Helper para criar um serviço válido
async function criarServicoValido(app, overrides = {}) {
  const response = await request(app)
    .post('/api/servicos')
    .send({
      nome: `Serviço Teste ${Date.now()}`,
      descricao: 'Descrição do serviço de teste',
      preco_padrao: 100.50,
      tempo_estimado: 60,
      ...overrides
    });
  return response;
}

describe('Testes das Rotas de Serviços', () => {
  beforeEach(async () => {
    // Limpar o banco de dados antes de cada teste
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

  afterAll(async () => {
    // Fechar a conexão com o banco de dados após todos os testes
    await db.destroy();
  });

  // ============================================
  // Testes POST /api/servicos
  // ============================================

  test('POST /api/servicos - Deve criar um novo serviço com sucesso', async () => {
    const response = await criarServicoValido(app, {
      nome: 'Troca de Óleo',
      preco_padrao: 150.00
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.servico).toHaveProperty('id');
    expect(response.body.servico.nome).toBe('Troca de Óleo');
    expect(parseFloat(response.body.servico.preco_padrao)).toBe(150.00);
  });

  test('POST /api/servicos - Deve falhar ao criar serviço sem nome', async () => {
    const response = await request(app)
      .post('/api/servicos')
      .send({
        descricao: 'Serviço sem nome',
        preco_padrao: 50.00
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Nome e preço padrão do serviço são obrigatórios');
  });

  test('POST /api/servicos - Deve falhar ao criar serviço sem preco_padrao', async () => {
    const response = await request(app)
      .post('/api/servicos')
      .send({
        nome: 'Serviço sem preço',
        descricao: 'Descrição'
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Nome e preço padrão do serviço são obrigatórios');
  });

  test('POST /api/servicos - Deve falhar ao criar serviço com nome duplicado', async () => {
    await criarServicoValido(app, { nome: 'Alinhamento' });

    const response = await request(app)
      .post('/api/servicos')
      .send({
        nome: 'Alinhamento',
        preco_padrao: 80.00
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Nome do serviço já cadastrado');
  });

  test('POST /api/servicos - Deve falhar ao criar serviço com preco_padrao inválido', async () => {
    const response = await request(app)
      .post('/api/servicos')
      .send({
        nome: 'Serviço com preço inválido',
        preco_padrao: -10.00
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Preço padrão deve ser um número positivo');
  });

  // ============================================
  // Testes GET /api/servicos
  // ============================================

  test('GET /api/servicos - Deve listar todos os serviços', async () => {
    await criarServicoValido(app, { nome: 'Serviço A', preco_padrao: 50 });
    await criarServicoValido(app, { nome: 'Serviço B', preco_padrao: 75 });

    const response = await request(app).get('/api/servicos');

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.servicos).toHaveLength(2);
    expect(response.body.servicos[0].nome).toBe('Serviço A'); // Ordenado por nome
  });

  test('GET /api/servicos/buscar?q= - Deve buscar serviços por termo', async () => {
    await criarServicoValido(app, { nome: 'Troca de Pneu', descricao: 'Serviço de troca' });
    await criarServicoValido(app, { nome: 'Balanceamento', descricao: 'Serviço de balanceamento' });
    await criarServicoValido(app, { nome: 'Revisão', descricao: 'Revisão geral' });

    const response = await request(app).get('/api/servicos/buscar?q=troca');

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.servicos).toHaveLength(1);
    expect(response.body.servicos[0].nome).toBe('Troca de Pneu');
  });

  test('GET /api/servicos/:id - Deve buscar um serviço por ID com sucesso', async () => {
    const createResponse = await criarServicoValido(app, { nome: 'Serviço Busca' });
    const servicoId = createResponse.body.servico.id;

    const response = await request(app).get(`/api/servicos/${servicoId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.servico.id).toBe(servicoId);
    expect(response.body.servico.nome).toBe('Serviço Busca');
  });

  test('GET /api/servicos/:id - Deve retornar 404 se o serviço não for encontrado', async () => {
    const response = await request(app).get('/api/servicos/99999'); // ID que não existe

    expect(response.statusCode).toBe(404);
    expect(response.body.erro).toBe('Serviço não encontrado');
  });

  // ============================================
  // Testes PUT /api/servicos/:id
  // ============================================

  test('PUT /api/servicos/:id - Deve atualizar um serviço com sucesso', async () => {
    const createResponse = await criarServicoValido(app, { nome: 'Serviço Antigo', preco_padrao: 100 });
    const servicoId = createResponse.body.servico.id;

    const response = await request(app)
      .put(`/api/servicos/${servicoId}`)
      .send({ nome: 'Serviço Atualizado', preco_padrao: 120.00, tempo_estimado: 90 });

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.servico.nome).toBe('Serviço Atualizado');
    expect(parseFloat(response.body.servico.preco_padrao)).toBe(120.00);
    expect(response.body.servico.tempo_estimado).toBe(90);
  });

  test('PUT /api/servicos/:id - Deve retornar 404 se tentar atualizar serviço não encontrado', async () => {
    const response = await request(app)
      .put('/api/servicos/99999')
      .send({ nome: 'Serviço Inexistente' });

    expect(response.statusCode).toBe(404);
    expect(response.body.erro).toBe('Serviço não encontrado');
  });

  test('PUT /api/servicos/:id - Deve falhar ao atualizar com nome duplicado', async () => {
    await criarServicoValido(app, { nome: 'Serviço Existente', preco_padrao: 50 });
    const servico2Response = await criarServicoValido(app, { nome: 'Outro Serviço', preco_padrao: 70 });
    const servico2Id = servico2Response.body.servico.id;

    const response = await request(app)
      .put(`/api/servicos/${servico2Id}`)
      .send({ nome: 'Serviço Existente' });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Nome do serviço já cadastrado para outro serviço');
  });

  test('PUT /api/servicos/:id - Deve falhar ao atualizar com preco_padrao inválido', async () => {
    const createResponse = await criarServicoValido(app, { nome: 'Serviço Valido', preco_padrao: 100 });
    const servicoId = createResponse.body.servico.id;

    const response = await request(app)
      .put(`/api/servicos/${servicoId}`)
      .send({ preco_padrao: 0 });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Preço padrão deve ser um número positivo');
  });

  // ============================================
  // Testes DELETE /api/servicos/:id
  // ============================================

  test('DELETE /api/servicos/:id - Deve deletar um serviço com sucesso', async () => {
    const createResponse = await criarServicoValido(app, { nome: 'Serviço a Deletar' });
    const servicoId = createResponse.body.servico.id;

    const response = await request(app).delete(`/api/servicos/${servicoId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.mensagem).toBe('Serviço deletado com sucesso');

    // Verificar se o serviço foi realmente deletado
    const getResponse = await request(app).get(`/api/servicos/${servicoId}`);
    expect(getResponse.statusCode).toBe(404);
  });

  test('DELETE /api/servicos/:id - Deve retornar 404 se tentar deletar serviço não encontrado', async () => {
    const response = await request(app).delete('/api/servicos/99999'); // ID que não existe

    expect(response.statusCode).toBe(404);
    expect(response.body.erro).toBe('Serviço não encontrado');
  });

  test('DELETE /api/servicos/:id - Deve falhar ao deletar serviço vinculado a uma OS', async () => {
    // 1. Criar um cliente, veículo e mecânico
    const clienteResponse = await request(app).post('/api/clientes/rapido').send({
      nome: 'Cliente OS', cpf_cnpj: generateValidCpf(false), telefone: '11988887777'
    });
    console.log('Cliente Response Body (servicos.test.js):', clienteResponse.body);
    const clienteId = clienteResponse.body.cliente.id;

    const veiculoResponse = await request(app).post('/api/veiculos/rapido').send({
      cliente_id: clienteId, placa: 'OSV0001', marca: 'FIAT', modelo: 'Uno'
    });
    const veiculoId = veiculoResponse.body.veiculo.id;

    const mecanicoResponse = await request(app).post('/api/mecanicos').send({
      nome: 'Mecanico OS', especialidade: 'Geral', telefone: '11999998888'
    });
    const mecanicoId = mecanicoResponse.body.mecanico.id;

    // 2. Criar um serviço
    const servicoResponse = await criarServicoValido(app, { nome: 'Servico OS', preco_padrao: 200 });
    const servicoId = servicoResponse.body.servico.id;

    // 3. Criar uma OS vinculando o serviço
    const osResponse = await request(app).post('/api/os').send({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      data_abertura: new Date().toISOString().split('T')[0],
      status: 'Aguardando',
      servicos: [{ servico_id: servicoId, preco_unitario: 200, quantidade: 1 }]
    });
    expect(osResponse.statusCode).toBe(201);

    // 4. Tentar deletar o serviço
    const deleteResponse = await request(app).delete(`/api/servicos/${servicoId}`);
    expect(deleteResponse.statusCode).toBe(400);
    expect(deleteResponse.body.erro).toBe('Não é possível deletar serviço vinculado a uma ordem de serviço');
  });
});