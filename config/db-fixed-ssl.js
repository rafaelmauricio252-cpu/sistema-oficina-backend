// config/db.js - VERSAO CORRIGIDA COM SSL
import 'dotenv/config';
import knex from 'knex';
import knexConfig from '../knexfile.js';

const environment = process.env.NODE_ENV || 'development';

// Em producao, usar DATABASE_URL (padrao do Render) COM SSL
const dbConfig = process.env.DATABASE_URL && environment === 'production'
  ? {
      client: 'pg',
      connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }  // CORRECAO: Adicionar SSL para Render
      },
      pool: {
        min: 2,
        max: 10
      },
      migrations: {
        tableName: 'knex_migrations',
        directory: './migrations'
      }
    }
  : knexConfig[environment];

const db = knex(dbConfig);

// Adiciona um teste de conexao para verificar se o Knex esta funcionando
db.raw('SELECT 1')
  .then(() => {
    console.log('✅ Conexao com o banco de dados (Knex) estabelecida com sucesso.');
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar com o banco de dados (Knex):', err);
  });

export default db;
