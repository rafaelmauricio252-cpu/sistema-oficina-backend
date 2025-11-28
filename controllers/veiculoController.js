// ============================================
// CONTROLLER DE VEÍCULOS (Refatorado com Knex.js)
// ============================================

import db from '../config/db.js';
import { removerFormatacao, limparPlaca } from '../utils/formatadores.js';

/**
 * Listar veículos do cliente
 * GET /api/veiculos?cliente_id=123
 */
async function listarVeiculosDoCliente(req, res) {
  try {
    const { cliente_id } = req.query;

    if (!cliente_id) {
      return res.status(400).json({ erro: 'ID do cliente é obrigatório' });
    }

    const veiculos = await db('veiculos as v')
      .leftJoin('clientes as c', 'v.cliente_id', 'c.id')
      .select('v.*', 'c.nome as nome_cliente')
      .where('v.cliente_id', cliente_id)
      .orderBy('v.criado_em', 'desc');

    res.json({
      sucesso: true,
      total: veiculos.length,
      veiculos: veiculos
    });

  } catch (erro) {
    console.error('Erro ao listar veículos:', erro);
    res.status(500).json({ erro: 'Erro ao listar veículos' });
  }
}

/**
 * Cadastrar veículo rápido
 * POST /api/veiculos/rapido
 */
async function cadastrarVeiculoRapido(req, res) {
  try {
    const { cliente_id, placa, marca, modelo, ano, cor, km, chassi } = req.body;
    console.log('🚗 Backend recebeu - chassi:', chassi, 'km:', km);
    const placaLimpa = limparPlaca(placa);

    // Verificar se placa já existe
    const veiculoExistente = await db('veiculos').where({ placa: placaLimpa }).first();

    if (veiculoExistente) {
      return res.status(400).json({
        erro: 'Placa já cadastrada',
        veiculo_existente: veiculoExistente
      });
    }

    // Inserir veículo
    const novoVeiculo = {
      cliente_id,
      placa: placaLimpa,
      marca: marca.toUpperCase(),
      modelo,
      ano: ano || null,
      cor: cor || null,
      km: km || null,
      chassi: chassi || null
    };

    console.log('🔍 Objeto sendo inserido no banco:', JSON.stringify(novoVeiculo, null, 2));
    const [veiculoCadastrado] = await db('veiculos').insert(novoVeiculo).returning('*');
    console.log('✅ Veículo cadastrado retornado do banco:', JSON.stringify(veiculoCadastrado, null, 2));

    res.status(201).json({
      sucesso: true,
      mensagem: 'Veículo cadastrado com sucesso',
      veiculo: veiculoCadastrado
    });

  } catch (erro) {
    console.error('Erro ao cadastrar veículo:', erro);

    if (erro.code === '23503') { // Erro de FK (cliente não existe)
      return res.status(400).json({ erro: 'Cliente não encontrado' });
    }
    if (erro.code === '23505') { // Erro de violação de unique constraint (placa duplicada)
      return res.status(400).json({ erro: 'Placa já cadastrada' });
    }

    res.status(500).json({ erro: 'Erro ao cadastrar veículo' });
  }
}

/**
 * Buscar veículo por ID
 * GET /api/veiculos/:id
 */
async function buscarVeiculoPorID(req, res) {
  try {
    const { id } = req.params;

    const veiculo = await db('veiculos as v')
      .leftJoin('clientes as c', 'v.cliente_id', 'c.id')
      .select('v.*', 'c.nome as nome_cliente', 'c.telefone as telefone_cliente')
      .where('v.id', id)
      .first();

    if (!veiculo) {
      return res.status(404).json({ erro: 'Veículo não encontrado' });
    }

    res.json({
      sucesso: true,
      veiculo: veiculo
    });

  } catch (erro) {
    console.error('Erro ao buscar veículo:', erro);
    res.status(500).json({ erro: 'Erro ao buscar veículo' });
  }
}

/**
 * Buscar histórico de OS do veículo
 * GET /api/veiculos/:id/historico
 */
