const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const { generateValidCpf } = require('../utils/cpfGenerator');

// Helper para criar uma categoria de peça válida (se necessário para testes)
async function criarCategoriaValida(app, overrides = {}) {
  const response = await request(app)
    .post('/api/categorias') // Assumindo que existe uma rota POST para categorias
    .send({
      nome: `Categoria Teste ${Date.now()}`,
      descricao: 'Descrição da categoria de teste',
      ...overrides
    });
  return response;
}

// Helper para criar uma peça válida
async function criarPecaValida(app, overrides = {}) {
  const response = await request(app)
    .post('/api/pecas')
    .send({
      nome: `Peca Teste ${Date.now()}`,
      numero_peca: `PN-${Date.now()}`,
      descricao: 'Descrição da peça de teste',
      preco_custo: 50.00,
      preco_venda: 100.00,
      quantidade_estoque: 10,
      estoque_minimo: 2,
      ...overrides
    });
  return response;
}

describe('Testes das Rotas de Peças', () => {
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
      DELETE FROM categorias_pecas;
    `);
  });

  afterAll(async () => {
    // Fechar a conexão com o banco de dados após todos os testes
    await db.destroy();
  });

  // ============================================
  // Testes POST /api/pecas
  // ============================================

  test('POST /api/pecas - Deve criar uma nova peça com sucesso', async () => {
    const response = await criarPecaValida(app, {
      nome: 'Filtro de Ar',
      numero_peca: 'FA-001',
      preco_custo: 25.00,
      preco_venda: 50.00,
      quantidade_estoque: 20,
      estoque_minimo: 5
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.peca).toHaveProperty('id');
    expect(response.body.peca.nome).toBe('Filtro de Ar');
    expect(response.body.peca.numero_peca).toBe('FA-001');
  });

  test('POST /api/pecas - Deve falhar ao criar peça com campos obrigatórios faltando', async () => {
    const response = await request(app)
      .post('/api/pecas')
      .send({
        nome: 'Pneu',
        numero_peca: 'PN-001'
        // Faltando preco_custo, preco_venda, quantidade_estoque, estoque_minimo
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Campos obrigatórios faltando: nome, numero_peca, preco_custo, preco_venda, quantidade_estoque, estoque_minimo');
  });

  test('POST /api/pecas - Deve falhar ao criar peça com nome duplicado', async () => {
    await criarPecaValida(app, { nome: 'Vela de Ignição', numero_peca: 'VI-001' });

    const response = await request(app)
      .post('/api/pecas')
      .send({
        nome: 'Vela de Ignição',
        numero_peca: 'VI-002', // Número de peça diferente
        preco_custo: 10.00,
        preco_venda: 20.00,
        quantidade_estoque: 15,
        estoque_minimo: 3
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Nome da peça já cadastrado');
  });

  test('POST /api/pecas - Deve falhar ao criar peça com numero_peca duplicado', async () => {
    await criarPecaValida(app, { nome: 'Amortecedor', numero_peca: 'AM-001' });

    const response = await request(app)
      .post('/api/pecas')
      .send({
        nome: 'Amortecedor Dianteiro', // Nome diferente
        numero_peca: 'AM-001',
        preco_custo: 100.00,
        preco_venda: 200.00,
        quantidade_estoque: 5,
        estoque_minimo: 1
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Número da peça já cadastrado');
  });

  test('POST /api/pecas - Deve falhar ao criar peça com preços negativos', async () => {
    const response = await request(app)
      .post('/api/pecas')
      .send({
        nome: 'Bateria',
        numero_peca: 'BAT-001',
        preco_custo: -50.00,
        preco_venda: 100.00,
        quantidade_estoque: 5,
        estoque_minimo: 1
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Preço de custo e preço de venda devem ser números não negativos');
  });

  test('POST /api/pecas - Deve falhar ao criar peça com quantidade_estoque negativo', async () => {
    const response = await request(app)
      .post('/api/pecas')
      .send({
        nome: 'Correia',
        numero_peca: 'COR-001',
        preco_custo: 20.00,
        preco_venda: 40.00,
        quantidade_estoque: -5,
        estoque_minimo: 1
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Quantidade em estoque e estoque mínimo devem ser números não negativos');
  });

  test('POST /api/pecas - Deve falhar ao criar peça com categoria_id inexistente', async () => {
    const response = await request(app)
      .post('/api/pecas')
      .send({
        nome: 'Pastilha de Freio',
        numero_peca: 'PF-001',
        descricao: 'Pastilha de freio dianteira',
        categoria_id: 99999, // ID de categoria inexistente
        preco_custo: 30.00,
        preco_venda: 60.00,
        quantidade_estoque: 10,
        estoque_minimo: 2
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Categoria não encontrada');
  });

  // ============================================
  // Testes GET /api/pecas
  // ============================================

  test('GET /api/pecas - Deve listar todas as peças', async () => {
    await criarPecaValida(app, { nome: 'Peca A', numero_peca: 'PA-001' });
    await criarPecaValida(app, { nome: 'Peca B', numero_peca: 'PB-001' });

    const response = await request(app).get('/api/pecas');

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.pecas).toHaveLength(2);
    expect(response.body.pecas[0].nome).toBe('Peca A'); // Ordenado por nome
  });

  test('GET /api/pecas/buscar?q= - Deve buscar peças por termo', async () => {
    await criarPecaValida(app, { nome: 'Oleo Motor', numero_peca: 'OM-001' });
    await criarPecaValida(app, { nome: 'Oleo Freio', numero_peca: 'OF-001' });
    await criarPecaValida(app, { nome: 'Filtro Oleo', numero_peca: 'FO-001' });

    const response = await request(app).get('/api/pecas/buscar?q=oleo');

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.pecas).toHaveLength(3);
  });

  test('GET /api/pecas/:id - Deve buscar uma peça por ID com sucesso', async () => {
    const createResponse = await criarPecaValida(app, { nome: 'Peca Busca', numero_peca: 'PB-002' });
    const pecaId = createResponse.body.peca.id;

    const response = await request(app).get(`/api/pecas/${pecaId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.peca.id).toBe(pecaId);
    expect(response.body.peca.nome).toBe('Peca Busca');
  });

  test('GET /api/pecas/:id - Deve retornar 404 se a peça não for encontrada', async () => {
    const response = await request(app).get('/api/pecas/99999'); // ID que não existe

    expect(response.statusCode).toBe(404);
    expect(response.body.erro).toBe('Peça não encontrada');
  });

  // ============================================
  // Testes PUT /api/pecas/:id
  // ============================================

  test('PUT /api/pecas/:id - Deve atualizar uma peça com sucesso', async () => {
    const createResponse = await criarPecaValida(app, { nome: 'Peca Antiga', numero_peca: 'PA-002' });
    const pecaId = createResponse.body.peca.id;

    const response = await request(app)
      .put(`/api/pecas/${pecaId}`)
      .send({ nome: 'Peca Atualizada', preco_venda: 120.00, quantidade_estoque: 15 });

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.peca.nome).toBe('Peca Atualizada');
    expect(parseFloat(response.body.peca.preco_venda)).toBe(120.00);
    expect(response.body.peca.quantidade_estoque).toBe(15);
  });

  test('PUT /api/pecas/:id - Deve retornar 404 se tentar atualizar peça não encontrada', async () => {
    const response = await request(app)
      .put('/api/pecas/99999')
      .send({ nome: 'Peca Inexistente' });

    expect(response.statusCode).toBe(404);
    expect(response.body.erro).toBe('Peça não encontrada');
  });

  test('PUT /api/pecas/:id - Deve falhar ao atualizar com nome duplicado', async () => {
    await criarPecaValida(app, { nome: 'Peca Existente', numero_peca: 'PE-001' });
    const peca2Response = await criarPecaValida(app, { nome: 'Outra Peca', numero_peca: 'OP-001' });
    const peca2Id = peca2Response.body.peca.id;

    const response = await request(app)
      .put(`/api/pecas/${peca2Id}`)
      .send({ nome: 'Peca Existente' });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Nome da peça já cadastrado para outra peça');
  });

  test('PUT /api/pecas/:id - Deve falhar ao atualizar com numero_peca duplicado', async () => {
    await criarPecaValida(app, { nome: 'Peca X', numero_peca: 'PX-001' });
    const pecaYResponse = await criarPecaValida(app, { nome: 'Peca Y', numero_peca: 'PY-001' });
    const pecaYId = pecaYResponse.body.peca.id;

    const response = await request(app)
      .put(`/api/pecas/${pecaYId}`)
      .send({ numero_peca: 'PX-001' });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Número da peça já cadastrado para outra peça');
  });

  test('PUT /api/pecas/:id - Deve falhar ao atualizar com preco_custo negativo', async () => {
    const createResponse = await criarPecaValida(app, { nome: 'Peca Valida', numero_peca: 'PV-001' });
    const pecaId = createResponse.body.peca.id;

    const response = await request(app)
      .put(`/api/pecas/${pecaId}`)
      .send({ preco_custo: -10 });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Preço de custo deve ser um número não negativo');
  });

  test('PUT /api/pecas/:id - Deve falhar ao atualizar com categoria_id inexistente', async () => {
    const createResponse = await criarPecaValida(app, { nome: 'Peca Cat', numero_peca: 'PC-001' });
    const pecaId = createResponse.body.peca.id;

    const response = await request(app)
      .put(`/api/pecas/${pecaId}`)
      .send({ categoria_id: 99999 });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Categoria não encontrada');
  });

  // ============================================
  // Testes DELETE /api/pecas/:id
  // ============================================

  test('DELETE /api/pecas/:id - Deve deletar uma peça com sucesso', async () => {
    const createResponse = await criarPecaValida(app, { nome: 'Peca a Deletar', numero_peca: 'PD-001' });
    const pecaId = createResponse.body.peca.id;

    const response = await request(app).delete(`/api/pecas/${pecaId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.mensagem).toBe('Peça deletada com sucesso');

    // Verificar se a peça foi realmente deletada
    const getResponse = await request(app).get(`/api/pecas/${pecaId}`);
    expect(getResponse.statusCode).toBe(404);
  });

  test('DELETE /api/pecas/:id - Deve retornar 404 se tentar deletar peça não encontrada', async () => {
    const response = await request(app).delete('/api/pecas/99999'); // ID que não existe

    expect(response.statusCode).toBe(404);
    expect(response.body.erro).toBe('Peça não encontrada');
  });

  test('DELETE /api/pecas/:id - Deve falhar ao deletar peça vinculada a uma OS', async () => {
    // 1. Criar um cliente, veículo e mecânico
    const clienteResponse = await request(app).post('/api/clientes/rapido').send({
      nome: 'Cliente OS Peca', cpf_cnpj: generateValidCpf(false), telefone: '11988887778'
    });
    console.log('Cliente Response Body (pecas.test.js):', clienteResponse.body);
    const clienteId = clienteResponse.body.cliente.id;

    const veiculoResponse = await request(app).post('/api/veiculos/rapido').send({
      cliente_id: clienteId, placa: 'OSP0001', marca: 'FORD', modelo: 'Ka'
    });
    const veiculoId = veiculoResponse.body.veiculo.id;

    const mecanicoResponse = await request(app).post('/api/mecanicos').send({
      nome: 'Mecanico OS Peca', especialidade: 'Motor', telefone: '11999998889'
    });
    const mecanicoId = mecanicoResponse.body.mecanico.id;

    // 2. Criar uma peça
    const pecaResponse = await criarPecaValida(app, { nome: 'Peca OS', numero_peca: 'POS-001' });
    const pecaId = pecaResponse.body.peca.id;

    // 3. Criar uma OS vinculando a peça
    const osResponse = await request(app).post('/api/os').send({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      data_abertura: new Date().toISOString().split('T')[0],
      status: 'Aguardando',
      pecas: [{ peca_id: pecaId, quantidade: 1, preco_unitario: 100 }]
    });
    expect(osResponse.statusCode).toBe(201);

    // 4. Tentar deletar a peça
    const deleteResponse = await request(app).delete(`/api/pecas/${pecaId}`);
    expect(deleteResponse.statusCode).toBe(400);
    expect(deleteResponse.body.erro).toBe('Não é possível deletar peça vinculada a uma ordem de serviço');
  });
});