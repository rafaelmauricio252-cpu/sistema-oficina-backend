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
    CREATE TABLE IF NOT EXISTS permissoes (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      modulo VARCHAR(50) NOT NULL,
      criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(usuario_id, modulo)
    );
  `);

  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_permissoes_usuario_id ON permissoes(usuario_id);
  `);
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export async function down(pgm) {
  pgm.sql(`
    DROP TABLE IF EXISTS permissoes CASCADE;
  `);
}
