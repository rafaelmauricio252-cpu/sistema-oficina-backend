const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function popular() {
  console.log('📦 Populando banco de dados...\n');
  
  try {
    // 1. Criar Peças
    console.log('1. Criando peças...');
    await axios.post(`${BASE_URL}/pecas`, {
      nome: 'Óleo Motor 5W30',
      preco_custo: 25.00,
      preco_venda: 45.00,
      quantidade_estoque: 50
    });
    await axios.post(`${BASE_URL}/pecas`, {
      nome: 'Filtro de Óleo',
      preco_custo: 15.00,
      preco_venda: 30.00,
      quantidade_estoque: 30
    });
    console.log('   ✅ Peças criadas!\n');
    
    // 2. Criar Mecânicos
    console.log('2. Criando mecânicos...');
    await axios.post(`${BASE_URL}/mecanicos`, {
      nome: 'João Silva',
      cpf: '12345678901',
      telefone: '11987654321',
      especialidade: 'Motor',
      ativo: true
    });
    await axios.post(`${BASE_URL}/mecanicos`, {
      nome: 'Maria Santos',
      cpf: '98765432109',
      telefone: '11976543210',
      especialidade: 'Suspensão',
      ativo: true
    });
    console.log('   ✅ Mecânicos criados!\n');
    
    // 3. Criar Serviços
    console.log('3. Criando serviços...');
    await axios.post(`${BASE_URL}/servicos`, {
      nome: 'Troca de Óleo',
      descricao: 'Troca de óleo e filtro',
      preco_padrao: 150.00,
      ativo: true
    });
    await axios.post(`${BASE_URL}/servicos`, {
      nome: 'Alinhamento',
      descricao: 'Alinhamento e balanceamento',
      preco_padrao: 120.00,
      ativo: true
    });
    console.log('   ✅ Serviços criados!\n');
    
    console.log('🎉 Banco populado com sucesso!\n');
    console.log('Agora execute: node testar-validacoes-CORRIGIDO.js');
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

popular();
