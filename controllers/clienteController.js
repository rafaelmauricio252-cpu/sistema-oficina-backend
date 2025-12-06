// ============================================
// CONTROLLER DE CLIENTES (Refatorado com Knex.js)
// ============================================

import db from '../config/db.js';
import { removerFormatacao, capitalizarNome } from '../utils/formatadores.js';

/**
 * Buscar clientes (autocomplete)
 * GET /api/clientes/buscar?q=joao
 */
async function buscarClientes(req, res) {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ erro: 'Parâmetro de busca é obrigatório' });
    }

    const documentoLimpo = removerFormatacao(q);

    // Busca clientes por nome, CPF, telefone ou PLACA do veículo
    const queryBuilder = db('clientes')
      .distinct('clientes.id', 'clientes.nome', 'clientes.cpf_cnpj', 'clientes.telefone', 'clientes.email', 'clientes.endereco')
      .leftJoin('veiculos', 'clientes.id', 'veiculos.cliente_id')
      .where(function () {
        this.where('clientes.nome', 'ilike', `%${q}%`)
          .orWhere('veiculos.placa', 'ilike', `%${q}%`); // Busca por placa

        // Só busca por CPF/Telefone se houver números na busca
        if (documentoLimpo.length > 0) {
          this.orWhere('clientes.cpf_cnpj', 'like', `%${documentoLimpo}%`)
            .orWhere('clientes.telefone', 'like', `%${documentoLimpo}%`);
        }
      })
      .orderBy('clientes.nome')
      .limit(10);

    const clientes = await queryBuilder;

    res.json({
      sucesso: true,
      total: clientes.length,
      clientes: clientes
    });

  } catch (erro) {
    console.error('Erro ao buscar clientes:', erro);
    res.status(500).json({ erro: 'Erro ao buscar clientes' });
  }
}

/**
 * Cadastrar cliente rápido (com opção de veículo)
 * POST /api/clientes/rapido
 */
async function cadastrarClienteRapido(req, res) {
  try {
    const { nome, cpf_cnpj, telefone, email, endereco, veiculo } = req.body;
    const documentoLimpo = removerFormatacao(cpf_cnpj);

    // Verificar se CPF/CNPJ já existe
    const clienteExistente = await db('clientes').where({ cpf_cnpj: documentoLimpo }).first();

    if (clienteExistente) {
      return res.status(400).json({
        erro: 'CPF/CNPJ já cadastrado',
        cliente_existente: clienteExistente
      });
    }

    // Se tiver veículo, verificar se placa já existe
    if (veiculo && veiculo.placa) {
      const placaExistente = await db('veiculos').where({ placa: veiculo.placa }).first();
      if (placaExistente) {
        return res.status(400).json({ erro: 'Placa de veículo já cadastrada' });
      }
    }

    // Transação para garantir atomicidade (Cliente + Veículo)
    await db.transaction(async (trx) => {
      // 1. Inserir Cliente
      const novoCliente = {
        nome: capitalizarNome(nome),
        cpf_cnpj: documentoLimpo,
        telefone,
        email: email || null,
        endereco: endereco || null
      };

      const [clienteCadastrado] = await trx('clientes').insert(novoCliente).returning('*');

      // 2. Inserir Veículo (se fornecido)
      let veiculoCadastrado = null;
      if (veiculo && veiculo.placa) {
        const novoVeiculo = {
          placa: veiculo.placa.toUpperCase(),
          modelo: veiculo.modelo,
          marca: veiculo.marca,
          ano: veiculo.ano ? parseInt(veiculo.ano) : null,
          cor: veiculo.cor,
          cliente_id: clienteCadastrado.id
        };
        [veiculoCadastrado] = await trx('veiculos').insert(novoVeiculo).returning('*');
      }

      res.status(201).json({
        sucesso: true,
        mensagem: 'Cliente cadastrado com sucesso',
        cliente: clienteCadastrado,
        veiculo: veiculoCadastrado
      });
    });

  } catch (erro) {
    console.error('Erro ao cadastrar cliente rápido:', erro);
    res.status(500).json({ erro: 'Erro ao cadastrar cliente' });
  }
}

/**
 * Buscar cliente por ID
 * GET /api/clientes/:id
 */
async function buscarClientePorID(req, res) {
  try {
    const { id } = req.params;

    const cliente = await db('clientes').where({ id }).first();

    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }

    res.json({
      sucesso: true,
      cliente: cliente
    });

  } catch (erro) {
    console.error('Erro ao buscar cliente:', erro);
    res.status(500).json({ erro: 'Erro ao buscar cliente' });
  }
}

/**
 * Atualizar cliente
 * PUT /api/clientes/:id
 */
