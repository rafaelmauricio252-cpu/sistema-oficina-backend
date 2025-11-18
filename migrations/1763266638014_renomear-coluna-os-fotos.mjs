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
  // Renomear coluna url_foto para caminho_arquivo
  pgm.renameColumn('os_fotos', 'url_foto', 'caminho_arquivo');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  // Reverter: renomear caminho_arquivo de volta para url_foto
  pgm.renameColumn('os_fotos', 'caminho_arquivo', 'url_foto');
};
