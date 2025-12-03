const request = require('supertest');
const app = require('../server.js');
const knex = require('../config/db');

let testClienteId, testVeiculoId;

beforeAll(async () => {
  // Criar cliente de teste
  const [cliente] = await knex('clientes').insert({
    nome: 'Cliente Teste Chassi Debug',
    cpf_cnpj: '11122233344',
    telefone: '11988887777',
  }).returning('id');
  testClienteId = cliente.id || cliente;
});

afterAll(async () => {
  // Limpar dados de teste
  if (testVeiculoId) await knex('veiculos').where('id', testVeiculoId).del();
  if (testClienteId) await knex('clientes').where('id', testClienteId).del();
  await knex.destroy();
});

describe('🔍 DEBUG: Chassi não está salvando', () => {

  it('1️⃣ Verificar se coluna chassi existe na tabela', async () => {
    const hasColumn = await knex.schema.hasColumn('veiculos', 'chassi');
    console.log('✅ Coluna chassi existe?', hasColumn);
    expect(hasColumn).toBe(true);
  });

  it('2️⃣ Verificar schema da tabela veiculos', async () => {
    const columnInfo = await knex('veiculos').columnInfo();
    console.log('📋 Schema da tabela veiculos:');
    console.log(JSON.stringify(columnInfo, null, 2));

    expect(columnInfo).toHaveProperty('chassi');
    expect(columnInfo).toHaveProperty('km');
  });

  it('3️⃣ Inserir diretamente via Knex (sem API)', async () => {
    const [veiculo] = await knex('veiculos').insert({
      cliente_id: testClienteId,
      placa: 'TEST123',
      marca: 'TESTE',
      modelo: 'Modelo Teste',
      chassi: 'CHASSI-KNEX-DIRETO',
      km: 50000
    }).returning('*');

    console.log('🔧 Veículo inserido via Knex direto:');
    console.log(JSON.stringify(veiculo, null, 2));

    expect(veiculo.chassi).toBe('CHASSI-KNEX-DIRETO');
    expect(veiculo.km).toBe(50000);

    // Limpar
    await knex('veiculos').where('id', veiculo.id).del();
  });

  it('4️⃣ Criar via API e verificar req.body', async () => {
    const dadosEnviados = {
      cliente_id: testClienteId,
      placa: 'API1234',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2023,
      cor: 'Preto',
      km: 20000,
      chassi: 'CHASSI-VIA-API-TEST'
    };

    console.log('📤 Dados enviados para API:');
    console.log(JSON.stringify(dadosEnviados, null, 2));

    const response = await request(app)
      .post('/api/veiculos')
      .send(dadosEnviados);

    console.log('📥 Response status:', response.status);
    console.log('📥 Response body:');
    console.log(JSON.stringify(response.body, null, 2));

    expect(response.status).toBe(201);
    testVeiculoId = response.body.veiculo.id;

    // Verificar se chassi foi salvo na resposta
    console.log('🔍 Chassi na resposta:', response.body.veiculo.chassi);
    console.log('🔍 KM na resposta:', response.body.veiculo.km);

    expect(response.body.veiculo.chassi).toBe('CHASSI-VIA-API-TEST');
    expect(response.body.veiculo.km).toBe(20000);
  });

  it('5️⃣ Buscar do banco e verificar se chassi foi persistido', async () => {
    const veiculo = await knex('veiculos')
      .where('id', testVeiculoId)
      .first();

    console.log('🗄️ Veículo retornado do banco:');
    console.log(JSON.stringify(veiculo, null, 2));

    expect(veiculo.chassi).toBe('CHASSI-VIA-API-TEST');
    expect(veiculo.km).toBe(20000);
  });

  it('6️⃣ Atualizar chassi via API', async () => {
    const response = await request(app)
      .put(`/api/veiculos/${testVeiculoId}`)
      .send({
        placa: 'API1234',
        marca: 'Toyota',
        modelo: 'Corolla',
        ano: 2023,
        cor: 'Preto',
        km: 25000,
        chassi: 'CHASSI-ATUALIZADO'
      });

    console.log('📥 Response de atualização:');
    console.log(JSON.stringify(response.body, null, 2));

    expect(response.status).toBe(200);
    expect(response.body.veiculo.chassi).toBe('CHASSI-ATUALIZADO');
    expect(response.body.veiculo.km).toBe(25000);

    // Verificar no banco
    const veiculoAtualizado = await knex('veiculos')
      .where('id', testVeiculoId)
      .first();

    console.log('🗄️ Veículo atualizado no banco:');
    console.log(JSON.stringify(veiculoAtualizado, null, 2));

    expect(veiculoAtualizado.chassi).toBe('CHASSI-ATUALIZADO');
    expect(veiculoAtualizado.km).toBe(25000);
  });
});
