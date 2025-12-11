// ============================================
// CONTROLLER AUXILIAR (Refatorado com Knex.js)
// ============================================

import db from '../config/db.js';

/**
 * Listar todos os mecânicos ativos
 * GET /api/mecanicos
 */
async function listarMecanicos(req, res) {
  try {
    const mecanicos = await db('mecanicos')
      .select('id', 'nome', 'cpf', 'especialidade', 'telefone', 'email')
      .orderBy('mecanicos.id', 'desc');

    res.json({
      sucesso: true,
      total: mecanicos.length,
      mecanicos
    });

  } catch (erro) {
    console.error('Erro ao listar mecânicos:', erro);
    res.status(500).json({ erro: 'Erro ao listar mecânicos' });
  }
}

/**
 * Buscar mecânico por ID
 * GET /api/mecanicos/:id
 */
async function buscarMecanicoPorID(req, res) {
  try {
    const { id } = req.params;
    const mecanico = await db('mecanicos').where({ id }).first();

    if (!mecanico) {
      return res.status(404).json({ erro: 'Mecânico não encontrado' });
    }

    res.json({
      sucesso: true,
      mecanico
    });

  } catch (erro) {
    console.error('Erro ao buscar mecânico:', erro);
    res.status(500).json({ erro: 'Erro ao buscar mecânico' });
  }
}

/**
 * Criar um novo mecânico
 * POST /api/mecanicos
 */
async function criarMecanico(req, res) {
  try {
    const { nome, cpf, especialidade, telefone, email } = req.body;

    // Validação básica
    if (!nome) {
      return res.status(400).json({ erro: 'Nome do mecânico é obrigatório' });
    }

    // Verificar duplicidade de email ou telefone (se fornecidos)
    if (email) {
      const emailExistente = await db('mecanicos').where({ email }).first();
      if (emailExistente) {
        return res.status(400).json({ erro: 'Email já cadastrado' });
      }
    }
    if (telefone) {
      const telefoneExistente = await db('mecanicos').where({ telefone }).first();
      if (telefoneExistente) {
        return res.status(400).json({ erro: 'Telefone já cadastrado' });
      }
    }

    const [novoMecanico] = await db('mecanicos').insert({
      nome,
      cpf,
      especialidade,
      telefone,
      email,
      criado_em: db.fn.now(),
      atualizado_em: db.fn.now()
    }).returning('*');

    res.status(201).json({
      sucesso: true,
      mensagem: 'Mecânico criado com sucesso',
      mecanico: novoMecanico
    });

  } catch (erro) {
    console.error('Erro ao criar mecânico:', erro);
    res.status(500).json({ erro: 'Erro ao criar mecânico' });
  }
}

/**
 * Criar um novo serviço
 * POST /api/servicos
 */
async function criarServico(req, res) {
  try {
    const { nome, descricao, preco_padrao, tempo_estimado, ativo } = req.body;

    // Validação básica
    if (!nome || !preco_padrao) {
      return res.status(400).json({ erro: 'Nome e preço padrão do serviço são obrigatórios' });
    }
    if (isNaN(preco_padrao) || preco_padrao <= 0) {
      return res.status(400).json({ erro: 'Preço padrão deve ser um número positivo' });
    }
    if (tempo_estimado && (isNaN(tempo_estimado) || tempo_estimado <= 0)) {
      return res.status(400).json({ erro: 'Tempo estimado deve ser um número positivo' });
    }

    // Verificar duplicidade de nome
    const nomeExistente = await db('servicos').where({ nome }).first();
    if (nomeExistente) {
      return res.status(400).json({ erro: 'Nome do serviço já cadastrado' });
    }

    const [novoServico] = await db('servicos').insert({
      nome,
      descricao: descricao || null,
      preco_padrao,
      tempo_estimado: tempo_estimado || null,
      ativo: ativo !== undefined ? ativo : true,
      criado_em: db.fn.now(),
      atualizado_em: db.fn.now()
    }).returning('*');

    res.status(201).json({
      sucesso: true,
      mensagem: 'Serviço criado com sucesso',
      servico: novoServico
    });

  } catch (erro) {
    console.error('Erro ao criar serviço:', erro);
    res.status(500).json({ erro: 'Erro ao criar serviço' });
  }
}

