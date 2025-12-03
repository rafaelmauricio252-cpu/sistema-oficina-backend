const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const { generateValidCpf } = require('../utils/cpfGenerator');

describe('Testes da Rota de Dashboard', () => {
  beforeEach(async () => {
    // Limpar banco
    await db.raw(`
      DELETE FROM estoque_movimentacao;
      DELETE FROM os_fotos;
      DELETE FROM os_servicos;
      DELETE FROM os_pecas;
      DELETE FROM ordem_servico;
      DELETE FROM veiculos;
      DELETE FROM clientes;
      DELETE FROM mecanicos;
      DELETE FROM pecas;
    `);
  });

  afterAll(async () => {
    await db.destroy();
  });

  // ============================================
  // Testes GET /api/dashboard
  // ============================================

  test('GET /api/dashboard - Deve retornar estatísticas vazias quando não há dados', async () => {
    const response = await request(app).get('/api/dashboard');

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.estatisticas).toHaveProperty('os_por_status');
    expect(response.body.estatisticas).toHaveProperty('os_mes_atual');
    expect(response.body.estatisticas).toHaveProperty('total_clientes');
    expect(response.body.estatisticas).toHaveProperty('total_veiculos');
    expect(response.body.estatisticas).toHaveProperty('pecas_estoque_baixo');
    expect(response.body.estatisticas).toHaveProperty('mecanicos_ranking');

    expect(response.body.estatisticas.os_por_status).toHaveLength(0);
    expect(response.body.estatisticas.total_clientes).toBe(0);
    expect(response.body.estatisticas.total_veiculos).toBe(0);
    expect(response.body.estatisticas.pecas_estoque_baixo).toBe(0);
  });

  test('GET /api/dashboard - Deve retornar contagens corretas de clientes e veículos', async () => {
    // Criar 3 clientes e 5 veículos
    const clientes = await db('clientes').insert([
      { nome: 'Cliente 1', cpf_cnpj: generateValidCpf(false), telefone: '11999999991' },
      { nome: 'Cliente 2', cpf_cnpj: generateValidCpf(false), telefone: '11999999992' },
      { nome: 'Cliente 3', cpf_cnpj: generateValidCpf(false), telefone: '11999999993' }
    ]).returning('id');

    await db('veiculos').insert([
      { cliente_id: clientes[0].id, marca: 'VW', modelo: 'Gol', placa: 'ABC1234', ano: 2020 },
      { cliente_id: clientes[0].id, marca: 'Fiat', modelo: 'Uno', placa: 'DEF5678', ano: 2019 },
      { cliente_id: clientes[1].id, marca: 'Ford', modelo: 'Ka', placa: 'GHI9012', ano: 2021 },
      { cliente_id: clientes[1].id, marca: 'Chevrolet', modelo: 'Onix', placa: 'JKL3456', ano: 2022 },
      { cliente_id: clientes[2].id, marca: 'Toyota', modelo: 'Corolla', placa: 'MNO7890', ano: 2023 }
    ]);

    const response = await request(app).get('/api/dashboard');

    expect(response.statusCode).toBe(200);
    expect(response.body.estatisticas.total_clientes).toBe(3);
    expect(response.body.estatisticas.total_veiculos).toBe(5);
  });

  test('GET /api/dashboard - Deve retornar OS por status corretamente', async () => {
    // Criar dados necessários
    const [cliente] = await db('clientes').insert({
      nome: 'Cliente Teste',
      cpf_cnpj: generateValidCpf(false),
      telefone: '11999999999'
    }).returning('id');

    const [veiculo] = await db('veiculos').insert({
      cliente_id: cliente.id,
      marca: 'VW',
      modelo: 'Gol',
      placa: 'ABC1234',
      ano: 2020
    }).returning('id');

    const [mecanico] = await db('mecanicos').insert({
      nome: 'Mecânico Teste',
      especialidade: 'Geral',
      telefone: '11988888888',
      email: `mecanico${Date.now()}@teste.com`
    }).returning('id');

    // Criar OS com diferentes status
    await db('ordem_servico').insert([
      { cliente_id: cliente.id, veiculo_id: veiculo.id, mecanico_id: mecanico.id, status: 'Aguardando', valor_total: 100.00 },
      { cliente_id: cliente.id, veiculo_id: veiculo.id, mecanico_id: mecanico.id, status: 'Aguardando', valor_total: 150.00 },
      { cliente_id: cliente.id, veiculo_id: veiculo.id, mecanico_id: mecanico.id, status: 'Em Andamento', valor_total: 200.00 },
      { cliente_id: cliente.id, veiculo_id: veiculo.id, mecanico_id: mecanico.id, status: 'Concluído', valor_total: 300.00 },
      { cliente_id: cliente.id, veiculo_id: veiculo.id, mecanico_id: mecanico.id, status: 'Pago', valor_total: 500.00 }
    ]);

    const response = await request(app).get('/api/dashboard');

    expect(response.statusCode).toBe(200);
    expect(response.body.estatisticas.os_por_status).toHaveLength(4); // 4 status diferentes

    const aguardando = response.body.estatisticas.os_por_status.find(s => s.status === 'Aguardando');
    const emAndamento = response.body.estatisticas.os_por_status.find(s => s.status === 'Em Andamento');
    const concluido = response.body.estatisticas.os_por_status.find(s => s.status === 'Concluído');
    const pago = response.body.estatisticas.os_por_status.find(s => s.status === 'Pago');

    expect(aguardando.total).toBe('2');
    expect(parseFloat(aguardando.valor_total)).toBe(250.00); // 100 + 150
    expect(emAndamento.total).toBe('1');
    expect(parseFloat(emAndamento.valor_total)).toBe(200.00);
    expect(concluido.total).toBe('1');
    expect(parseFloat(concluido.valor_total)).toBe(300.00);
    expect(pago.total).toBe('1');
    expect(parseFloat(pago.valor_total)).toBe(500.00);
  });

  test('GET /api/dashboard - Deve retornar peças com estoque baixo', async () => {
    // Criar peças com diferentes níveis de estoque
    await db('pecas').insert([
      { nome: 'Peça OK', numero_peca: 'P001', preco_venda: 50.00, quantidade_estoque: 20, estoque_minimo: 10 },
      { nome: 'Peça Baixa 1', numero_peca: 'P002', preco_venda: 60.00, quantidade_estoque: 5, estoque_minimo: 10 },
      { nome: 'Peça Baixa 2', numero_peca: 'P003', preco_venda: 70.00, quantidade_estoque: 3, estoque_minimo: 10 },
      { nome: 'Peça Crítica', numero_peca: 'P004', preco_venda: 80.00, quantidade_estoque: 0, estoque_minimo: 5 }
    ]);

    const response = await request(app).get('/api/dashboard');

    expect(response.statusCode).toBe(200);
    expect(response.body.estatisticas.pecas_estoque_baixo).toBe(3); // 3 peças com estoque <= estoque_minimo
  });

  test('GET /api/dashboard - Deve retornar ranking de mecânicos', async () => {
    // Criar cliente, veículo e mecânicos
    const [cliente] = await db('clientes').insert({
      nome: 'Cliente Teste',
      cpf_cnpj: generateValidCpf(false),
      telefone: '11999999999'
    }).returning('id');

    const [veiculo] = await db('veiculos').insert({
      cliente_id: cliente.id,
      marca: 'VW',
      modelo: 'Gol',
      placa: 'ABC1234',
      ano: 2020
    }).returning('id');

    const mecanicos = await db('mecanicos').insert([
      { nome: 'Mecânico A', especialidade: 'Motor', telefone: '11111111111', email: 'a@teste.com' },
      { nome: 'Mecânico B', especialidade: 'Freios', telefone: '22222222222', email: 'b@teste.com' },
      { nome: 'Mecânico C', especialidade: 'Suspensão', telefone: '33333333333', email: 'c@teste.com' }
    ]).returning('id');

    // Criar OS para cada mecânico
    // Mecânico A: 3 OS
    // Mecânico B: 2 OS
    // Mecânico C: 1 OS
    await db('ordem_servico').insert([
      { cliente_id: cliente.id, veiculo_id: veiculo.id, mecanico_id: mecanicos[0].id, status: 'Concluído', valor_total: 100.00 },
      { cliente_id: cliente.id, veiculo_id: veiculo.id, mecanico_id: mecanicos[0].id, status: 'Concluído', valor_total: 200.00 },
      { cliente_id: cliente.id, veiculo_id: veiculo.id, mecanico_id: mecanicos[0].id, status: 'Concluído', valor_total: 300.00 },
      { cliente_id: cliente.id, veiculo_id: veiculo.id, mecanico_id: mecanicos[1].id, status: 'Concluído', valor_total: 150.00 },
      { cliente_id: cliente.id, veiculo_id: veiculo.id, mecanico_id: mecanicos[1].id, status: 'Concluído', valor_total: 250.00 },
      { cliente_id: cliente.id, veiculo_id: veiculo.id, mecanico_id: mecanicos[2].id, status: 'Concluído', valor_total: 180.00 }
    ]);

    const response = await request(app).get('/api/dashboard');

    expect(response.statusCode).toBe(200);
    expect(response.body.estatisticas.mecanicos_ranking).toHaveLength(3);

    // Verificar ordenação (maior quantidade de OS primeiro)
    expect(response.body.estatisticas.mecanicos_ranking[0].nome).toBe('Mecânico A');
    expect(response.body.estatisticas.mecanicos_ranking[0].total_os).toBe('3');
    expect(parseFloat(response.body.estatisticas.mecanicos_ranking[0].valor_total)).toBe(600.00);

    expect(response.body.estatisticas.mecanicos_ranking[1].nome).toBe('Mecânico B');
    expect(response.body.estatisticas.mecanicos_ranking[1].total_os).toBe('2');
    expect(parseFloat(response.body.estatisticas.mecanicos_ranking[1].valor_total)).toBe(400.00);

    expect(response.body.estatisticas.mecanicos_ranking[2].nome).toBe('Mecânico C');
    expect(response.body.estatisticas.mecanicos_ranking[2].total_os).toBe('1');
    expect(parseFloat(response.body.estatisticas.mecanicos_ranking[2].valor_total)).toBe(180.00);
  });
});
