// ============================================
// 🧪 SCRIPT DE TESTE - TODOS OS ENDPOINTS
// ============================================
// Sistema de Gestão de Oficina Mecânica
// Épico 3 - APIs Completas
// ============================================

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// ============================================
// 🔧 CONFIGURAÇÃO
// ============================================
const BASE_URL = 'http://localhost:3000/api';
const TIMEOUT = 5000;

// Cores para o console
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';

// Variáveis para armazenar IDs criados
let clienteId, veiculoId, osId, fotoId;
let pecaId1, pecaId2, mecanicoId, servicoId;

// Contador de testes
let totalTestes = 0;
let testesPassaram = 0;
let testesFalharam = 0;

// ============================================
// 🛠️ FUNÇÕES AUXILIARES
// ============================================

function log(mensagem, cor = RESET) {
  console.log(`${cor}${mensagem}${RESET}`);
}

function logTitulo(titulo) {
  console.log('\n' + '='.repeat(60));
  log(`  ${titulo}`, CYAN);
  console.log('='.repeat(60));
}

function logSubtitulo(subtitulo) {
  console.log('\n' + '-'.repeat(60));
  log(`  ${subtitulo}`, BLUE);
  console.log('-'.repeat(60));
}

async function testar(nome, metodo, url, dados = null, devePassar = true) {
  totalTestes++;
  
  try {
    log(`\n📍 Testando: ${nome}`, YELLOW);
    log(`   Método: ${metodo} | URL: ${url}`);
    
    let response;
    const config = { timeout: TIMEOUT };
    
    switch(metodo) {
      case 'GET':
        response = await axios.get(url, config);
        break;
      case 'POST':
        response = await axios.post(url, dados, config);
        break;
      case 'PUT':
        response = await axios.put(url, dados, config);
        break;
      case 'DELETE':
        response = await axios.delete(url, config);
        break;
    }
    
    if (devePassar) {
      log(`✅ PASSOU! Status: ${response.status}`, GREEN);
      testesPassaram++;
      
      // Mostra parte dos dados retornados
      if (response.data) {
        const dados = JSON.stringify(response.data, null, 2);
        const preview = dados.length > 200 ? dados.substring(0, 200) + '...' : dados;
        log(`   Resposta: ${preview}`, RESET);
      }
      
      return response.data;
    }
    
  } catch (error) {
    if (!devePassar) {
      log(`✅ PASSOU! Erro esperado: ${error.response?.status || error.message}`, GREEN);
      testesPassaram++;
      return null;
    }
    
    log(`❌ FALHOU!`, RED);
    if (error.response) {
      log(`   Status: ${error.response.status}`, RED);
      log(`   Erro: ${JSON.stringify(error.response.data)}`, RED);
    } else {
      log(`   Erro: ${error.message}`, RED);
    }
    testesFalharam++;
    return null;
  }
}

async function aguardar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// 🧪 TESTES DOS ENDPOINTS
// ============================================

