// ============================================
// MIDDLEWARE DE VALIDAÇÃO
// ============================================

import { validarDocumento, validarTelefone, validarEmail, validarPlaca, validarData, validarDatasOS, validarValorPositivo, validarPagamento } from '../utils/validacoes.js';

/**
 * Valida dados de cliente
 */
function validarCliente(req, res, next) {
  const { nome, cpf_cnpj, telefone, email } = req.body;

  // Validações obrigatórias
  if (!nome || nome.trim() === '') {
    return res.status(400).json({ erro: 'Nome é obrigatório' });
  }

  if (!cpf_cnpj || cpf_cnpj.trim() === '') {
    return res.status(400).json({ erro: 'CPF/CNPJ é obrigatório' });
  }

  if (!telefone || telefone.trim() === '') {
    return res.status(400).json({ erro: 'Telefone é obrigatório' });
  }

  // Validação de CPF/CNPJ
  if (!validarDocumento(cpf_cnpj)) {
    return res.status(400).json({ erro: 'CPF/CNPJ inválido' });
  }

  // Validação de telefone
  if (!validarTelefone(telefone)) {
    return res.status(400).json({ erro: 'Telefone inválido' });
  }

  // Validação de email (se fornecido)
  if (email && !validarEmail(email)) {
    return res.status(400).json({ erro: 'Email inválido' });
  }

  next();
}

/**
 * Valida dados de veículo
 */
function validarVeiculo(req, res, next) {
  const { cliente_id, placa, marca, modelo, ano } = req.body;

  // Cliente é obrigatório apenas para POST (criação)
  if (req.method === 'POST' && !cliente_id) {
    return res.status(400).json({ erro: 'Cliente é obrigatório' });
  }
  if (!placa || placa.trim() === '') {
    return res.status(400).json({ erro: 'Placa é obrigatória' });
  }

  if (!marca || marca.trim() === '') {
    return res.status(400).json({ erro: 'Marca é obrigatória' });
  }

  if (!modelo || modelo.trim() === '') {
    return res.status(400).json({ erro: 'Modelo é obrigatório' });
  }

  // Validação de placa
  if (!validarPlaca(placa)) {
    return res.status(400).json({ erro: 'Placa inválida' });
  }

  // Validação de ano (se fornecido)
  if (ano) {
    const anoNum = parseInt(ano);
    const anoAtual = new Date().getFullYear();

    if (isNaN(anoNum) || anoNum < 1900 || anoNum > anoAtual + 1) {
      return res.status(400).json({ erro: 'Ano inválido' });
    }
  }

  next();
}

/**
 * Valida dados da Ordem de Serviço
 */
