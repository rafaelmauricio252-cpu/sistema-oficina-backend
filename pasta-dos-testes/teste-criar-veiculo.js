const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testarCriacaoVeiculo() {
  try {
    // Primeiro, pegar um cliente existente
    const clientes = await axios.get(`${BASE_URL}/clientes`);
    const clienteId = clientes.data.clientes[0].id;
    
    console.log('🔍 Cliente ID:', clienteId);
    console.log();
    
    // Criar um veículo
    const placaTeste = `TST${Math.floor(Math.random() * 9000) + 1000}`;
    console.log('🚗 Criando veículo com placa:', placaTeste);
    
    const response = await axios.post(`${BASE_URL}/veiculos/rapido`, {
      cliente_id: clienteId,
      placa: placaTeste,
      modelo: 'Teste',
      marca: 'Teste',
      ano: 2020,
      cor: 'Branco'
    });
    
    console.log();
    console.log('📋 RESPOSTA COMPLETA:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log();
    console.log('🔑 Tentativas de acessar ID:');
    console.log('   response.data.id:', response.data.id);
    console.log('   response.data.veiculo?.id:', response.data.veiculo?.id);
    console.log('   response.data.dados?.id:', response.data.dados?.id);
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testarCriacaoVeiculo();
