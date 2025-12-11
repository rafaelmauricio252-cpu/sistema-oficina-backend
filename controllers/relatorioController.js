// ============================================
// CONTROLLER DE RELATÓRIOS
// ============================================

import db from '../config/db.js';

/**
 * Gerar Relatório de Ordens de Serviço
 * POST /api/relatorios/os
 */
async function gerarRelatorioOS(req, res) {
  try {
    const { campos = [], filtros = {} } = req.body;

    // Validação de campos permitidos
    const camposPermitidos = [
      'numero', 'data_abertura', 'data_fechamento', 'cliente_nome', 'cpf_cnpj',
      'veiculo_placa', 'veiculo_modelo', 'mecanico_nome', 'status',
      'valor_total', 'desconto', 'valor_final', 'forma_pagamento'
    ];

    // Validar campos solicitados
    const camposInvalidos = campos.filter(campo => !camposPermitidos.includes(campo));
    if (camposInvalidos.length > 0) {
      return res.status(400).json({
        erro: `Campos inválidos: ${camposInvalidos.join(', ')}`,
        campos_permitidos: camposPermitidos
      });
    }

    // Se nenhum campo foi especificado, usar todos
    const camposFinais = campos.length > 0 ? campos : camposPermitidos;

    // Validação de filtros de data
    if (filtros.data_inicio && filtros.data_fim) {
      const dataInicio = new Date(filtros.data_inicio);
      const dataFim = new Date(filtros.data_fim);

      if (dataInicio > dataFim) {
        return res.status(400).json({
          erro: 'Data de início não pode ser maior que data de fim'
        });
      }
    }

    // Construir query base
    let query = db('ordem_servico as os')
      .leftJoin('clientes as c', 'os.cliente_id', 'c.id')
      .leftJoin('veiculos as v', 'os.veiculo_id', 'v.id')
      .leftJoin('mecanicos as m', 'os.mecanico_id', 'm.id');

    // Mapear campos solicitados para SELECT
    const selectFields = [];
    const campoMap = {
      'numero': 'os.id as numero',
      'data_abertura': db.raw("TO_CHAR(os.data_abertura, 'DD/MM/YYYY') as data_abertura"),
      'data_fechamento': db.raw("TO_CHAR(os.data_fechamento, 'DD/MM/YYYY') as data_fechamento"),
      'cliente_nome': 'c.nome as cliente_nome',
      'cpf_cnpj': 'c.cpf_cnpj',
      'veiculo_placa': 'v.placa as veiculo_placa',
      'veiculo_modelo': db.raw("CONCAT(v.marca, ' ', v.modelo) as veiculo_modelo"),
      'mecanico_nome': 'm.nome as mecanico_nome',
      'status': 'os.status',
      'valor_total': 'os.valor_total',
      'desconto': 'os.desconto',
      'valor_final': 'os.valor_total as valor_final',
      'forma_pagamento': 'os.forma_pagamento',
      'valor_servicos': db.raw(`(
        SELECT COALESCE(SUM(preco_servico), 0)
        FROM os_servicos
        WHERE os_servicos.os_id = os.id
      ) as valor_servicos`),
      'valor_pecas': db.raw(`(
        SELECT COALESCE(SUM(quantidade * preco_unitario), 0)
        FROM os_pecas
        WHERE os_pecas.os_id = os.id
      ) as valor_pecas`)
    };

    camposFinais.forEach(campo => {
      if (campoMap[campo]) {
        selectFields.push(campoMap[campo]);
      }
    });

    query = query.select(selectFields);

    // Aplicar filtros
    if (filtros.data_inicio && filtros.data_fim) {
      // Adicionar hora para incluir o dia inteiro
      const dataInicioCompleta = `${filtros.data_inicio} 00:00:00`;
      const dataFimCompleta = `${filtros.data_fim} 23:59:59`;
      query = query.whereBetween('os.data_abertura', [dataInicioCompleta, dataFimCompleta]);
    }

    if (filtros.status) {
      query = query.where('os.status', filtros.status);
    }

    if (filtros.mecanico_id) {
      query = query.where('os.mecanico_id', filtros.mecanico_id);
    }

    if (filtros.forma_pagamento) {
      query = query.where('os.forma_pagamento', filtros.forma_pagamento);
    }

    // Busca textual
    if (filtros.busca && filtros.busca.trim() !== '') {
      const busca = filtros.busca.trim();
      query = query.where(function () {
        this.where('c.nome', 'ilike', `%${busca}%`)
          .orWhere('v.placa', 'ilike', `%${busca}%`)
          .orWhere(db.raw("os.id::text"), 'ilike', `%${busca}%`);
      });
    }

    // Ordenar por data de abertura (mais recente primeiro)
    query = query.orderBy('os.data_abertura', 'desc');

    // Executar query principal
    const dados = await query;

    // Calcular totalizadores (usar query separada para garantir precisão)
    let totalizadoresQuery = db('ordem_servico as os')
      .leftJoin('clientes as c', 'os.cliente_id', 'c.id')
      .leftJoin('veiculos as v', 'os.veiculo_id', 'v.id')
      .select(
        db.raw('COUNT(*) as total_registros'),
        db.raw('COALESCE(SUM(os.valor_total), 0) as valor_total'),
        db.raw('COALESCE(SUM(os.desconto), 0) as total_descontos'),
        db.raw('COALESCE(SUM(os.valor_total), 0) as total_valor_final'),
        db.raw(`COALESCE(SUM((
          SELECT COALESCE(SUM(preco_servico), 0)
          FROM os_servicos
          WHERE os_servicos.os_id = os.id
        )), 0) as total_valor_servicos`),
        db.raw(`COALESCE(SUM((
          SELECT COALESCE(SUM(quantidade * preco_unitario), 0)
          FROM os_pecas
          WHERE os_pecas.os_id = os.id
        )), 0) as total_valor_pecas`)
      );

    // Aplicar os mesmos filtros aos totalizadores
    if (filtros.data_inicio && filtros.data_fim) {
      const dataInicioCompleta = `${filtros.data_inicio} 00:00:00`;
      const dataFimCompleta = `${filtros.data_fim} 23:59:59`;
      totalizadoresQuery = totalizadoresQuery.whereBetween('os.data_abertura', [dataInicioCompleta, dataFimCompleta]);
    }

    if (filtros.status) {
      totalizadoresQuery = totalizadoresQuery.where('os.status', filtros.status);
    }

    if (filtros.mecanico_id) {
      totalizadoresQuery = totalizadoresQuery.where('os.mecanico_id', filtros.mecanico_id);
    }

    if (filtros.forma_pagamento) {
      totalizadoresQuery = totalizadoresQuery.where('os.forma_pagamento', filtros.forma_pagamento);
    }

    if (filtros.busca && filtros.busca.trim() !== '') {
      const busca = filtros.busca.trim();
      totalizadoresQuery = totalizadoresQuery.where(function () {
        this.where('c.nome', 'ilike', `%${busca}%`)
          .orWhere('v.placa', 'ilike', `%${busca}%`)
          .orWhere(db.raw("os.id::text"), 'ilike', `%${busca}%`);
      });
    }

    const totalizadoresResult = await totalizadoresQuery.first();

    const totalizadores = {
      total_registros: parseInt(totalizadoresResult?.total_registros) || 0,
      total_valor_servicos: parseFloat(totalizadoresResult?.total_valor_servicos) || 0,
      total_valor_pecas: parseFloat(totalizadoresResult?.total_valor_pecas) || 0,
      total_valor_final: parseFloat(totalizadoresResult?.total_valor_final) || 0
    };

    res.json({
      sucesso: true,
      dados: dados.map(row => ({
        ...row,
        valor_total: row.valor_total ? parseFloat(row.valor_total) : null,
        desconto: row.desconto ? parseFloat(row.desconto) : null,
        valor_final: row.valor_final ? parseFloat(row.valor_final) : null
      })),
      totalizadores
    });

  } catch (erro) {
    console.error('Erro ao gerar relatório de OS:', erro);
    res.status(500).json({ erro: 'Erro ao gerar relatório de ordens de serviço' });
  }
}