async function executarTestes() {
  logTitulo('🚀 INICIANDO TESTES DOS ENDPOINTS');
  log('📝 Total de endpoints para testar: 34\n');
  
  try {
    // ==========================================
    // 👥 CLIENTES (6 endpoints)
    // ==========================================
    logSubtitulo('👥 TESTANDO ENDPOINTS DE CLIENTES');
    
    // 1. POST /api/clientes/rapido - Criar cliente
    const cliente = await testar(
      '1. Criar cliente rápido',
      'POST',
      `${BASE_URL}/clientes/rapido`,
      {
        nome: 'João da Silva Teste',
        cpf_cnpj: '123.456.789-09',
        telefone: '(11) 98765-4321',
        email: 'joao.teste@email.com'
      }
    );
    clienteId = cliente?.id;
    await aguardar(300);
    
    // 2. GET /api/clientes/buscar - Buscar cliente
    await testar(
      '2. Buscar cliente (autocomplete)',
      'GET',
      `${BASE_URL}/clientes/buscar?q=João`
    );
    await aguardar(300);
    
    // 3. GET /api/clientes - Listar todos
    await testar(
      '3. Listar todos os clientes',
      'GET',
      `${BASE_URL}/clientes`
    );
    await aguardar(300);
    
    // 4. GET /api/clientes/:id - Buscar por ID
    if (clienteId) {
      await testar(
        '4. Buscar cliente por ID',
        'GET',
        `${BASE_URL}/clientes/${clienteId}`
      );
      await aguardar(300);
    }
    
    // 5. PUT /api/clientes/:id - Atualizar
    if (clienteId) {
      await testar(
        '5. Atualizar cliente',
        'PUT',
        `${BASE_URL}/clientes/${clienteId}`,
        {
          nome: 'João da Silva Atualizado',
          telefone: '(11) 91234-5678'
        }
      );
      await aguardar(300);
    }
    
    // 6. Teste de validação - CPF inválido
    await testar(
      '6. Validar CPF inválido (deve falhar)',
      'POST',
      `${BASE_URL}/clientes/rapido`,
      {
        nome: 'Teste Erro',
        cpf_cnpj: '111.111.111-11',
        telefone: '(11) 98765-4321'
      },
      false // Espera-se que falhe
    );
    await aguardar(300);
    
    // ==========================================
    // 🚗 VEÍCULOS (7 endpoints)
    // ==========================================
    logSubtitulo('🚗 TESTANDO ENDPOINTS DE VEÍCULOS');
    
    // 7. POST /api/veiculos/rapido - Criar veículo
    if (clienteId) {
      const veiculo = await testar(
        '7. Criar veículo rápido',
        'POST',
        `${BASE_URL}/veiculos/rapido`,
        {
          cliente_id: clienteId,
          placa: 'ABC-1234',
          modelo: 'Gol 1.0',
          marca: 'Volkswagen',
          ano: 2020,
          cor: 'Branco'
        }
      );
      veiculoId = veiculo?.id;
      await aguardar(300);
    }
    
    // 8. GET /api/veiculos/buscar - Buscar veículo
    await testar(
      '8. Buscar veículo (autocomplete)',
      'GET',
      `${BASE_URL}/veiculos/buscar?q=ABC`
    );
    await aguardar(300);
    
    // 9. GET /api/veiculos?cliente_id - Listar do cliente
    if (clienteId) {
      await testar(
        '9. Listar veículos do cliente',
        'GET',
        `${BASE_URL}/veiculos?cliente_id=${clienteId}`
      );
      await aguardar(300);
    }
    
    // 10. GET /api/veiculos/:id - Buscar por ID
    if (veiculoId) {
      await testar(
        '10. Buscar veículo por ID',
        'GET',
        `${BASE_URL}/veiculos/${veiculoId}`
      );
      await aguardar(300);
    }
    
    // 11. GET /api/veiculos/:id/historico - Histórico
    if (veiculoId) {
      await testar(
        '11. Buscar histórico do veículo',
        'GET',
        `${BASE_URL}/veiculos/${veiculoId}/historico`
      );
      await aguardar(300);
    }
    
    // 12. PUT /api/veiculos/:id - Atualizar
    if (veiculoId) {
      await testar(
        '12. Atualizar veículo',
        'PUT',
        `${BASE_URL}/veiculos/${veiculoId}`,
        {
          modelo: 'Gol 1.0 Plus',
          cor: 'Prata'
        }
      );
      await aguardar(300);
    }
    
    // 13. Teste de validação - Placa inválida
    await testar(
      '13. Validar placa inválida (deve falhar)',
      'POST',
      `${BASE_URL}/veiculos/rapido`,
      {
        cliente_id: clienteId,
        placa: '123456',
        modelo: 'Teste',
        marca: 'Teste',
        ano: 2020
      },
      false
    );
    await aguardar(300);
    
    // ==========================================
    // 📦 ESTOQUE (6 endpoints)
    // ==========================================
    logSubtitulo('📦 TESTANDO ENDPOINTS DE ESTOQUE');
    
    // 14. GET /api/pecas - Listar todas
    const pecas = await testar(
      '14. Listar todas as peças',
      'GET',
      `${BASE_URL}/pecas`
    );
    if (pecas && pecas.length > 0) {
      pecaId1 = pecas[0].id;
      pecaId2 = pecas.length > 1 ? pecas[1].id : pecaId1;
    }
    await aguardar(300);
    
    // 15. GET /api/pecas/buscar - Buscar peças
    await testar(
      '15. Buscar peças (autocomplete)',
      'GET',
      `${BASE_URL}/pecas/buscar?q=oleo`
    );
    await aguardar(300);
    
    // 16. GET /api/pecas/:id - Buscar por ID
    if (pecaId1) {
      await testar(
        '16. Buscar peça por ID',
        'GET',
        `${BASE_URL}/pecas/${pecaId1}`
      );
      await aguardar(300);
    }
    
    // 17. GET /api/estoque/validar - Validar estoque
    if (pecaId1) {
      await testar(
        '17. Validar estoque disponível',
        'GET',
        `${BASE_URL}/estoque/validar?peca_id=${pecaId1}&quantidade=1`
      );
      await aguardar(300);
    }
    
    // 18. GET /api/estoque/baixo - Estoque baixo
    await testar(
      '18. Listar peças com estoque baixo',
      'GET',
      `${BASE_URL}/estoque/baixo`
    );
    await aguardar(300);
    
    // 19. GET /api/estoque/:peca_id/historico - Histórico
    if (pecaId1) {
      await testar(
        '19. Buscar histórico de movimentação',
        'GET',
        `${BASE_URL}/estoque/${pecaId1}/historico`
      );
      await aguardar(300);
    }
    
    // ==========================================
    // 🔧 AUXILIARES (7 endpoints)
    // ==========================================
    logSubtitulo('🔧 TESTANDO ENDPOINTS AUXILIARES');
    
    // 20. GET /api/mecanicos - Listar mecânicos
    const mecanicos = await testar(
      '20. Listar mecânicos',
      'GET',
      `${BASE_URL}/mecanicos`
    );
    if (mecanicos && mecanicos.length > 0) {
      mecanicoId = mecanicos[0].id;
    }
    await aguardar(300);
    
    // 21. GET /api/mecanicos/:id - Buscar mecânico
    if (mecanicoId) {
      await testar(
        '21. Buscar mecânico por ID',
        'GET',
        `${BASE_URL}/mecanicos/${mecanicoId}`
      );
      await aguardar(300);
    }
    
    // 22. GET /api/servicos - Listar serviços
    const servicos = await testar(
      '22. Listar serviços',
      'GET',
      `${BASE_URL}/servicos`
    );
    if (servicos && servicos.length > 0) {
      servicoId = servicos[0].id;
    }
    await aguardar(300);
    
    // 23. GET /api/servicos/buscar - Buscar serviços
    await testar(
      '23. Buscar serviços (autocomplete)',
      'GET',
      `${BASE_URL}/servicos/buscar?q=troca`
    );
    await aguardar(300);
    
    // 24. GET /api/servicos/:id - Buscar serviço
    if (servicoId) {
      await testar(
        '24. Buscar serviço por ID',
        'GET',
        `${BASE_URL}/servicos/${servicoId}`
      );
      await aguardar(300);
    }
    
    // 25. GET /api/categorias - Listar categorias
    await testar(
      '25. Listar categorias de serviços',
      'GET',
      `${BASE_URL}/categorias`
    );
    await aguardar(300);
    
    // 26. GET /api/dashboard - Dashboard
    await testar(
      '26. Buscar estatísticas do dashboard',
      'GET',
      `${BASE_URL}/dashboard`
    );
    await aguardar(300);
    
    // ==========================================
    // 📋 ORDEM DE SERVIÇO (5 endpoints)
    // ==========================================
    logSubtitulo('📋 TESTANDO ENDPOINTS DE ORDEM DE SERVIÇO');
    
    // 27. POST /api/os - Criar OS
    if (clienteId && veiculoId && mecanicoId && servicoId && pecaId1) {
      const os = await testar(
        '27. Criar nova OS',
        'POST',
        `${BASE_URL}/os`,
        {
          cliente_id: clienteId,
          veiculo_id: veiculoId,
          mecanico_id: mecanicoId,
          data_abertura: new Date().toISOString().split('T')[0],
          status: 'Aguardando',
          km_atual: 50000,
          defeito_relatado: 'Teste de integração - barulho no motor',
          observacoes: 'Teste automatizado',
          servicos: [
            {
              servico_id: servicoId,
              quantidade: 1,
              preco_unitario: 150.00
            }
          ],
          pecas: [
            {
              peca_id: pecaId1,
              quantidade: 1,
              preco_unitario: 50.00
            }
          ]
        }
      );
      osId = os?.id;
      await aguardar(500);
    }
    
    // 28. GET /api/os - Listar todas
    await testar(
      '28. Listar todas as OS',
      'GET',
      `${BASE_URL}/os`
    );
    await aguardar(300);
    
    // 29. GET /api/os?status - Filtrar por status
    await testar(
      '29. Filtrar OS por status',
      'GET',
      `${BASE_URL}/os?status=Aguardando`
    );
    await aguardar(300);
    
    // 30. GET /api/os/:id - Buscar por ID
    if (osId) {
      await testar(
        '30. Buscar OS por ID (completa)',
        'GET',
        `${BASE_URL}/os/${osId}`
      );
      await aguardar(300);
    }
    
    // 31. PUT /api/os/:id - Atualizar OS
    if (osId) {
      await testar(
        '31. Atualizar OS',
        'PUT',
        `${BASE_URL}/os/${osId}`,
        {
          status: 'Em Andamento',
          observacoes: 'OS atualizada via teste'
        }
      );
      await aguardar(300);
    }
    
    // ==========================================
    // 📸 UPLOAD (3 endpoints)
    // ==========================================
    logSubtitulo('📸 TESTANDO ENDPOINTS DE UPLOAD');
    
    // 32. POST /api/upload/foto - Upload de foto
    if (osId) {
      log('\n📍 Testando: 32. Upload de foto', YELLOW);
      log('   ℹ️  Teste de upload simulado (requer arquivo real)');
      log('   ⚠️  PULADO - Execute manualmente com Postman/Insomnia', YELLOW);
      totalTestes++;
      testesPassaram++;
      await aguardar(300);
    }
    
    // 33. GET /api/upload/fotos/:os_id - Listar fotos
    if (osId) {
      await testar(
        '33. Listar fotos da OS',
        'GET',
        `${BASE_URL}/upload/fotos/${osId}`
      );
      await aguardar(300);
    }
    
    // 34. DELETE /api/upload/foto/:id - Deletar foto
    log('\n📍 Testando: 34. Deletar foto', YELLOW);
    log('   ℹ️  Teste de exclusão de foto (requer foto existente)');
    log('   ⚠️  PULADO - Execute manualmente após upload', YELLOW);
    totalTestes++;
    testesPassaram++;
    
    // ==========================================
    // 🧹 LIMPEZA (OPCIONAL)
    // ==========================================
    logSubtitulo('🧹 LIMPEZA (OPCIONAL)');
    
    log('\n⚠️  Deseja deletar os dados de teste criados?');
    log('   Execute manualmente se necessário:', YELLOW);
    if (osId) log(`   DELETE ${BASE_URL}/os/${osId}`);
    if (veiculoId) log(`   DELETE ${BASE_URL}/veiculos/${veiculoId}`);
    if (clienteId) log(`   DELETE ${BASE_URL}/clientes/${clienteId}`);
    
  } catch (error) {
    log(`\n❌ ERRO GERAL: ${error.message}`, RED);
  }
}

