import db from './config/db.js';

async function testarHistorico() {
  try {
    console.log('🔍 Verificando movimentações no banco...\n');

    // Contar total de movimentações
    const total = await db('estoque_movimentacao').count('* as total').first();
    console.log('📊 Total de movimentações:', total.total);

    // Buscar últimas 5 movimentações
    const movimentacoes = await db('estoque_movimentacao')
      .select(
        'estoque_movimentacao.*',
        'pecas.nome as peca_nome',
        'usuarios.nome as usuario_nome'
      )
      .leftJoin('pecas', 'estoque_movimentacao.peca_id', 'pecas.id')
      .leftJoin('usuarios', 'estoque_movimentacao.usuario_id', 'usuarios.id')
      .orderBy('estoque_movimentacao.data_movimentacao', 'desc')
      .limit(5);

    console.log('\n📋 Últimas 5 movimentações:');
    console.log('='.repeat(80));

    if (movimentacoes.length === 0) {
      console.log('❌ Nenhuma movimentação encontrada no banco!');
      console.log('\n💡 Isso é normal se você acabou de implementar.');
      console.log('   As movimentações só começam a ser registradas DEPOIS da migration.');
    } else {
      movimentacoes.forEach((mov, index) => {
        console.log(`\n${index + 1}. Movimentação ID: ${mov.id}`);
        console.log(`   Peça: ${mov.peca_nome} (ID: ${mov.peca_id})`);
        console.log(`   Tipo: ${mov.tipo_movimentacao}`);
        console.log(`   Quantidade: ${mov.quantidade}`);
        console.log(`   Estoque: ${mov.quantidade_anterior} → ${mov.quantidade_nova}`);
        console.log(`   Usuário: ${mov.usuario_nome || 'N/A'}`);
        console.log(`   Motivo: ${mov.motivo}`);
        console.log(`   Data: ${mov.data_movimentacao}`);
        console.log(`   OS: ${mov.os_id || 'N/A'}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Teste concluído!');
    process.exit(0);

  } catch (erro) {
    console.error('❌ Erro:', erro);
    process.exit(1);
  }
}

testarHistorico();