async function buscarHistoricoVeiculo(req, res) {
  try {
    const { id } = req.params;

    // Verificar se veículo existe
    const veiculo = await db('veiculos').where({ id }).first();
    if (!veiculo) {
      return res.status(404).json({ erro: 'Veículo não encontrado' });
    }

    // Buscar histórico de OS
    const historico = await db('ordem_servico as os')
      .leftJoin('mecanicos as m', 'os.mecanico_id', 'm.id')
      .select(
        'os.id',
        'os.data_abertura',
        'os.data_fechamento as data_conclusao', // Renomeado para manter consistência
        'os.status',
        'os.valor_total',
        'os.observacoes as descricao_problema', // Renomeado para manter consistência
        'm.nome as mecanico'
      )
      .where('os.veiculo_id', id)
      .orderBy('os.data_abertura', 'desc');

    // Calcular estatísticas
    const totalOS = historico.length;
    const valorTotal = historico.reduce((sum, os) => sum + parseFloat(os.valor_total || 0), 0);

    res.json({
      sucesso: true,
      total_os: totalOS,
      valor_total_gasto: valorTotal.toFixed(2),
      historico: historico
    });

  } catch (erro) {
    console.error('Erro ao buscar histórico:', erro);
    res.status(500).json({ erro: 'Erro ao buscar histórico' });
  }
}

/**
 * Atualizar veículo
 * PUT /api/veiculos/:id
 */
async function atualizarVeiculo(req, res) {
  try {
    const { id } = req.params;
    const { placa, marca, modelo, ano, cor, km, chassi } = req.body;

    // Verificar se veículo existe
    const veiculoExistente = await db('veiculos').where({ id }).first();
    if (!veiculoExistente) {
      return res.status(404).json({ erro: 'Veículo não encontrado' });
    }

    // ============================================
    // PROTEÇÃO: Verificar se veículo tem OS
    // ============================================
    const temOS = await db('ordem_servico').where({ veiculo_id: id }).first();

    if (temOS) {
      // Se tem OS, não pode alterar campos críticos (para nota fiscal)
      const camposProtegidos = [];

      if (placa && limparPlaca(placa) !== veiculoExistente.placa) {
        camposProtegidos.push('placa');
      }
      if (marca && marca.toUpperCase() !== veiculoExistente.marca) {
        camposProtegidos.push('marca');
      }
      if (modelo && modelo !== veiculoExistente.modelo) {
        camposProtegidos.push('modelo');
      }
      if (ano && parseInt(ano) !== parseInt(veiculoExistente.ano)) {
        camposProtegidos.push('ano');
      }

      if (camposProtegidos.length > 0) {
        return res.status(400).json({
          erro: `Não é possível alterar ${camposProtegidos.join(', ')} de veículo com ordens de serviço cadastradas`,
          campos_protegidos: camposProtegidos,
          motivo: 'Integridade de dados para emissão de nota fiscal'
        });
      }
    }

    const placaLimpa = limparPlaca(placa);

    // Verificar se placa já existe em outro veículo
    const outroVeiculoComPlaca = await db('veiculos')
      .where('placa', placaLimpa)
      .andWhereNot('id', id)
      .first();

    if (outroVeiculoComPlaca) {
      return res.status(400).json({ erro: 'Placa já cadastrada para outro veículo' });
    }

    // Atualizar veículo (apenas campos permitidos)
    const dadosAtualizados = {
      placa: placaLimpa,
      marca: marca.toUpperCase(),
      modelo,
      ano: ano || null,
      cor: cor || null,
      km: km || null,
      chassi: chassi || null,
      atualizado_em: db.fn.now()
    };

    const [veiculoAtualizado] = await db('veiculos')
      .where({ id })
      .update(dadosAtualizados)
      .returning('*');

    res.json({
      sucesso: true,
      mensagem: 'Veículo atualizado com sucesso',
      veiculo: veiculoAtualizado
    });

  } catch (erro) {
    console.error('Erro ao atualizar veículo:', erro);
    if (erro.code === '23505') { // Erro de violação de unique constraint (placa duplicada)
      return res.status(400).json({ erro: 'Placa já cadastrada para outro veículo' });
    }

    res.status(500).json({ erro: 'Erro ao atualizar veículo' });
  }
}

