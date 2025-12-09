import db from './config/db.js';

async function investigarOS4375() {
  try {
    console.log('\n=== INVESTIGAÇÃO DA OS 4375 ===\n');

    // 1. Buscar todas as movimentações da OS 4375
    console.log('1. Buscando todas as movimentações da OS 4375...\n');
    const movimentacoes = await db('estoque_movimentacao')
      .select('id', 'peca_id', 'tipo_movimentacao', 'quantidade', 'quantidade_anterior', 'quantidade_nova', 'data_movimentacao', 'motivo', 'os_id', 'usuario_id', 'criado_em')
      .where('os_id', 4375)
      .orderBy('data_movimentacao', 'asc');

    console.log(`Total de movimentações encontradas: ${movimentacoes.length}\n`);
    console.log('Detalhes das movimentações:');
    movimentacoes.forEach((mov, index) => {
      console.log(`\n  [${index + 1}] ID: ${mov.id}`);
      console.log(`      Peça ID: ${mov.peca_id}`);
      console.log(`      Tipo: ${mov.tipo_movimentacao}`);
      console.log(`      Quantidade movida: ${mov.quantidade}`);
      console.log(`      Quantidade anterior: ${mov.quantidade_anterior}`);
      console.log(`      Quantidade nova: ${mov.quantidade_nova}`);
      console.log(`      Data: ${mov.data_movimentacao}`);
      console.log(`      Motivo: ${mov.motivo}`);
      console.log(`      Usuário ID: ${mov.usuario_id}`);
      console.log(`      Criado em: ${mov.criado_em}`);
    });

    // 2. Agrupar por peca_id e contar
    console.log('\n\n2. Agrupamento por peça:\n');
    const agrupado = {};
    movimentacoes.forEach(mov => {
      if (!agrupado[mov.peca_id]) {
        agrupado[mov.peca_id] = [];
      }
      agrupado[mov.peca_id].push(mov);
    });

    Object.entries(agrupado).forEach(([pecaId, movs]) => {
      console.log(`Peça ID ${pecaId}: ${movs.length} movimentação(ões)`);
      movs.forEach((mov, idx) => {
        const dataStr = typeof mov.data_movimentacao === 'string' ? mov.data_movimentacao.substring(0, 19) : new Date(mov.data_movimentacao).toISOString().substring(0, 19);
        console.log(`  [${idx + 1}] ID: ${mov.id}, Qty: ${mov.quantidade}, Data: ${dataStr}`);
      });
    });

    // 3. Buscar peças da OS 4375
    console.log('\n\n3. Buscando peças vinculadas à OS 4375...\n');
    const osPecas = await db('os_pecas')
      .select('id', 'os_id', 'peca_id', 'quantidade', 'criado_em')
      .where('os_id', 4375)
      .orderBy('peca_id');

    console.log(`Total de peças na OS: ${osPecas.length}\n`);
    osPecas.forEach((op, index) => {
      console.log(`  [${index + 1}] ID: ${op.id}`);
      console.log(`      Peça ID: ${op.peca_id}`);
      console.log(`      Quantidade: ${op.quantidade}`);
      console.log(`      Criado em: ${op.criado_em}`);
    });

    // 4. Focar na peça 2226 (Fio Eletrico)
    console.log('\n\n4. Análise específica da peça 2226 (Fio Eletrico):\n');
    const movimentacoes2226 = movimentacoes.filter(m => m.peca_id === 2226);
    const osPecas2226 = osPecas.filter(op => op.peca_id === 2226);

    console.log(`Movimentações encontradas para Fio Eletrico: ${movimentacoes2226.length}`);
    console.log(`Peças vinculadas na OS para Fio Eletrico: ${osPecas2226.length}\n`);

    if (movimentacoes2226.length > 0) {
      console.log('Detalhes das movimentações:');
      movimentacoes2226.forEach((mov, idx) => {
        console.log(`\n  [${idx + 1}] ID Movimentação: ${mov.id}`);
        console.log(`      Tipo: ${mov.tipo_movimentacao}`);
        console.log(`      Quantidade: ${mov.quantidade}`);
        console.log(`      Antes: ${mov.quantidade_anterior} -> Depois: ${mov.quantidade_nova}`);
        console.log(`      Data: ${mov.data_movimentacao}`);
        console.log(`      Motivo: ${mov.motivo}`);
        console.log(`      Usuário ID: ${mov.usuario_id}`);
        console.log(`      Criado em: ${mov.criado_em}`);
      });

      // Verificar se há duplicação exata
      if (movimentacoes2226.length > 1) {
        console.log('\n\nVERIFICANDO DUPLICAÇÃO:');
        const mov1 = movimentacoes2226[0];
        const mov2 = movimentacoes2226[1];

        const sameQuantity = mov1.quantidade === mov2.quantidade;
        const sameType = mov1.tipo_movimentacao === mov2.tipo_movimentacao;
        const sameMotivo = mov1.motivo === mov2.motivo;

        // Verificar se os tempos são muito próximos (menos de 1 segundo)
        const time1 = new Date(mov1.data_movimentacao).getTime();
        const time2 = new Date(mov2.data_movimentacao).getTime();
        const timeDiff = Math.abs(time1 - time2);
        const veryClose = timeDiff < 1000; // menos de 1 segundo

        console.log(`  Mesma quantidade? ${sameQuantity}`);
        console.log(`  Mesmo tipo? ${sameType}`);
        console.log(`  Mesmo motivo? ${sameMotivo}`);
        console.log(`  Timestamps muito próximos (< 1s)? ${veryClose} (diferença: ${timeDiff}ms)`);
        console.log(`\n  CONCLUSÃO: Parecem ser ${(sameQuantity && sameType && sameMotivo && veryClose) ? 'REGISTROS DUPLICADOS' : 'REGISTROS DIFERENTES'}`);
      }
    }

    console.log('\n=== FIM DA INVESTIGAÇÃO ===\n');
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

investigarOS4375();
