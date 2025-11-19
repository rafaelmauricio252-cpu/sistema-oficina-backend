// config/db.js
const knex = require('knex');
const config = require('../knexfile');

const environment = process.env.NODE_ENV || 'development';

// Em produção, usar DATABASE_URL (padrão do Railway/Heroku)
const dbConfig = process.env.DATABASE_URL && environment === 'production'
  ? {
      client: 'pg',
      connection: process.env.DATABASE_URL,
      pool: {
        min: 2,
        max: 10
      },
      migrations: {
        tableName: 'knex_migrations',
        directory: './migrations'
      }
    }
  : config[environment];

const db = knex(dbConfig);

// Adiciona um teste de conexão para verificar se o Knex está funcionando
db.raw('SELECT 1')
  .then(() => {
    console.log('✅ Conexão com o banco de dados (Knex) estabelecida com sucesso.');
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar com o banco de dados (Knex):', err);
  });

export default db;
