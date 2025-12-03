const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const { generateValidCpf } = require('../utils/cpfGenerator');

describe('Testes E2E - Fluxos Completos do Sistema', () => {
  beforeEach(async () => {
    // Limpar banco completamente
    await db.raw(`
      DELETE FROM estoque_movimentacao;
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
    await db.destroy();
  });

  // ============================================
  // FLUXO 1: Ciclo Completo de Ordem de Serviço
  // ============================================

  test('E2E: Fluxo completo - Cliente chega → OS criada → Executada → Paga → Dashboard atualizado', async () => {
    // ========================================
    // ETAPA 1: Cliente chega à oficina
    // ========================================
    const [cliente] = await db('clientes').insert({
      nome: 'João Silva',
      cpf_cnpj: generateValidCpf(false),
      telefone: '11987654321',
      email: 'joao@email.com',
      endereco: 'Rua ABC, 123'
    }).returning('*');

    const clienteId = cliente.id;

    // ========================================
    // ETAPA 2: Cadastrar veículo do cliente
    // ========================================
    const [veiculo] = await db('veiculos').insert({
      cliente_id: clienteId,
      marca: 'Volkswagen',
      modelo: 'Gol',
      placa: 'ABC1234',
      ano: 2020,
      cor: 'Prata'
    }).returning('*');

    const veiculoId = veiculo.id;

    // ========================================
    // ETAPA 3: Cadastrar mecânico responsável
    // ========================================
    const [mecanico] = await db('mecanicos').insert({
      nome: 'Carlos Mecânico',
      especialidade: 'Motor',
      telefone: '11999887766',
      email: `carlos${Date.now()}@oficina.com`
    }).returning('*');

    const mecanicoId = mecanico.id;

    // ========================================
    // ETAPA 4: Cadastrar serviço disponível
    // ========================================
    const [servico] = await db('servicos').insert({
      nome: 'Troca de Óleo',
      descricao: 'Troca de óleo do motor',
      preco_padrao: 150.00,
      tempo_estimado: 30,
      ativo: true
    }).returning('*');

    // ========================================
    // ETAPA 5: Cadastrar peça no estoque
    // ========================================
    const [peca] = await db('pecas').insert({
      nome: 'Filtro de Óleo',
      numero_peca: 'FO001',
      preco_venda: 50.00,
      quantidade_estoque: 20,
      estoque_minimo: 5
    }).returning('*');

    // Verificar estoque inicial
    expect(peca.quantidade_estoque).toBe(20);

    // ========================================
    // ETAPA 6: Criar Ordem de Serviço
    // ========================================
    const osResponse = await request(app).post('/api/os').send({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      data_abertura: '2024-01-15',
      status: 'Aguardando',
      descricao_problema: 'Troca de óleo preventiva',
      servicos: [
        { servico_id: servico.id, preco_unitario: 150.00, quantidade: 1 }
      ],
      pecas: [
        { peca_id: peca.id, preco_unitario: 50.00, quantidade: 2 }
      ],
      desconto: 20.00
    });

    expect(osResponse.statusCode).toBe(201);
    expect(osResponse.body.sucesso).toBe(true);
    expect(osResponse.body.os.valor_total).toBe('230.00'); // (150 + 100) - 20
    const osId = osResponse.body.os.id;

    // ========================================
    // ETAPA 7: Verificar baixa automática de estoque
    // ========================================
    const pecaAposOS = await db('pecas').where({ id: peca.id }).first();
    expect(pecaAposOS.quantidade_estoque).toBe(18); // 20 - 2

    // ========================================
    // ETAPA 8: Mecânico inicia o trabalho
    // ========================================
    const iniciarResponse = await request(app).put(`/api/os/${osId}`).send({
      status: 'Em Andamento'
    });

    expect(iniciarResponse.statusCode).toBe(200);
    expect(iniciarResponse.body.os.status).toBe('Em Andamento');

    // ========================================
    // ETAPA 9: Mecânico conclui o serviço
    // ========================================
    const concluirResponse = await request(app).put(`/api/os/${osId}`).send({
      status: 'Concluído',
      observacoes: 'Serviço executado com sucesso. Óleo trocado.',
      forma_pagamento: 'Cartão de Crédito'
    });

    expect(concluirResponse.statusCode).toBe(200);
    expect(concluirResponse.body.os.status).toBe('Concluído');
    expect(concluirResponse.body.os.forma_pagamento).toBe('Cartão de Crédito');

    // ========================================
    // ETAPA 10: Verificar dashboard atualizado
    // ========================================
    const dashboardResponse = await request(app).get('/api/dashboard');

    expect(dashboardResponse.statusCode).toBe(200);
    expect(dashboardResponse.body.sucesso).toBe(true);

    // Verificar contadores
    expect(dashboardResponse.body.estatisticas.total_clientes).toBe(1);
    expect(dashboardResponse.body.estatisticas.total_veiculos).toBe(1);

    // Verificar OS por status
    const osConcluida = dashboardResponse.body.estatisticas.os_por_status.find(
      s => s.status === 'Concluído'
    );
    expect(osConcluida).toBeDefined();
    expect(osConcluida.total).toBe('1');
    expect(parseFloat(osConcluida.valor_total)).toBe(230.00);

    // Verificar ranking de mecânicos
    const mecanicoRanking = dashboardResponse.body.estatisticas.mecanicos_ranking[0];
    expect(mecanicoRanking.nome).toBe('Carlos Mecânico');
    expect(mecanicoRanking.total_os).toBe('1');
    expect(parseFloat(mecanicoRanking.valor_total)).toBe(230.00);

    // ========================================
    // ETAPA 11: Listar OS do cliente
    // ========================================
    const listarOSResponse = await request(app).get('/api/os');

    expect(listarOSResponse.statusCode).toBe(200);
    expect(listarOSResponse.body.ordem_servicos).toHaveLength(1);
    expect(listarOSResponse.body.ordem_servicos[0].cliente_nome).toBe('João Silva');
    expect(listarOSResponse.body.ordem_servicos[0].placa).toBe('ABC1234');
  });

  // ============================================
  // FLUXO 2: Orçamento Rejeitado (Cancelamento)
  // ============================================

  test('E2E: Fluxo de orçamento rejeitado - OS cancelada → Estoque devolvido', async () => {
    // Criar dados base
    const [cliente] = await db('clientes').insert({
      nome: 'Maria Santos',
      cpf_cnpj: generateValidCpf(false),
      telefone: '11998765432'
    }).returning('*');

    const [veiculo] = await db('veiculos').insert({
      cliente_id: cliente.id,
      marca: 'Fiat',
      modelo: 'Uno',
      placa: 'XYZ9876',
      ano: 2018
    }).returning('*');

    const [mecanico] = await db('mecanicos').insert({
      nome: 'José Técnico',
      especialidade: 'Elétrica',
      telefone: '11987654321',
      email: `jose${Date.now()}@oficina.com`
    }).returning('*');

    const [peca] = await db('pecas').insert({
      nome: 'Bateria',
      numero_peca: 'BAT001',
      preco_venda: 350.00,
      quantidade_estoque: 10,
      estoque_minimo: 2
    }).returning('*');

    // Criar OS (orçamento)
    const osResponse = await request(app).post('/api/os').send({
      cliente_id: cliente.id,
      veiculo_id: veiculo.id,
      mecanico_id: mecanico.id,
      data_abertura: '2024-01-16',
      status: 'Aguardando',
      servicos: [],
      pecas: [
        { peca_id: peca.id, preco_unitario: 350.00, quantidade: 1 }
      ]
    });

    expect(osResponse.statusCode).toBe(201);
    const osId = osResponse.body.os.id;

    // Verificar que estoque foi reduzido
    let pecaAtual = await db('pecas').where({ id: peca.id }).first();
    expect(pecaAtual.quantidade_estoque).toBe(9); // 10 - 1

    // Cliente rejeita o orçamento (cancela OS)
    const cancelarResponse = await request(app).delete(`/api/os/${osId}`);

    expect(cancelarResponse.statusCode).toBe(200);
    expect(cancelarResponse.body.sucesso).toBe(true);
    expect(cancelarResponse.body.mensagem).toBe('Ordem de Serviço cancelada com sucesso');

    // Verificar que estoque foi devolvido
    pecaAtual = await db('pecas').where({ id: peca.id }).first();
    expect(pecaAtual.quantidade_estoque).toBe(10); // 9 + 1 devolvido

    // Verificar que OS foi removida
    const osCancelada = await db('ordem_servico').where({ id: osId }).first();
    expect(osCancelada).toBeUndefined();
  });

  // ============================================
  // FLUXO 3: Alerta de Estoque Baixo
  // ============================================

  test('E2E: Fluxo de alerta de estoque - Múltiplas OS → Estoque baixo → Dashboard alerta', async () => {
    // Criar dados base
    const [cliente] = await db('clientes').insert({
      nome: 'Pedro Oliveira',
      cpf_cnpj: generateValidCpf(false),
      telefone: '11976543210'
    }).returning('*');

    const [veiculo] = await db('veiculos').insert({
      cliente_id: cliente.id,
      marca: 'Chevrolet',
      modelo: 'Onix',
      placa: 'DEF5678',
      ano: 2022
    }).returning('*');

    const [mecanico] = await db('mecanicos').insert({
      nome: 'Ana Mecânica',
      especialidade: 'Geral',
      telefone: '11965432109',
      email: `ana${Date.now()}@oficina.com`
    }).returning('*');

    // Criar peça com estoque limitado
    const [peca] = await db('pecas').insert({
      nome: 'Vela de Ignição',
      numero_peca: 'VI001',
      preco_venda: 25.00,
      quantidade_estoque: 12,
      estoque_minimo: 10
    }).returning('*');

    // Dashboard inicial - estoque OK
    let dashboardResponse = await request(app).get('/api/dashboard');
    expect(dashboardResponse.body.estatisticas.pecas_estoque_baixo).toBe(0);

    // Primeira OS - usa 3 peças
    await request(app).post('/api/os').send({
      cliente_id: cliente.id,
      veiculo_id: veiculo.id,
      mecanico_id: mecanico.id,
      data_abertura: '2024-01-17',
      status: 'Aguardando',
      servicos: [],
      pecas: [{ peca_id: peca.id, preco_unitario: 25.00, quantidade: 3 }]
    });

    // Verificar estoque: 12 - 3 = 9 (abaixo do mínimo de 10!)
    let pecaAtual = await db('pecas').where({ id: peca.id }).first();
    expect(pecaAtual.quantidade_estoque).toBe(9);

    // Dashboard deve alertar estoque baixo
    dashboardResponse = await request(app).get('/api/dashboard');
    expect(dashboardResponse.body.estatisticas.pecas_estoque_baixo).toBe(1);

    // Listar peças com estoque baixo
    const estoqueBaixoResponse = await request(app).get('/api/estoque/baixo');

    expect(estoqueBaixoResponse.statusCode).toBe(200);
    expect(estoqueBaixoResponse.body.pecas).toHaveLength(1);
    expect(estoqueBaixoResponse.body.pecas[0].nome).toBe('Vela de Ignição');
    expect(estoqueBaixoResponse.body.pecas[0].quantidade_estoque).toBe(9);
    expect(estoqueBaixoResponse.body.pecas[0].estoque_minimo).toBe(10);
    expect(estoqueBaixoResponse.body.pecas[0].diferenca).toBe(1); // 10 - 9
    expect(estoqueBaixoResponse.body.pecas[0].critico).toBe(false); // Não é crítico (ainda tem 9)
  });

  // ============================================
  // FLUXO 4: Múltiplos Clientes e Veículos
  // ============================================

  test('E2E: Fluxo de múltiplos clientes - Cliente com 2 veículos → 2 OS simultâneas', async () => {
    // Criar cliente
    const [cliente] = await db('clientes').insert({
      nome: 'Roberto Empresário',
      cpf_cnpj: generateValidCpf(true), // CNPJ
      telefone: '11954321098',
      email: 'roberto@empresa.com'
    }).returning('*');

    // Cliente tem 2 veículos
    const veiculos = await db('veiculos').insert([
      {
        cliente_id: cliente.id,
        marca: 'Toyota',
        modelo: 'Corolla',
        placa: 'AAA1111',
        ano: 2023
      },
      {
        cliente_id: cliente.id,
        marca: 'Honda',
        modelo: 'Civic',
        placa: 'BBB2222',
        ano: 2022
      }
    ]).returning('*');

    const [mecanico] = await db('mecanicos').insert({
      nome: 'Lucas Especialista',
      especialidade: 'Suspensão',
      telefone: '11943210987',
      email: `lucas${Date.now()}@oficina.com`
    }).returning('*');

    const [servico] = await db('servicos').insert({
      nome: 'Alinhamento',
      descricao: 'Alinhamento e balanceamento',
      preco_padrao: 120.00,
      tempo_estimado: 45,
      ativo: true
    }).returning('*');

    // Criar OS para cada veículo
    const os1Response = await request(app).post('/api/os').send({
      cliente_id: cliente.id,
      veiculo_id: veiculos[0].id,
      mecanico_id: mecanico.id,
      data_abertura: '2024-01-18',
      status: 'Aguardando',
      servicos: [{ servico_id: servico.id, preco_unitario: 120.00, quantidade: 1 }],
      pecas: []
    });

    const os2Response = await request(app).post('/api/os').send({
      cliente_id: cliente.id,
      veiculo_id: veiculos[1].id,
      mecanico_id: mecanico.id,
      data_abertura: '2024-01-18',
      status: 'Aguardando',
      servicos: [{ servico_id: servico.id, preco_unitario: 120.00, quantidade: 1 }],
      pecas: []
    });

    expect(os1Response.statusCode).toBe(201);
    expect(os2Response.statusCode).toBe(201);

    // Listar todas as OS
    const listarResponse = await request(app).get('/api/os');

    expect(listarResponse.statusCode).toBe(200);
    expect(listarResponse.body.ordem_servicos).toHaveLength(2);
    expect(listarResponse.body.ordem_servicos[0].cliente_nome).toBe('Roberto Empresário');
    expect(listarResponse.body.ordem_servicos[1].cliente_nome).toBe('Roberto Empresário');

    // Verificar dashboard
    const dashboardResponse = await request(app).get('/api/dashboard');
    expect(dashboardResponse.body.estatisticas.total_clientes).toBe(1);
    expect(dashboardResponse.body.estatisticas.total_veiculos).toBe(2);

    const osAguardando = dashboardResponse.body.estatisticas.os_por_status.find(
      s => s.status === 'Aguardando'
    );
    expect(osAguardando.total).toBe('2');
    expect(parseFloat(osAguardando.valor_total)).toBe(240.00); // 120 + 120
  });

  // ============================================
  // FLUXO 5: Validação de Estoque Insuficiente
  // ============================================

  test('E2E: Fluxo de erro - Tentar criar OS com estoque insuficiente → Rollback completo', async () => {
    // Criar dados base
    const [cliente] = await db('clientes').insert({
      nome: 'Cliente Teste',
      cpf_cnpj: generateValidCpf(false),
      telefone: '11900000000'
    }).returning('*');

    const [veiculo] = await db('veiculos').insert({
      cliente_id: cliente.id,
      marca: 'Ford',
      modelo: 'Ka',
      placa: 'TEST123',
      ano: 2020
    }).returning('*');

    const [mecanico] = await db('mecanicos').insert({
      nome: 'Mecânico Teste',
      especialidade: 'Geral',
      telefone: '11900000001',
      email: `teste${Date.now()}@oficina.com`
    }).returning('*');

    // Peça com estoque limitado
    const [peca] = await db('pecas').insert({
      nome: 'Peça Rara',
      numero_peca: 'PR001',
      preco_venda: 500.00,
      quantidade_estoque: 2,
      estoque_minimo: 1
    }).returning('*');

    // Tentar criar OS solicitando mais peças do que disponível
    const osResponse = await request(app).post('/api/os').send({
      cliente_id: cliente.id,
      veiculo_id: veiculo.id,
      mecanico_id: mecanico.id,
      data_abertura: '2024-01-19',
      status: 'Aguardando',
      servicos: [],
      pecas: [
        { peca_id: peca.id, preco_unitario: 500.00, quantidade: 5 } // Solicita 5, mas só tem 2!
      ]
    });

    // Deve falhar
    expect(osResponse.statusCode).toBe(400);
    expect(osResponse.body.erro).toContain('Estoque insuficiente');
    expect(osResponse.body.erro).toContain('Disponível: 2');

    // Verificar que estoque NÃO foi alterado (rollback)
    const pecaApos = await db('pecas').where({ id: peca.id }).first();
    expect(pecaApos.quantidade_estoque).toBe(2); // Mantém o valor original

    // Verificar que nenhuma OS foi criada
    const osCount = await db('ordem_servico').count('* as total').first();
    expect(parseInt(osCount.total)).toBe(0);
  });
});
