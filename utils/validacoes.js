// ============================================
// VALIDAÇÕES - CPF, CNPJ, DATAS, ETC
// ============================================

function validarCPF(cpf) {
  cpf = cpf.replace(/[^\d]/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // Reject CPFs with all identical digits
  
  // Validate first digit
  let soma = 0;
  let resto;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  
  // Validate second digit
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

function validarCNPJ(cnpj) {
  cnpj = cnpj.replace(/[^\d]/g, '');
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != digitos.charAt(0)) return false;
  
  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != digitos.charAt(1)) return false;
  
  return true;
}

function validarDocumento(documento) {
  if (!documento) return false;
  const apenasNumeros = documento.replace(/[^\d]/g, '');
  if (apenasNumeros.length === 11) return validarCPF(apenasNumeros);
  if (apenasNumeros.length === 14) return validarCNPJ(apenasNumeros);
  return false;
}

function validarData(data) {
  if (!data) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(data)) return false;
  const dataObj = new Date(data);
  return !isNaN(dataObj.getTime());
}

function validarDatasOS(dataAbertura, dataConclusao) {
  if (!dataConclusao) return true;
  const abertura = new Date(dataAbertura);
  const conclusao = new Date(dataConclusao);
  return conclusao >= abertura;
}

function validarTelefone(telefone) {
  if (!telefone) return false;
  const apenasNumeros = telefone.replace(/[^\d]/g, '');
  return apenasNumeros.length === 10 || apenasNumeros.length === 11;
}

function validarEmail(email) {
  if (!email) return true;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validarPlaca(placa) {
  if (!placa) return false;
  const placaLimpa = placa.replace(/[-\s]/g, '').toUpperCase();
  const formatoAntigo = /^[A-Z]{3}\d{4}$/;
  const formatoMercosul = /^[A-Z]{3}\d[A-Z]\d{2}$/;
  return formatoAntigo.test(placaLimpa) || formatoMercosul.test(placaLimpa);
}

function validarValorPositivo(valor) {
  const numero = parseFloat(valor);
  return !isNaN(numero) && numero >= 0;
}

function validarPagamento(status, formaPagamento) {
  if (status === 'Pago' && !formaPagamento) {
    return {
      valido: false,
      mensagem: 'Forma de pagamento é obrigatória quando o status é "Pago"'
    };
  }
  return { valido: true };
}

export {
  validarCPF,
  validarCNPJ,
  validarDocumento,
  validarData,
  validarDatasOS,
  validarTelefone,
  validarEmail,
  validarPlaca,
  validarValorPositivo,
  validarPagamento
};
