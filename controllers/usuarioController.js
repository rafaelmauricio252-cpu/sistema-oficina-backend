import bcrypt from 'bcrypt';
import db from '../config/db.js';

export const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await db('usuarios')
      .select('id', 'nome', 'email', 'tipo', 'ativo', 'deve_trocar_senha', 'created_at')
      .orderBy('id', 'desc');

    // Buscar permissões de cada usuário
    for (const usuario of usuarios) {
      if (usuario.tipo !== 'admin') {
        const perms = await db('permissoes')
          .where({ usuario_id: usuario.id })
          .select('modulo');
        usuario.permissoes = perms.map(p => p.modulo);
      } else {
        usuario.permissoes = ['todos'];
      }
    }

    res.json(usuarios);
  } catch (erro) {
    console.error('Erro ao listar usuários:', erro);
    res.status(500).json({ erro: 'Erro ao listar usuários' });
  }
};

export const buscarUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await db('usuarios')
      .where({ id })
      .select('id', 'nome', 'email', 'tipo', 'ativo', 'deve_trocar_senha', 'created_at')
      .first();

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    // Buscar permissões
    if (usuario.tipo !== 'admin') {
      const perms = await db('permissoes')
        .where({ usuario_id: usuario.id })
        .select('modulo');
      usuario.permissoes = perms.map(p => p.modulo);
    } else {
      usuario.permissoes = ['todos'];
    }

    res.json(usuario);
  } catch (erro) {
    console.error('Erro ao buscar usuário:', erro);
    res.status(500).json({ erro: 'Erro ao buscar usuário' });
  }
};

export const criarUsuario = async (req, res) => {
  try {
    const { nome, email, senha, tipo, permissoes } = req.body;

    // Validações
    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
    }

    if (senha.length < 6) {
      return res.status(400).json({ erro: 'Senha deve ter no mínimo 6 caracteres' });
    }

    if (!['admin', 'comum'].includes(tipo)) {
      return res.status(400).json({ erro: 'Tipo deve ser "admin" ou "comum"' });
    }

    // Verificar email duplicado
    const emailExiste = await db('usuarios')
      .where({ email: email.toLowerCase() })
      .first();

    if (emailExiste) {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar usuário
    const [novoUsuario] = await db('usuarios')
      .insert({
        nome,
        email: email.toLowerCase(),
        senha_hash: senhaHash,
        tipo,
        ativo: true,
        deve_trocar_senha: true // Força trocar senha no primeiro login
      })
      .returning(['id', 'nome', 'email', 'tipo', 'ativo', 'created_at']);

    // Criar permissões (se não for admin)
    if (tipo === 'comum' && permissoes && permissoes.length > 0) {
      const permissoesInsert = permissoes.map(modulo => ({
        usuario_id: novoUsuario.id,
        modulo
      }));
      await db('permissoes').insert(permissoesInsert);
      novoUsuario.permissoes = permissoes;
    } else {
      novoUsuario.permissoes = tipo === 'admin' ? ['todos'] : [];
    }

    res.status(201).json(novoUsuario);
  } catch (erro) {
    console.error('Erro ao criar usuário:', erro);
    res.status(500).json({ erro: 'Erro ao criar usuário' });
  }
};

export const atualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, tipo, ativo } = req.body;

    // Verificar se usuário existe
    const usuario = await db('usuarios').where({ id }).first();

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    // Não permitir que admin se autodesative
    if (id == req.usuario.id && ativo === false) {
      return res.status(400).json({ erro: 'Você não pode desativar sua própria conta' });
    }

    // Verificar email duplicado
    if (email && email !== usuario.email) {
      const emailExiste = await db('usuarios')
        .where({ email: email.toLowerCase() })
        .whereNot({ id })
        .first();

      if (emailExiste) {
        return res.status(400).json({ erro: 'Email já cadastrado para outro usuário' });
      }
    }

    // Atualizar usuário
    const [usuarioAtualizado] = await db('usuarios')
      .where({ id })
      .update({
        nome: nome || usuario.nome,
        email: email ? email.toLowerCase() : usuario.email,
        tipo: tipo || usuario.tipo,
        ativo: ativo !== undefined ? ativo : usuario.ativo,
        updated_at: db.fn.now()
      })
      .returning(['id', 'nome', 'email', 'tipo', 'ativo', 'created_at']);

    res.json(usuarioAtualizado);
  } catch (erro) {
    console.error('Erro ao atualizar usuário:', erro);
    res.status(500).json({ erro: 'Erro ao atualizar usuário' });
  }
};

export const atualizarPermissoes = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissoes } = req.body;

    // Verificar se usuário existe
    const usuario = await db('usuarios').where({ id }).first();

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    if (usuario.tipo === 'admin') {
      return res.status(400).json({ erro: 'Admin tem acesso total. Não é possível alterar permissões.' });
    }

    // Remover permissões antigas
    await db('permissoes').where({ usuario_id: id }).delete();

    // Inserir novas permissões
    if (permissoes && permissoes.length > 0) {
      const permissoesInsert = permissoes.map(modulo => ({
        usuario_id: id,
        modulo
      }));
      await db('permissoes').insert(permissoesInsert);
    }

    res.json({ sucesso: true, mensagem: 'Permissões atualizadas com sucesso', permissoes });
  } catch (erro) {
    console.error('Erro ao atualizar permissões:', erro);
    res.status(500).json({ erro: 'Erro ao atualizar permissões' });
  }
};

export const resetarSenha = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se usuário existe
    const usuario = await db('usuarios').where({ id }).first();

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    // Gerar senha temporária
    const anoAtual = new Date().getFullYear();
    const senhaTemporaria = `Oficina@${anoAtual}`;
    const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

    // Atualizar senha
    await db('usuarios')
      .where({ id })
      .update({
        senha_hash: senhaHash,
        deve_trocar_senha: true,
        updated_at: db.fn.now()
      });

    res.json({
      sucesso: true,
      mensagem: 'Senha resetada com sucesso',
      senha_temporaria: senhaTemporaria,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      }
    });
  } catch (erro) {
    console.error('Erro ao resetar senha:', erro);
    res.status(500).json({ erro: 'Erro ao resetar senha' });
  }
};

export const desativarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se não está tentando desativar a si mesmo
    if (id == req.usuario.id) {
      return res.status(400).json({ erro: 'Você não pode desativar sua própria conta' });
    }

    // Verificar se usuário existe
    const usuario = await db('usuarios').where({ id }).first();

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    // Desativar
    await db('usuarios')
      .where({ id })
      .update({
        ativo: false,
        updated_at: db.fn.now()
      });

    res.json({ sucesso: true, mensagem: 'Usuário desativado com sucesso' });
  } catch (erro) {
    console.error('Erro ao desativar usuário:', erro);
    res.status(500).json({ erro: 'Erro ao desativar usuário' });
  }
};
