// ============================================
// CONTROLLER DE ORDEM DE SERVIÇO (Refatorado com Knex.js)
// ============================================

const db = require('../config/db');

/**
 * Criar nova Ordem de Serviço
 * POST /api/os
 */
async function criarOS(req, res) {
  try {
    const {
      cliente_id,
      veiculo_id,
      mecanico_id,
      data_abertura,
      data_conclusao,
      descricao_problema,
      observacoes,
      status,
      forma_pagamento,
      desconto,
      servicos = [],
      pecas = []
    } = req.body;

    const osInserida = await db.transaction(async (trx) => {
      // PASSO 0: Validações de regras de negócio

      // Regra 1: Validar se mecânico já tem OS "Em Andamento"
      if (status === 'Em Andamento') {
        const osEmAndamento = await trx('ordem_servico')
          .where({ mecanico_id, status: 'Em Andamento' })
          .first();

        if (osEmAndamento) {
          throw new Error('Mecânico já possui uma OS em andamento');
        }
      }

      // Regra 2: Validar datas (data_conclusao >= data_abertura)
      if (data_conclusao && data_abertura) {
        const dataAbert = new Date(data_abertura);
        const dataConcl = new Date(data_conclusao);

        if (dataConcl < dataAbert) {
          throw new Error('Data de conclusão não pode ser anterior à data de abertura');
        }
      }

      // PASSO 1: Validar estoque
      for (const peca of pecas) {
        const p = await trx('pecas').where({ id: peca.peca_id }).first('quantidade_estoque', 'nome');
        if (!p) throw new Error(`Peça ID ${peca.peca_id} não encontrada`);
        if (p.quantidade_estoque < peca.quantidade) {
          throw new Error(`Estoque insuficiente para ${p.nome}. Disponível: ${p.quantidade_estoque}, Solicitado: ${peca.quantidade}`);
        }
      }

      // PASSO 2: Calcular valor total
      const valorServicos = servicos.reduce((total, s) => total + (parseFloat(s.preco_unitario || 0) * parseInt(s.quantidade || 1)), 0);
      const valorPecas = pecas.reduce((total, p) => total + (parseFloat(p.preco_unitario || 0) * parseInt(p.quantidade || 1)), 0);
      const subtotal = valorServicos + valorPecas;

      // Regra 3: Validar desconto (não pode ser maior que subtotal)
      const descontoValor = parseFloat(desconto) || 0;
      if (descontoValor > subtotal) {
        throw new Error('Desconto não pode ser maior que o valor total da OS');
      }

      const valorTotal = subtotal - descontoValor;

      // PASSO 3: Inserir Ordem de Serviço
      const [novaOS] = await trx('ordem_servico').insert({
        cliente_id, veiculo_id, mecanico_id, data_abertura,
        data_fechamento: data_conclusao || null,
        observacoes: descricao_problema || observacoes, // Ajustado para um campo
        status, forma_pagamento: forma_pagamento || null,
        desconto: parseFloat(desconto) || 0,
        valor_total: valorTotal
      }).returning('*');

      // PASSO 4: Inserir serviços e peças da OS
      if (servicos.length > 0) {
        const servicosParaInserir = servicos.map(s => ({
          os_id: novaOS.id,
          servico_id: s.servico_id,
          preco_servico: s.preco_unitario,
        }));
        await trx('os_servicos').insert(servicosParaInserir);
      }

      if (pecas.length > 0) {
        const pecasParaInserir = pecas.map(p => ({
          os_id: novaOS.id,
          peca_id: p.peca_id,
          quantidade: p.quantidade,
          preco_unitario: p.preco_unitario
        }));
        await trx('os_pecas').insert(pecasParaInserir);

        // Dar baixa no estoque
        for (const peca of pecas) {
          await trx('pecas')
            .where({ id: peca.peca_id })
            .decrement('quantidade_estoque', peca.quantidade);
        }
      }
      
      return novaOS;
    });

    // PASSO 5: Buscar OS completa para retornar
    const osCompleta = await buscarOSCompletaPorID(osInserida.id);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Ordem de Serviço criada com sucesso',
      os: osCompleta
    });

  } catch (erro) {
    console.error('Erro ao criar OS:', erro);
    if (erro.message.includes('Estoque insuficiente') ||
        erro.message.includes('não encontrada') ||
        erro.message.includes('Desconto não pode') ||
        erro.message.includes('Data de conclusão') ||
        erro.message.includes('Mecânico já possui')) {
      return res.status(400).json({ erro: erro.message });
    }
    res.status(500).json({ erro: 'Erro ao criar Ordem de Serviço' });
  }
}

