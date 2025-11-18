// ============================================
// FORMATADORES - CPF, CNPJ, TELEFONE, DINHEIRO
// ============================================

function formatarCPF(cpf) {
  if (!cpf) return '';
  const apenasNumeros = cpf.replace(/[^\d]/g, '');
  if (apenasNumeros.length !== 11) return cpf;
  return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarCNPJ(cnpj) {
  if (!cnpj) return '';
  const apenasNumeros = cnpj.replace(/[^\d]/g, '');
  if (apenasNumeros.length !== 14) return cnpj;
  return apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function formatarDocumento(documento) {
  if (!documento) return '';
  const apenasNumeros = documento.replace(/[^\d]/g, '');
  if (apenasNumeros.length === 11) return formatarCPF(apenasNumeros);
  if (apenasNumeros.length === 14) return formatarCNPJ(apenasNumeros);
  return documento;
}

function formatarTelefone(telefone) {
  if (!telefone) return '';
  const apenasNumeros = telefone.replace(/[^\d]/g, '');
  if (apenasNumeros.length === 11) {
    return apenasNumeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (apenasNumeros.length === 10) {
    return apenasNumeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return telefone;
}

function formatarDinheiro(valor) {
  if (valor === null || valor === undefined) return 'R$ 0,00';
  const numero = parseFloat(valor);
  if (isNaN(numero)) return 'R$ 0,00';
  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatarDataBR(data) {
  if (!data) return '';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

function formatarDataHoraBR(dataHora) {
  if (!dataHora) return '';
  const data = new Date(dataHora);
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  const hora = String(data.getHours()).padStart(2, '0');
  const minuto = String(data.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
}

function removerFormatacao(documento) {
  if (!documento) return '';
  return documento.replace(/[^\d]/g, '');
}

function limparPlaca(placa) {
  if (!placa) return '';
  return placa.replace(/[-\s]/g, '').toUpperCase();
}

function formatarPlaca(placa) {
  if (!placa) return '';
  const placaLimpa = placa.replace(/[-\s]/g, '').toUpperCase();
  if (/^[A-Z]{3}\d{4}$/.test(placaLimpa)) {
    return placaLimpa.replace(/([A-Z]{3})(\d{4})/, '$1-$2');
  }
  if (/^[A-Z]{3}\d[A-Z]\d{2}$/.test(placaLimpa)) {
    return placaLimpa;
  }
  return placa;
}

function capitalizarNome(texto) {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .split(' ')
    .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(' ');
}

module.exports = {
  formatarCPF,
  formatarCNPJ,
  formatarDocumento,
  formatarTelefone,
  formatarDinheiro,
  formatarDataBR,
  formatarDataHoraBR,
  removerFormatacao,
  limparPlaca, // <-- Adicionado
  formatarPlaca,
  capitalizarNome
};
