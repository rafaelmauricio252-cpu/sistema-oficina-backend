// ============================================
// CONTROLLER DE ESTOQUE (Refatorado com Knex.js)
// ============================================

const db = require('../config/db');

/**
 * Criar uma nova peça
 * POST /api/pecas
 */
async function criarPeca(req, res) {
  try {
    const { nome, numero_peca, descricao, categoria_id, preco_custo, preco_venda, quantidade_estoque, estoque_minimo } = req.body;

    // Validação básica
    if (!nome || !numero_peca || preco_custo === undefined || preco_venda === undefined || quantidade_estoque === undefined || estoque_minimo === undefined) {
      return res.status(400).json({ erro: 'Campos obrigatórios faltando: nome, numero_peca, preco_custo, preco_venda, quantidade_estoque, estoque_minimo' });
    }
    if (isNaN(preco_custo) || preco_custo < 0 || isNaN(preco_venda) || preco_venda < 0) {
      return res.status(400).json({ erro: 'Preço de custo e preço de venda devem ser números não negativos' });
    }
    if (isNaN(quantidade_estoque) || quantidade_estoque < 0 || isNaN(estoque_minimo) || estoque_minimo < 0) {
      return res.status(400).json({ erro: 'Quantidade em estoque e estoque mínimo devem ser números não negativos' });
    }

    // Verificar unicidade de nome e numero_peca
    const nomeExistente = await db('pecas').where({ nome }).first();
    if (nomeExistente) {
      return res.status(400).json({ erro: 'Nome da peça já cadastrado' });
    }
    const numeroPecaExistente = await db('pecas').where({ numero_peca }).first();
    if (numeroPecaExistente) {
      return res.status(400).json({ erro: 'Número da peça já cadastrado' });
    }

    // Validar categoria_id se fornecido
    if (categoria_id) {
      const categoriaExistente = await db('categorias_pecas').where({ id: categoria_id }).first();
      if (!categoriaExistente) {
        return res.status(400).json({ erro: 'Categoria não encontrada' });
      }
    }

    const [novaPeca] = await db('pecas').insert({
      nome,
      numero_peca,
      descricao: descricao || null,
      categoria_id: categoria_id || null,
      preco_custo,
      preco_venda,
      quantidade_estoque,
      estoque_minimo,
      criado_em: db.fn.now(),
      atualizado_em: db.fn.now()
    }).returning('*');

    res.status(201).json({
      sucesso: true,
      mensagem: 'Peça criada com sucesso',
      peca: novaPeca
    });

  } catch (erro) {
    console.error('Erro ao criar peça:', erro);
    res.status(500).json({ erro: 'Erro ao criar peça' });
  }
}

/**
 * Atualizar uma peça existente
 * PUT /api/pecas/:id
 */
async function atualizarPeca(req, res) {
  try {
    const { id } = req.params;
    const { nome, numero_peca, descricao, categoria_id, preco_custo, preco_venda, quantidade_estoque, estoque_minimo } = req.body;

    // Verificar se a peça existe
    const pecaExistente = await db('pecas').where({ id }).first();
    if (!pecaExistente) {
      return res.status(404).json({ erro: 'Peça não encontrada' });
    }

    // Construir objeto de atualização
    const dadosParaAtualizar = { atualizado_em: db.fn.now() };
    if (nome !== undefined) dadosParaAtualizar.nome = nome;
    if (numero_peca !== undefined) dadosParaAtualizar.numero_peca = numero_peca;
    if (descricao !== undefined) dadosParaAtualizar.descricao = descricao;
    if (categoria_id !== undefined) {
      if (categoria_id !== null) { // Permite definir categoria_id como null
        const categoriaExiste = await db('categorias_pecas').where({ id: categoria_id }).first();
        if (!categoriaExiste) {
          return res.status(400).json({ erro: 'Categoria não encontrada' });
        }
      }
      dadosParaAtualizar.categoria_id = categoria_id;
    }
    if (preco_custo !== undefined) {
      if (isNaN(preco_custo) || preco_custo < 0) return res.status(400).json({ erro: 'Preço de custo deve ser um número não negativo' });
      dadosParaAtualizar.preco_custo = preco_custo;
    }
    if (preco_venda !== undefined) {
      if (isNaN(preco_venda) || preco_venda < 0) return res.status(400).json({ erro: 'Preço de venda deve ser um número não negativo' });
      dadosParaAtualizar.preco_venda = preco_venda;
    }
    if (quantidade_estoque !== undefined) {
      if (isNaN(quantidade_estoque) || quantidade_estoque < 0) return res.status(400).json({ erro: 'Quantidade em estoque deve ser um número não negativo' });
      dadosParaAtualizar.quantidade_estoque = quantidade_estoque;
    }
    if (estoque_minimo !== undefined) {
      if (isNaN(estoque_minimo) || estoque_minimo < 0) return res.status(400).json({ erro: 'Estoque mínimo deve ser um número não negativo' });
      dadosParaAtualizar.estoque_minimo = estoque_minimo;
    }

    // Validação de duplicidade para nome e numero_peca (excluindo a própria peça)
    if (nome) {
      const nomeDuplicado = await db('pecas').where({ nome }).whereNot({ id }).first();
      if (nomeDuplicado) {
        return res.status(400).json({ erro: 'Nome da peça já cadastrado para outra peça' });
      }
    }
    if (numero_peca) {
      const numeroPecaDuplicado = await db('pecas').where({ numero_peca }).whereNot({ id }).first();
      if (numeroPecaDuplicado) {
        return res.status(400).json({ erro: 'Número da peça já cadastrado para outra peça' });
      }
    }

    // Se nenhum dado foi fornecido para atualização
    if (Object.keys(dadosParaAtualizar).length === 1 && dadosParaAtualizar.atualizado_em) {
      return res.status(400).json({ erro: 'Nenhum dado fornecido para atualização' });
    }

    const [pecaAtualizada] = await db('pecas').where({ id }).update(dadosParaAtualizar).returning('*');

    res.json({
      sucesso: true,
      mensagem: 'Peça atualizada com sucesso',
      peca: pecaAtualizada
    });

  } catch (erro) {
    console.error('Erro ao atualizar peça:', erro);
    res.status(500).json({ erro: 'Erro ao atualizar peça' });
  }
}

