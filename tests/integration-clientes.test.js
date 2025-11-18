// ============================================
// TESTE DE INTEGRAÇÃO COMPLETO - CLIENTES
// ============================================
// Valida: Banco de Dados + Backend + Frontend
// Objetivo: Garantir que toda a stack funciona corretamente

const request = require('supertest');
const app = require('../server.js');
const knex = require('../config/db');

// ============================================
// 1. VALIDAÇÃO DO SCHEMA DO BANCO DE DADOS
// ============================================

describe('📊 SCHEMA DO BANCO - Tabela CLIENTES', () => {

  it('Deve ter a tabela "clientes" no banco de dados', async () => {
    const hasTable = await knex.schema.hasTable('clientes');
    expect(hasTable).toBe(true);
  });

  it('Deve ter todas as colunas necessárias', async () => {
    const columnInfo = await knex('clientes').columnInfo();

    // Colunas obrigatórias
    expect(columnInfo).toHaveProperty('id');
    expect(columnInfo).toHaveProperty('nome');
    expect(columnInfo).toHaveProperty('cpf_cnpj');
    expect(columnInfo).toHaveProperty('telefone');
    expect(columnInfo).toHaveProperty('email');
    expect(columnInfo).toHaveProperty('endereco');
    expect(columnInfo).toHaveProperty('criado_em');
    expect(columnInfo).toHaveProperty('atualizado_em');
  });

  it('Deve ter os tipos de dados corretos', async () => {
    const columnInfo = await knex('clientes').columnInfo();

    // Verificar tipos (PostgreSQL)
    expect(columnInfo.id.type).toMatch(/integer|serial|bigserial/i);
    expect(columnInfo.nome.type).toMatch(/varchar|character varying|text/i);
    expect(columnInfo.cpf_cnpj.type).toMatch(/varchar|character varying/i);
    expect(columnInfo.telefone.type).toMatch(/varchar|character varying/i);
  });

  it('Deve ter constraints NOT NULL nos campos obrigatórios', async () => {
    const columnInfo = await knex('clientes').columnInfo();

    // Campos obrigatórios não podem ser NULL
    expect(columnInfo.nome.nullable).toBe(false);
    expect(columnInfo.cpf_cnpj.nullable).toBe(false);
    expect(columnInfo.telefone.nullable).toBe(false);

    // Campos opcionais podem ser NULL
    expect(columnInfo.email.nullable).toBe(true);
    expect(columnInfo.endereco.nullable).toBe(true);
  });

  it('Deve ter constraint UNIQUE no CPF/CNPJ', async () => {
    // Tentar inserir dois clientes com mesmo CPF/CNPJ deve falhar
    const cliente1 = {
      nome: 'Cliente Teste Unique 1',
      cpf_cnpj: '70711112259385',
      telefone: '11999999999'
    };

    await knex('clientes').insert(cliente1);

    const cliente2 = {
      nome: 'Cliente Teste Unique 2',
      cpf_cnpj: '70711112259385', // Mesmo CPF/CNPJ
      telefone: '11888888888'
    };

    await expect(
      knex('clientes').insert(cliente2)
    ).rejects.toThrow(); // Deve falhar por violação de UNIQUE

    // Limpar
    await knex('clientes').where('cpf_cnpj', '70711112259385').del();
  });
});

// ============================================
// 2. VALIDAÇÃO DO BACKEND (API)
// ============================================

