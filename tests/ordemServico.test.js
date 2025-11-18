const request = require('supertest');
const app = require('../server.js');
const knex = require('../config/db');

let testClienteId, testVeiculoId, testMecanicoId, testOSId;

beforeAll(async () => {
  // Criar dados de teste
  const [cliente] = await knex('clientes').insert({
    nome: 'Cliente Teste OS',
    cpf_cnpj: '12345678900',
    telefone: '11999999999',
  }).returning('id');
  testClienteId = cliente.id || cliente;

  const [veiculo] = await knex('veiculos').insert({
    cliente_id: testClienteId,
    placa: 'TEST123',
    marca: 'Teste',
    modelo: 'Modelo Teste',
    ano: 2023,
  }).returning('id');
  testVeiculoId = veiculo.id || veiculo;

  const [mecanico] = await knex('mecanicos').insert({
    nome: 'Mecânico Teste',
    telefone: '11888888888',
    especialidade: 'Geral',
    email: 'mecanico.teste@oficina.com'
  }).returning('id');
  testMecanicoId = mecanico.id || mecanico;
});

afterAll(async () => {
  // Limpar dados de teste
  if (testOSId) {
    await knex('os_servicos').where('os_id', testOSId).del();
    await knex('os_pecas').where('os_id', testOSId).del();
    await knex('ordem_servicos').where('id', testOSId).del();
  }
  await knex('veiculos').where('id', testVeiculoId).del();
  await knex('mecanicos').where('id', testMecanicoId).del();
  await knex('clientes').where('id', testClienteId).del();
  await knex.destroy();
});

describe('CRUD de Ordem de Serviço', () => {

  describe('CREATE - POST /api/os', () => {
    it('Deve criar uma OS com campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/os')
        .send({
          cliente_id: testClienteId,
          veiculo_id: testVeiculoId,
          mecanico_id: testMecanicoId,
          data_abertura: '2025-01-17',
          status: 'Aguardando',
          descricao_problema: 'Teste de criação de OS',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('mensagem');
      expect(response.body).toHaveProperty('ordem_servico');
      expect(response.body.ordem_servico).toHaveProperty('id');
      testOSId = response.body.ordem_servico.id;
    });

    it('Deve criar uma OS com serviços e peças', async () => {
      // Criar serviço e peça de teste
      const [servico] = await knex('servicos').insert({
        nome: 'Serviço Teste',
        descricao: 'Teste',
        preco_base: 100.00,
      }).returning('id');

      const [peca] = await knex('pecas').insert({
        nome: 'Peça Teste',
        codigo: 'TEST001',
        preco_venda: 50.00,
        preco_custo: 30.00,
        quantidade_estoque: 10,
        estoque_minimo: 2,
      }).returning('id');

      const response = await request(app)
        .post('/api/os')
        .send({
          cliente_id: testClienteId,
          veiculo_id: testVeiculoId,
          mecanico_id: testMecanicoId,
          data_abertura: '2025-01-17',
          status: 'Em Andamento',
          descricao_problema: 'OS com serviços e peças',
          servicos: [{
            servico_id: servico.id || servico,
            quantidade: 2,
            preco_unitario: 100.00,
          }],
          pecas: [{
            peca_id: peca.id || peca,
            quantidade: 3,
            preco_unitario: 50.00,
          }],
          desconto: 50.00,
        });

      expect(response.status).toBe(201);
      expect(response.body.ordem_servico).toHaveProperty('valor_total');
      // (2*100) + (3*50) - 50 = 200 + 150 - 50 = 300
      expect(response.body.ordem_servico.valor_total).toBe(300.00);

      // Limpar
      const osId = response.body.ordem_servico.id;
      await knex('os_servicos').where('os_id', osId).del();
      await knex('os_pecas').where('os_id', osId).del();
      await knex('ordem_servicos').where('id', osId).del();
      await knex('servicos').where('id', servico.id || servico).del();
      await knex('pecas').where('id', peca.id || peca).del();
    });

    it('Deve retornar erro quando falta campo obrigatório', async () => {
      const response = await request(app)
        .post('/api/os')
        .send({
          cliente_id: testClienteId,
          // Faltando veiculo_id
          mecanico_id: testMecanicoId,
          data_abertura: '2025-01-17',
          status: 'Aguardando',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('erro');
    });
  });

  describe('READ - GET /api/os', () => {
    it('Deve listar todas as OS', async () => {
      const response = await request(app).get('/api/os');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ordem_servicos');
      expect(Array.isArray(response.body.ordem_servicos)).toBe(true);
    });

    it('Deve buscar OS por ID com dados completos', async () => {
      const response = await request(app).get(`/api/os/${testOSId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ordem_servico');
      expect(response.body.ordem_servico).toHaveProperty('id', testOSId);
      expect(response.body.ordem_servico).toHaveProperty('cliente');
      expect(response.body.ordem_servico).toHaveProperty('veiculo');
      expect(response.body.ordem_servico).toHaveProperty('mecanico');
    });

    it('Deve retornar 404 para OS inexistente', async () => {
      const response = await request(app).get('/api/os/999999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('erro');
    });
  });

  describe('UPDATE - PUT /api/os/:id', () => {
    it('Deve atualizar o status da OS', async () => {
      const response = await request(app)
        .put(`/api/os/${testOSId}`)
        .send({
          status: 'Concluído',
          data_conclusao: '2025-01-17',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mensagem');
      expect(response.body.ordem_servico).toHaveProperty('status', 'Concluído');
    });

    it('Deve atualizar observações da OS', async () => {
      const response = await request(app)
        .put(`/api/os/${testOSId}`)
        .send({
          observacoes: 'Observação de teste atualizada',
        });

      expect(response.status).toBe(200);
      expect(response.body.ordem_servico).toHaveProperty('observacoes', 'Observação de teste atualizada');
    });
  });

  describe('DELETE - DELETE /api/os/:id', () => {
    it('Deve deletar/cancelar uma OS', async () => {
      const response = await request(app).delete(`/api/os/${testOSId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mensagem');
    });

    it('Deve retornar 404 ao tentar deletar OS inexistente', async () => {
      const response = await request(app).delete('/api/os/999999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('erro');
    });
  });
});