/**
 * Atualizar um mecânico existente
 * PUT /api/mecanicos/:id
 */
async function atualizarMecanico(req, res) {
  try {
    const { id } = req.params;
    const { nome, cpf, especialidade, telefone, email } = req.body;

    // Verificar se o mecânico existe
    const mecanicoExistente = await db('mecanicos').where({ id }).first();
    if (!mecanicoExistente) {
      return res.status(404).json({ erro: 'Mecânico não encontrado' });
    }

    // ============================================
    // PROTEÇÃO: Verificar se tem OS vinculada
    // ============================================
    if (req.body.cpf && req.body.cpf !== mecanicoExistente.cpf) {
      const temOS = await db('ordem_servico').where({ mecanico_id: id }).first();
      if (temOS) {
        return res.status(400).json({
          erro: 'Não é possível alterar CPF de mecânico com ordens de serviço vinculadas (histórico fiscal)'
        });
      }
    }

    // Construir objeto de atualização
    const dadosParaAtualizar = { atualizado_em: db.fn.now() };
    if (nome !== undefined) dadosParaAtualizar.nome = nome;
    if (cpf !== undefined) dadosParaAtualizar.cpf = cpf;
    if (especialidade !== undefined) dadosParaAtualizar.especialidade = especialidade;
    if (telefone !== undefined) dadosParaAtualizar.telefone = telefone;
    if (email !== undefined) dadosParaAtualizar.email = email;

    // Validação de duplicidade para email e telefone (excluindo o próprio mecânico)
    if (email) {
      const emailDuplicado = await db('mecanicos').where({ email }).whereNot({ id }).first();
      if (emailDuplicado) {
        return res.status(400).json({ erro: 'Email já cadastrado para outro mecânico' });
      }
    }
    if (telefone) {
      const telefoneDuplicado = await db('mecanicos').where({ telefone }).whereNot({ id }).first();
      if (telefoneDuplicado) {
        return res.status(400).json({ erro: 'Telefone já cadastrado para outro mecânico' });
      }
    }

    // Se nenhum dado foi fornecido para atualização
    if (Object.keys(dadosParaAtualizar).length === 1 && dadosParaAtualizar.atualizado_em) {
      return res.status(400).json({ erro: 'Nenhum dado fornecido para atualização' });
    }

    const [mecanicoAtualizado] = await db('mecanicos').where({ id }).update(dadosParaAtualizar).returning('*');

    res.json({
      sucesso: true,
      mensagem: 'Mecânico atualizado com sucesso',
      mecanico: mecanicoAtualizado
    });

  } catch (erro) {
    console.error('Erro ao atualizar mecânico:', erro);
    res.status(500).json({ erro: 'Erro ao atualizar mecânico' });
  }
}

/**
 * Atualizar um serviço existente
 * PUT /api/servicos/:id
 */
async function atualizarServico(req, res) {
  try {
    const { id } = req.params;
    const { nome, descricao, preco_padrao, tempo_estimado } = req.body;

    // Verificar se o serviço existe
    const servicoExistente = await db('servicos').where({ id }).first();
    if (!servicoExistente) {
      return res.status(404).json({ erro: 'Serviço não encontrado' });
    }

    // Construir objeto de atualização
    const dadosParaAtualizar = { atualizado_em: db.fn.now() };
    if (nome !== undefined) dadosParaAtualizar.nome = nome;
    if (descricao !== undefined) dadosParaAtualizar.descricao = descricao;
    if (preco_padrao !== undefined) {
      if (isNaN(preco_padrao) || preco_padrao <= 0) {
        return res.status(400).json({ erro: 'Preço padrão deve ser um número positivo' });
      }
      dadosParaAtualizar.preco_padrao = preco_padrao;
    }
    if (tempo_estimado !== undefined) {
      if (isNaN(tempo_estimado) || tempo_estimado <= 0) {
        return res.status(400).json({ erro: 'Tempo estimado deve ser um número positivo' });
      }
      dadosParaAtualizar.tempo_estimado = tempo_estimado;
    }
    if (req.body.ativo !== undefined) {
      dadosParaAtualizar.ativo = req.body.ativo;
    }

    // Validação de duplicidade para nome (excluindo o próprio serviço)
    if (nome) {
      const nomeDuplicado = await db('servicos').where({ nome }).whereNot({ id }).first();
      if (nomeDuplicado) {
        return res.status(400).json({ erro: 'Nome do serviço já cadastrado para outro serviço' });
      }
    }

    // Se nenhum dado foi fornecido para atualização
    if (Object.keys(dadosParaAtualizar).length === 1 && dadosParaAtualizar.atualizado_em) {
      return res.status(400).json({ erro: 'Nenhum dado fornecido para atualização' });
    }

    const [servicoAtualizado] = await db('servicos').where({ id }).update(dadosParaAtualizar).returning('*');

    res.json({
      sucesso: true,
      mensagem: 'Serviço atualizado com sucesso',
      servico: servicoAtualizado
    });

  } catch (erro) {
    console.error('Erro ao atualizar serviço:', erro);
    res.status(500).json({ erro: 'Erro ao atualizar serviço' });
  }
}

