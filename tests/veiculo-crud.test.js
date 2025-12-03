const request = require('supertest');
const app = require('../server.js');
const knex = require('../config/db');

let testClienteId, testVeiculoId;

beforeAll(async () => {
  // Criar cliente de teste
  const [cliente] = await knex('clientes').insert({
    nome: 'Cliente Teste Veículo',
    cpf_cnpj: '99988877766',
    telefone: '11987654321',
  }).returning('id');
  testClienteId = cliente.id || cliente;
});

afterAll(async () => {
  // Limpar dados de teste
  if (testVeiculoId) await knex('veiculos').where('id', testVeiculoId).del();
  if (testClienteId) await knex('clientes').where('id', testClienteId).del();
  await knex.destroy();
});

describe('CRUD Completo de Veículos', () => {

  describe('CREATE - POST /api/veiculos', () => {
    it('Deve criar um veículo com todos os campos', async () => {
      const response = await request(app)
        .post('/api/veiculos')
        .send({
          cliente_id: testClienteId,
          placa: 'ABC1234', // Formato antigo: 3 letras + 4 números
          marca: 'Toyota',
          modelo: 'Corolla',
          ano: 2023,
          cor: 'Preto',
          km: 10000,
          chassi: '9BWZZZ377VT004251'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('sucesso', true);
      expect(response.body).toHaveProperty('veiculo');
      expect(response.body.veiculo).toHaveProperty('id');
      expect(response.body.veiculo.chassi).toBe('9BWZZZ377VT004251');
      expect(response.body.veiculo.km).toBe(10000);

      testVeiculoId = response.body.veiculo.id;
    });
  });

  describe('READ - GET /api/veiculos/:id', () => {
    it('Deve buscar veículo com todos os campos', async () => {
      const response = await request(app).get(`/api/veiculos/${testVeiculoId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('veiculo');
      expect(response.body.veiculo.chassi).toBe('9BWZZZ377VT004251');
      expect(response.body.veiculo.km).toBe(10000);
    });
  });

  describe('UPDATE - PUT /api/veiculos/:id', () => {
    it('Deve atualizar chassi do veículo', async () => {
      const response = await request(app)
        .put(`/api/veiculos/${testVeiculoId}`)
        .send({
          placa: 'ABC1234', // Mesma placa válida
          marca: 'Toyota',
          modelo: 'Corolla',
          ano: 2023,
          cor: 'Preto',
          km: 15000,
          chassi: '9BWZZZ377VT004252' // Chassi atualizado
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sucesso', true);
      expect(response.body.veiculo.chassi).toBe('9BWZZZ377VT004252');
      expect(response.body.veiculo.km).toBe(15000);
    });

    it('Deve validar que a atualização foi persistida', async () => {
      const response = await request(app).get(`/api/veiculos/${testVeiculoId}`);

      expect(response.status).toBe(200);
      expect(response.body.veiculo.chassi).toBe('9BWZZZ377VT004252');
      expect(response.body.veiculo.km).toBe(15000);
    });
  });

  describe('DELETE - DELETE /api/veiculos/:id', () => {
    it('Deve deletar o veículo', async () => {
      const response = await request(app).delete(`/api/veiculos/${testVeiculoId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sucesso', true);
    });

    it('Deve retornar 404 para veículo deletado', async () => {
      const response = await request(app).get(`/api/veiculos/${testVeiculoId}`);

      expect(response.status).toBe(404);
    });
  });
});