function validarOS(req, res, next) {
  const {
    cliente_id,
    veiculo_id,
    mecanico_id,
    data_abertura,
    data_conclusao,
    status,
    forma_pagamento,
    desconto,
    servicos,
    pecas
  } = req.body;

  // ============================================
  // REGRAS OBRIGATÓRIAS DO FORMULÁRIO
  // ============================================

  // 1. Cliente obrigatório
  if (!cliente_id) {
    return res.status(400).json({ erro: 'Cliente é obrigatório' });
  }

  // 2. Veículo obrigatório
  if (!veiculo_id) {
    return res.status(400).json({ erro: 'Veículo é obrigatório' });
  }

  // 3. Mecânico obrigatório
  if (!mecanico_id) {
    return res.status(400).json({ erro: 'Mecânico responsável é obrigatório' });
  }

  // 4. Data de abertura (será gerada automaticamente se não vier, mas não é obrigatória no body)
  // if (!data_abertura) { ... } -> Removido

  // 5. Validar formato de data (apenas se vier)
  if (data_abertura && !validarData(data_abertura)) {
    return res.status(400).json({ erro: 'Data de abertura inválida' });
  }

  // 6. Validar data de conclusão (se fornecida)
  if (data_conclusao) {
    if (!validarData(data_conclusao)) {
      return res.status(400).json({ erro: 'Data de conclusão inválida' });
    }

    // 7. Data de conclusão deve ser >= data de abertura (se abertura vier)
    if (data_abertura && !validarDatasOS(data_abertura, data_conclusao)) {
      return res.status(400).json({
        erro: 'Data de conclusão não pode ser anterior à data de abertura'
      });
    }
  }

  // 8. Status obrigatório
  if (!status) {
    return res.status(400).json({ erro: 'Status é obrigatório' });
  }

  // 9. Validar status permitidos
  const statusPermitidos = ['Agendamento', 'Em Andamento', 'Finalizada', 'Pago'];
  if (!statusPermitidos.includes(status)) {
    return res.status(400).json({
      erro: 'Status inválido. Use: Agendamento, Em Andamento, Finalizada ou Pago'
    });
  }

  // NOVA REGRA: Se status for "Agendamento", data_agendamento é obrigatória
  if (status === 'Agendamento') {
    const { data_agendamento } = req.body;
    if (!data_agendamento) {
      return res.status(400).json({ erro: 'Data do agendamento é obrigatória para status Agendamento' });
    }
    if (!validarData(data_agendamento)) {
      return res.status(400).json({ erro: 'Data do agendamento inválida' });
    }

    // Validar se data_agendamento não é no passado (opcional, mas recomendado para agendamento)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataAgendamento = new Date(data_agendamento);
    // Ajuste de fuso horário simples para comparação de data (string vem YYYY-MM-DD)
    const partesData = data_agendamento.split('-');
    const dataAgendamentoObj = new Date(partesData[0], partesData[1] - 1, partesData[2]);

    if (dataAgendamentoObj < hoje) {
      return res.status(400).json({ erro: 'Data do agendamento não pode ser no passado' });
    }
  }

  // 10. Se status = "Pago", forma de pagamento é obrigatória
  const validacaoPagamento = validarPagamento(status, forma_pagamento);
  if (!validacaoPagamento.valido) {
    return res.status(400).json({ erro: validacaoPagamento.mensagem });
  }

  // 11. Validar desconto (se fornecido)
  if (desconto !== undefined && desconto !== null && desconto !== '') {
    if (!validarValorPositivo(desconto)) {
      return res.status(400).json({ erro: 'Desconto deve ser um valor positivo' });
    }
  }

  // 12. Validar serviços e peças (REGRA ATUALIZADA)
  const temServicos = servicos && Array.isArray(servicos) && servicos.length > 0;
  const temPecas = pecas && Array.isArray(pecas) && pecas.length > 0;

  // REGRA 1: Apenas status "Agendamento" pode ter OS vazia (sem serviços e peças)
  // Para outros status, é obrigatório ter pelo menos 1 serviço OU 1 peça
  if (status !== 'Agendamento' && !temServicos && !temPecas) {
    return res.status(400).json({
      erro: 'Adicione pelo menos 1 serviço ou 1 peça à ordem de serviço'
    });
  }

  // REGRA 2: Status "Finalizada" SEMPRE requer pelo menos 1 serviço OU 1 peça
  if (status === 'Finalizada' && !temServicos && !temPecas) {
    return res.status(400).json({
      erro: 'Status Finalizada requer pelo menos 1 serviço ou 1 peça'
    });
  }

  // 13. Validar estrutura de serviços (se houver)
  if (temServicos) {
    for (const servico of servicos) {
      if (!servico.servico_id) {
        return res.status(400).json({
          erro: `Cada serviço deve ter servico_id`
        });
      }

      if (!servico.quantidade || servico.quantidade <= 0) {
        return res.status(400).json({
        });
      }

      if (!servico.preco_unitario || servico.preco_unitario < 0) {
        return res.status(400).json({
          erro: `Serviço ${i + 1}: Preço deve ser maior ou igual a 0`
        });
      }
    }
  }

  // 14. Validar peças (se fornecidas)
  if (pecas && pecas.length > 0) {
    for (let i = 0; i < pecas.length; i++) {
      const peca = pecas[i];

      if (!peca.peca_id) {
        return res.status(400).json({
          erro: `Peça ${i + 1}: ID da peça é obrigatório`
        });
      }

      if (!peca.quantidade || peca.quantidade <= 0) {
        return res.status(400).json({
          erro: `Peça ${i + 1}: Quantidade deve ser maior que 0`
        });
      }

      if (!peca.preco_unitario || peca.preco_unitario < 0) {
        return res.status(400).json({
          erro: `Peça ${i + 1}: Preço deve ser maior ou igual a 0`
        });
      }
    }
  }

  next();
}

/**
 * Valida parâmetro ID (deve ser número inteiro positivo)
 */
function validarID(req, res, next) {
  const { id } = req.params;

  const idNum = parseInt(id);

  if (isNaN(idNum) || idNum <= 0) {
    return res.status(400).json({ erro: 'ID inválido' });
  }

  next();
}

/**
 * Valida parâmetro OS_ID (deve ser número inteiro positivo)
 */
function validarOSID(req, res, next) {
  const { os_id } = req.params;

  const idNum = parseInt(os_id);

  if (isNaN(idNum) || idNum <= 0) {
    return res.status(400).json({ erro: 'ID inválido' });
  }

  next();
}

export {
  validarCliente,
  validarVeiculo,
  validarOS,
  validarID,
  validarOSID
};
