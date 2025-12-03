#!/usr/bin/env node

/**
 * Script de diagnostico para problemas no Render
 * Verifica configuracoes, testa conexoes e identifica problemas
 */

import 'dotenv/config';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'https://sistema-oficina-backend.onrender.com';

console.log('\n==============================================');
console.log('🔍 DIAGNOSTICO DO SISTEMA - RENDER');
console.log('==============================================\n');

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function success(msg) {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}

function error(msg) {
  console.log(`${colors.red}✗${colors.reset} ${msg}`);
}

function warning(msg) {
  console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);
}

function info(msg) {
  console.log(`${colors.blue}ℹ${colors.reset} ${msg}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. Verificar variaveis de ambiente locais
console.log('📋 1. VERIFICANDO CONFIGURACOES LOCAIS\n');

if (process.env.DATABASE_URL) {
  success('DATABASE_URL esta configurado');
  try {
    const url = new URL(process.env.DATABASE_URL);
    info(`   Host: ${url.hostname}`);
    info(`   Banco: ${url.pathname.substring(1)}`);
    info(`   Usuario: ${url.username}`);

    // Verificar se tem SSL na URL
    if (url.search.includes('ssl=true') || url.search.includes('sslmode=require')) {
      success('   Parametro SSL encontrado na URL');
    } else {
      warning('   Parametro SSL NAO encontrado na URL');
      warning('   Considere adicionar ?ssl=true no final da URL');
    }
  } catch (e) {
    error('   Formato da URL invalido');
  }
} else {
  warning('DATABASE_URL nao configurado (normal em desenvolvimento)');
}

console.log();

if (process.env.NODE_ENV) {
  success(`NODE_ENV: ${process.env.NODE_ENV}`);
} else {
  warning('NODE_ENV nao configurado (padrao: development)');
}

console.log();

// 2. Testar endpoints do backend
console.log('\n📡 2. TESTANDO ENDPOINTS DO BACKEND\n');
console.log(`   URL base: ${BACKEND_URL}\n`);

const endpoints = [
  { path: '/health', name: 'Health Check' },
  { path: '/api/dashboard', name: 'Dashboard' },
  { path: '/api/mecanicos', name: 'Mecanicos' },
  { path: '/api/clientes', name: 'Clientes' },
  { path: '/api/veiculos', name: 'Veiculos' }
];

const results = {
  success: 0,
  failed: 0,
  errors: []
};

for (const endpoint of endpoints) {
  process.stdout.write(`   Testando ${endpoint.name.padEnd(20)}... `);

  try {
    const response = await axios.get(`${BACKEND_URL}${endpoint.path}`, {
      timeout: 10000,
      validateStatus: () => true // Aceitar qualquer status
    });

    if (response.status === 200) {
      console.log(`${colors.green}OK${colors.reset} (${response.status})`);
      results.success++;

      // Mostrar preview dos dados se for array
      if (Array.isArray(response.data)) {
        info(`      Retornou: array com ${response.data.length} item(ns)`);
      } else if (typeof response.data === 'object') {
        const keys = Object.keys(response.data);
        info(`      Retornou: objeto com ${keys.length} campo(s)`);
      }
    } else if (response.status === 404) {
      console.log(`${colors.yellow}NOT FOUND${colors.reset} (${response.status})`);
      results.failed++;
      results.errors.push({ endpoint: endpoint.path, error: 'Endpoint nao encontrado' });
    } else if (response.status === 500) {
      console.log(`${colors.red}ERROR${colors.reset} (${response.status})`);
      results.failed++;
      results.errors.push({
        endpoint: endpoint.path,
        error: response.data.error || response.data.message || 'Erro interno do servidor'
      });
    } else {
      console.log(`${colors.yellow}WARN${colors.reset} (${response.status})`);
      results.failed++;
    }

    await sleep(500); // Delay entre requests

  } catch (err) {
    console.log(`${colors.red}FALHOU${colors.reset}`);
    results.failed++;

    if (err.code === 'ECONNREFUSED') {
      results.errors.push({ endpoint: endpoint.path, error: 'Conexao recusada - servidor pode estar offline' });
    } else if (err.code === 'ETIMEDOUT') {
      results.errors.push({ endpoint: endpoint.path, error: 'Timeout - servidor nao respondeu a tempo' });
    } else if (err.code === 'ENOTFOUND') {
      results.errors.push({ endpoint: endpoint.path, error: 'DNS nao encontrado - URL invalida?' });
    } else {
      results.errors.push({ endpoint: endpoint.path, error: err.message });
    }

    await sleep(500);
  }
}

console.log();

// 3. Resumo dos testes
console.log('\n📊 3. RESUMO DOS TESTES\n');

console.log(`   Total de testes: ${endpoints.length}`);
success(`   Sucessos: ${results.success}`);
if (results.failed > 0) {
  error(`   Falhas: ${results.failed}`);
}

// 4. Mostrar erros detalhados
if (results.errors.length > 0) {
  console.log('\n❌ 4. ERROS ENCONTRADOS\n');

  results.errors.forEach((err, i) => {
    console.log(`   ${i + 1}. ${err.endpoint}`);
    console.log(`      ${colors.red}Erro:${colors.reset} ${err.error}\n`);
  });
}

// 5. Diagnostico e recomendacoes
console.log('\n💡 5. DIAGNOSTICO E RECOMENDACOES\n');

if (results.failed === 0) {
  success('Todos os endpoints estao funcionando corretamente!');
  console.log();
  info('Sistema operacional. Nenhuma acao necessaria.');

} else if (results.failed === endpoints.length) {
  error('NENHUM endpoint esta funcionando!');
  console.log();
  warning('Possiveis causas:');
  console.log('   1. Backend nao esta rodando no Render');
  console.log('   2. URL do backend esta incorreta');
  console.log('   3. Servidor esta reiniciando (aguarde 2-3 minutos)');
  console.log();
  info('Recomendacoes:');
  console.log('   1. Verificar status do servico no Dashboard do Render');
  console.log('   2. Verificar logs do backend no Render');
  console.log('   3. Verificar se DATABASE_URL esta configurado');

} else {
  warning('Alguns endpoints estao falhando');
  console.log();

  // Analisar erros especificos
  const hasDbError = results.errors.some(e =>
    e.error.includes('database') ||
    e.error.includes('relation') ||
    e.error.includes('postgres')
  );

  const hasTimeoutError = results.errors.some(e =>
    e.error.includes('timeout') ||
    e.error.includes('ETIMEDOUT')
  );

  const hasConnectionError = results.errors.some(e =>
    e.error.includes('ECONNREFUSED') ||
    e.error.includes('connection')
  );

  if (hasDbError) {
    error('Detectado problema com banco de dados!');
    console.log();
    warning('Possiveis causas:');
    console.log('   1. Migrations nao foram aplicadas (tabelas nao existem)');
    console.log('   2. DATABASE_URL incorreto ou nao configurado');
    console.log('   3. SSL nao configurado (Render exige SSL)');
    console.log('   4. Credenciais do banco incorretas');
    console.log();
    info('Recomendacoes:');
    console.log('   1. Verificar variavel DATABASE_URL no Render');
    console.log('   2. Adicionar configuracao SSL em db.js');
    console.log('   3. Rodar migrations manualmente via Render Shell');
    console.log('   4. Ver GUIA_SOLUCOES_RENDER.md (Solucao 1 ou 4)');
  }

  if (hasTimeoutError) {
    warning('Detectado problema de timeout!');
    console.log();
    warning('Possiveis causas:');
    console.log('   1. Banco de dados esta lento ou sobrecarregado');
    console.log('   2. Usando External URL ao inves de Internal URL');
    console.log('   3. Conexao de rede instavel');
    console.log();
    info('Recomendacoes:');
    console.log('   1. Trocar para Internal Database URL');
    console.log('   2. Ver GUIA_SOLUCOES_RENDER.md (Solucao 2)');
  }

  if (hasConnectionError) {
    error('Detectado problema de conexao!');
    console.log();
    warning('Possiveis causas:');
    console.log('   1. Backend esta offline ou reiniciando');
    console.log('   2. Startup falhou (verificar logs)');
    console.log();
    info('Recomendacoes:');
    console.log('   1. Verificar logs do backend no Render');
    console.log('   2. Fazer Manual Deploy se necessario');
  }
}

// 6. Proximos passos
console.log('\n📋 6. PROXIMOS PASSOS\n');

if (results.failed > 0) {
  console.log('   1. Acessar Dashboard do Render');
  console.log('   2. Ir em Logs e copiar ultimas 50-100 linhas');
  console.log('   3. Procurar por mensagens de erro (ERROR, FAIL, etc)');
  console.log('   4. Consultar DIAGNOSTICO_RENDER_AVANCADO.md');
  console.log('   5. Aplicar solucoes do GUIA_SOLUCOES_RENDER.md');
} else {
  console.log('   Sistema funcionando normalmente!');
  console.log('   Nenhuma acao necessaria.');
}

console.log('\n==============================================');
console.log('🔍 DIAGNOSTICO CONCLUIDO');
console.log('==============================================\n');

// Exit code baseado no resultado
process.exit(results.failed > 0 ? 1 : 0);