/**
 * Listar todas as OS (com filtros e paginação)
 * GET /api/os?pagina=1&limite=20&status=Aberta
 */
async function listarOS(req, res) {
  try {
    const { pagina = 1, limite = 20, status, cliente_id, veiculo_id } = req.query;
    const offset = (pagina - 1) * limite;

    const query = db('ordem_servico as os')
      .leftJoin('clientes as c', 'os.cliente_id', 'c.id')
      .leftJoin('veiculos as v', 'os.veiculo_id', 'v.id')
      .leftJoin('mecanicos as m', 'os.mecanico_id', 'm.id');

    // Aplicar filtros
    if (status) query.andWhere('os.status', status);
    if (cliente_id) query.andWhere('os.cliente_id', cliente_id);
    if (veiculo_id) query.andWhere('os.veiculo_id', veiculo_id);

    // Clonar query para contagem antes de aplicar limit/offset
    const countQuery = query.clone().clearSelect().clearOrder().count('* as total').first();
    const dataQuery = query.select(
        'os.*',
        'c.nome as cliente_nome',
        'v.placa', 'v.marca', 'v.modelo',
        'm.nome as mecanico_nome'
      )
      .orderBy('os.data_abertura', 'desc')
      .limit(limite)
      .offset(offset);

    const [totalResult, ordem_servicos] = await Promise.all([countQuery, dataQuery]);
    const total = parseInt(totalResult.total);

    res.json({
      sucesso: true,
      total,
      pagina: parseInt(pagina),
      total_paginas: Math.ceil(total / limite),
      ordem_servicos
    });

  } catch (erro) {
    console.error('Erro ao listar OS:', erro);
    res.status(500).json({ erro: 'Erro ao listar ordens de serviço' });
  }
}

/**
 * Buscar OS por ID (completa com todos os detalhes)
 * GET /api/os/:id
 */
async function buscarOSPorID(req, res) {
  try {
    const { id } = req.params;

    const os = await buscarOSCompletaPorID(id);

    if (!os) {
      return res.status(404).json({ erro: 'Ordem de Serviço não encontrada' });
    }

    // Buscar itens em paralelo
    const [servicos, pecas, fotos] = await Promise.all([
      db('os_servicos as os_s')
        .leftJoin('servicos as s', 'os_s.servico_id', 's.id')
        .select('os_s.*', 's.nome as servico_nome', 's.descricao as servico_descricao')
        .where('os_s.os_id', id).orderBy('os_s.id'),
      db('os_pecas as os_p')
        .leftJoin('pecas as p', 'os_p.peca_id', 'p.id')
        .select('os_p.*', 'p.nome as peca_nome', 'p.numero_peca as peca_codigo')
        .where('os_p.os_id', id).orderBy('os_p.id'),
      db('os_fotos').where({ os_id: id }).orderBy('criado_em')
    ]);

    res.json({
      sucesso: true,
      os: { ...os, servicos, pecas, fotos }
    });

  } catch (erro) {
    console.error('Erro ao buscar OS:', erro);
    res.status(500).json({ erro: 'Erro ao buscar Ordem de Serviço' });
  }
}

/**
 * Atualizar OS
 * PUT /api/os/:id
 */