/**
 * Deletar um serviço
 * DELETE /api/servicos/:id
 */
async function deletarServico(req, res) {
  try {
    const { id } = req.params;

    // Verificar se o serviço existe
    const servicoExistente = await db('servicos').where({ id }).first();
    if (!servicoExistente) {
      return res.status(404).json({ erro: 'Serviço não encontrado' });
    }

    // Verificar se o serviço está vinculado a alguma ordem de serviço
    const osVinculada = await db('os_servicos').where({ servico_id: id }).first();
    if (osVinculada) {
      return res.status(400).json({ erro: 'Não é possível deletar serviço vinculado a uma ordem de serviço' });
    }

    await db('servicos').where({ id }).del();

    res.json({
      sucesso: true,
      mensagem: 'Serviço deletado com sucesso'
    });

  } catch (erro) {
    console.error('Erro ao deletar serviço:', erro);
    res.status(500).json({ erro: 'Erro ao deletar serviço' });
  }
}

/**
 * Deletar um mecânico
 * DELETE /api/mecanicos/:id
 */
async function deletarMecanico(req, res) {
  try {
    const { id } = req.params;

    // Verificar se o mecânico existe
    const mecanicoExistente = await db('mecanicos').where({ id }).first();
    if (!mecanicoExistente) {
      return res.status(404).json({ erro: 'Mecânico não encontrado' });
    }

    // Verificar se o mecânico tem ordens de serviço ligadas
    const osVinculada = await db('ordem_servico').where({ mecanico_id: id }).first();
    if (osVinculada) {
      return res.status(400).json({
        erro: 'Não é possível deletar mecânico com ordens de serviço vinculadas'
      });
    }

    await db('mecanicos').where({ id }).del();

    res.json({
      sucesso: true,
      mensagem: 'Mecânico deletado com sucesso'
    });

  } catch (erro) {
    console.error('Erro ao deletar mecânico:', erro);
    res.status(500).json({ erro: 'Erro ao deletar mecânico' });
  }
}

/**
 * Buscar serviços (autocomplete)
 * GET /api/servicos/buscar?q=troca
 */
async function buscarServicos(req, res) {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ erro: 'Parâmetro de busca é obrigatório' });
    }

    const servicos = await db('servicos')
      .select('id', 'nome', 'descricao', 'preco_padrao', 'tempo_estimado')
      .andWhere(function () {
        this.where('nome', 'ilike', `%${q}%`)
          .orWhere('descricao', 'ilike', `%${q}%`);
      })
      .orderBy('nome')
      .limit(15);

    res.json({
      sucesso: true,
      total: servicos.length,
      servicos
    });

  } catch (erro) {
    console.error('Erro ao buscar serviços:', erro);
    res.status(500).json({ erro: 'Erro ao buscar serviços' });
  }
}

/**
 * Listar todos os serviços ativos
 * GET /api/servicos
 */
async function listarServicos(req, res) {
  try {
    const servicos = await db('servicos')
      .select('id', 'nome', 'descricao', 'preco_padrao', 'tempo_estimado', 'ativo')
      .orderBy('servicos.id', 'desc');

    res.json({
      sucesso: true,
      total: servicos.length,
      servicos
    });

  } catch (erro) {
    console.error('Erro ao listar serviços:', erro);
    res.status(500).json({ erro: 'Erro ao listar serviços' });
  }
}

