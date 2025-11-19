// ============================================
// CONTROLLER DE UPLOAD (Refatorado com Knex.js)
// ============================================

import db from '../config/db.js';
import path from 'path';
import fs from 'fs/promises';

/**
 * Upload de foto da OS
 * POST /api/upload/foto
 */
async function uploadFoto(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhum arquivo foi enviado' });
    }
    
    const { os_id, descricao } = req.body;
    
    if (!os_id) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ erro: 'ID da Ordem de Serviço é obrigatório' });
    }
    
    const os = await db('ordem_servico').where({ id: os_id }).first();
    
    if (!os) {
      await fs.unlink(req.file.path);
      return res.status(404).json({ erro: 'Ordem de Serviço não encontrada' });
    }
    
    const caminhoRelativo = `/uploads/fotos/${req.file.filename}`;
    
    const [fotoInserida] = await db('os_fotos').insert({
      os_id,
      caminho_arquivo: caminhoRelativo,
      descricao: descricao || null
    }).returning('*');
    
    res.status(201).json({
      sucesso: true,
      mensagem: 'Foto enviada com sucesso',
      foto: {
        ...fotoInserida,
        url: `http://localhost:3000${caminhoRelativo}`,
        nome_arquivo: req.file.filename,
        tamanho: req.file.size,
        tipo: req.file.mimetype
      }
    });
    
  } catch (erro) {
    if (req.file) {
      try { await fs.unlink(req.file.path); } 
      catch (unlinkError) { console.error('Erro ao deletar arquivo órfão:', unlinkError); }
    }
    console.error('Erro ao fazer upload:', erro);
    res.status(500).json({ erro: 'Erro ao fazer upload da foto' });
  }
}

/**
 * Listar fotos de uma OS
 * GET /api/upload/fotos/:os_id
 */
async function listarFotosOS(req, res) {
  try {
    const { os_id } = req.params;
    
    const fotos = await db('os_fotos')
      .select('id', 'os_id', 'caminho_arquivo', 'descricao', 'criado_em')
      .where({ os_id })
      .orderBy('criado_em', 'desc');
    
    const fotosComURL = fotos.map(foto => ({
      ...foto,
      url: `http://localhost:3000${foto.caminho_arquivo}`
    }));
    
    res.json({
      sucesso: true,
      total: fotosComURL.length,
      fotos: fotosComURL
    });
    
  } catch (erro) {
    console.error('Erro ao listar fotos:', erro);
    res.status(500).json({ erro: 'Erro ao listar fotos' });
  }
}

/**
 * Deletar foto
 * DELETE /api/upload/foto/:id
 */
async function deletarFoto(req, res) {
  try {
    const { id } = req.params;
    
    const foto = await db('os_fotos').where({ id }).first('caminho_arquivo');
    
    if (!foto) {
      return res.status(404).json({ erro: 'Foto não encontrada' });
    }
    
    const rowsDeleted = await db('os_fotos').where({ id }).del();

    if (rowsDeleted > 0) {
      try {
        const caminhoCompleto = path.join(__dirname, '..', foto.caminho_arquivo);
        await fs.unlink(caminhoCompleto);
      } catch (fsError) {
        console.error('Arquivo físico não encontrado ou já foi deletado:', fsError);
      }
    }
    
    res.json({
      sucesso: true,
      mensagem: 'Foto deletada com sucesso'
    });
    
  } catch (erro) {
    console.error('Erro ao deletar foto:', erro);
    res.status(500).json({ erro: 'Erro ao deletar foto' });
  }
}

export {
  uploadFoto,
  listarFotosOS,
  deletarFoto
};