async function atualizarOS(req, res) {
  try {
    const { id } = req.params;
    const {
      cliente_id,
      veiculo_id,
      mecanico_id,
      data_abertura,
      data_conclusao,
      descricao_problema,
      observacoes,
      status,
      forma_pagamento,
      desconto
    } = req.body;

    // Só processar serviços/peças se foram fornecidos
    const servicos = req.body.servicos;
    const pecas = req.body.pecas;

    const osAtualizada = await db.transaction(async (trx) => {
      // 0. Verificar se a OS existe
      const osExistente = await trx('ordem_servico').where({ id }).first();
      if (!osExistente) {
        throw new Error('Ordem de Serviço não encontrada');
      }

      // Validações de regras de negócio
      if (status === 'Concluído' && (!forma_pagamento || forma_pagamento.trim() === '')) {
        throw new Error('Forma de pagamento é obrigatória para concluir a OS');
      }

      // Regra 1: Validar se mecânico já tem OS "Em Andamento" (se o status for alterado para "Em Andamento")
      if (mecanico_id && status === 'Em Andamento' && osExistente.mecanico_id !== mecanico_id) {
        const osEmAndamento = await trx('ordem_servico')
          .where({ mecanico_id, status: 'Em Andamento' })
          .whereNot({ id }) // Excluir a própria OS se o mecânico não mudou
          .first();

        if (osEmAndamento) {
          throw new Error('Mecânico já possui outra OS em andamento');
        }
      }

      // Regra 2: Validar datas (data_conclusao >= data_abertura)
      if (data_conclusao) {
        const dataAberturaFinal = data_abertura !== undefined ? data_abertura : osExistente.data_abertura;
        const dataAbert = new Date(dataAberturaFinal);
        const dataConcl = new Date(data_conclusao);

        if (dataConcl < dataAbert) {
          throw new Error('Data de conclusão não pode ser anterior à data de abertura');
        }
      }

      // 1. Gerenciar Peças (só se fornecidas)
      if (pecas !== undefined) {
      const pecasAtuaisOS = await trx('os_pecas').where({ os_id: id });
      const pecasParaRemover = pecasAtuaisOS.filter(pAtual => !pecas.some(pNova => pNova.peca_id === pAtual.peca_id));
      const pecasParaAdicionarOuAtualizar = pecas;

      // Devolver peças removidas ao estoque
      for (const pecaRemover of pecasParaRemover) {
        await trx('pecas')
          .where({ id: pecaRemover.peca_id })
          .increment('quantidade_estoque', pecaRemover.quantidade);
        await trx('os_pecas').where({ os_id: id, peca_id: pecaRemover.peca_id }).del();
      }

      // Processar peças para adicionar/atualizar
      for (const pecaNova of pecasParaAdicionarOuAtualizar) {
        const pecaExistenteNaOS = pecasAtuaisOS.find(p => p.peca_id === pecaNova.peca_id);
        const pecaMestra = await trx('pecas').where({ id: pecaNova.peca_id }).first('quantidade_estoque', 'nome');

        if (!pecaMestra) {
          throw new Error(`Peça ID ${pecaNova.peca_id} não encontrada`);
        }

        const quantidadeAntiga = pecaExistenteNaOS ? pecaExistenteNaOS.quantidade : 0;
        const diferencaQuantidade = pecaNova.quantidade - quantidadeAntiga;

        if (diferencaQuantidade > 0) { // Aumentou a quantidade, verificar estoque
          if (pecaMestra.quantidade_estoque <= diferencaQuantidade) {
            throw new Error(`Estoque insuficiente para ${pecaMestra.nome}. Disponível: ${pecaMestra.quantidade_estoque}, Solicitado adicional: ${diferencaQuantidade}`);
          }
          await trx('pecas').where({ id: pecaNova.peca_id }).decrement('quantidade_estoque', diferencaQuantidade);
        } else if (diferencaQuantidade < 0) { // Diminuiu a quantidade, devolver ao estoque
          await trx('pecas').where({ id: pecaNova.peca_id }).increment('quantidade_estoque', Math.abs(diferencaQuantidade));
        }

        if (pecaExistenteNaOS) {
          await trx('os_pecas')
            .where({ os_id: id, peca_id: pecaNova.peca_id })
            .update({ quantidade: pecaNova.quantidade, preco_unitario: pecaNova.preco_unitario });
        } else {
          await trx('os_pecas').insert({
            os_id: id,
            peca_id: pecaNova.peca_id,
            quantidade: pecaNova.quantidade,
            preco_unitario: pecaNova.preco_unitario
          });
        }
      }
      } // Fim do if (pecas !== undefined)

      // 2. Gerenciar Serviços (só se fornecidos)
      if (servicos !== undefined) {
      const servicosAtuaisOS = await trx('os_servicos').where({ os_id: id });
      const servicosParaRemover = servicosAtuaisOS.filter(sAtual => !servicos.some(sNova => sNova.servico_id === sAtual.servico_id));

      for (const servicoRemover of servicosParaRemover) {
        await trx('os_servicos').where({ os_id: id, servico_id: servicoRemover.servico_id }).del();
      }

      for (const servicoNovo of servicos) {
        const servicoExistenteNaOS = servicosAtuaisOS.find(s => s.servico_id === servicoNovo.servico_id);
        if (servicoExistenteNaOS) {
          await trx('os_servicos')
            .where({ os_id: id, servico_id: servicoNovo.servico_id })
            .update({ preco_servico: servicoNovo.preco_servico });
        } else {
          await trx('os_servicos').insert({
            os_id: id,
            servico_id: servicoNovo.servico_id,
            preco_servico: servicoNovo.preco_servico
          });
        }
      }
      } // Fim do if (servicos !== undefined)

      // 3. Recalcular valor total
      const resultServicos = await trx('os_servicos').where({ os_id: id }).sum('preco_servico as total');
      const valorServicosAtualizado = parseFloat(resultServicos[0]?.total || 0);

      const resultPecas = await trx('os_pecas')
        .where({ os_id: id })
        .sum(trx.raw('quantidade * preco_unitario'));
      const valorPecasAtualizado = parseFloat(resultPecas[0]?.sum || 0);

      const subtotalAtualizado = valorServicosAtualizado + valorPecasAtualizado;

      // Usar desconto existente se não fornecido
      const descontoValor = desconto !== undefined ? (parseFloat(desconto) || 0) : parseFloat(osExistente.desconto || 0);
      if (descontoValor > subtotalAtualizado) {
        throw new Error('Desconto não pode ser maior que o valor total da OS');
      }
      const valorTotalAtualizado = subtotalAtualizado - descontoValor;

      // 4. Atualizar campos principais da OS (apenas os fornecidos)
      const camposParaAtualizar = {
        valor_total: valorTotalAtualizado,
        desconto: descontoValor,
        atualizado_em: db.fn.now()
      };

      // Adicionar apenas campos que foram fornecidos
      if (cliente_id !== undefined) camposParaAtualizar.cliente_id = cliente_id;
      if (veiculo_id !== undefined) camposParaAtualizar.veiculo_id = veiculo_id;
      if (mecanico_id !== undefined) camposParaAtualizar.mecanico_id = mecanico_id;
      if (data_abertura !== undefined) camposParaAtualizar.data_abertura = data_abertura;
      if (data_conclusao !== undefined) camposParaAtualizar.data_fechamento = data_conclusao;
      if (descricao_problema !== undefined) camposParaAtualizar.descricao_problema = descricao_problema;
      if (observacoes !== undefined) camposParaAtualizar.observacoes = observacoes;
      if (status !== undefined) camposParaAtualizar.status = status;
      if (forma_pagamento !== undefined) camposParaAtualizar.forma_pagamento = forma_pagamento;

      const [updatedOS] = await trx('ordem_servico')
        .where({ id })
        .update(camposParaAtualizar)
        .returning('*');
      
      return updatedOS;
    });

    const osCompleta = await buscarOSCompletaPorID(osAtualizada.id);

    res.json({
      sucesso: true,
      mensagem: 'Ordem de Serviço atualizada com sucesso',
      os: osCompleta
    });

  } catch (erro) {
    console.error('Erro ao atualizar OS:', erro);
    if (erro.message.includes('Ordem de Serviço não encontrada') ||
        erro.message.includes('Forma de pagamento é obrigatória') ||
        erro.message.includes('Mecânico já possui outra OS') ||
        erro.message.includes('Data de conclusão não pode ser anterior') ||
        erro.message.includes('Peça ID') ||
        erro.message.includes('Estoque insuficiente') ||
        erro.message.includes('Desconto não pode')) {
      return res.status(400).json({ erro: erro.message });
    }
    res.status(500).json({ erro: 'Erro ao atualizar Ordem de Serviço' });
  }
}

