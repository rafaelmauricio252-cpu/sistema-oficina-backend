const request = require('supertest');
const app = require('../server.js'); 
const knex = require('../config/db');

afterAll(async () => {
    await knex.destroy(); // Fecha a conexão com o banco de dados
});

describe('Integração Frontend Services vs Backend Routes', () => {

    // Testes para clienteService.ts
    describe('Cliente Service', () => {
        it('GET /api/clientes deve retornar 200 e a chave "clientes"', async () => {
            const response = await request(app).get('/api/clientes');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('clientes');
            expect(Array.isArray(response.body.clientes)).toBe(true);
        });
    });

    // Testes para veiculoService.ts
    describe('Veiculo Service', () => {
        it('GET /api/veiculos deve retornar 200 e a chave "veiculos"', async () => {
            const response = await request(app).get('/api/veiculos');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('veiculos');
            expect(Array.isArray(response.body.veiculos)).toBe(true);
        });

        it('GET /api/clientes/:id/veiculos deve retornar 200 e a chave "veiculos"', async () => {
            // Este teste assume que existe um cliente com id=1.
            // Em um cenário real, seria melhor criar um cliente no setup do teste.
            const response = await request(app).get('/api/clientes/1/veiculos');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('veiculos');
            expect(Array.isArray(response.body.veiculos)).toBe(true);
        });
    });

    // Testes para mecanicoService.ts
    describe('Mecanico Service', () => {
        it('GET /api/mecanicos deve retornar 200 e a chave "mecanicos"', async () => {
            const response = await request(app).get('/api/mecanicos');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('mecanicos');
            expect(Array.isArray(response.body.mecanicos)).toBe(true);
        });
    });

    // Testes para servicoService.ts
    describe('Servico Service', () => {
        it('GET /api/servicos deve retornar 200 e a chave "servicos"', async () => {
            const response = await request(app).get('/api/servicos');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('servicos');
            expect(Array.isArray(response.body.servicos)).toBe(true);
        });
    });

    // Testes para pecaService.ts
    describe('Peca Service (Estoque)', () => {
        it('GET /api/pecas deve retornar 200 e a chave "pecas"', async () => {
            const response = await request(app).get('/api/pecas');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('pecas');
            expect(Array.isArray(response.body.pecas)).toBe(true);
        });
    });

    // Testes para ordemServicoService.ts
    describe('Ordem de Serviço Service', () => {
        let testClienteId, testVeiculoId, testMecanicoId, testOSId;

        beforeAll(async () => {
            // Criar cliente de teste
            const [cliente] = await knex('clientes').insert({
                nome: 'Cliente Teste Integração',
                cpf_cnpj: '11122233344',
                telefone: '11987654321',
                email: 'teste@teste.com'
            }).returning('id');
            testClienteId = cliente.id || cliente;

            // Criar veículo de teste
            const [veiculo] = await knex('veiculos').insert({
                cliente_id: testClienteId,
                placa: 'ABC1234',
                marca: 'Ford',
                modelo: 'Focus',
                ano: 2020,
                cor: 'Prata'
            }).returning('id');
            testVeiculoId = veiculo.id || veiculo;

            // Criar mecânico de teste
            const [mecanico] = await knex('mecanicos').insert({
                nome: 'Mecânico Teste',
                telefone: '11999999999',
                especialidade: 'Geral',
                email: 'mecanico.teste@oficina.com'
            }).returning('id');
            testMecanicoId = mecanico.id || mecanico;

            // Criar OS de teste
            const [os] = await knex('ordem_servico').insert({
                cliente_id: testClienteId,
                veiculo_id: testVeiculoId,
                mecanico_id: testMecanicoId,
                data_abertura: '2025-01-17',
                status: 'Aguardando',
                observacoes: 'OS de teste para validação',
                valor_total: 100.00
            }).returning('id');
            testOSId = os.id || os;
        });

        afterAll(async () => {
            // Limpar dados de teste
            if (testOSId) await knex('ordem_servico').where('id', testOSId).del();
            if (testVeiculoId) await knex('veiculos').where('id', testVeiculoId).del();
            if (testMecanicoId) await knex('mecanicos').where('id', testMecanicoId).del();
            if (testClienteId) await knex('clientes').where('id', testClienteId).del();
        });

        it('GET /api/os deve retornar 200 e a chave "ordem_servicos"', async () => {
            const response = await request(app).get('/api/os');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('ordem_servicos');
            expect(Array.isArray(response.body.ordem_servicos)).toBe(true);
        });

        it('GET /api/os/:id deve retornar OS com cliente e veículo COMPLETOS (dados aninhados)', async () => {
            const response = await request(app).get(`/api/os/${testOSId}`);

            console.log('\n=== RESPOSTA COMPLETA DO BACKEND ===');
            console.log(JSON.stringify(response.body, null, 2));

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('os');

            const os = response.body.os;

            // Validar que OS tem os dados básicos
            expect(os).toHaveProperty('id', testOSId);
            expect(os).toHaveProperty('status', 'Aguardando');

            // VALIDAR DADOS DO CLIENTE (campos flat do backend)
            expect(os).toHaveProperty('cliente_nome', 'Cliente Teste Integração');
            expect(os).toHaveProperty('cliente_documento', '11122233344');
            expect(os).toHaveProperty('cliente_telefone', '11987654321');
            expect(os).toHaveProperty('cliente_email', 'teste@teste.com');

            // VALIDAR DADOS DO VEÍCULO (campos flat do backend)
            expect(os).toHaveProperty('placa', 'ABC1234');
            expect(os).toHaveProperty('marca', 'Ford');
            expect(os).toHaveProperty('modelo', 'Focus');
            expect(os).toHaveProperty('ano', 2020);
            expect(os).toHaveProperty('cor', 'Prata');

            // VALIDAR DADOS DO MECÂNICO (campos flat do backend)
            expect(os).toHaveProperty('mecanico_nome', 'Mecânico Teste');

            console.log('\n✅ Backend retorna TODOS os campos flat corretamente!');
            console.log('📌 O problema está no frontend - a transformação flat → aninhado não está funcionando');
        });
    });

    // Testes para dashboardService.ts
    describe('Dashboard Service', () => {
        it('GET /api/dashboard deve retornar 200 e a chave "estatisticas"', async () => {
            const response = await request(app).get('/api/dashboard');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('estatisticas');
            expect(typeof response.body.estatisticas).toBe('object');
        });
    });

});