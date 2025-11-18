const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function verificarEstruturas() {
  console.log('🔍 Verificando estrutura das respostas...\n');
  
  try {
    // Mecânicos
    const mecanicos = await axios.get(`${BASE_URL}/mecanicos`);
    console.log('👨‍🔧 Mecânicos:');
    console.log('   Estrutura:', JSON.stringify(Object.keys(mecanicos.data), null, 2));
    console.log('   Primeiro item:', mecanicos.data.mecanicos?.[0] || mecanicos.data[0]);
    console.log();
    
    // Serviços
    const servicos = await axios.get(`${BASE_URL}/servicos`);
    console.log('⚙️  Serviços:');
    console.log('   Estrutura:', JSON.stringify(Object.keys(servicos.data), null, 2));
    console.log('   Primeiro item:', servicos.data.servicos?.[0] || servicos.data[0]);
    console.log();
    
    // Clientes
    const clientes = await axios.get(`${BASE_URL}/clientes`);
    console.log('👤 Clientes:');
    console.log('   Estrutura:', JSON.stringify(Object.keys(clientes.data), null, 2));
    console.log('   Primeiro item:', clientes.data.clientes?.[0] || clientes.data[0]);
    console.log();
    
    // Veículos
    const veiculos = await axios.get(`${BASE_URL}/veiculos`);
    console.log('🚗 Veículos:');
    console.log('   Estrutura:', JSON.stringify(Object.keys(veiculos.data), null, 2));
    console.log('   Primeiro item:', veiculos.data.veiculos?.[0] || veiculos.data[0]);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

verificarEstruturas();
