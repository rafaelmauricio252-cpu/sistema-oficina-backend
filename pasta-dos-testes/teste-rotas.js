const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testarRotas() {
  console.log('🔍 Testando rotas da API...\n');
  
  // Testar diferentes variações de rotas
  const testes = [
    { nome: 'Estoque Peças', rotas: ['/estoque_pecas', '/pecas', '/estoque-pecas'] },
    { nome: 'Mecânicos', rotas: ['/mecanicos', '/mecanico'] },
    { nome: 'Serviços', rotas: ['/servicos', '/servico'] }
  ];
  
  for (const teste of testes) {
    console.log(`\n📦 ${teste.nome}:`);
    for (const rota of teste.rotas) {
      try {
        const response = await axios.get(`${BASE_URL}${rota}`);
        const qtd = response.data.length || 0;
        console.log(`   ✅ ${rota} → ${qtd} registros`);
        if (qtd > 0) break; // Achou uma rota que funciona, para aqui
      } catch (error) {
        console.log(`   ❌ ${rota} → Não funciona`);
      }
    }
  }
}

testarRotas();
