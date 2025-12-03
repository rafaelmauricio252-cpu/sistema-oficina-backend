const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const fs = require('fs').promises;
const path = require('path');
const { generateValidCpf } = require('../utils/cpfGenerator');

describe('Testes das Rotas de Upload', () => {
  let clienteId, veiculoId, mecanicoId, osId;
  const testImagePath = path.join(__dirname, '..', 'test-assets', 'test-image.png');

  beforeEach(async () => {
    // Limpar banco
    await db.raw(`
      DELETE FROM os_fotos;
      DELETE FROM estoque_movimentacao;
      DELETE FROM os_servicos;
      DELETE FROM os_pecas;
      DELETE FROM ordem_servico;
      DELETE FROM veiculos;
      DELETE FROM clientes;
      DELETE FROM mecanicos;
    `);

    // Criar dados necessários
    const [cliente] = await db('clientes').insert({
      nome: 'Cliente Teste Upload',
      cpf_cnpj: generateValidCpf(false),
      telefone: '11999999999'
    }).returning('*');
    clienteId = cliente.id;

    const [veiculo] = await db('veiculos').insert({
      cliente_id: clienteId,
      marca: 'Ford',
      modelo: 'Focus',
      placa: 'XYZ9876',
      ano: 2021
    }).returning('*');
    veiculoId = veiculo.id;

    const [mecanico] = await db('mecanicos').insert({
      nome: 'Mecânico Teste',
      especialidade: 'Geral',
      telefone: '11988888888',
      email: `mecanico${Date.now()}@teste.com`
    }).returning('*');
    mecanicoId = mecanico.id;

    const [os] = await db('ordem_servico').insert({
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      status: 'Aguardando',
      valor_total: 100.00
    }).returning('*');
    osId = os.id;

    // Limpar diretório de uploads de teste
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'fotos');
    try {
      const files = await fs.readdir(uploadsDir);
      for (const file of files) {
        await fs.unlink(path.join(uploadsDir, file));
      }
    } catch (err) {
      // Diretório pode não existir ainda
    }
  });

  afterAll(async () => {
    // Limpar uploads de teste
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'fotos');
    try {
      const files = await fs.readdir(uploadsDir);
      for (const file of files) {
        await fs.unlink(path.join(uploadsDir, file));
      }
    } catch (err) {
      // Ignorar erros de limpeza
    }

    await db.destroy();
  });

  // ============================================
  // Testes POST /api/upload/foto
  // ============================================

  test('POST /api/upload/foto - Deve fazer upload de foto com sucesso', async () => {
    const response = await request(app)
      .post('/api/upload/foto')
      .field('os_id', osId)
      .field('descricao', 'Foto do motor')
      .attach('file', testImagePath);

    expect(response.statusCode).toBe(201);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.mensagem).toBe('Foto enviada com sucesso');
    expect(response.body.foto).toHaveProperty('id');
    expect(response.body.foto).toHaveProperty('url');
    expect(response.body.foto).toHaveProperty('nome_arquivo');
    expect(response.body.foto.os_id).toBe(osId);
    expect(response.body.foto.descricao).toBe('Foto do motor');

    // Verificar se foto foi inserida no banco
    const fotoNoBanco = await db('os_fotos').where({ id: response.body.foto.id }).first();
    expect(fotoNoBanco).toBeDefined();
    expect(fotoNoBanco.os_id).toBe(osId);
  });

  test('POST /api/upload/foto - Deve fazer upload sem descrição', async () => {
    const response = await request(app)
      .post('/api/upload/foto')
      .field('os_id', osId)
      .attach('file', testImagePath);

    expect(response.statusCode).toBe(201);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.foto.descricao).toBeNull();
  });

  test('POST /api/upload/foto - Deve falhar sem arquivo', async () => {
    const response = await request(app)
      .post('/api/upload/foto')
      .field('os_id', osId);

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('Nenhum arquivo foi enviado');
  });

  test('POST /api/upload/foto - Deve falhar sem os_id', async () => {
    const response = await request(app)
      .post('/api/upload/foto')
      .attach('file', testImagePath);

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('ID da Ordem de Serviço é obrigatório');
  });

  test('POST /api/upload/foto - Deve falhar com OS inexistente', async () => {
    const response = await request(app)
      .post('/api/upload/foto')
      .field('os_id', 99999)
      .attach('file', testImagePath);

    expect(response.statusCode).toBe(404);
    expect(response.body.erro).toBe('Ordem de Serviço não encontrada');
  });

  // ============================================
  // Testes GET /api/upload/fotos/:os_id
  // ============================================

  test('GET /api/upload/fotos/:os_id - Deve listar fotos de uma OS', async () => {
    // Fazer upload de 2 fotos
    await request(app)
      .post('/api/upload/foto')
      .field('os_id', osId)
      .field('descricao', 'Foto 1')
      .attach('file', testImagePath);

    await request(app)
      .post('/api/upload/foto')
      .field('os_id', osId)
      .field('descricao', 'Foto 2')
      .attach('file', testImagePath);

    const response = await request(app).get(`/api/upload/fotos/${osId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.total).toBe(2);
    expect(response.body.fotos).toHaveLength(2);
    expect(response.body.fotos[0]).toHaveProperty('url');
    expect(response.body.fotos[0]).toHaveProperty('caminho_arquivo');

    // Verificar ordenação (mais recente primeiro)
    expect(response.body.fotos[0].descricao).toBe('Foto 2');
    expect(response.body.fotos[1].descricao).toBe('Foto 1');
  });

  test('GET /api/upload/fotos/:os_id - Deve retornar lista vazia para OS sem fotos', async () => {
    const response = await request(app).get(`/api/upload/fotos/${osId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.total).toBe(0);
    expect(response.body.fotos).toHaveLength(0);
  });

  test('GET /api/upload/fotos/:os_id - Deve falhar com ID inválido', async () => {
    const response = await request(app).get('/api/upload/fotos/abc');

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('ID inválido');
  });

  // ============================================
  // Testes DELETE /api/upload/foto/:id
  // ============================================

  test('DELETE /api/upload/foto/:id - Deve deletar foto com sucesso', async () => {
    // Fazer upload de uma foto
    const uploadResponse = await request(app)
      .post('/api/upload/foto')
      .field('os_id', osId)
      .field('descricao', 'Foto para deletar')
      .attach('file', testImagePath);

    const fotoId = uploadResponse.body.foto.id;

    // Deletar a foto
    const response = await request(app).delete(`/api/upload/foto/${fotoId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.mensagem).toBe('Foto deletada com sucesso');

    // Verificar que foto foi removida do banco
    const fotoNoBanco = await db('os_fotos').where({ id: fotoId }).first();
    expect(fotoNoBanco).toBeUndefined();
  });

  test('DELETE /api/upload/foto/:id - Deve falhar ao deletar foto inexistente', async () => {
    const response = await request(app).delete('/api/upload/foto/99999');

    expect(response.statusCode).toBe(404);
    expect(response.body.erro).toBe('Foto não encontrada');
  });

  test('DELETE /api/upload/foto/:id - Deve falhar com ID inválido', async () => {
    const response = await request(app).delete('/api/upload/foto/abc');

    expect(response.statusCode).toBe(400);
    expect(response.body.erro).toBe('ID inválido');
  });
});
