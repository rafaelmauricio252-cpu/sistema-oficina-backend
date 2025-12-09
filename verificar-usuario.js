import bcrypt from 'bcrypt';
import db from './config/db.js';

async function verificarUsuario() {
  try {
    console.log('🔍 Verificando usuário admin...\n');

    const usuario = await db('usuarios')
      .where({ email: 'admin@oficina.com' })
      .first();

    if (!usuario) {
      console.log('❌ Usuário admin@oficina.com NÃO encontrado!');
      process.exit(1);
    }

    console.log('✅ Usuário encontrado:');
    console.log('   ID:', usuario.id);
    console.log('   Nome:', usuario.nome);
    console.log('   Email:', usuario.email);
    console.log('   Tipo:', usuario.tipo);
    console.log('   Ativo:', usuario.ativo);
    console.log('   Deve trocar senha:', usuario.deve_trocar_senha);
    console.log('');

    // Testar senha
    const senhaCorreta = 'admin123';
    const senhaMatch = await bcrypt.compare(senhaCorreta, usuario.senha_hash);

    console.log('🔐 Teste de senha:');
    console.log('   Senha testada:', senhaCorreta);
    console.log('   Hash no banco:', usuario.senha_hash.substring(0, 30) + '...');
    console.log('   Senha válida?', senhaMatch ? '✅ SIM' : '❌ NÃO');
    console.log('');

    if (!senhaMatch) {
      console.log('⚠️  A senha NÃO corresponde ao hash! Regenerando...\n');

      const salt = await bcrypt.genSalt(10);
      const novoHash = await bcrypt.hash(senhaCorreta, salt);

      await db('usuarios')
        .where({ id: usuario.id })
        .update({ senha_hash: novoHash });

      console.log('✅ Senha regenerada com sucesso!');
      console.log('   Novo hash:', novoHash.substring(0, 30) + '...');
    }

    process.exit(0);
  } catch (erro) {
    console.error('❌ Erro:', erro);
    process.exit(1);
  }
}

verificarUsuario();