/**
 * Buscar serviço por ID
 * GET /api/servicos/:id
 */
async function buscarServicoPorID(req, res) {
  try {
    const { id } = req.params;
    const servico = await db('servicos').where({ id }).first();

    if (!servico) {
      return res.status(404).json({ erro: 'Serviço não encontrado' });
    }

    res.json({
      sucesso: true,
      servico
    });

  } catch (erro) {
    console.error('Erro ao buscar serviço:', erro);
    res.status(500).json({ erro: 'Erro ao buscar serviço' });
  }
}

/**
 * Listar categorias de peças
 * GET /api/categorias
 */
async function listarCategorias(req, res) {
  try {
    const categorias = await db('categorias_pecas').select('id', 'nome', 'descricao').orderBy('nome');

    res.json({
      sucesso: true,
      total: categorias.length,
      categorias
    });

  } catch (erro) {
    console.error('Erro ao listar categorias:', erro);
    res.status(500).json({ erro: 'Erro ao listar categorias' });
  }
}

/**
 * Criar nova categoria de peça
 * POST /api/categorias
 */
async function criarCategoria(req, res) {
  try {
    const { nome, descricao } = req.body;

    // Validações
    if (!nome || nome.trim() === '') {
      return res.status(400).json({ erro: 'Nome da categoria é obrigatório' });
    }

    // Verificar se já existe categoria com mesmo nome
    const categoriaExistente = await db('categorias_pecas')
      .whereRaw('LOWER(nome) = LOWER(?)', [nome.trim()])
      .first();

    if (categoriaExistente) {
      return res.status(400).json({ erro: 'Já existe uma categoria com este nome' });
    }

    // Criar categoria
    const [novaCategoria] = await db('categorias_pecas')
      .insert({
        nome: nome.trim(),
        descricao: descricao?.trim() || null
      })
      .returning(['id', 'nome', 'descricao']);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Categoria criada com sucesso',
      categoria: novaCategoria
    });

  } catch (erro) {
    console.error('Erro ao criar categoria:', erro);
    res.status(500).json({ erro: 'Erro ao criar categoria' });
  }
}

/**
 * Dashboard - Estatísticas gerais
 * GET /api/dashboard
 */
