import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'oficina-secret-key-2025';

export const autenticar = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ erro: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Buscar usuário
    const usuario = await db('usuarios')
      .where({ id: decoded.id })
      .first();

    if (!usuario || !usuario.ativo) {
      return res.status(401).json({ erro: 'Usuário inválido ou inativo' });
    }

    // Adiciona usuário na request
    req.usuario = usuario;
    next();
  } catch (erro) {
    console.error('Erro na autenticação:', erro);
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
};

export const verificarAdmin = (req, res, next) => {
  if (req.usuario.tipo !== 'admin') {
    return res.status(403).json({ erro: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

export const verificarPermissao = (modulo) => {
  return async (req, res, next) => {
    try {
      // Admin tem acesso a tudo
      if (req.usuario.tipo === 'admin') {
        return next();
      }

      // Verificar permissão do usuário
      const permissao = await db('permissoes')
        .where({
          usuario_id: req.usuario.id,
          modulo: modulo
        })
        .first();

      if (!permissao) {
        return res.status(403).json({
          erro: `Você não tem permissão para acessar: ${modulo}`
        });
      }

      next();
    } catch (erro) {
      console.error('Erro ao verificar permissão:', erro);
      return res.status(500).json({ erro: 'Erro ao verificar permissões' });
    }
  };
};