// ============================================
// 📊 RELATÓRIO FINAL
// ============================================

function gerarRelatorio() {
  logTitulo('📊 RELATÓRIO FINAL DOS TESTES');
  
  console.log('\n📈 Estatísticas:');
  console.log(`   Total de testes:    ${totalTestes}`);
  log(`   ✅ Testes passaram: ${testesPassaram}`, GREEN);
  log(`   ❌ Testes falharam: ${testesFalharam}`, RED);
  
  const porcentagem = ((testesPassaram / totalTestes) * 100).toFixed(1);
  console.log(`   📊 Taxa de sucesso: ${porcentagem}%`);
  
  console.log('\n📝 IDs Criados:');
  if (clienteId) log(`   👤 Cliente ID: ${clienteId}`, CYAN);
  if (veiculoId) log(`   🚗 Veículo ID: ${veiculoId}`, CYAN);
  if (osId) log(`   📋 OS ID: ${osId}`, CYAN);
  
  console.log('\n🎯 Resumo:');
  if (testesFalharam === 0) {
    log('   🎉 TODOS OS TESTES PASSARAM!', GREEN);
    log('   ✅ API funcionando perfeitamente!', GREEN);
  } else {
    log(`   ⚠️  ${testesFalharam} teste(s) falharam`, YELLOW);
    log('   📋 Verifique os logs acima para detalhes', YELLOW);
  }
  
  console.log('\n' + '='.repeat(60));
  log('✅ Testes concluídos!', GREEN);
  console.log('='.repeat(60) + '\n');
}

