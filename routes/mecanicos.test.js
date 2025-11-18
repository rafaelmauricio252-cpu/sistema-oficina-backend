const request = require('supertest');
const app = require('../server');
const db = require('../config/db');

// Helper para criar um mecânico válido
async function criarMecanicoValido(app, overrides = {}) {
  const response = await request(app)
    .post('/api/mecanicos')
    .send({
      nome: 'Mecânico Teste',
      especialidade: 'Geral',
      telefone: `119${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`, // Telefone único
      email: `mecanico${Date.now()}@teste.com`, // Email único
      ...overrides
    });
  return response;
}

describe('Testes das Rotas de Mecânicos', () => {
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
  // Testes POST /api/mecanicos
  // ============================================

  test('POST /api/mecanicos - Deve criar um novo mecânico com sucesso', async () => {
    const response = await criarMecanicoValido(app, {
      nome: 'Mecânico Novo',
      especialidade: 'Motor',
      telefone: '11987654321',
      email: 'mecanico.novo@teste.com'
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.mecanico).toHaveProperty('id');
    expect(response.body.mecanico.nome).toBe('Mecânico Novo');
  });

  test('POST /api/mecanicos - Deve falhar ao criar mecânico sem nome', async () => {
    const response = await request(app)
      .post('/api/mecanicos')
      .send({
        especialidade: 'Elétrica',
        telefone: '11999998888',
        email: 'sem.nome@teste.com'
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Nome do mecânico é obrigatório');
  });

  test('POST /api/mecanicos - Deve falhar ao criar mecânico com email duplicado', async () => {
    await criarMecanicoValido(app, { email: 'duplicado@teste.com' });

    const response = await request(app)
      .post('/api/mecanicos')
      .send({
        nome: 'Mecânico Duplicado',
        especialidade: 'Freios',
        telefone: '11911112222',
        email: 'duplicado@teste.com'
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Email já cadastrado');
  });

  test('POST /api/mecanicos - Deve falhar ao criar mecânico com telefone duplicado', async () => {
    await criarMecanicoValido(app, { telefone: '11933334444' });

    const response = await request(app)
      .post('/api/mecanicos')
      .send({
        nome: 'Mecânico Duplicado Tel',
        especialidade: 'Suspensão',
        telefone: '11933334444',
        email: 'duplicado.tel@teste.com'
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Telefone já cadastrado');
  });

  // ============================================
  // Testes GET /api/mecanicos
  // ============================================

  test('GET /api/mecanicos - Deve listar todos os mecânicos', async () => {
    await criarMecanicoValido(app, { nome: 'Mecânico 1', email: 'mecanico1@teste.com' });
    await criarMecanicoValido(app, { nome: 'Mecânico 2', email: 'mecanico2@teste.com' });

    const response = await request(app).get('/api/mecanicos');

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.mecanicos).toHaveLength(2);
    expect(response.body.mecanicos[0].nome).toBe('Mecânico 1'); // Ordenado por nome
  });

  // ============================================
  // Testes GET /api/mecanicos/:id
  // ============================================

  test('GET /api/mecanicos/:id - Deve buscar um mecânico por ID com sucesso', async () => {
    const createResponse = await criarMecanicoValido(app, { nome: 'Mecânico Busca' });
    const mecanicoId = createResponse.body.mecanico.id;

    const response = await request(app).get(`/api/mecanicos/${mecanicoId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.mecanico.id).toBe(mecanicoId);
    expect(response.body.mecanico.nome).toBe('Mecânico Busca');
  });

  test('GET /api/mecanicos/:id - Deve retornar 404 se o mecânico não for encontrado', async () => {
    const response = await request(app).get('/api/mecanicos/99999'); // ID que não existe

    expect(response.statusCode).toBe(404);
    expect(response.body.erro).toBe('Mecânico não encontrado');
  });

  // ============================================
  // Testes PUT /api/mecanicos/:id
  // ============================================

  test('PUT /api/mecanicos/:id - Deve atualizar um mecânico com sucesso', async () => {
    const createResponse = await criarMecanicoValido(app, { nome: 'Mecânico Antigo' });
    const mecanicoId = createResponse.body.mecanico.id;

    const response = await request(app)
      .put(`/api/mecanicos/${mecanicoId}`)
      .send({ nome: 'Mecânico Atualizado', especialidade: 'Freios' });

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.mecanico.nome).toBe('Mecânico Atualizado');
    expect(response.body.mecanico.especialidade).toBe('Freios');
  });

  test('PUT /api/mecanicos/:id - Deve retornar 404 se tentar atualizar mecânico não encontrado', async () => {
    const response = await request(app)
      .put('/api/mecanicos/99999')
      .send({ nome: 'Mecânico Inexistente' });

    expect(response.statusCode).toBe(404);
    expect(response.body.erro).toBe('Mecânico não encontrado');
  });

  test('PUT /api/mecanicos/:id - Deve falhar ao atualizar com email duplicado', async () => {
    await criarMecanicoValido(app, { email: 'email.existente@teste.com', nome: 'Mec1' });
    const mecanico2Response = await criarMecanicoValido(app, { email: 'email.diferente@teste.com', nome: 'Mec2' });
    const mecanico2Id = mecanico2Response.body.mecanico.id;

    const response = await request(app)
      .put(`/api/mecanicos/${mecanico2Id}`)
      .send({ email: 'email.existente@teste.com' });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Email já cadastrado para outro mecânico');
  });

  // ============================================
  // Testes DELETE /api/mecanicos/:id
  // ============================================

  test('DELETE /api/mecanicos/:id - Deve deletar um mecânico com sucesso quando não tem OS vinculadas', async () => {
    const createResponse = await criarMecanicoValido(app, { nome: 'Mecânico a Deletar' });
    const mecanicoId = createResponse.body.mecanico.id;

    const response = await request(app).delete(`/api/mecanicos/${mecanicoId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.mensagem).toBe('Mecânico deletado com sucesso');

    // Verificar se o mecânico foi realmente deletado
    const getResponse = await request(app).get(`/api/mecanicos/${mecanicoId}`);
    expect(getResponse.statusCode).toBe(404);
  });

  test('DELETE /api/mecanicos/:id - Deve falhar ao deletar mecânico com OS vinculadas', async () => {
    // Criar os dados necessários para uma OS de teste
    await db.raw(`
      INSERT INTO clientes (nome, cpf_cnpj, telefone)
      VALUES ('Cliente OS Teste', '11122233344', '11999999999');
    `);
    const [cliente] = await db('clientes').where({ cpf_cnpj: '11122233344' }).select('id');

    await db.raw(`
      INSERT INTO veiculos (cliente_id, placa, marca, modelo)
      VALUES (?, 'OS123', 'Teste', 'Teste');
    `, [cliente.id]);
    const [veiculo] = await db('veiculos').where({ placa: 'OS123' }).select('id');

    await db.raw(`
      INSERT INTO servicos (nome, preco_padrao)
      VALUES ('Servico Teste', 100);
    `);
    const [servico] = await db('servicos').where({ nome: 'Servico Teste' }).select('id');

    // Criar um mecânico
    const mecanicoResponse = await criarMecanicoValido(app, { nome: 'Mecânico com OS' });
    const mecanicoId = mecanicoResponse.body.mecanico ? mecanicoResponse.body.mecanico.id : mecanicoResponse.body.id;

    // Criar uma OS diretamente no banco para garantir o vínculo
    await db('ordem_servico').insert({
      cliente_id: cliente.id,
      veiculo_id: veiculo.id,
      mecanico_id: mecanicoId,
      data_abertura: new Date().toISOString(),
      status: 'Aguardando',
      observacoes: 'Teste de vínculo',
      valor_total: 100
    });

    // Tentar deletar o mecânico deve falhar
    const response = await request(app).delete(`/api/mecanicos/${mecanicoId}`);

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Não é possível deletar mecânico com ordens de serviço vinculadas');
  });

  test('DELETE /api/mecanicos/:id - Deve retornar 404 se tentar deletar mecânico não encontrado', async () => {
    const response = await request(app).delete('/api/mecanicos/99999'); // ID que não existe

    expect(response.statusCode).toBe(404);
    expect(response.body.erro).toBe('Mecânico não encontrado');
  });
});
