const fs = require('fs');

const filePath = 'C:\\oficina-backend\\tests\\integration-clientes.test.js';
let content = fs.readFileSync(filePath, 'utf8');

// CPFs e CNPJs válidos GARANTIDOS (gerados com algoritmo brasileiro correto)
const cpfsValidos = [
  '63114205895', '68733069590', '48813610661', '79025336450',
  '67906672615', '15835590270', '54770265700', '37682654473',
  '83135307581', '63700885288', '37258308008', '21228487073',
  '76532402834', '98826240140', '77034911959'
];

const cnpjsValidos = [
  '70711112259385', '70607780718736', '71410869279246'
];

// Mapa de substituições: CPF inválido → CPF válido
const substitutions = {
  // CPFs que ainda estão causando erro 400
  "'62297458751'": `'${cpfsValidos[0]}'`,
  "'91708635016'": `'${cpfsValidos[1]}'`,
  "'80651651054'": `'${cpfsValidos[2]}'`,
  "'07413843041'": `'${cpfsValidos[3]}'`,

  // Outros CPFs do arquivo (garantir que todos sejam válidos)
  "'52998224725'": `'${cpfsValidos[4]}'`,
  "'38968738002'": `'${cpfsValidos[5]}'`,
  "'29026695002'": `'${cpfsValidos[6]}'`,
  "'78592045005'": `'${cpfsValidos[7]}'`,
  "'36251816011'": `'${cpfsValidos[8]}'`,
  "'69468286090'": `'${cpfsValidos[9]}'`,
  "'53842271020'": `'${cpfsValidos[10]}'`,
  "'85660434134'": `'${cpfsValidos[11]}'`,
  "'47714671297'": `'${cpfsValidos[12]}'`,
  "'57930379000'": `'${cpfsValidos[13]}'`,
  "'85708464100'": `'${cpfsValidos[14]}'`,

  // CNPJ
  "'11444777000161'": `'${cnpjsValidos[0]}'`,

  // CPF formatado
  "'529.982.247-25'": `'${cpfsValidos[4].replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}'`,
};

console.log('🔄 Substituindo TODOS os CPFs/CNPJs por valores GARANTIDAMENTE válidos...\n');

// Fazer todas as substituições
let totalSubstituicoes = 0;
for (const [invalid, valid] of Object.entries(substitutions)) {
  const regex = new RegExp(invalid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const matches = content.match(regex);
  const count = matches ? matches.length : 0;

  if (count > 0) {
    content = content.split(invalid).join(valid);
    console.log(`✅ Substituído ${invalid} → ${valid} (${count} ocorrências)`);
    totalSubstituicoes += count;
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`\n✅ Arquivo atualizado! Total: ${totalSubstituicoes} substituições`);
console.log('\n📋 CPFs válidos GARANTIDOS usados:');
cpfsValidos.forEach((cpf, i) => console.log(`   ${i + 1}. ${cpf}`));
console.log('\n📋 CNPJs válidos GARANTIDOS usados:');
cnpjsValidos.forEach((cnpj, i) => console.log(`   ${i + 1}. ${cnpj}`));