/**
 * Gerar Relatório Financeiro
 * POST /api/relatorios/financeiro
 */
async function gerarRelatorioFinanceiro(req, res) {
  try {
    const { campos = [], filtros = {} } = req.body;

    // Validação de campos permitidos
    const camposPermitidos = [
      'numero', 'data_abertura', 'data_fechamento', 'cliente_nome', 'cpf_cnpj',
      'veiculo_placa', 'veiculo_modelo', 'mecanico_nome', 'status',
      'valor_total', 'desconto', 'valor_final', 'forma_pagamento',
      'valor_servicos', 'valor_pecas'
    ];

    // Validar campos solicitados
    const camposInvalidos = campos.filter(campo => !camposPermitidos.includes(campo));
    if (camposInvalidos.length > 0) {
      return res.status(400).json({
        erro: `Campos inválidos: ${camposInvalidos.join(', ')}`,
        campos_permitidos: camposPermitidos
      });
    }

    // Se nenhum campo foi especificado, usar todos
    const camposFinais = campos.length > 0 ? campos : camposPermitidos;

    // Validação de filtros de data
    if (filtros.data_inicio && filtros.data_fim) {
      const dataInicio = new Date(filtros.data_inicio);
      const dataFim = new Date(filtros.data_fim);

      if (dataInicio > dataFim) {
        return res.status(400).json({
          erro: 'Data de início não pode ser maior que data de fim'
        });
      }
    }

    // Construir query base com subqueries para valores calculados
    let query = db('ordem_servico as os')
      .leftJoin('clientes as c', 'os.cliente_id', 'c.id')
      .leftJoin('veiculos as v', 'os.veiculo_id', 'v.id')
      .leftJoin('mecanicos as m', 'os.mecanico_id', 'm.id')
      .where('os.status', 'Pago'); // Fixo: apenas OS pagas

    // Mapear campos solicitados para SELECT
    const selectFields = [];
    const campoMap = {
      'numero': 'os.id as numero',
      'data_abertura': db.raw("TO_CHAR(os.data_abertura, 'DD/MM/YYYY') as data_abertura"),
      'data_fechamento': db.raw("TO_CHAR(os.data_fechamento, 'DD/MM/YYYY') as data_fechamento"),
      'cliente_nome': 'c.nome as cliente_nome',
      'cpf_cnpj': 'c.cpf_cnpj',
      'veiculo_placa': 'v.placa as veiculo_placa',
      'veiculo_modelo': db.raw("CONCAT(v.marca, ' ', v.modelo) as veiculo_modelo"),
      'mecanico_nome': 'm.nome as mecanico_nome',
      'status': 'os.status',
      'valor_total': 'os.valor_total',
      'desconto': 'os.desconto',
      'valor_final': 'os.valor_total as valor_final',
      'forma_pagamento': 'os.forma_pagamento',
      'valor_servicos': db.raw(`(
        SELECT COALESCE(SUM(preco_servico), 0)
        FROM os_servicos
        WHERE os_servicos.os_id = os.id
      ) as valor_servicos`),
      'valor_pecas': db.raw(`(
        SELECT COALESCE(SUM(quantidade * preco_unitario), 0)
        FROM os_pecas
        WHERE os_pecas.os_id = os.id
      ) as valor_pecas`)
    };

    camposFinais.forEach(campo => {
      if (campoMap[campo]) {
        selectFields.push(campoMap[campo]);
      }
    });

    query = query.select(selectFields);

    // Aplicar filtros (usar data_fechamento para relatório financeiro)
    if (filtros.data_inicio && filtros.data_fim) {
      const dataInicioCompleta = `${filtros.data_inicio} 00:00:00`;
      const dataFimCompleta = `${filtros.data_fim} 23:59:59`;
      query = query.whereBetween('os.data_fechamento', [dataInicioCompleta, dataFimCompleta]);
    }

    if (filtros.mecanico_id) {
      query = query.where('os.mecanico_id', filtros.mecanico_id);
    }

    if (filtros.forma_pagamento) {
      query = query.where('os.forma_pagamento', filtros.forma_pagamento);
    }

    // Busca textual
    if (filtros.busca && filtros.busca.trim() !== '') {
      const busca = filtros.busca.trim();
      query = query.where(function () {
        this.where('c.nome', 'ilike', `%${busca}%`)
          .orWhere('v.placa', 'ilike', `%${busca}%`)
          .orWhere(db.raw("os.id::text"), 'ilike', `%${busca}%`);
      });
    }

    // Ordenar por data de fechamento (mais recente primeiro)
    query = query.orderBy('os.data_fechamento', 'desc');

    // Executar query principal
    const dados = await query;

    // Calcular totalizadores com valores agregados
    let totalizadoresQuery = db('ordem_servico as os')
      .leftJoin('clientes as c', 'os.cliente_id', 'c.id')
      .leftJoin('veiculos as v', 'os.veiculo_id', 'v.id')
      .where('os.status', 'Pago')
      .select(
        db.raw('COUNT(*) as total_os'),
        db.raw('COALESCE(SUM(os.valor_total), 0) as valor_total'),
        db.raw('COALESCE(SUM(os.desconto), 0) as total_descontos'),
        db.raw('COALESCE(SUM(os.valor_total), 0) as valor_final')
      );

    // Aplicar os mesmos filtros aos totalizadores
    if (filtros.data_inicio && filtros.data_fim) {
      const dataInicioCompleta = `${filtros.data_inicio} 00:00:00`;
      const dataFimCompleta = `${filtros.data_fim} 23:59:59`;
      totalizadoresQuery = totalizadoresQuery.whereBetween('os.data_fechamento', [dataInicioCompleta, dataFimCompleta]);
    }

    if (filtros.mecanico_id) {
      totalizadoresQuery = totalizadoresQuery.where('os.mecanico_id', filtros.mecanico_id);
    }

    if (filtros.forma_pagamento) {
      totalizadoresQuery = totalizadoresQuery.where('os.forma_pagamento', filtros.forma_pagamento);
    }

    if (filtros.busca && filtros.busca.trim() !== '') {
      const busca = filtros.busca.trim();
      totalizadoresQuery = totalizadoresQuery.where(function () {
        this.where('c.nome', 'ilike', `%${busca}%`)
          .orWhere('v.placa', 'ilike', `%${busca}%`)
          .orWhere(db.raw("os.id::text"), 'ilike', `%${busca}%`);
      });
    }

    const totalizadoresResult = await totalizadoresQuery.first();

    // Calcular totais de serviços e peças separadamente
    let totalServicosQuery = db('os_servicos as oss')
      .join('ordem_servico as os', 'oss.os_id', 'os.id')
      .leftJoin('clientes as c', 'os.cliente_id', 'c.id')
      .leftJoin('veiculos as v', 'os.veiculo_id', 'v.id')
      .where('os.status', 'Pago')
      .select(db.raw('SUM(oss.preco_servico) as total'));

    let totalPecasQuery = db('os_pecas as osp')
      .join('ordem_servico as os', 'osp.os_id', 'os.id')
      .leftJoin('clientes as c', 'os.cliente_id', 'c.id')
      .leftJoin('veiculos as v', 'os.veiculo_id', 'v.id')
      .where('os.status', 'Pago')
      .select(db.raw('SUM(osp.quantidade * osp.preco_unitario) as total'));

    // Aplicar filtros aos totais de serviços e peças
    if (filtros.data_inicio && filtros.data_fim) {
      totalServicosQuery = totalServicosQuery.whereBetween('os.data_fechamento', [filtros.data_inicio, filtros.data_fim]);
      totalPecasQuery = totalPecasQuery.whereBetween('os.data_fechamento', [filtros.data_inicio, filtros.data_fim]);
    }

    if (filtros.mecanico_id) {
      totalServicosQuery = totalServicosQuery.where('os.mecanico_id', filtros.mecanico_id);
      totalPecasQuery = totalPecasQuery.where('os.mecanico_id', filtros.mecanico_id);
    }

    if (filtros.forma_pagamento) {
      totalServicosQuery = totalServicosQuery.where('os.forma_pagamento', filtros.forma_pagamento);
      totalPecasQuery = totalPecasQuery.where('os.forma_pagamento', filtros.forma_pagamento);
    }

    if (filtros.busca && filtros.busca.trim() !== '') {
      const busca = filtros.busca.trim();
      totalServicosQuery = totalServicosQuery.where(function () {
        this.where('c.nome', 'ilike', `%${busca}%`)
          .orWhere('v.placa', 'ilike', `%${busca}%`)
          .orWhere(db.raw("os.id::text"), 'ilike', `%${busca}%`);
      });
      totalPecasQuery = totalPecasQuery.where(function () {
        this.where('c.nome', 'ilike', `%${busca}%`)
          .orWhere('v.placa', 'ilike', `%${busca}%`)
          .orWhere(db.raw("os.id::text"), 'ilike', `%${busca}%`);
      });
    }

    const [totalServicosResult, totalPecasResult] = await Promise.all([
      totalServicosQuery.first(),
      totalPecasQuery.first()
    ]);

    const totalRegistros = parseInt(totalizadoresResult?.total_os) || 0;
    const receitaLiquida = parseFloat(totalizadoresResult?.valor_final) || 0;
    const totalServicos = parseFloat(totalServicosResult?.total) || 0;
    const totalPecas = parseFloat(totalPecasResult?.total) || 0;

    const totalizadores = {
      total_registros: totalRegistros,
      total_valor_servicos: totalServicos,
      total_valor_pecas: totalPecas,
      total_valor_final: receitaLiquida
    };

    res.json({
      sucesso: true,
      dados: dados.map(row => ({
        ...row,
        valor_total: row.valor_total ? parseFloat(row.valor_total) : null,
        desconto: row.desconto ? parseFloat(row.desconto) : null,
        valor_final: row.valor_final ? parseFloat(row.valor_final) : null,
        valor_servicos: row.valor_servicos ? parseFloat(row.valor_servicos) : null,
        valor_pecas: row.valor_pecas ? parseFloat(row.valor_pecas) : null
      })),
      totalizadores
    });

  } catch (erro) {
    console.error('Erro ao gerar relatório financeiro:', erro);
    res.status(500).json({ erro: 'Erro ao gerar relatório financeiro' });
  }
}