/**
 * Deletar veículo
 * DELETE /api/veiculos/:id
 */
async function deletarVeiculo(req, res) {
  try {
    const { id } = req.params;

    // Verificar se veículo tem OS
    const os = await db('ordem_servico').where({ veiculo_id: id }).first();

    if (os) {
      return res.status(400).json({
        erro: 'Não é possível deletar veículo com ordens de serviço cadastradas'
      });
    }

    // Deletar veículo
    const [veiculoDeletado] = await db('veiculos')
      .where({ id })
      .del()
      .returning(['id', 'placa', 'modelo']);

    if (!veiculoDeletado) {
      return res.status(404).json({ erro: 'Veículo não encontrado' });
    }

    res.json({
      sucesso: true,
      mensagem: 'Veículo deletado com sucesso',
      veiculo_deletado: veiculoDeletado
    });

  } catch (erro) {
    console.error('Erro ao deletar veículo:', erro);
    res.status(500).json({ erro: 'Erro ao deletar veículo' });
  }
}

/**
 * Buscar veículos (autocomplete por placa)
 * GET /api/veiculos/buscar?q=ABC
 */
async function buscarVeiculos(req, res) {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ erro: 'Parâmetro de busca é obrigatório' });
    }

    const placaLimpa = limparPlaca(q);

    const veiculos = await db('veiculos as v')
      .leftJoin('clientes as c', 'v.cliente_id', 'c.id')
      .select('v.*', 'c.nome as nome_cliente')
      .where('v.placa', 'like', `%${placaLimpa}%`)
      .orWhere('v.modelo', 'ilike', `%${q}%`)
      .orWhere('v.marca', 'ilike', `%${q}%`)
      .orderBy('v.placa')
      .limit(10);

    res.json({
      sucesso: true,
      total: veiculos.length,
      veiculos: veiculos
    });

  } catch (erro) {
    console.error('Erro ao buscar veículos:', erro);
    res.status(500).json({ erro: 'Erro ao buscar veículos' });
  }
}

/**
 * Listar todos os veículos
 * GET /api/veiculos
 */
async function listarTodosVeiculos(req, res) {
  try {
    const veiculos = await db('veiculos as v')
      .leftJoin('clientes as c', 'v.cliente_id', 'c.id')
      .select('v.*', 'c.nome as nome_cliente')
      .orderBy('v.criado_em', 'desc');

    res.json({
      sucesso: true,
      total: veiculos.length,
      veiculos: veiculos
    });

  } catch (erro) {
    console.error('Erro ao listar todos os veículos:', erro);
    res.status(500).json({ erro: 'Erro ao listar todos os veículos' });
  }
}

/**
 * Verificar se veículo tem ordens de serviço
 * GET /api/veiculos/:id/tem-os
 */
async function verificarVeiculoTemOS(req, res) {
  try {
    const { id } = req.params;

    // Verificar se veículo existe
    const veiculo = await db('veiculos').where({ id }).first();
    if (!veiculo) {
      return res.status(404).json({ erro: 'Veículo não encontrado' });
    }

    // Verificar se tem OS
    const temOS = await db('ordem_servico').where({ veiculo_id: id }).first();

    res.json({
      sucesso: true,
      tem_os: !!temOS,
      campos_protegidos: temOS ? ['placa', 'marca', 'modelo', 'ano'] : []
    });

  } catch (erro) {
    console.error('Erro ao verificar OS do veículo:', erro);
    res.status(500).json({ erro: 'Erro ao verificar ordens de serviço' });
  }
}

export default {
  listarVeiculosDoCliente,
  cadastrarVeiculoRapido,
  buscarVeiculoPorID,
  buscarHistoricoVeiculo,
  atualizarVeiculo,
  deletarVeiculo,
  buscarVeiculos,
  listarTodosVeiculos,
  verificarVeiculoTemOS
};