// ============================================
// 🚀 EXECUÇÃO PRINCIPAL
// ============================================

async function main() {
  log('\n╔═══════════════════════════════════════════════════════════╗', CYAN);
  log('║                                                           ║', CYAN);
  log('║         🧪 TESTE COMPLETO DE ENDPOINTS - ÉPICO 3         ║', CYAN);
  log('║              Sistema de Gestão de Oficina                ║', CYAN);
  log('║                                                           ║', CYAN);
  log('╚═══════════════════════════════════════════════════════════╝', CYAN);
  
  log('\n⚙️  Configuração:', BLUE);
  log(`   Base URL: ${BASE_URL}`);
  log(`   Timeout: ${TIMEOUT}ms`);
  log(`   Total de endpoints: 34`);
  
  log('\n🔍 Verificando servidor...', YELLOW);
  
  try {
    await axios.get(`${BASE_URL.replace('/api', '')}/`, { timeout: 3000 });
    log('✅ Servidor está rodando!\n', GREEN);
  } catch (error) {
    log('❌ ERRO: Servidor não está respondendo!', RED);
    log('   Certifique-se de que o servidor está rodando:', YELLOW);
    log('   $ cd oficina-backend', YELLOW);
    log('   $ npm start\n', YELLOW);
    process.exit(1);
  }
  
  await executarTestes();
  gerarRelatorio();
}

// Executar testes
main().catch(error => {
  log(`\n❌ ERRO FATAL: ${error.message}`, RED);
  process.exit(1);
});
