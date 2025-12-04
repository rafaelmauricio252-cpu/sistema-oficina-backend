import express from 'express';
import {
  listarUsuarios,
  buscarUsuarioPorId,
  criarUsuario,
  atualizarUsuario,
  atualizarPermissoes,
  resetarSenha,
  desativarUsuario
} from '../controllers/usuarioController.js';
import { autenticar, verificarAdmin } from '../middlewares/autenticar.js';

const router = express.Router();

// Todas as rotas de usuários exigem autenticação E permissão de admin
router.use(autenticar);
router.use(verificarAdmin);

router.get('/', listarUsuarios);
router.get('/:id', buscarUsuarioPorId);
router.post('/', criarUsuario);
router.put('/:id', atualizarUsuario);
router.patch('/:id/permissoes', atualizarPermissoes);
router.post('/:id/resetar-senha', resetarSenha);
router.delete('/:id', desativarUsuario);

export default router;
