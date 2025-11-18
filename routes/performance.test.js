const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const { generateValidCpf } = require('../utils/cpfGenerator');

describe('Testes de Performance (10 usuários simultâneos)', () => {
  let clienteId, veiculoId, mecanicoId, servicoId, pecaId;
  const NUM_USUARIOS = 10;

  beforeAll(async () => {
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
      DELETE FROM servicos;
    `);

    // Criar dados base
    const [cliente] = await db('clientes').insert({
      nome: 'Cliente Performance',
      cpf_cnpj: generateValidCpf(false),
      telefone: '11999999999'
    }).returning('id');
    clienteId = cliente.id;

    const [veiculo] = await db('veiculos').insert({
      cliente_id: clienteId,
      marca: 'VW',
      modelo: 'Gol',
      placa: 'PERF123',
      ano: 2020
    }).returning('id');
    veiculoId = veiculo.id;

    const [mecanico] = await db('mecanicos').insert({
      nome: 'Mecânico Performance',
      especialidade: 'Geral',
      telefone: '11988888888',
      email: `mecanico-perf${Date.now()}@teste.com`
    }).returning('id');
    mecanicoId = mecanico.id;

    const [servico] = await db('servicos').insert({
      nome: 'Serviço Performance',
      preco_padrao: 100.00
    }).returning('id');
    servicoId = servico.id;

    const [peca] = await db('pecas').insert({
      nome: 'Peça Performance',
      numero_peca: 'PERF001',
      preco_venda: 50.00,
      quantidade_estoque: 1000, // Estoque grande para testes concorrentes
      estoque_minimo: 10
    }).returning('id');
    pecaId = peca.id;
  });

  afterAll(async () => {
    await db.destroy();
  });

  // ============================================
  // Helper: Calcular estatísticas de tempo
  // ============================================
  function calcularEstatisticas(tempos) {
    const min = Math.min(...tempos);
    const max = Math.max(...tempos);
    const media = tempos.reduce((a, b) => a + b, 0) / tempos.length;
    return { min, max, media };
  }

  // ============================================
  // TESTE 1: Performance de Listagem de OS
  // ============================================
  test('PERFORMANCE: Listagem de OS com 10 usuários simultâneos', async () => {
    // Criar 50 OS para testar paginação
    const osParaCriar = [];
    for (let i = 0; i < 50; i++) {
      osParaCriar.push({
        cliente_id: clienteId,
        veiculo_id: veiculoId,
        mecanico_id: mecanicoId,
        status: 'Aguardando',
        valor_total: 100.00 + i
      });
    }
    await db('ordem_servico').insert(osParaCriar);

    // Simular 10 usuários fazendo requisições simultâneas
    const requisicoes = [];
    const tempos = [];

    for (let i = 0; i < NUM_USUARIOS; i++) {
      const inicio = Date.now();
      const req = request(app)
        .get('/api/os?pagina=1&limite=20')
        .then(response => {
          tempos.push(Date.now() - inicio);
          return response;
        });
      requisicoes.push(req);
    }

    const responses = await Promise.all(requisicoes);

    // Validações
    responses.forEach(res => {
      expect(res.statusCode).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.ordem_servicos).toBeDefined();
    });

    const stats = calcularEstatisticas(tempos);
    console.log(`\n📊 LISTAGEM DE OS:`);
    console.log(`   Tempo mínimo: ${stats.min}ms`);
    console.log(`   Tempo máximo: ${stats.max}ms`);
    console.log(`   Tempo médio: ${stats.media.toFixed(2)}ms`);

    // Garantir que o tempo médio seja razoável (< 500ms)
    expect(stats.media).toBeLessThan(500);
  });

  // ============================================
  // TESTE 2: Performance de Criação de OS
  // ============================================
  test('PERFORMANCE: Criação de OS com 10 usuários simultâneos', async () => {
    const requisicoes = [];
    const tempos = [];

    for (let i = 0; i < NUM_USUARIOS; i++) {
      const inicio = Date.now();
      const req = request(app)
        .post('/api/os')
        .send({
          cliente_id: clienteId,
          veiculo_id: veiculoId,
          mecanico_id: mecanicoId,
          data_abertura: '2024-01-15',
          status: 'Aguardando',
          servicos: [{ servico_id: servicoId, preco_unitario: 100.00, quantidade: 1 }],
          pecas: [{ peca_id: pecaId, preco_unitario: 50.00, quantidade: 1 }]
        })
        .then(response => {
          tempos.push(Date.now() - inicio);
          return response;
        });
      requisicoes.push(req);
    }

    const responses = await Promise.all(requisicoes);

    // Validações
    let sucessos = 0;
    responses.forEach(res => {
      if (res.statusCode === 201) {
        sucessos++;
        expect(res.body.sucesso).toBe(true);
        expect(res.body.os).toBeDefined();
      }
    });

    const stats = calcularEstatisticas(tempos);
    console.log(`\n📊 CRIAÇÃO DE OS:`);
    console.log(`   Requisições bem-sucedidas: ${sucessos}/${NUM_USUARIOS}`);
    console.log(`   Tempo mínimo: ${stats.min}ms`);
    console.log(`   Tempo máximo: ${stats.max}ms`);
    console.log(`   Tempo médio: ${stats.media.toFixed(2)}ms`);

    // Validar que todas as OS foram criadas
    expect(sucessos).toBe(NUM_USUARIOS);

    // Tempo médio razoável (< 1000ms)
    expect(stats.media).toBeLessThan(1000);
  });

  // ============================================
  // TESTE 3: Performance do Dashboard
  // ============================================
  test('PERFORMANCE: Dashboard com 10 usuários simultâneos', async () => {
    const requisicoes = [];
    const tempos = [];

    for (let i = 0; i < NUM_USUARIOS; i++) {
      const inicio = Date.now();
      const req = request(app)
        .get('/api/dashboard')
        .then(response => {
          tempos.push(Date.now() - inicio);
          return response;
        });
      requisicoes.push(req);
    }

    const responses = await Promise.all(requisicoes);

    // Validações
    responses.forEach(res => {
      expect(res.statusCode).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.estatisticas).toBeDefined();
    });

    const stats = calcularEstatisticas(tempos);
    console.log(`\n📊 DASHBOARD:`);
    console.log(`   Tempo mínimo: ${stats.min}ms`);
    console.log(`   Tempo máximo: ${stats.max}ms`);
    console.log(`   Tempo médio: ${stats.media.toFixed(2)}ms`);

    // Dashboard deve ser rápido (< 800ms) pois faz múltiplas queries
    expect(stats.media).toBeLessThan(800);
  });

  // ============================================
  // TESTE 4: Performance de Busca por ID
  // ============================================
  test('PERFORMANCE: Busca de OS por ID com 10 usuários simultâneos', async () => {
    // Criar uma OS para buscar
    const osResponse = await request(app).post('/api/os').send({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      data_abertura: '2024-01-15',
      status: 'Aguardando',
      servicos: [{ servico_id: servicoId, preco_unitario: 100.00, quantidade: 1 }],
      pecas: [{ peca_id: pecaId, preco_unitario: 50.00, quantidade: 2 }]
    });

    const osId = osResponse.body.os.id;

    const requisicoes = [];
    const tempos = [];

    for (let i = 0; i < NUM_USUARIOS; i++) {
      const inicio = Date.now();
      const req = request(app)
        .get(`/api/os/${osId}`)
        .then(response => {
          tempos.push(Date.now() - inicio);
          return response;
        });
      requisicoes.push(req);
    }

    const responses = await Promise.all(requisicoes);

    // Validações
    responses.forEach(res => {
      expect(res.statusCode).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.os).toBeDefined();
      expect(res.body.os.servicos).toBeDefined();
      expect(res.body.os.pecas).toBeDefined();
    });

    const stats = calcularEstatisticas(tempos);
    console.log(`\n📊 BUSCA POR ID:`);
    console.log(`   Tempo mínimo: ${stats.min}ms`);
    console.log(`   Tempo máximo: ${stats.max}ms`);
    console.log(`   Tempo médio: ${stats.media.toFixed(2)}ms`);

    // Busca por ID deve ser muito rápida (< 300ms)
    expect(stats.media).toBeLessThan(300);
  });

  // ============================================
  // TESTE 5: Concorrência no Controle de Estoque
  // ============================================
  test('CONCORRÊNCIA: Controle de estoque com múltiplas OS simultâneas', async () => {
    // Resetar estoque para 100 unidades
    await db('pecas').where({ id: pecaId }).update({ quantidade_estoque: 100 });

    const requisicoes = [];
    const tempos = [];

    // 10 usuários tentando criar OS com 5 peças cada (total: 50 peças)
    for (let i = 0; i < NUM_USUARIOS; i++) {
      const inicio = Date.now();
      const req = request(app)
        .post('/api/os')
        .send({
          cliente_id: clienteId,
          veiculo_id: veiculoId,
          mecanico_id: mecanicoId,
          data_abertura: '2024-01-15',
          status: 'Aguardando',
          servicos: [],
          pecas: [{ peca_id: pecaId, preco_unitario: 50.00, quantidade: 5 }]
        })
        .then(response => {
          tempos.push(Date.now() - inicio);
          return response;
        });
      requisicoes.push(req);
    }

    const responses = await Promise.all(requisicoes);

    // Validações
    let sucessos = 0;
    responses.forEach(res => {
      if (res.statusCode === 201) sucessos++;
    });

    console.log(`\n📊 CONCORRÊNCIA DE ESTOQUE:`);
    console.log(`   OS criadas com sucesso: ${sucessos}/${NUM_USUARIOS}`);
    console.log(`   Estoque inicial: 100 unidades`);
    console.log(`   Solicitado: ${NUM_USUARIOS * 5} unidades (${NUM_USUARIOS} OS × 5)`);

    // Verificar estoque final
    const peca = await db('pecas').where({ id: pecaId }).first();
    const estoqueEsperado = 100 - (sucessos * 5);

    console.log(`   Estoque final: ${peca.quantidade_estoque} unidades`);
    console.log(`   Estoque esperado: ${estoqueEsperado} unidades`);

    // Validar integridade do estoque
    expect(peca.quantidade_estoque).toBe(estoqueEsperado);
    expect(sucessos).toBe(NUM_USUARIOS); // Todas devem ter sucesso
    expect(peca.quantidade_estoque).toBe(50); // 100 - 50 = 50

    const stats = calcularEstatisticas(tempos);
    console.log(`   Tempo médio: ${stats.media.toFixed(2)}ms`);
  });

  // ============================================
  // TESTE 6: Estresse - Múltiplas operações mistas
  // ============================================
  test('ESTRESSE: Operações mistas simultâneas (CRUD completo)', async () => {
    const requisicoes = [];
    const tempos = [];

    // Criar algumas OS de teste
    const osIds = [];
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/os').send({
        cliente_id: clienteId,
        veiculo_id: veiculoId,
        mecanico_id: mecanicoId,
        data_abertura: '2024-01-15',
        status: 'Aguardando',
        servicos: [{ servico_id: servicoId, preco_unitario: 100.00, quantidade: 1 }],
        pecas: []
      });
      osIds.push(res.body.os.id);
    }

    // Simular operações mistas: 10 operações simultâneas
    for (let i = 0; i < NUM_USUARIOS; i++) {
      const inicio = Date.now();
      let req;

      // Alternar entre CREATE, READ, UPDATE
      if (i % 3 === 0) {
        // CREATE
        req = request(app).post('/api/os').send({
          cliente_id: clienteId,
          veiculo_id: veiculoId,
          mecanico_id: mecanicoId,
          data_abertura: '2024-01-15',
          status: 'Aguardando',
          servicos: [{ servico_id: servicoId, preco_unitario: 100.00, quantidade: 1 }],
          pecas: []
        });
      } else if (i % 3 === 1) {
        // READ
        req = request(app).get(`/api/os/${osIds[i % osIds.length]}`);
      } else {
        // UPDATE
        req = request(app).put(`/api/os/${osIds[i % osIds.length]}`).send({
          status: 'Em Andamento',
          forma_pagamento: 'Dinheiro'
        });
      }

      requisicoes.push(
        req.then(response => {
          tempos.push(Date.now() - inicio);
          return response;
        })
      );
    }

    const responses = await Promise.all(requisicoes);

    // Contar sucessos
    let sucessos = 0;
    responses.forEach(res => {
      if (res.statusCode === 200 || res.statusCode === 201) sucessos++;
    });

    const stats = calcularEstatisticas(tempos);
    console.log(`\n📊 OPERAÇÕES MISTAS:`);
    console.log(`   Operações bem-sucedidas: ${sucessos}/${NUM_USUARIOS}`);
    console.log(`   Tempo mínimo: ${stats.min}ms`);
    console.log(`   Tempo máximo: ${stats.max}ms`);
    console.log(`   Tempo médio: ${stats.media.toFixed(2)}ms`);

    // Validar que a maioria foi bem-sucedida
    expect(sucessos).toBeGreaterThanOrEqual(NUM_USUARIOS - 2); // Permitir 2 falhas
    expect(stats.media).toBeLessThan(1000);
  });
});