async function obterEstatisticas(req, res) {
  try {
    const [
      osPorStatus,
      osMesAtual,
      totalClientes,
      totalVeiculos,
      totalMecanicos,
      pecasEstoqueBaixo,
      mecanicosRanking,
      osAgendadas,
      osEmAndamento,
      osFinalizadas,
      osPagas
    ] = await Promise.all([
      // Total de OS por status
      db('ordem_servico')
        .select('status')
        .count('* as total')
        .sum('valor_total')
        .groupBy('status')
        .then(rows => {
          return rows.map(row => ({
            status: row.status,
            total: row.total,
            valor_total: row.sum || row.valor_total || 0
          }));
        }),

      // OS do mês atual
      db('ordem_servico')
        .whereRaw('EXTRACT(MONTH FROM data_abertura) = EXTRACT(MONTH FROM CURRENT_DATE)')
        .andWhereRaw('EXTRACT(YEAR FROM data_abertura) = EXTRACT(YEAR FROM CURRENT_DATE)')
        .count('* as total')
        .sum('valor_total')
        .first()
        .then(row => ({
          total: row.total,
          faturamento: row.sum || 0
        })),

      // Total de clientes
      db('clientes').count('* as total').first(),

      // Total de veículos
      db('veiculos').count('* as total').first(),

      // Total de mecânicos
      db('mecanicos').count('* as total').first().then(row => parseInt(row.total)),

      // Peças com estoque baixo
      db('pecas').whereRaw('quantidade_estoque <= estoque_minimo').count('* as total').first(),

      // OS por mecânico (top 5)
      db('mecanicos as m')
        .leftJoin('ordem_servico as os', 'm.id', 'os.mecanico_id')
        .select('m.nome')
        .count('os.id as total_os')
        .sum('os.valor_total')
        .groupBy('m.id', 'm.nome')
        .orderBy('total_os', 'desc')
        .limit(5)
        .then(rows => rows.map(row => ({
          nome: row.nome,
          total_os: row.total_os,
          valor_total: row.sum || 0
        }))),

      // OS Agendadas
      db('ordem_servico')
        .where({ status: 'Agendamento' })
        .count('* as total')
        .first()
        .then(row => parseInt(row.total)),

      // OS Em Andamento
      db('ordem_servico')
        .where({ status: 'Em Andamento' })
        .count('* as total')
        .first()
        .then(row => parseInt(row.total)),

      // OS Finalizadas
      db('ordem_servico')
        .where({ status: 'Finalizada' })
        .count('* as total')
        .first()
        .then(row => parseInt(row.total)),

      // OS Pagas
      db('ordem_servico')
        .where({ status: 'Pago' })
        .count('* as total')
        .first()
        .then(row => parseInt(row.total)),

      // Top 5 Serviços Mais Pedidos
      db('os_servicos')
        .join('servicos', 'os_servicos.servico_id', 'servicos.id')
        .select('servicos.nome')
        .count('os_servicos.id as total')
        .groupBy('servicos.id', 'servicos.nome')
        .orderBy('total', 'desc')
        .limit(5)
        .then(rows => rows.map(row => ({
          nome: row.nome,
          total: parseInt(row.total)
        }))),

      // Top 5 Peças Mais Utilizadas
      db('os_pecas')
        .join('pecas', 'os_pecas.peca_id', 'pecas.id')
        .select('pecas.nome')
        .sum('os_pecas.quantidade as total')
        .groupBy('pecas.id', 'pecas.nome')
        .orderBy('total', 'desc')
        .limit(5)
        .then(rows => rows.map(row => ({
          nome: row.nome,
          total: parseInt(row.total)
        })))
    ]);

    res.json({
      sucesso: true,
      estatisticas: {
        os_por_status: osPorStatus,
        os_mes_atual: osMesAtual,
        total_clientes: parseInt(totalClientes.total),
        total_veiculos: parseInt(totalVeiculos.total),
        total_mecanicos: totalMecanicos,
        pecas_estoque_baixo: parseInt(pecasEstoqueBaixo.total),
        mecanicos_ranking: mecanicosRanking,
        os_agendadas: osAgendadas,
        os_em_andamento: osEmAndamento,
        os_finalizadas: osFinalizadas,
        os_pagas: osPagas,
        top_servicos: arguments[0][11], // O 12º elemento do Promise.all (índice 11)
        top_pecas: arguments[0][12]     // O 13º elemento do Promise.all (índice 12)
      }
    });

  } catch (erro) {
    console.error('Erro ao obter estatísticas:', erro);
    res.status(500).json({ erro: 'Erro ao obter estatísticas' });
  }
}

/**
 * Buscar mecânicos (autocomplete)
 * GET /api/mecanicos/buscar?q=joao
 */
async function buscarMecanicos(req, res) {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ erro: 'Parâmetro de busca é obrigatório' });
    }

    const mecanicos = await db('mecanicos')
      .select('id', 'nome', 'cpf', 'especialidade', 'telefone', 'email')
      .andWhere(function () {
        this.where('nome', 'ilike', `%${q}%`)
          .orWhere('cpf', 'ilike', `%${q}%`)
          .orWhere('especialidade', 'ilike', `%${q}%`);
      })
      .orderBy('nome')
      .limit(15);

    res.json({
      sucesso: true,
      total: mecanicos.length,
      mecanicos
    });

  } catch (erro) {
    console.error('Erro ao buscar mecânicos:', erro);
    res.status(500).json({ erro: 'Erro ao buscar mecânicos' });
  }
}

export default {
  listarMecanicos,
  buscarMecanicoPorID,
  criarMecanico,
  atualizarMecanico,
  deletarMecanico,
  buscarMecanicos,
  buscarServicos,
  listarServicos,
  buscarServicoPorID,
  criarServico,
  atualizarServico,
  deletarServico,
  listarCategorias,
  criarCategoria,
  obterEstatisticas
};
