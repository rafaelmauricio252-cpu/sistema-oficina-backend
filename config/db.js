// config/db.js
const knex = require('knex');
const config = require('../knexfile');

const environment = process.env.NODE_ENV || 'development';
const db = knex(config[environment]);

// Adiciona um teste de conexão para verificar se o Knex está funcionando
db.raw('SELECT 1')
  .then(() => {
    console.log('✅ Conexão com o banco de dados (Knex) estabelecida com sucesso.');
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar com o banco de dados (Knex):', err);
  });

module.exports = db;
