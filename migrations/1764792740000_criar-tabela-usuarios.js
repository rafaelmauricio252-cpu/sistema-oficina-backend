/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export async function up(pgm) {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      senha_hash VARCHAR(255) NOT NULL,
      tipo VARCHAR(20) NOT NULL DEFAULT 'comum',
      ativo BOOLEAN NOT NULL DEFAULT true,
      deve_trocar_senha BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
  `);

  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo);
  `);
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export async function down(pgm) {
  pgm.sql(`
    DROP TABLE IF EXISTS usuarios CASCADE;
  `);
}
