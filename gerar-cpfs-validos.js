// Gerador de CPFs válidos usando o algoritmo brasileiro correto

function gerarCPFValido() {
  // Gerar 9 primeiros dígitos aleatórios
  const primeirosNove = Array.from({length: 9}, () => Math.floor(Math.random() * 10));

  // Calcular primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += primeirosNove[i] * (10 - i);
  }
  let resto = 11 - (soma % 11);
  const digito1 = (resto === 10 || resto === 11) ? 0 : resto;

  // Calcular segundo dígito verificador
  const primeiroDez = [...primeirosNove, digito1];
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += primeiroDez[i] * (11 - i);
  }
  resto = 11 - (soma % 11);
  const digito2 = (resto === 10 || resto === 11) ? 0 : resto;

  // Retornar CPF completo
  return [...primeirosNove, digito1, digito2].join('');
}

function gerarCNPJValido() {
  // Gerar 12 primeiros dígitos aleatórios
  const primeirosDoze = Array.from({length: 12}, () => Math.floor(Math.random() * 10));

  // Calcular primeiro dígito verificador
  let tamanho = 12;
  let pos = tamanho - 7;
  let soma = 0;

  for (let i = tamanho; i >= 1; i--) {
    soma += primeirosDoze[tamanho - i] * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  const digito1 = resultado;

  // Calcular segundo dígito verificador
  const primeirosTreeze = [...primeirosDoze, digito1];
  tamanho = 13;
  pos = tamanho - 7;
  soma = 0;

  for (let i = tamanho; i >= 1; i--) {
    soma += primeirosTreeze[tamanho - i] * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  const digito2 = resultado;

  return [...primeirosDoze, digito1, digito2].join('');
}

// Gerar 15 CPFs e 3 CNPJs válidos
console.log('📋 CPFs válidos gerados:');
const cpfs = [];
for (let i = 0; i < 15; i++) {
  const cpf = gerarCPFValido();
  cpfs.push(cpf);
  console.log(`CPF ${i + 1}: ${cpf}`);
}

console.log('\n📋 CNPJs válidos gerados:');
const cnpjs = [];
for (let i = 0; i < 3; i++) {
  const cnpj = gerarCNPJValido();
  cnpjs.push(cnpj);
  console.log(`CNPJ ${i + 1}: ${cnpj}`);
}

// Exportar para usar em outros scripts
module.exports = { cpfs, cnpjs, gerarCPFValido, gerarCNPJValido };
