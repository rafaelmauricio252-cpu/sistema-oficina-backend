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
  // Adicionar coluna usuario_id
  pgm.sql(`
    ALTER TABLE estoque_movimentacao
    ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL;
  `);

  // Adicionar comentário na coluna
  pgm.sql(`
    COMMENT ON COLUMN estoque_movimentacao.usuario_id IS 'Usuário que realizou a movimentação';
  `);

  // Criar índices para performance
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_estoque_movimentacao_peca_id ON estoque_movimentacao(peca_id);
  `);

  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_estoque_movimentacao_usuario_id ON estoque_movimentacao(usuario_id);
  `);

  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_estoque_movimentacao_data ON estoque_movimentacao(data_movimentacao DESC);
  `);

  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_estoque_movimentacao_tipo ON estoque_movimentacao(tipo_movimentacao);
  `);

  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_estoque_peca_data ON estoque_movimentacao(peca_id, data_movimentacao DESC);
  `);
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export async function down(pgm) {
  pgm.sql(`DROP INDEX IF EXISTS idx_estoque_peca_data;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_estoque_movimentacao_tipo;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_estoque_movimentacao_data;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_estoque_movimentacao_usuario_id;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_estoque_movimentacao_peca_id;`);
  pgm.sql(`ALTER TABLE estoque_movimentacao DROP COLUMN IF EXISTS usuario_id;`);
}