describe('⚙️ BACKEND API - Endpoints de CLIENTES', () => {

  let testClienteId;

  afterEach(async () => {
    // Limpar dados de teste após cada teste
    if (testClienteId) {
      await knex('clientes').where('id', testClienteId).del();
      testClienteId = null;
    }
  });

  // ---------- CREATE (POST) ----------
  describe('POST /api/clientes - Criar cliente', () => {

    it('Deve criar cliente com todos os campos', async () => {
      const novoCliente = {
        nome: 'João da Silva',
        cpf_cnpj: '67906672615',
        telefone: '11987654321',
        email: 'joao@email.com',
        endereco: 'Rua Teste, 123'
      };

      const response = await request(app)
        .post('/api/clientes')
        .send(novoCliente);

      expect(response.status).toBe(201);
      expect(response.body.sucesso).toBe(true);
      expect(response.body.cliente).toHaveProperty('id');
      expect(response.body.cliente.nome).toBe('João Da Silva'); // Capitalizado
      expect(response.body.cliente.cpf_cnpj).toBe('67906672615');
      expect(response.body.cliente.email).toBe('joao@email.com');

      testClienteId = response.body.cliente.id;
    });

    it('Deve criar cliente apenas com campos obrigatórios', async () => {
      const novoCliente = {
        nome: 'maria santos',
        cpf_cnpj: '63114205895',
        telefone: '11123456789'
      };

      const response = await request(app)
        .post('/api/clientes')
        .send(novoCliente);

      expect(response.status).toBe(201);
      expect(response.body.cliente.nome).toBe('Maria Santos'); // Capitalizado
      expect(response.body.cliente.email).toBeNull();
      expect(response.body.cliente.endereco).toBeNull();

      testClienteId = response.body.cliente.id;
    });

    it('Deve aplicar capitalização no nome', async () => {
      const novoCliente = {
        nome: 'pedro de oliveira junior',
        cpf_cnpj: '15835590270',
        telefone: '11999999999'
      };

      const response = await request(app)
        .post('/api/clientes')
        .send(novoCliente);

      expect(response.status).toBe(201);
      expect(response.body.cliente.nome).toBe('Pedro De Oliveira Junior');

      testClienteId = response.body.cliente.id;
    });

    it('Deve remover formatação do CPF/CNPJ', async () => {
      const novoCliente = {
        nome: 'Cliente Teste',
        cpf_cnpj: '679.066.726-15', // Com formatação
        telefone: '(11) 98765-4321'
      };

      const response = await request(app)
        .post('/api/clientes')
        .send(novoCliente);

      expect(response.status).toBe(201);
      expect(response.body.cliente.cpf_cnpj).toBe('67906672615'); // Sem formatação

      testClienteId = response.body.cliente.id;
    });

    it('Deve rejeitar CPF/CNPJ duplicado', async () => {
      const cliente1 = {
        nome: 'Cliente 1',
        cpf_cnpj: '54770265700',
        telefone: '15835590270'
      };

      const response1 = await request(app)
        .post('/api/clientes')
        .send(cliente1);

      testClienteId = response1.body.cliente.id;

      const cliente2 = {
        nome: 'Cliente 2',
        cpf_cnpj: '54770265700', // Mesmo CPF
        telefone: '54770265700'
      };

      const response2 = await request(app)
        .post('/api/clientes')
        .send(cliente2);

      expect(response2.status).toBe(400);
      expect(response2.body.erro).toMatch(/CPF\/CNPJ já cadastrado/i);
    });
  });

  // ---------- READ (GET) ----------
  describe('GET /api/clientes - Listar clientes', () => {

    beforeEach(async () => {
      // Criar alguns clientes para teste
      const [cliente] = await knex('clientes').insert({
        nome: 'Teste Listagem',
        cpf_cnpj: '37682654473',
        telefone: '11333333333'
      }).returning('id');
      testClienteId = cliente.id || cliente;
    });

    it('Deve listar todos os clientes', async () => {
      const response = await request(app).get('/api/clientes');

      expect(response.status).toBe(200);
      expect(response.body.sucesso).toBe(true);
      expect(response.body.clientes).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('Deve retornar cliente por ID', async () => {
      const response = await request(app)
        .get(`/api/clientes/${testClienteId}`);

      expect(response.status).toBe(200);
      expect(response.body.sucesso).toBe(true);
      expect(response.body.cliente.id).toBe(testClienteId);
      expect(response.body.cliente.nome).toBe('Teste Listagem');
    });

    it('Deve retornar 404 para cliente inexistente', async () => {
      const response = await request(app).get('/api/clientes/999999');

      expect(response.status).toBe(404);
      expect(response.body.erro).toMatch(/Cliente não encontrado/i);
    });
  });

  // ---------- UPDATE (PUT) ----------
  describe('PUT /api/clientes/:id - Atualizar cliente', () => {

    beforeEach(async () => {
      const [cliente] = await knex('clientes').insert({
        nome: 'Cliente Original',
        cpf_cnpj: '79025336450',
        telefone: '11444444444',
        email: 'original@email.com'
      }).returning('id');
      testClienteId = cliente.id || cliente;
    });

    it('Deve atualizar todos os campos do cliente', async () => {
      const dadosAtualizados = {
        nome: 'cliente atualizado',
        cpf_cnpj: '68733069590',
        telefone: '11555555555',
        email: 'atualizado@email.com',
        endereco: 'Novo Endereço, 456'
      };

      const response = await request(app)
        .put(`/api/clientes/${testClienteId}`)
        .send(dadosAtualizados);

      expect(response.status).toBe(200);
      expect(response.body.sucesso).toBe(true);
      expect(response.body.cliente.nome).toBe('Cliente Atualizado'); // Capitalizado
      expect(response.body.cliente.cpf_cnpj).toBe('68733069590');
      expect(response.body.cliente.email).toBe('atualizado@email.com');

      // Verificar no banco
      const clienteNoBanco = await knex('clientes')
        .where('id', testClienteId)
        .first();

      expect(clienteNoBanco.nome).toBe('Cliente Atualizado');
      expect(clienteNoBanco.endereco).toBe('Novo Endereço, 456');
    });

    it('Deve atualizar atualizado_em automaticamente', async () => {
      const clienteAntes = await knex('clientes')
        .where('id', testClienteId)
        .first();

      // Aguardar 1 segundo para garantir diferença no timestamp
      await new Promise(resolve => setTimeout(resolve, 1000));

      await request(app)
        .put(`/api/clientes/${testClienteId}`)
        .send({
          nome: 'Nome Atualizado',
          cpf_cnpj: '79025336450',
          telefone: '11444444444'
        });

      const clienteDepois = await knex('clientes')
        .where('id', testClienteId)
        .first();

      expect(new Date(clienteDepois.atualizado_em).getTime())
        .toBeGreaterThan(new Date(clienteAntes.atualizado_em).getTime());
    });

    it('Deve retornar 404 ao atualizar cliente inexistente', async () => {
      const response = await request(app)
        .put('/api/clientes/999999')
        .send({
          nome: 'Teste',
          cpf_cnpj: '67906672615',
          telefone: '11999999999'
        });

      expect(response.status).toBe(404);
      expect(response.body.erro).toMatch(/Cliente não encontrado/i);
    });
  });

  // ---------- DELETE ----------
  describe('DELETE /api/clientes/:id - Deletar cliente', () => {

    it('Deve deletar cliente sem veículos', async () => {
      const [cliente] = await knex('clientes').insert({
        nome: 'Cliente Para Deletar',
        cpf_cnpj: '83135307581',
        telefone: '11666666666'
      }).returning('id');

      const clienteId = cliente.id || cliente;

      const response = await request(app)
        .delete(`/api/clientes/${clienteId}`);

      expect(response.status).toBe(200);
      expect(response.body.sucesso).toBe(true);

      // Verificar que foi deletado do banco
      const clienteDeletado = await knex('clientes')
        .where('id', clienteId)
        .first();

      expect(clienteDeletado).toBeUndefined();
    });

    it('Deve retornar 404 ao deletar cliente inexistente', async () => {
      const response = await request(app).delete('/api/clientes/999999');

      expect(response.status).toBe(404);
      expect(response.body.erro).toMatch(/Cliente não encontrado/i);
    });
  });

  // ---------- BUSCA (Autocomplete) ----------
  describe('GET /api/clientes/buscar - Buscar clientes', () => {

    beforeEach(async () => {
      const [cliente] = await knex('clientes').insert({
        nome: 'Ana Paula Costa',
        cpf_cnpj: '48813610661',
        telefone: '11777777777'
      }).returning('id');
      testClienteId = cliente.id || cliente;
    });

    it('Deve buscar cliente por nome', async () => {
      const response = await request(app)
        .get('/api/clientes/buscar?q=Ana');

      expect(response.status).toBe(200);
      expect(response.body.sucesso).toBe(true);
      expect(response.body.clientes).toBeInstanceOf(Array);
      expect(response.body.clientes.length).toBeGreaterThan(0);
      expect(response.body.clientes[0].nome).toMatch(/Ana/i);
    });

    it('Deve buscar cliente por CPF/CNPJ', async () => {
      const response = await request(app)
        .get('/api/clientes/buscar?q=48813610661');

      expect(response.status).toBe(200);
      expect(response.body.clientes.length).toBeGreaterThan(0);
      expect(response.body.clientes[0].cpf_cnpj).toBe('48813610661');
    });

    it('Deve buscar cliente por telefone', async () => {
      const response = await request(app)
        .get('/api/clientes/buscar?q=777777777');

      expect(response.status).toBe(200);
      expect(response.body.clientes.length).toBeGreaterThan(0);
      expect(response.body.clientes[0].telefone).toBe('11777777777');
    });

    it('Deve limitar resultados a 10', async () => {
      const response = await request(app)
        .get('/api/clientes/buscar?q=a');

      expect(response.status).toBe(200);
      expect(response.body.clientes.length).toBeLessThanOrEqual(10);
    });

    it('Deve retornar erro se query estiver vazia', async () => {
      const response = await request(app)
        .get('/api/clientes/buscar?q=');

      expect(response.status).toBe(400);
      expect(response.body.erro).toMatch(/Parâmetro de busca é obrigatório/i);
    });
  });
});

// ============================================
// 3. VALIDAÇÃO DE RELACIONAMENTOS
// ============================================

describe('🔗 RELACIONAMENTOS - Cliente → Veículos', () => {

  let testClienteId;
  let testVeiculoId;

  beforeEach(async () => {
    // Criar cliente de teste
    const [cliente] = await knex('clientes').insert({
      nome: 'Cliente Com Veículo',
      cpf_cnpj: '63700885288',
      telefone: '11888888888'
    }).returning('id');
    testClienteId = cliente.id || cliente;
  });

  afterEach(async () => {
    // Limpar dados de teste
    if (testVeiculoId) {
      await knex('veiculos').where('id', testVeiculoId).del();
    }
    if (testClienteId) {
      await knex('clientes').where('id', testClienteId).del();
    }
  });

  it('Cliente pode existir sem veículos', async () => {
    const cliente = await knex('clientes')
      .where('id', testClienteId)
      .first();

    expect(cliente).toBeDefined();
    expect(cliente.id).toBe(testClienteId);

    const veiculos = await knex('veiculos')
      .where('cliente_id', testClienteId);

    expect(veiculos).toHaveLength(0);
  });

  it('Cliente pode ter múltiplos veículos (1:N)', async () => {
    // Criar 3 veículos para o mesmo cliente
    const veiculos = [
      {
        cliente_id: testClienteId,
        placa: 'ABC1234',
        marca: 'FIAT',
        modelo: 'Uno'
      },
      {
        cliente_id: testClienteId,
        placa: 'DEF5678',
        marca: 'VW',
        modelo: 'Gol'
      },
      {
        cliente_id: testClienteId,
        placa: 'GHI9012',
        marca: 'GM',
        modelo: 'Onix'
      }
    ];

    await knex('veiculos').insert(veiculos);

    // Buscar veículos do cliente
    const veiculosDoCliente = await knex('veiculos')
      .where('cliente_id', testClienteId);

    expect(veiculosDoCliente).toHaveLength(3);
    expect(veiculosDoCliente[0].cliente_id).toBe(testClienteId);
    expect(veiculosDoCliente[1].cliente_id).toBe(testClienteId);
    expect(veiculosDoCliente[2].cliente_id).toBe(testClienteId);

    // Limpar
    await knex('veiculos').where('cliente_id', testClienteId).del();
  });

  it('Veículo NÃO pode existir sem cliente (FK obrigatória)', async () => {
    const veiculo = {
      placa: 'JKL3456',
      marca: 'HONDA',
      modelo: 'Civic'
      // cliente_id está faltando
    };

    await expect(
      knex('veiculos').insert(veiculo)
    ).rejects.toThrow(); // Deve falhar por violação de NOT NULL
  });

  it('Veículo NÃO pode ter cliente_id inexistente (FK integrity)', async () => {
    const veiculo = {
      cliente_id: 999999, // Cliente inexistente
      placa: 'MNO7890',
      marca: 'TOYOTA',
      modelo: 'Corolla'
    };

    await expect(
      knex('veiculos').insert(veiculo)
    ).rejects.toThrow(); // Deve falhar por violação de FK
  });

  it('NÃO pode deletar cliente com veículos', async () => {
    // Criar veículo para o cliente
    const [veiculo] = await knex('veiculos').insert({
      cliente_id: testClienteId,
      placa: 'PQR1234',
      marca: 'NISSAN',
      modelo: 'March'
    }).returning('id');
    testVeiculoId = veiculo.id || veiculo;

    // Tentar deletar cliente via API
    const response = await request(app)
      .delete(`/api/clientes/${testClienteId}`);

    expect(response.status).toBe(400);
    expect(response.body.erro).toMatch(/Não é possível deletar cliente com veículos/i);

    // Verificar que cliente ainda existe
    const cliente = await knex('clientes')
      .where('id', testClienteId)
      .first();

    expect(cliente).toBeDefined();
  });

  it('GET /api/clientes/:id/completo deve retornar cliente com seus veículos', async () => {
    // Criar 2 veículos para o cliente
    await knex('veiculos').insert([
      {
        cliente_id: testClienteId,
        placa: 'STU5678',
        marca: 'FORD',
        modelo: 'Ka'
      },
      {
        cliente_id: testClienteId,
        placa: 'VWX9012',
        marca: 'RENAULT',
        modelo: 'Sandero'
      }
    ]);

    const response = await request(app)
      .get(`/api/clientes/${testClienteId}/completo`);

    expect(response.status).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.cliente).toHaveProperty('veiculos');
    expect(response.body.cliente.veiculos).toBeInstanceOf(Array);
    expect(response.body.cliente.veiculos).toHaveLength(2);
    expect(response.body.cliente.veiculos[0]).toHaveProperty('placa');
    expect(response.body.cliente.veiculos[0]).toHaveProperty('marca');

    // Limpar
    await knex('veiculos').where('cliente_id', testClienteId).del();
  });
});

// ============================================
// 4. INTEGRAÇÃO FRONTEND → BACKEND → BANCO
// ============================================

describe('🎨 INTEGRAÇÃO FRONTEND - Service de CLIENTES', () => {

  let testClienteId;

  afterEach(async () => {
    if (testClienteId) {
      await knex('clientes').where('id', testClienteId).del();
    }
  });

  it('Frontend service getAll() deve corresponder ao backend', async () => {
    // Simular chamada do frontend (GET /api/clientes)
    const response = await request(app).get('/api/clientes');

    // Verificar estrutura esperada pelo frontend
    expect(response.body).toHaveProperty('clientes');
    expect(response.body.clientes).toBeInstanceOf(Array);

    // Cada cliente deve ter os campos esperados
    if (response.body.clientes.length > 0) {
      const cliente = response.body.clientes[0];
      expect(cliente).toHaveProperty('id');
      expect(cliente).toHaveProperty('nome');
      expect(cliente).toHaveProperty('cpf_cnpj');
      expect(cliente).toHaveProperty('telefone');
    }
  });

  it('Frontend service getById() deve corresponder ao backend', async () => {
    // Criar cliente
    const [cliente] = await knex('clientes').insert({
      nome: 'Cliente Frontend Test',
      cpf_cnpj: '37258308008',
      telefone: '11999999999'
    }).returning('id');
    testClienteId = cliente.id || cliente;

    // Simular chamada do frontend (GET /api/clientes/:id)
    const response = await request(app)
      .get(`/api/clientes/${testClienteId}`);

    // Verificar estrutura esperada pelo frontend
    expect(response.body).toHaveProperty('cliente');
    expect(response.body.cliente.id).toBe(testClienteId);
    expect(response.body.cliente).toHaveProperty('nome');
    expect(response.body.cliente).toHaveProperty('cpf_cnpj');
  });

  it('Formulário frontend tem todos os campos da tabela', async () => {
    // Campos do formulário frontend (baseado em Clientes.tsx)
    const camposFormulario = [
      'nome',      // TextField obrigatório
      'cpf_cnpj',  // TextField obrigatório
      'telefone',  // TextField obrigatório
      'email',     // TextField opcional
      'endereco'   // TextField opcional (multiline)
    ];

    // Campos da tabela no banco
    const columnInfo = await knex('clientes').columnInfo();
    const camposTabela = Object.keys(columnInfo);

    // Verificar se todos os campos editáveis estão no formulário
    camposFormulario.forEach(campo => {
      expect(camposTabela).toContain(campo);
    });

    // Campos obrigatórios no formulário devem ser NOT NULL no banco
    const camposObrigatorios = ['nome', 'cpf_cnpj', 'telefone'];
    camposObrigatorios.forEach(campo => {
      expect(columnInfo[campo].nullable).toBe(false);
    });

    // Campos opcionais no formulário devem permitir NULL no banco
    const camposOpcionais = ['email', 'endereco'];
    camposOpcionais.forEach(campo => {
      expect(columnInfo[campo].nullable).toBe(true);
    });
  });
});

// ============================================
// LIMPEZA FINAL
// ============================================

afterAll(async () => {
  await knex.destroy();
});
