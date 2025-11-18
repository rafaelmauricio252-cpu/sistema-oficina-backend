const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const { generateValidCpf } = require('../utils/cpfGenerator');

describe('Testes de Regras de Negócio', () => {
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
      DELETE FROM pecas;
      DELETE FROM servicos;
    `);

    // Criar dados base para testes
    const [cliente] = await db('clientes').insert({
      nome: 'Cliente Teste',
      cpf_cnpj: generateValidCpf(false),
      telefone: '11999999999'
    }).returning('id');
    clienteId = cliente.id;

    const [veiculo] = await db('veiculos').insert({
      cliente_id: clienteId,
      marca: 'VW',
      modelo: 'Gol',
      placa: 'ABC1234',
      ano: 2020
    }).returning('id');
    veiculoId = veiculo.id;

    const [mecanico] = await db('mecanicos').insert({
      nome: 'Mecânico Teste',
      especialidade: 'Geral',
      telefone: '11988888888',
      email: `mecanico${Date.now()}@teste.com`
    }).returning('id');
    mecanicoId = mecanico.id;

    const [servico] = await db('servicos').insert({
      nome: 'Troca de Óleo',
      preco_padrao: 150.00
    }).returning('id');
    servicoId = servico.id;

    const [peca] = await db('pecas').insert({
      nome: 'Filtro de Óleo',
      numero_peca: 'F001',
      preco_venda: 50.00,
      quantidade_estoque: 20,
      estoque_minimo: 5
    }).returning('id');
    pecaId = peca.id;
  });

  afterAll(async () => {
    await db.destroy();
  });

  // ============================================
  // REGRA 1: Desconto não pode ser maior que valor total
  // ============================================

  test('REGRA: Desconto não pode exceder valor total da OS', async () => {
    const response = await request(app).post('/api/os').send({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      data_abertura: '2024-01-15',
      status: 'Aguardando',
      desconto: 500.00, // Desconto maior que o valor total
      servicos: [{ servico_id: servicoId, preco_unitario: 150.00, quantidade: 1 }],
      pecas: [{ peca_id: pecaId, preco_unitario: 50.00, quantidade: 2 }]
      // Valor total: (150 * 1) + (50 * 2) = 250
      // Desconto: 500 (MAIOR que 250)
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toContain('Desconto não pode ser maior que o valor total');
  });

  test('REGRA: Desconto válido deve ser aceito', async () => {
    const response = await request(app).post('/api/os').send({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      data_abertura: '2024-01-15',
      status: 'Aguardando',
      desconto: 50.00, // Desconto válido
      servicos: [{ servico_id: servicoId, preco_unitario: 150.00, quantidade: 1 }],
      pecas: [{ peca_id: pecaId, preco_unitario: 50.00, quantidade: 2 }]
      // Valor total: (150 * 1) + (50 * 2) - 50 = 200
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.os.valor_total).toBe('200.00');
  });

  // ============================================
  // REGRA 2: Data de conclusão deve ser >= data de abertura
  // ============================================

  test('REGRA: Data de conclusão não pode ser anterior à data de abertura', async () => {
    const response = await request(app).post('/api/os').send({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      data_abertura: '2024-01-20',
      data_conclusao: '2024-01-15', // Anterior à abertura!
      status: 'Aguardando',
      servicos: [{ servico_id: servicoId, preco_unitario: 150.00, quantidade: 1 }],
      pecas: []
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toContain('Data de conclusão não pode ser anterior à data de abertura');
  });

  test('REGRA: Data de conclusão igual ou posterior à abertura deve ser aceita', async () => {
    const response = await request(app).post('/api/os').send({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      data_abertura: '2024-01-15',
      data_conclusao: '2024-01-20', // Posterior (OK)
      status: 'Aguardando',
      servicos: [{ servico_id: servicoId, preco_unitario: 150.00, quantidade: 1 }],
      pecas: []
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.sucesso).toBe(true);
  });

  // ============================================
  // REGRA 3: Estoque não pode ficar negativo
  // ============================================

  test('REGRA: Não deve permitir OS que deixaria estoque negativo', async () => {
    const response = await request(app).post('/api/os').send({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      data_abertura: '2024-01-15',
      status: 'Aguardando',
      servicos: [],
      pecas: [{ peca_id: pecaId, preco_unitario: 50.00, quantidade: 100 }]
      // Estoque disponível: 20
      // Solicitado: 100 (INSUFICIENTE)
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toContain('Estoque insuficiente');
    expect(response.body.erro).toContain('Disponível: 20');
    expect(response.body.erro).toContain('Solicitado: 100');
  });

  test('REGRA: Estoque deve ser decrementado corretamente após criar OS', async () => {
    // Estoque inicial: 20
    const response = await request(app).post('/api/os').send({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      data_abertura: '2024-01-15',
      status: 'Aguardando',
      servicos: [],
      pecas: [{ peca_id: pecaId, preco_unitario: 50.00, quantidade: 5 }]
    });

    expect(response.statusCode).toBe(201);

    // Verificar que estoque foi reduzido
    const peca = await db('pecas').where({ id: pecaId }).first();
    expect(peca.quantidade_estoque).toBe(15); // 20 - 5 = 15
  });

  test('REGRA: Estoque deve ser restaurado ao deletar OS', async () => {
    // Criar OS
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

    // Estoque após criação: 15
    let peca = await db('pecas').where({ id: pecaId }).first();
    expect(peca.quantidade_estoque).toBe(15);

    // Deletar OS
    await request(app).delete(`/api/os/${osId}`);

    // Estoque deve voltar a 20
    peca = await db('pecas').where({ id: pecaId }).first();
    expect(peca.quantidade_estoque).toBe(20);
  });

  // ============================================
  // REGRA 4: Mecânico não pode ter múltiplas OS "Em Andamento"
  // ============================================

  test('REGRA: Mecânico não deve ter mais de 1 OS "Em Andamento" simultaneamente', async () => {
    // Criar primeira OS "Em Andamento"
    await request(app).post('/api/os').send({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      data_abertura: '2024-01-15',
      status: 'Em Andamento',
      servicos: [{ servico_id: servicoId, preco_unitario: 150.00, quantidade: 1 }],
      pecas: []
    });

    // Tentar criar segunda OS "Em Andamento" para o mesmo mecânico
    const response = await request(app).post('/api/os').send({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      data_abertura: '2024-01-16',
      status: 'Em Andamento',
      servicos: [{ servico_id: servicoId, preco_unitario: 150.00, quantidade: 1 }],
      pecas: []
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toContain('Mecânico já possui uma OS em andamento');
  });

  test('REGRA: Mecânico pode ter múltiplas OS se não estiverem "Em Andamento"', async () => {
    // Criar primeira OS "Aguardando"
    await request(app).post('/api/os').send({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      data_abertura: '2024-01-15',
      status: 'Aguardando',
      servicos: [{ servico_id: servicoId, preco_unitario: 150.00, quantidade: 1 }],
      pecas: []
    });

    // Criar segunda OS "Aguardando" - DEVE FUNCIONAR
    const response = await request(app).post('/api/os').send({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      data_abertura: '2024-01-16',
      status: 'Aguardando',
      servicos: [{ servico_id: servicoId, preco_unitario: 150.00, quantidade: 1 }],
      pecas: []
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.sucesso).toBe(true);
  });
});