/**
 * Gerar Relatório de Estoque
 * POST /api/relatorios/estoque
 */
async function gerarRelatorioEstoque(req, res) {
  try {
    const { campos = [], filtros = {} } = req.body;

    // Validação de campos permitidos
    const camposPermitidos = [
      'codigo', 'nome', 'categoria', 'descricao', 'quantidade_estoque', 'estoque_minimo',
      'preco_custo', 'preco_venda', 'valor_total_custo', 'valor_total_venda',
      'margem_lucro', 'status_estoque', 'localizacao_estoque', 'fornecedor'
    ];

    // Validar campos solicitados
    const camposInvalidos = campos.filter(campo => !camposPermitidos.includes(campo));
    if (camposInvalidos.length > 0) {
      return res.status(400).json({
        erro: `Campos inválidos: ${camposInvalidos.join(', ')}`,
        campos_permitidos: camposPermitidos
      });
    }

    // Se nenhum campo foi especificado, usar todos
    const camposFinais = campos.length > 0 ? campos : camposPermitidos;

    // Construir query base
    let query = db('pecas as p')
      .leftJoin('categorias_pecas as cat', 'p.categoria_id', 'cat.id');

    // Mapear campos solicitados para SELECT
    const selectFields = [];
    const campoMap = {
      'codigo': 'p.numero_peca as codigo',
      'nome': 'p.nome',
      'categoria': 'cat.nome as categoria',
      'descricao': 'p.descricao',
      'quantidade_estoque': 'p.quantidade_estoque',
      'estoque_minimo': 'p.estoque_minimo',
      'preco_custo': 'p.preco_custo',
      'preco_venda': 'p.preco_venda',
      'valor_total_custo': db.raw('(p.quantidade_estoque * p.preco_custo) as valor_total_custo'),
      'valor_total_venda': db.raw('(p.quantidade_estoque * p.preco_venda) as valor_total_venda'),
      'margem_lucro': db.raw(`
        CASE
          WHEN p.preco_custo > 0 THEN
            ((p.preco_venda - p.preco_custo) / p.preco_custo) * 100
          ELSE 0
        END as margem_lucro
      `),
      'status_estoque': db.raw(`
        CASE
          WHEN p.quantidade_estoque = 0 THEN 'Crítico'
          WHEN p.quantidade_estoque <= p.estoque_minimo THEN 'Baixo'
          ELSE 'Normal'
        END as status_estoque
      `),
      'localizacao_estoque': 'p.localizacao_estoque',
      'fornecedor': 'p.fornecedor'
    };

    camposFinais.forEach(campo => {
      if (campoMap[campo]) {
        selectFields.push(campoMap[campo]);
      }
    });

    query = query.select(selectFields);

    // Aplicar filtros
    if (filtros.situacao) {
      if (filtros.situacao === 'baixo') {
        query = query.whereRaw('p.quantidade_estoque <= p.estoque_minimo');
      } else if (filtros.situacao === 'critico') {
        query = query.where('p.quantidade_estoque', 0);
      }
      // Se for 'todos', não aplica filtro de situação
    }

    // Busca textual
    if (filtros.busca && filtros.busca.trim() !== '') {
      const busca = filtros.busca.trim();
      query = query.where(function () {
        this.where('p.numero_peca', 'ilike', `%${busca}%`)
          .orWhere('p.nome', 'ilike', `%${busca}%`);
      });
    }

    // Ordenar por nome
    query = query.orderBy('p.nome', 'asc');

    // Executar query principal
    const dados = await query;

    // Calcular totalizadores
    let totalizadoresQuery = db('pecas')
      .select(
        db.raw('COUNT(*) as total_pecas'),
        db.raw('COALESCE(SUM(quantidade_estoque), 0) as quantidade_total'),
        db.raw('COALESCE(SUM(quantidade_estoque * preco_custo), 0) as valor_total_custo'),
        db.raw('COALESCE(SUM(quantidade_estoque * preco_venda), 0) as valor_total_venda'),
        db.raw('COUNT(CASE WHEN quantidade_estoque <= estoque_minimo THEN 1 END) as pecas_estoque_baixo')
      );

    // Aplicar filtros aos totalizadores
    if (filtros.situacao === 'baixo') {
      totalizadoresQuery = totalizadoresQuery.whereRaw('quantidade_estoque <= estoque_minimo');
    } else if (filtros.situacao === 'critico') {
      totalizadoresQuery = totalizadoresQuery.where('quantidade_estoque', 0);
    }

    if (filtros.busca && filtros.busca.trim() !== '') {
      const busca = filtros.busca.trim();
      totalizadoresQuery = totalizadoresQuery.where(function () {
        this.where('numero_peca', 'ilike', `%${busca}%`)
          .orWhere('nome', 'ilike', `%${busca}%`);
      });
    }

    const totalizadoresResult = await totalizadoresQuery.first();

    const valorTotalCusto = parseFloat(totalizadoresResult?.valor_total_custo) || 0;
    const valorTotalVenda = parseFloat(totalizadoresResult?.valor_total_venda) || 0;

    const totalizadores = {
      total_itens: parseInt(totalizadoresResult?.total_pecas) || 0,
      valor_total_custo: valorTotalCusto,
      valor_total_venda: valorTotalVenda
    };

    res.json({
      sucesso: true,
      dados: dados.map(row => ({
        ...row,
        preco_custo: row.preco_custo ? parseFloat(row.preco_custo) : null,
        preco_venda: row.preco_venda ? parseFloat(row.preco_venda) : null,
        valor_total_custo: row.valor_total_custo ? parseFloat(row.valor_total_custo) : null,
        valor_total_venda: row.valor_total_venda ? parseFloat(row.valor_total_venda) : null,
        margem_lucro: row.margem_lucro ? parseFloat(row.margem_lucro) : null
      })),
      totalizadores
    });

  } catch (erro) {
    console.error('Erro ao gerar relatório de estoque:', erro);
    res.status(500).json({ erro: 'Erro ao gerar relatório de estoque' });
  }
}

export default {
  gerarRelatorioOS,
  gerarRelatorioFinanceiro,
  gerarRelatorioEstoque
};
