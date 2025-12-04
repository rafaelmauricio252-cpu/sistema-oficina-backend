import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'oficina-secret-key-2025';
const JWT_EXPIRES_IN = '8h';

export const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário
    const usuario = await db('usuarios')
      .where({ email: email.toLowerCase() })
      .first();

    if (!usuario) {
      return res.status(401).json({ erro: 'Email ou senha inválidos' });
    }

    if (!usuario.ativo) {
      return res.status(401).json({ erro: 'Usuário inativo. Contate o administrador.' });
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({ erro: 'Email ou senha inválidos' });
    }

    // Buscar permissões (se não for admin)
    let permissoes = [];
    if (usuario.tipo !== 'admin') {
      const perms = await db('permissoes')
        .where({ usuario_id: usuario.id })
        .select('modulo');
      permissoes = perms.map(p => p.modulo);
    }

    // Gerar token JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, tipo: usuario.tipo },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Remover senha do retorno
    delete usuario.senha_hash;

    res.json({
      sucesso: true,
      token,
      usuario: {
        ...usuario,
        permissoes
      }
    });
  } catch (erro) {
    console.error('Erro no login:', erro);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
};

export const me = async (req, res) => {
  try {
    const usuario = { ...req.usuario };
    delete usuario.senha_hash;

    // Buscar permissões
    let permissoes = [];
    if (usuario.tipo !== 'admin') {
      const perms = await db('permissoes')
        .where({ usuario_id: usuario.id })
        .select('modulo');
      permissoes = perms.map(p => p.modulo);
    }

    res.json({
      usuario: {
        ...usuario,
        permissoes
      }
    });
  } catch (erro) {
    console.error('Erro ao buscar dados do usuário:', erro);
    res.status(500).json({ erro: 'Erro ao buscar dados' });
  }
};

export const trocarSenha = async (req, res) => {
  try {
    const { senha_atual, senha_nova } = req.body;
    const usuario_id = req.usuario.id;

    if (!senha_nova || senha_nova.length < 6) {
      return res.status(400).json({ erro: 'Nova senha deve ter no mínimo 6 caracteres' });
    }

    // Buscar usuário
    const usuario = await db('usuarios').where({ id: usuario_id }).first();

    // Se não é troca obrigatória, validar senha atual
    if (!usuario.deve_trocar_senha) {
      if (!senha_atual) {
        return res.status(400).json({ erro: 'Senha atual é obrigatória' });
      }

      const senhaValida = await bcrypt.compare(senha_atual, usuario.senha_hash);
      if (!senhaValida) {
        return res.status(401).json({ erro: 'Senha atual incorreta' });
      }
    }

    // Atualizar senha
    const novaSenhaHash = await bcrypt.hash(senha_nova, 10);

    await db('usuarios')
      .where({ id: usuario_id })
      .update({
        senha_hash: novaSenhaHash,
        deve_trocar_senha: false,
        updated_at: db.fn.now()
      });

    res.json({ sucesso: true, mensagem: 'Senha alterada com sucesso' });
  } catch (erro) {
    console.error('Erro ao trocar senha:', erro);
    res.status(500).json({ erro: 'Erro ao trocar senha' });
  }
};
