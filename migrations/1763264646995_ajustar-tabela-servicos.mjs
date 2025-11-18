/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // Renomear coluna 'preco' para 'preco_padrao'
  pgm.renameColumn('servicos', 'preco', 'preco_padrao');

  // Adicionar coluna 'tempo_estimado' (em minutos)
  pgm.addColumn('servicos', {
    tempo_estimado: {
      type: 'integer',
      notNull: false,
      comment: 'Tempo estimado do serviço em minutos'
    }
  });

  // Adicionar coluna 'ativo'
  pgm.addColumn('servicos', {
    ativo: {
      type: 'boolean',
      notNull: true,
      default: true,
      comment: 'Indica se o serviço está ativo'
    }
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  // Remover coluna 'ativo'
  pgm.dropColumn('servicos', 'ativo');

  // Remover coluna 'tempo_estimado'
  pgm.dropColumn('servicos', 'tempo_estimado');

  // Renomear coluna 'preco_padrao' de volta para 'preco'
  pgm.renameColumn('servicos', 'preco_padrao', 'preco');
};