/**
 * Buscar peças (autocomplete)
 * GET /api/pecas/buscar?q=filtro
 */
async function buscarPecas(req, res) {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ erro: 'Parâmetro de busca é obrigatório' });
    }
    
    const pecas = await db('pecas as p')
      .leftJoin('categorias_pecas as c', 'p.categoria_id', 'c.id')
      .select(
        'p.id', 'p.nome', 'p.numero_peca as codigo', 'p.preco_venda',
        'p.quantidade_estoque', 'p.estoque_minimo', 'c.nome as categoria'
      )
      .where('p.nome', 'ilike', `%${q}%`)
      .orWhere('p.numero_peca', 'ilike', `%${q}%`)
      .orderBy('p.nome')
      .limit(15);
    
    const pecasComStatus = pecas.map(peca => ({
      ...peca,
      estoque_baixo: peca.quantidade_estoque <= peca.estoque_minimo,
      estoque_disponivel: peca.quantidade_estoque > 0
    }));
    
    res.json({
      sucesso: true,
      total: pecasComStatus.length,
      pecas: pecasComStatus
    });
    
  } catch (erro) {
    console.error('Erro ao buscar peças:', erro);
    res.status(500).json({ erro: 'Erro ao buscar peças' });
  }
}

/**
 * Validar disponibilidade de estoque
 * GET /api/estoque/validar?peca_id=5&quantidade=2
 */
async function validarEstoque(req, res) {
  try {
    const { peca_id, quantidade } = req.query;
    
    if (!peca_id) return res.status(400).json({ erro: 'ID da peça é obrigatório' });
    if (!quantidade || quantidade <= 0) return res.status(400).json({ erro: 'Quantidade deve ser maior que 0' });
    
    const peca = await db('pecas')
      .select('id', 'nome', 'quantidade_estoque', 'estoque_minimo', 'preco_venda')
      .where({ id: peca_id })
      .first();
    
    if (!peca) {
      return res.status(404).json({ disponivel: false, erro: 'Peça não encontrada' });
    }
    
    const quantidadeSolicitada = parseInt(quantidade);
    const estoqueDisponivel = peca.quantidade_estoque >= quantidadeSolicitada;
    
    res.json({
      sucesso: true,
      disponivel: estoqueDisponivel,
      peca: {
        id: peca.id,
        nome: peca.nome,
        quantidade_solicitada: quantidadeSolicitada,
        quantidade_disponivel: peca.quantidade_estoque,
        estoque_baixo: peca.quantidade_estoque <= peca.estoque_minimo,
        preco_unitario: peca.preco_venda
      },
      mensagem: estoqueDisponivel 
        ? 'Estoque disponível' 
        : `Estoque insuficiente. Disponível: ${peca.quantidade_estoque}, Solicitado: ${quantidadeSolicitada}`
    });
    
  } catch (erro) {
    console.error('Erro ao validar estoque:', erro);
    res.status(500).json({ erro: 'Erro ao validar estoque' });
  }
}

/**
 * Buscar peças com estoque baixo
 * GET /api/estoque/baixo
 */
