import express from 'express';
import { login, me, trocarSenha } from '../controllers/authController.js';
import { autenticar } from '../middlewares/autenticar.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', autenticar, me);
router.post('/trocar-senha', autenticar, trocarSenha);

export default router;
