const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const { generateValidCpf } = require('../utils/cpfGenerator');

describe('Testes das Rotas de Ordem de Serviço', () => {
  let clienteId, veiculoId, mecanicoId, servicoId, pecaId;

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
      DELETE FROM servicos;
      DELETE FROM pecas;
    `);

    // Criar dados necessários
    const [cliente] = await db('clientes').insert({
      nome: 'Cliente Teste OS',
      cpf_cnpj: generateValidCpf(false),
      telefone: '11999999999'
    }).returning('*');
    clienteId = cliente.id;

    const [veiculo] = await db('veiculos').insert({
      cliente_id: clienteId,
      marca: 'VW',
      modelo: 'Gol',
      placa: 'ABC1234',
      ano: 2020
    }).returning('*');
    veiculoId = veiculo.id;

    const [mecanico] = await db('mecanicos').insert({
      nome: 'Mecânico Teste',
      especialidade: 'Geral',
      telefone: '11988888888',
      email: `mecanico${Date.now()}@teste.com`
    }).returning('*');
    mecanicoId = mecanico.id;

    const [servico] = await db('servicos').insert({
      nome: 'Troca de Óleo',
      descricao: 'Troca de óleo do motor',
      preco_padrao: 150.00,
      ativo: true
    }).returning('*');
    servicoId = servico.id;

    const [peca] = await db('pecas').insert({
      nome: 'Filtro de Óleo',
      numero_peca: 'FO001',
      preco_venda: 50.00,
      quantidade_estoque: 20,
      estoque_minimo: 5
    }).returning('*');
    pecaId = peca.id;
  });

  afterAll(async () => {
    await db.destroy();
  });

  // ========================================
  // Testes de Criação de OS
  // ========================================

  test('POST /api/os - Deve criar OS com serviços apenas', async () => {
    const response = await request(app).post('/api/os').send({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      data_abertura: '2024-01-15',
      status: 'Aguardando',
      servicos: [
        { servico_id: servicoId, preco_unitario: 150.00, quantidade: 1 }
      ],
      pecas: []
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.os.valor_total).toBe('150.00');
    expect(response.body.os.cliente_nome).toBe('Cliente Teste OS');
  });

  test('POST /api/os - Deve criar OS com peças e dar baixa no estoque', async () => {
    const response = await request(app).post('/api/os').send({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      data_abertura: '2024-01-15',
      status: 'Aguardando',
      servicos: [],
      pecas: [
        { peca_id: pecaId, preco_unitario: 50.00, quantidade: 5 }
      ]
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.os.valor_total).toBe('250.00');

    // Verificar baixa no estoque
    const peca = await db('pecas').where({ id: pecaId }).first();
    expect(peca.quantidade_estoque).toBe(15); // 20 - 5
  });

  test('POST /api/os - Deve criar OS completa (serviços + peças) com desconto', async () => {
    const response = await request(app).post('/api/os').send({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      data_abertura: '2024-01-15',
      status: 'Aguardando',
      desconto: 50.00,
      servicos: [
        { servico_id: servicoId, preco_unitario: 150.00, quantidade: 1 }
      ],
      pecas: [
        { peca_id: pecaId, preco_unitario: 50.00, quantidade: 2 }
      ]
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.sucesso).toBe(true);
    // (150 * 1) + (50 * 2) - 50 = 200
    expect(response.body.os.valor_total).toBe('200.00');
    expect(response.body.os.desconto).toBe('50.00');
  });

  test('POST /api/os - Deve falhar com estoque insuficiente', async () => {
    const response = await request(app).post('/api/os').send({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      data_abertura: '2024-01-15',
      status: 'Aguardando',
      servicos: [],
      pecas: [
        { peca_id: pecaId, preco_unitario: 50.00, quantidade: 100 } // Mais que o disponível
      ]
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toContain('Estoque insuficiente');
    expect(response.body.erro).toContain('Disponível: 20');

    // Verificar que estoque não foi alterado
    const peca = await db('pecas').where({ id: pecaId }).first();
    expect(peca.quantidade_estoque).toBe(20);
  });

  test('POST /api/os - Deve falhar com peça inexistente', async () => {
    const response = await request(app).post('/api/os').send({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      data_abertura: '2024-01-15',
      status: 'Aguardando',
      servicos: [],
      pecas: [
        { peca_id: 99999, preco_unitario: 50.00, quantidade: 1 }
      ]
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toContain('não encontrada');
  });

  // ========================================
  // Testes de Listagem e Busca
  // ========================================

  test('GET /api/os - Deve listar ordens de serviço', async () => {
    // Criar 2 OS
    await db('ordem_servico').insert([
      {
        cliente_id: clienteId,
        veiculo_id: veiculoId,
        mecanico_id: mecanicoId,
        status: 'Aguardando',
        valor_total: 100.00
      },
      {
        cliente_id: clienteId,
        veiculo_id: veiculoId,
        mecanico_id: mecanicoId,
        status: 'Concluído',
        valor_total: 200.00
      }
    ]);

    const response = await request(app).get('/api/os');

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.ordem_servicos).toHaveLength(2);
    expect(response.body.total).toBe(2);
  });

  test('GET /api/os?status=Aguardando - Deve filtrar por status', async () => {
    await db('ordem_servico').insert([
      { cliente_id: clienteId, veiculo_id: veiculoId, mecanico_id: mecanicoId, status: 'Aguardando', valor_total: 100 },
      { cliente_id: clienteId, veiculo_id: veiculoId, mecanico_id: mecanicoId, status: 'Concluído', valor_total: 200 }
    ]);

    const response = await request(app).get('/api/os?status=Aguardando');

    expect(response.statusCode).toBe(200);
    expect(response.body.ordem_servicos).toHaveLength(1);
    expect(response.body.ordem_servicos[0].status).toBe('Aguardando');
  });

  test('GET /api/os/:id - Deve buscar OS por ID com detalhes', async () => {
    // Criar OS com serviços e peças
    const osResponse = await request(app).post('/api/os').send({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      data_abertura: '2024-01-15',
      status: 'Aguardando',
      servicos: [{ servico_id: servicoId, preco_unitario: 150.00, quantidade: 1 }],
      pecas: [{ peca_id: pecaId, preco_unitario: 50.00, quantidade: 2 }]
    });

    const osId = osResponse.body.os.id;

    const response = await request(app).get(`/api/os/${osId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.os.servicos).toHaveLength(1);
    expect(response.body.os.pecas).toHaveLength(1);
    expect(response.body.os.servicos[0].servico_nome).toBe('Troca de Óleo');
    expect(response.body.os.pecas[0].peca_nome).toBe('Filtro de Óleo');
  });

  test('GET /api/os/:id - Deve retornar 404 para OS inexistente', async () => {
    const response = await request(app).get('/api/os/99999');

    expect(response.statusCode).toBe(404);
    expect(response.body.erro).toBe('Ordem de Serviço não encontrada');
  });

  // ========================================
  // Testes de Atualização
  // ========================================

  test('PUT /api/os/:id - Deve atualizar status da OS', async () => {
    const [os] = await db('ordem_servico').insert({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      status: 'Aguardando',
      valor_total: 100.00
    }).returning('*');

    const response = await request(app).put(`/api/os/${os.id}`).send({
      status: 'Concluído',
      forma_pagamento: 'Dinheiro'
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.os.status).toBe('Concluído');
    expect(response.body.os.forma_pagamento).toBe('Dinheiro');
  });

  test('PUT /api/os/:id - Deve atualizar observações da OS', async () => {
    const [os] = await db('ordem_servico').insert({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      status: 'Aguardando',
      valor_total: 100.00,
      observacoes: 'Observação inicial'
    }).returning('*');

    const response = await request(app).put(`/api/os/${os.id}`).send({
      observacoes: 'Cliente solicitou revisão completa'
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.os.observacoes).toBe('Cliente solicitou revisão completa');
  });

  test('PUT /api/os/:id - Deve exigir forma de pagamento ao concluir OS', async () => {
    const [os] = await db('ordem_servico').insert({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      status: 'Em Andamento',
      valor_total: 100.00
    }).returning('*');

    const response = await request(app).put(`/api/os/${os.id}`).send({
      status: 'Concluído'
      // forma_pagamento omitida propositalmente
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Forma de pagamento é obrigatória para concluir a OS');
  });

  test('PUT /api/os/:id - Deve adicionar um novo serviço à OS', async () => {
    const [os] = await db('ordem_servico').insert({
      cliente_id: clienteId, veiculo_id: veiculoId, mecanico_id: mecanicoId,
      status: 'Aguardando', valor_total: 0
    }).returning('*');

    const [novoServico] = await db('servicos').insert({
      nome: 'Balanceamento', preco_padrao: 80.00
    }).returning('*');

    const response = await request(app).put(`/api/os/${os.id}`).send({
      servicos: [{ servico_id: novoServico.id, preco_servico: 80.00 }]
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.os.servicos).toHaveLength(1);
    expect(response.body.os.servicos[0].servico_nome).toBe('Balanceamento');
    expect(response.body.os.valor_total).toBe('80.00');
  });

  test('PUT /api/os/:id - Deve atualizar um serviço existente na OS', async () => {
    const [os] = await db('ordem_servico').insert({
      cliente_id: clienteId, veiculo_id: veiculoId, mecanico_id: mecanicoId,
      status: 'Aguardando', valor_total: 150.00
    }).returning('*');
    await db('os_servicos').insert({ os_id: os.id, servico_id: servicoId, preco_servico: 150.00 });

    const response = await request(app).put(`/api/os/${os.id}`).send({
      servicos: [{ servico_id: servicoId, preco_servico: 180.00 }]
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.os.servicos).toHaveLength(1);
    expect(response.body.os.servicos[0].preco_servico).toBe('180.00');
    expect(response.body.os.valor_total).toBe('180.00');
  });

  test('PUT /api/os/:id - Deve remover um serviço da OS', async () => {
    const [os] = await db('ordem_servico').insert({
      cliente_id: clienteId, veiculo_id: veiculoId, mecanico_id: mecanicoId,
      status: 'Aguardando', valor_total: 150.00
    }).returning('*');
    await db('os_servicos').insert({ os_id: os.id, servico_id: servicoId, preco_servico: 150.00 });

    const response = await request(app).put(`/api/os/${os.id}`).send({
      servicos: [] // Remover todos os serviços
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.os.servicos).toHaveLength(0);
    expect(response.body.os.valor_total).toBe('0.00');
  });

  test('PUT /api/os/:id - Deve adicionar uma nova peça à OS e dar baixa no estoque', async () => {
    const [os] = await db('ordem_servico').insert({
      cliente_id: clienteId, veiculo_id: veiculoId, mecanico_id: mecanicoId,
      status: 'Aguardando', valor_total: 0
    }).returning('*');

    const [novaPeca] = await db('pecas').insert({
      nome: 'Pastilha de Freio', numero_peca: 'PF-001', preco_venda: 70.00,
      quantidade_estoque: 10, estoque_minimo: 2
    }).returning('*');

    const response = await request(app).put(`/api/os/${os.id}`).send({
      pecas: [{ peca_id: novaPeca.id, quantidade: 2, preco_unitario: 70.00 }]
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.os.pecas).toHaveLength(1);
    expect(response.body.os.pecas[0].peca_nome).toBe('Pastilha de Freio');
    expect(response.body.os.valor_total).toBe('140.00');

    const pecaAtualizada = await db('pecas').where({ id: novaPeca.id }).first();
    expect(pecaAtualizada.quantidade_estoque).toBe(8); // 10 - 2
  });

  test('PUT /api/os/:id - Deve atualizar quantidade de peça existente na OS e ajustar estoque', async () => {
    const [os] = await db('ordem_servico').insert({
      cliente_id: clienteId, veiculo_id: veiculoId, mecanico_id: mecanicoId,
      status: 'Aguardando', valor_total: 100.00
    }).returning('*');
    await db('os_pecas').insert({ os_id: os.id, peca_id: pecaId, quantidade: 2, preco_unitario: 50.00 });
    await db('pecas').where({ id: pecaId }).decrement('quantidade_estoque', 2); // Simula baixa inicial

    let pecaAntes = await db('pecas').where({ id: pecaId }).first();
    expect(pecaAntes.quantidade_estoque).toBe(18); // 20 - 2

    const response = await request(app).put(`/api/os/${os.id}`).send({
      pecas: [{ peca_id: pecaId, quantidade: 5, preco_unitario: 50.00 }] // Aumentar de 2 para 5
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.os.pecas).toHaveLength(1);
    expect(response.body.os.pecas[0].quantidade).toBe(5);
    expect(response.body.os.valor_total).toBe('250.00'); // 5 * 50

    const pecaDepois = await db('pecas').where({ id: pecaId }).first();
    expect(pecaDepois.quantidade_estoque).toBe(15); // 18 - 3
  });

  test('PUT /api/os/:id - Deve remover uma peça da OS e devolver ao estoque', async () => {
    const [os] = await db('ordem_servico').insert({
      cliente_id: clienteId, veiculo_id: veiculoId, mecanico_id: mecanicoId,
      status: 'Aguardando', valor_total: 100.00
    }).returning('*');
    await db('os_pecas').insert({ os_id: os.id, peca_id: pecaId, quantidade: 2, preco_unitario: 50.00 });
    await db('pecas').where({ id: pecaId }).decrement('quantidade_estoque', 2); // Simula baixa inicial

    let pecaAntes = await db('pecas').where({ id: pecaId }).first();
    expect(pecaAntes.quantidade_estoque).toBe(18); // 20 - 2

    const response = await request(app).put(`/api/os/${os.id}`).send({
      pecas: [] // Remover todas as peças
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.os.pecas).toHaveLength(0);
    expect(response.body.os.valor_total).toBe('0.00');

    const pecaDepois = await db('pecas').where({ id: pecaId }).first();
    expect(pecaDepois.quantidade_estoque).toBe(20); // 18 + 2
  });

  test('PUT /api/os/:id - Deve falhar ao adicionar peça com estoque insuficiente durante atualização', async () => {
    const [os] = await db('ordem_servico').insert({
      cliente_id: clienteId, veiculo_id: veiculoId, mecanico_id: mecanicoId,
      status: 'Aguardando', valor_total: 0
    }).returning('*');

    const response = await request(app).put(`/api/os/${os.id}`).send({
      pecas: [{ peca_id: pecaId, quantidade: 25, preco_unitario: 50.00 }] // Mais que o disponível (20)
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toContain('Estoque insuficiente');

    const peca = await db('pecas').where({ id: pecaId }).first();
    expect(peca.quantidade_estoque).toBe(20); // Estoque não deve mudar
  });

  test('PUT /api/os/:id - Deve falhar ao atualizar quantidade de peça com estoque insuficiente', async () => {
    const [os] = await db('ordem_servico').insert({
      cliente_id: clienteId, veiculo_id: veiculoId, mecanico_id: mecanicoId,
      status: 'Aguardando', valor_total: 100.00
    }).returning('*');
    await db('os_pecas').insert({ os_id: os.id, peca_id: pecaId, quantidade: 2, preco_unitario: 50.00 });
    await db('pecas').where({ id: pecaId }).decrement('quantidade_estoque', 2); // Estoque: 18

    const response = await request(app).put(`/api/os/${os.id}`).send({
      pecas: [{ peca_id: pecaId, quantidade: 20, preco_unitario: 50.00 }] // Tentar aumentar para 20 (precisa de 2, mas só tem 18)
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toContain('Estoque insuficiente');

    const peca = await db('pecas').where({ id: pecaId }).first();
    expect(peca.quantidade_estoque).toBe(18); // Estoque não deve mudar
  });

  test('PUT /api/os/:id - Deve falhar com desconto maior que o subtotal na atualização', async () => {
    const [os] = await db('ordem_servico').insert({
      cliente_id: clienteId, veiculo_id: veiculoId, mecanico_id: mecanicoId,
      status: 'Aguardando', valor_total: 100.00
    }).returning('*');
    await db('os_servicos').insert({ os_id: os.id, servico_id: servicoId, preco_servico: 100.00 });

    const response = await request(app).put(`/api/os/${os.id}`).send({
      desconto: 150.00, // Desconto maior que o valor do serviço
      servicos: [{ servico_id: servicoId, preco_servico: 100.00 }]
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Desconto não pode ser maior que o valor total da OS');
  });

  test('PUT /api/os/:id - Deve falhar se mecânico já possui outra OS em andamento', async () => {
    const [mecanico2] = await db('mecanicos').insert({
      nome: 'Mecanico Ocupado', especialidade: 'Motor', telefone: '11999991111', email: 'ocupado@teste.com'
    }).returning('*');

    await db('ordem_servico').insert({
      cliente_id: clienteId, veiculo_id: veiculoId, mecanico_id: mecanico2.id,
      status: 'Em Andamento', valor_total: 50
    });

    const [os] = await db('ordem_servico').insert({
      cliente_id: clienteId, veiculo_id: veiculoId, mecanico_id: mecanicoId,
      status: 'Aguardando', valor_total: 100
    }).returning('*');

    const response = await request(app).put(`/api/os/${os.id}`).send({
      mecanico_id: mecanico2.id, // Tentar atribuir ao mecânico ocupado
      status: 'Em Andamento'
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Mecânico já possui outra OS em andamento');
  });

  test('PUT /api/os/:id - Deve falhar se data de conclusão for anterior à data de abertura', async () => {
    const [os] = await db('ordem_servico').insert({
      cliente_id: clienteId, veiculo_id: veiculoId, mecanico_id: mecanicoId,
      status: 'Aguardando', data_abertura: '2024-01-15', valor_total: 100
    }).returning('*');

    const response = await request(app).put(`/api/os/${os.id}`).send({
      data_conclusao: '2024-01-14'
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Data de conclusão não pode ser anterior à data de abertura');
  });

  // ========================================
  // Testes de Exclusão
  // ========================================

  test('DELETE /api/os/:id - Deve cancelar OS e devolver peças ao estoque', async () => {
    // Criar OS com peças
    const osResponse = await request(app).post('/api/os').send({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      data_abertura: '2024-01-15',
      status: 'Aguardando',
      servicos: [],
      pecas: [{ peca_id: pecaId, preco_unitario: 50.00, quantidade: 5 }]
    });

    const osId = osResponse.body.os.id;

    // Verificar que estoque foi reduzido
    let peca = await db('pecas').where({ id: pecaId }).first();
    expect(peca.quantidade_estoque).toBe(15); // 20 - 5

    // Deletar OS
    const response = await request(app).delete(`/api/os/${osId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.mensagem).toBe('Ordem de Serviço cancelada com sucesso');

    // Verificar que estoque foi devolvido
    peca = await db('pecas').where({ id: pecaId }).first();
    expect(peca.quantidade_estoque).toBe(20); // 15 + 5 devolvido
  });

  test('DELETE /api/os/:id - Deve retornar 404 para OS inexistente', async () => {
    const response = await request(app).delete('/api/os/99999');

    expect(response.statusCode).toBe(404);
    expect(response.body.erro).toBe('Ordem de Serviço não encontrada');
  });
});