async function atualizarCliente(req, res) {
  try {
    const { id } = req.params;
    const { nome, cpf_cnpj, telefone, email, endereco } = req.body;

    // Verificar se cliente existe
    const clienteExistente = await db('clientes').where({ id }).first();
    if (!clienteExistente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }

    // ===== NOVA VALIDAÇÃO =====
    // Verificar se cliente tem ordens de serviço
    const temOS = await db('ordem_servico').where({ cliente_id: id }).first();

    if (temOS) {
      // Se tem OS, não permite alterar nome e CPF/CNPJ
      if (nome !== clienteExistente.nome) {
        return res.status(400).json({
          erro: 'Não é possível alterar o nome de cliente com ordens de serviço cadastradas',
          bloqueado: true
        });
      }

      const documentoLimpo = removerFormatacao(cpf_cnpj);
      if (documentoLimpo !== clienteExistente.cpf_cnpj) {
        return res.status(400).json({
          erro: 'Não é possível alterar o CPF/CNPJ de cliente com ordens de serviço cadastradas',
          bloqueado: true
        });
      }
    }
    // ===== FIM NOVA VALIDAÇÃO =====

    const documentoLimpo = removerFormatacao(cpf_cnpj);

    // Verificar se CPF/CNPJ já existe em outro cliente
    const outroClienteComCpfCnpj = await db('clientes')
      .where('cpf_cnpj', documentoLimpo)
      .andWhereNot('id', id)
      .first();

    if (outroClienteComCpfCnpj) {
      return res.status(400).json({ erro: 'CPF/CNPJ já cadastrado para outro cliente' });
    }

    // Atualizar cliente
    const dadosAtualizados = {
      nome: capitalizarNome(nome),
      cpf_cnpj: documentoLimpo,
      telefone,
      email: email || null,
      endereco: endereco || null,
      atualizado_em: db.fn.now() // Usa a função do próprio banco
    };

    const [clienteAtualizado] = await db('clientes')
      .where({ id })
      .update(dadosAtualizados)
      .returning('*');

    res.json({
      sucesso: true,
      mensagem: 'Cliente atualizado com sucesso',
      cliente: clienteAtualizado
    });

  } catch (erro) {
    console.error('Erro ao atualizar cliente:', erro);
    res.status(500).json({ erro: 'Erro ao atualizar cliente' });
  }
}

/**
 * Deletar cliente
 * DELETE /api/clientes/:id
 */
async function deletarCliente(req, res) {
  try {
    const { id } = req.params;

    // Verificar se cliente tem veículos ou OS
    const veiculo = await db('veiculos').where({ cliente_id: id }).first();
    const os = await db('ordem_servico').where({ cliente_id: id }).first();

    if (veiculo || os) {
      return res.status(400).json({
        erro: 'Não é possível deletar cliente com veículos ou ordens de serviço cadastradas'
      });
    }

    // Deletar cliente
    const [clienteDeletado] = await db('clientes')
      .where({ id })
      .del() // 'delete' é uma palavra reservada, então o Knex usa 'del'
      .returning(['id', 'nome']);

    if (!clienteDeletado) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }

    res.json({
      sucesso: true,
      mensagem: 'Cliente deletado com sucesso',
      cliente_deletado: clienteDeletado
    });

  } catch (erro) {
    console.error('Erro ao deletar cliente:', erro);
    res.status(500).json({ erro: 'Erro ao deletar cliente' });
  }
}

/**
 * Listar todos os clientes (com paginação)
 * GET /api/clientes?pagina=1&limite=20
 */
async function listarClientes(req, res) {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 20;
    const offset = (pagina - 1) * limite;

    // Contar total de clientes
    const [{ count: total }] = await db('clientes').count('* as count');

    // Buscar clientes com paginação
    const clientes = await db('clientes')
      .select('*')
      .orderBy('clientes.id', 'desc')
      .limit(limite)
      .offset(offset);

    res.json({
      sucesso: true,
      total: parseInt(total),
      pagina: pagina,
      total_paginas: Math.ceil(total / limite),
      clientes: clientes
    });

  } catch (erro) {
    console.error('Erro ao listar clientes:', erro);
    res.status(500).json({ erro: 'Erro ao listar clientes' });
  }
}

/**
 * Buscar cliente + veículos (completo)
 * GET /api/clientes/:id/completo
 */
async function buscarClienteCompleto(req, res) {
  try {
    const { id } = req.params;

    // 1) Busca o cliente
    const cliente = await db('clientes').where({ id }).first();

    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }

    // 2) Busca os veículos vinculados a este cliente
    const veiculos = await db('veiculos')
      .where({ cliente_id: id })
      .orderBy('id', 'desc');

    // 3) Anexa os veículos ao cliente
    cliente.veiculos = veiculos;

    // 4) Resposta
    return res.json({
      sucesso: true,
      cliente,
    });
  } catch (erro) {
    console.error('Erro ao buscar cliente completo:', erro);
    return res.status(500).json({ erro: 'Erro ao buscar cliente completo' });
  }
}

/**
 * Verificar se cliente tem ordens de serviço
 * GET /api/clientes/:id/tem-os
 */
async function verificarClienteTemOS(req, res) {
  try {
    const { id } = req.params;

    const temOS = await db('ordem_servico').where({ cliente_id: id }).first();

    res.json({
      sucesso: true,
      tem_os: !!temOS
    });

  } catch (erro) {
    console.error('Erro ao verificar OS do cliente:', erro);
    res.status(500).json({ erro: 'Erro ao verificar ordens de serviço' });
  }
}

export default {
  buscarClientes,
  cadastrarClienteRapido,
  buscarClientePorID,
  atualizarCliente,
  deletarCliente,
  listarClientes,
  buscarClienteCompleto,
  verificarClienteTemOS
};
