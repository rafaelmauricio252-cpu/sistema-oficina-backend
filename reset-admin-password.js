import bcrypt from 'bcrypt';
import db from './config/db.js';

async function resetAdminPassword() {
  try {
    console.log('🔄 Resetando senha do administrador...');

    // Nova senha: admin123
    const novaSenha = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(novaSenha, salt);

    // Atualizar no banco de dados
    const resultado = await db('usuarios')
      .where({ email: 'admin@oficina.com' })
      .update({
        senha_hash: senhaHash,
        deve_trocar_senha: false,
        updated_at: new Date()
      });

    if (resultado === 0) {
      console.log('⚠️  Usuário admin não encontrado. Criando...');

      // Criar usuário admin se não existir
      await db('usuarios').insert({
        nome: 'Administrador',
        email: 'admin@oficina.com',
        senha_hash: senhaHash,
        tipo: 'admin',
        ativo: true,
        deve_trocar_senha: false,
        created_at: new Date(),
        updated_at: new Date()
      });

      console.log('✅ Usuário admin criado com sucesso!');
    } else {
      console.log('✅ Senha do admin resetada com sucesso!');
    }

    console.log('');
    console.log('📋 Credenciais:');
    console.log('   Email: admin@oficina.com');
    console.log('   Senha: admin123');
    console.log('');
    console.log('⚠️  Você será solicitado a trocar a senha no primeiro login!');

    process.exit(0);
  } catch (erro) {
    console.error('❌ Erro ao resetar senha:', erro);
    process.exit(1);
  }
}

resetAdminPassword();
