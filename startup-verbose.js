#!/usr/bin/env node

/**
 * Script de inicializacao para ambiente de producao - VERSAO COM LOGS DETALHADOS
 * Aplica migrations e inicia o servidor
 */

import { execSync } from 'child_process';

async function iniciarServidor() {
  console.log('\n==============================================');
  console.log('🚀 INICIANDO SISTEMA DE OFICINA');
  console.log('==============================================\n');

  // Verificar variaveis de ambiente criticas
  console.log('📋 Verificando configuracoes...');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'NAO DEFINIDO'}`);
  console.log(`   PORT: ${process.env.PORT || 'NAO DEFINIDO'}`);
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'CONFIGURADO ✓' : 'NAO CONFIGURADO ✗'}`);

  if (!process.env.DATABASE_URL) {
    console.error('\n❌ ERRO CRITICO: DATABASE_URL nao esta configurado!');
    console.error('   Configure a variavel DATABASE_URL no Render Dashboard.');
    process.exit(1);
  }

  // Mostrar informacoes da conexao (sem senha)
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log(`   Database Host: ${url.hostname}`);
    console.log(`   Database Name: ${url.pathname.substring(1)}`);
    console.log(`   Database User: ${url.username}`);
  } catch (e) {
    console.warn('   ⚠️  Aviso: Nao foi possivel parsear DATABASE_URL');
  }

  // Aplicar migrations antes de iniciar o servidor
  console.log('\n🔄 Aplicando migrations...');
  console.log('   Isto pode levar alguns segundos...\n');

  try {
    execSync('npx node-pg-migrate up', {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'production' }
    });
    console.log('\n✅ Migrations aplicadas com sucesso!');
  } catch (error) {
    console.error('\n❌ ERRO AO APLICAR MIGRATIONS!');
    console.error('   Detalhes do erro:', error.message);
    console.error('\n   Possiveis causas:');
    console.error('   1. Banco de dados nao esta acessivel');
    console.error('   2. Credenciais invalidas');
    console.error('   3. SSL nao configurado corretamente');
    console.error('   4. DATABASE_URL incorreto');
    console.error('\n   Verifique os logs acima para mais detalhes.');
    process.exit(1);
  }

  // Iniciar o servidor apos aplicar as migrations
  console.log('\n🚀 Iniciando servidor HTTP...');

  try {
    const { app } = await import('./server.js');
    const http = await import('http');
    const server = http.createServer(app);

    const PORT = process.env.PORT || 3000;

    server.listen(PORT, () => {
      console.log('\n==============================================');
      console.log('✅  SERVIDOR DA OFICINA INICIADO COM SUCESSO!');
      console.log('==============================================');
      console.log(`📡 Porta: ${PORT}`);
      console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🕐 Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
      console.log('==============================================\n');
      console.log('💡 Endpoints disponiveis:');
      console.log(`   GET  /health`);
      console.log(`   GET  /api/dashboard`);
      console.log(`   GET  /api/clientes`);
      console.log(`   GET  /api/veiculos`);
      console.log(`   GET  /api/mecanicos`);
      console.log(`   GET  /api/pecas`);
      console.log(`   GET  /api/servicos`);
      console.log(`   GET  /api/ordens-servico`);
      console.log('\n==============================================\n');
    });

    // Handlers de erro do servidor
    server.on('error', (error) => {
      console.error('\n❌ ERRO NO SERVIDOR:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`   A porta ${PORT} ja esta em uso.`);
      }
      process.exit(1);
    });

    return server;
  } catch (error) {
    console.error('\n❌ ERRO AO INICIAR SERVIDOR!');
    console.error('   Detalhes:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

iniciarServidor().catch(error => {
  console.error('\n❌ ERRO FATAL:', error);
  process.exit(1);
});

export default iniciarServidor;