async function buscarEstoqueBaixo(req, res) {
  try {
    const pecas = await db('pecas as p')
      .leftJoin('categorias_pecas as c', 'p.categoria_id', 'c.id')
      .select(
        'p.id', 'p.nome', 'p.numero_peca as codigo', 'p.quantidade_estoque',
        'p.estoque_minimo', 'p.preco_venda', 'c.nome as categoria'
      )
      .whereRaw('p.quantidade_estoque <= p.estoque_minimo')
      .orderBy('p.quantidade_estoque', 'asc')
      .orderBy('p.nome', 'asc');
    
    const pecasClassificadas = pecas.map(peca => ({
      ...peca,
      critico: peca.quantidade_estoque === 0,
      diferenca: peca.estoque_minimo - peca.quantidade_estoque
    }));
    
    res.json({
      sucesso: true,
      total: pecasClassificadas.length,
      pecas: pecasClassificadas
    });
    
  } catch (erro) {
    console.error('Erro ao buscar estoque baixo:', erro);
    res.status(500).json({ erro: 'Erro ao buscar estoque baixo' });
  }
}

/**
 * Buscar peça por ID com detalhes
 * GET /api/pecas/:id
 */
async function buscarPecaPorID(req, res) {
  try {
    const { id } = req.params;
    
    const peca = await db('pecas as p')
      .leftJoin('categorias_pecas as c', 'p.categoria_id', 'c.id')
      .select('p.*', 'c.nome as categoria')
      .where('p.id', id)
      .first();
    
    if (!peca) {
      return res.status(404).json({ erro: 'Peça não encontrada' });
    }
    
    res.json({
      sucesso: true,
      peca: {
        ...peca,
        estoque_baixo: peca.quantidade_estoque <= peca.estoque_minimo,
        estoque_disponivel: peca.quantidade_estoque > 0
      }
    });
    
  } catch (erro) {
    console.error('Erro ao buscar peça:', erro);
    res.status(500).json({ erro: 'Erro ao buscar peça' });
  }
}

/**
 * Listar todas as peças (com paginação)
 * GET /api/pecas?pagina=1&limite=20
 */
async function listarPecas(req, res) {
  try {
    const { pagina = 1, limite = 20 } = req.query;
    const offset = (pagina - 1) * limite;

    const query = db('pecas as p').leftJoin('categorias_pecas as c', 'p.categoria_id', 'c.id');

    const totalResult = await query.clone().count('* as total').first();
    const total = parseInt(totalResult.total);

    const pecas = await query.clone().select('p.*', 'c.nome as categoria')
      .orderBy('p.nome')
      .limit(limite)
      .offset(offset);
    
    const pecasComStatus = pecas.map(peca => ({
      ...peca,
      estoque_baixo: peca.quantidade_estoque <= peca.estoque_minimo,
      estoque_disponivel: peca.quantidade_estoque > 0
    }));
    
    res.json({
      sucesso: true,
      total,
      pagina: parseInt(pagina),
      total_paginas: Math.ceil(total / limite),
      pecas: pecasComStatus
    });
    
  } catch (erro) {
    console.error('Erro ao listar peças:', erro);
    res.status(500).json({ erro: 'Erro ao listar peças' });
  }
}

/**
 * Buscar histórico de movimentação de uma peça
 * GET /api/estoque/:peca_id/historico
 */
async function buscarHistoricoMovimentacao(req, res) {
  try {
    const { peca_id } = req.params;
    
    const historico = await db('estoque_movimentacao as m')
      .leftJoin('pecas as p', 'm.peca_id', 'p.id')
      .leftJoin('ordem_servico as os', 'm.os_id', 'os.id')
      .select('m.*', 'p.nome as nome_peca', 'os.id as numero_os')
      .where('m.peca_id', peca_id)
      .orderBy('m.data_movimentacao', 'desc')
      .limit(50);
    
    res.json({
      sucesso: true,
      total: historico.length,
      historico: historico
    });
    
  } catch (erro) {
    console.error('Erro ao buscar histórico:', erro);
    res.status(500).json({ erro: 'Erro ao buscar histórico de movimentação' });
  }
}

/**
 * Deletar uma peça
 * DELETE /api/pecas/:id
 */
async function deletarPeca(req, res) {
  try {
    const { id } = req.params;

    // Verificar se a peça existe
    const pecaExistente = await db('pecas').where({ id }).first();
    if (!pecaExistente) {
      return res.status(404).json({ erro: 'Peça não encontrada' });
    }

    // Verificar se a peça está vinculada a alguma ordem de serviço
    const osVinculada = await db('os_pecas').where({ peca_id: id }).first();
    if (osVinculada) {
      return res.status(400).json({ erro: 'Não é possível deletar peça vinculada a uma ordem de serviço' });
    }

    await db('pecas').where({ id }).del();

    res.json({
      sucesso: true,
      mensagem: 'Peça deletada com sucesso'
    });

  } catch (erro) {
    console.error('Erro ao deletar peça:', erro);
    res.status(500).json({ erro: 'Erro ao deletar peça' });
  }
}

export {
  buscarPecas,
  validarEstoque,
  buscarEstoqueBaixo,
  buscarPecaPorID,
  listarPecas,
  buscarHistoricoMovimentacao,
  criarPeca,
  atualizarPeca,
  deletarPeca
};
