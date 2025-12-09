import db from './config/db.js';

async function verificarDuplicacoes() {
  try {
    console.log('🔍 Verificando duplicações de movimentações...\n');

    // Buscar movimentações agrupadas por os_id e peca_id
    const duplicadas = await db('estoque_movimentacao')
      .select('os_id', 'peca_id', 'tipo_movimentacao', 'quantidade', 'motivo')
      .count('* as total')
      .whereNotNull('os_id')
      .groupBy('os_id', 'peca_id', 'tipo_movimentacao', 'quantidade', 'motivo')
      .having(db.raw('count(*) > 1'));

    if (duplicadas.length === 0) {
      console.log('✅ Nenhuma duplicação encontrada!');
    } else {
      console.log(`⚠️  Encontradas ${duplicadas.length} duplicações:`);
      console.log('='.repeat(80));

      for (const dup of duplicadas) {
        console.log(`\nOS #${dup.os_id} - Peça #${dup.peca_id}`);
        console.log(`Tipo: ${dup.tipo_movimentacao}`);
        console.log(`Quantidade: ${dup.quantidade}`);
        console.log(`Registros duplicados: ${dup.total}`);
        console.log(`Motivo: ${dup.motivo}`);

        // Buscar detalhes das movimentações duplicadas
        const detalhes = await db('estoque_movimentacao')
          .where({ os_id: dup.os_id, peca_id: dup.peca_id, tipo_movimentacao: dup.tipo_movimentacao })
          .orderBy('id');

        detalhes.forEach((mov, index) => {
          console.log(`  ${index + 1}. ID: ${mov.id}, Data: ${mov.data_movimentacao}`);
        });
      }
    }

    process.exit(0);
  } catch (erro) {
    console.error('❌ Erro:', erro);
    process.exit(1);
  }
}

verificarDuplicacoes();
