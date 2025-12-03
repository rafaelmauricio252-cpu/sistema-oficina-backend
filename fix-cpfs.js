const fs = require('fs');

const filePath = 'C:\\oficina-backend\\tests\\integration-clientes.test.js';
let content = fs.readFileSync(filePath, 'utf8');

// Mapa de substituições: CPF inválido → CPF válido
const substitutions = {
  "'12345678900'": "'52998224725'",
  "'98765432100'": "'62297458751'",
  "'11111111111'": "'38968738002'",
  "'123.456.789-00'": "'529.982.247-25'",
  "'22222222222'": "'29026695002'",
  "'33333333333'": "'78592045005'",
  "'44444444444'": "'07413843041'",
  "'55555555555'": "'91708635016'",
  "'66666666666'": "'36251816011'",
  "'77777777777'": "'80651651054'",
  "'88888888888'": "'69468286090'",
  "'99999999999'": "'53842271020'",
  "'12345678901234'": "'11444777000161'", // CNPJ
};

// Fazer todas as substituições
for (const [invalid, valid] of Object.entries(substitutions)) {
  content = content.split(invalid).join(valid);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ CPFs e CNPJs atualizados com sucesso!');