/**
 * Deletar (Cancelar) OS
 * DELETE /api/os/:id
 */
async function deletarOS(req, res) {
  try {
    const { id } = req.params;

    const osDeletada = await db.transaction(async (trx) => {
      const pecasOS = await trx('os_pecas').where({ os_id: id });

      // Devolver peças ao estoque
      for (const peca of pecasOS) {
        await trx('pecas')
          .where({ id: peca.peca_id })
          .increment('quantidade_estoque', peca.quantidade);
      }
      
      // Deletar OS (cascade deve remover os itens)
      const [os] = await trx('ordem_servico').where({ id }).del().returning(['id']);
      
      if (!os) {
        throw new Error('Ordem de Serviço não encontrada');
      }
      return os;
    });

    res.json({
      sucesso: true,
      mensagem: 'Ordem de Serviço cancelada com sucesso',
      os_cancelada: osDeletada
    });

  } catch (erro) {
    console.error('Erro ao deletar OS:', erro);
    if (erro.message === 'Ordem de Serviço não encontrada') {
      return res.status(404).json({ erro: erro.message });
    }
    res.status(500).json({ erro: 'Erro ao cancelar Ordem de Serviço' });
  }
}

/**
 * Função auxiliar: Buscar OS completa por ID
 */
async function buscarOSCompletaPorID(id) {
  const os = await db('ordem_servico as os')
    .leftJoin('clientes as c', 'os.cliente_id', 'c.id')
    .leftJoin('veiculos as v', 'os.veiculo_id', 'v.id')
    .leftJoin('mecanicos as m', 'os.mecanico_id', 'm.id')
    .select(
      'os.*',
      'c.nome as cliente_nome', 'c.cpf_cnpj as cliente_documento', 'c.telefone as cliente_telefone', 'c.email as cliente_email', 'c.endereco as cliente_endereco',
      'v.placa', 'v.marca', 'v.modelo', 'v.ano', 'v.cor',
      'm.nome as mecanico_nome'
    )
    .where('os.id', id)
    .first();

  if (!os) return null;

  // Buscar itens em paralelo
  const [servicos, pecas, fotos] = await Promise.all([
    db('os_servicos as os_s')
      .leftJoin('servicos as s', 'os_s.servico_id', 's.id')
      .select('os_s.*', 's.nome as servico_nome', 's.descricao as servico_descricao')
      .where('os_s.os_id', id).orderBy('os_s.id'),
    db('os_pecas as os_p')
      .leftJoin('pecas as p', 'os_p.peca_id', 'p.id')
      .select('os_p.*', 'p.nome as peca_nome', 'p.numero_peca as peca_codigo')
      .where('os_p.os_id', id).orderBy('os_p.id'),
    db('os_fotos').where({ os_id: id }).orderBy('criado_em')
  ]);

  return { ...os, servicos, pecas, fotos };
}

export {
  criarOS,
  listarOS,
  buscarOSPorID,
  atualizarOS,
  deletarOS
};