// ============================================
// PONTO DE ENTRADA DA APLICAÇÃO
// ============================================

import 'dotenv/config';

const { app } = await import('./server.js');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('\n==============================================');
  console.log('🚗  SERVIDOR DA OFICINA INICIADO!');
  console.log('==============================================');
  console.log(`📡 Rodando em: http://localhost:${PORT}`);
  console.log(`🕐 Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
  console.log('==============================================\n');

  console.log('📋 Rotas disponíveis:');
  console.log('   - GET  http://localhost:' + PORT + '/');
  console.log('   - GET  http://localhost:' + PORT + '/health');
  console.log('   - GET  http://localhost:' + PORT + '/api/teste-banco');
  console.log('   - *    http://localhost:' + PORT + '/api/...');
  console.log('\n💡 Pressione CTRL+C para parar o servidor');
  console.log('==============================================\n');
});

export default app;

