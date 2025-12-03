const fs = require('fs');

const filePath = 'C:\\oficina-backend\\tests\\integration-clientes.test.js';
let content = fs.readFileSync(filePath, 'utf8');

// CPFs e CNPJs válidos gerados
const cpfsValidos = [
  '79402438297', '72903722048', '17668098984', '68047974939',
  '91250515718', '85660434134', '47714671297', '57930379000',
  '85708464100', '52600936661', '30782311270', '79057775379',
  '91639548505', '64308318335', '30328292591'
];

const cnpjsValidos = [
  '20314644760638', '46399678217687', '81878699335450'
];

// Mapa de substituições
const substitutions = {
  // CPFs inválidos existentes → CPFs válidos
  "'52998224725'": `'${cpfsValidos[0]}'`,
  "'62297458751'": `'${cpfsValidos[1]}'`,
  "'38968738002'": `'${cpfsValidos[2]}'`,
  "'07413843041'": `'${cpfsValidos[3]}'`,
  "'91708635016'": `'${cpfsValidos[4]}'`,
  "'36251816011'": `'${cpfsValidos[5]}'`,
  "'80651651054'": `'${cpfsValidos[6]}'`,
  "'69468286090'": `'${cpfsValidos[7]}'`,
  "'53842271020'": `'${cpfsValidos[8]}'`,
  "'29026695002'": `'${cpfsValidos[9]}'`,
  "'78592045005'": `'${cpfsValidos[10]}'`,

  // CNPJ
  "'11444777000161'": `'${cnpjsValidos[0]}'`,

  // CPF formatado
  "'529.982.247-25'": `'${cpfsValidos[0].replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}'`,
};

console.log('🔄 Substituindo CPFs/CNPJs por valores válidos garantidos...\n');

// Fazer todas as substituições
for (const [invalid, valid] of Object.entries(substitutions)) {
  const count = (content.match(new RegExp(invalid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  if (count > 0) {
    content = content.split(invalid).join(valid);
    console.log(`✅ Substituído ${invalid} → ${valid} (${count} ocorrências)`);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✅ Arquivo atualizado com CPFs e CNPJs válidos!');
console.log('\n📋 CPFs válidos usados:');
cpfsValidos.forEach((cpf, i) => console.log(`   ${i + 1}. ${cpf}`));
console.log('\n📋 CNPJs válidos usados:');
cnpjsValidos.forEach((cnpj, i) => console.log(`   ${i + 1}. ${cnpj}`));
