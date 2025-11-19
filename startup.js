#!/usr/bin/env node

/**
 * Script de inicialização para ambiente de produção
 * Aplica migrations e inicia o servidor
 */

import { execSync } from 'child_process';

async function iniciarServidor() {
  // Aplicar migrations antes de iniciar o servidor
  console.log('🔄 Aplicando migrations...');
  try {
    execSync('npx node-pg-migrate up', { stdio: 'inherit' });
    console.log('✅ Migrations aplicadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao aplicar migrations:', error.message);
    process.exit(1);
  }

  // Iniciar o servidor após aplicar as migrations
  console.log('🚀 Iniciando servidor...');
  const { app } = await import('./server.js');

  const http = await import('http');
  const server = http.createServer(app);

  const PORT = process.env.PORT || 3000;

  server.listen(PORT, () => {
    console.log('\n==============================================');
    console.log('🚗  SERVIDOR DA OFICINA INICIADO!');
    console.log('==============================================');
    console.log(`📡 Rodando em: http://localhost:${PORT}`);
    console.log(`🕐 Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
    console.log('==============================================\n');
  });

  return server;
}

iniciarServidor();

export default iniciarServidor;