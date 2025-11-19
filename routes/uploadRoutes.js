// ============================================
// ROTAS DE UPLOAD
// ============================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const uploadController = require('../controllers/uploadController');
const { validarID, validarOSID } = require('../middlewares/validarDados');

// Configuração do Multer (upload de arquivos)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/fotos/');
  },
  filename: function (req, file, cb) {
    // Gerar nome único: timestamp-nomeoriginal.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

// Filtro de tipos de arquivo (apenas imagens)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use apenas: JPG, PNG, GIF ou WebP'), false);
  }
};

// Configurar multer com limites
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  }
});

// Upload de foto da OS
// POST /api/upload/foto
// Body (form-data): file, os_id, descricao (opcional)
router.post('/foto', upload.single('file'), uploadController.uploadFoto);

// Listar fotos de uma OS
// GET /api/upload/fotos/:os_id
router.get('/fotos/:os_id', validarOSID, uploadController.listarFotosOS);

// Deletar foto
// DELETE /api/upload/foto/:id
router.delete('/foto/:id', validarID, uploadController.deletarFoto);

// Middleware de erro do Multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ erro: 'Arquivo muito grande. Tamanho máximo: 5MB' });
    }
    return res.status(400).json({ erro: 'Erro no upload: ' + err.message });
  } else if (err) {
    return res.status(400).json({ erro: err.message });
  }
  next();
});

module.exports = router;
