const knex = require('../config/db');

async function checkVeiculos() {
  try {
    console.log('🔍 Verificando últimos 10 veículos no banco de dados...\n');

    const veiculos = await knex('veiculos')
      .select('id', 'placa', 'marca', 'modelo', 'chassi', 'km', 'criado_em')
      .orderBy('id', 'desc')
      .limit(10);

    console.log('Total de veículos encontrados:', veiculos.length);
    console.log('\n📋 Últimos 10 veículos:\n');

    veiculos.forEach((v, index) => {
      console.log(`${index + 1}. ID: ${v.id}`);
      console.log(`   Placa: ${v.placa}`);
      console.log(`   Marca/Modelo: ${v.marca} ${v.modelo}`);
      console.log(`   Chassi: ${v.chassi || '❌ NULL'}`);
      console.log(`   KM: ${v.km || '❌ NULL'}`);
      console.log(`   Criado em: ${v.criado_em}`);
      console.log('');
    });

    // Estatísticas
    const total = await knex('veiculos').count('* as count').first();
    const comChassi = await knex('veiculos').whereNotNull('chassi').count('* as count').first();
    const comKm = await knex('veiculos').whereNotNull('km').count('* as count').first();

    console.log('\n📊 Estatísticas:');
    console.log(`Total de veículos: ${total.count}`);
    console.log(`Veículos com chassi: ${comChassi.count}`);
    console.log(`Veículos com km: ${comKm.count}`);

  } catch (error) {
    console.error('❌ Erro ao verificar veículos:', error);
  } finally {
    await knex.destroy();
  }
}

checkVeiculos();
