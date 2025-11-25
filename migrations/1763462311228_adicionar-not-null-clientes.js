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
  // Adicionar constraint NOT NULL na coluna cpf_cnpj
  pgm.alterColumn('clientes', 'cpf_cnpj', {
    notNull: true,
  });

  // Adicionar constraint NOT NULL na coluna telefone
  pgm.alterColumn('clientes', 'telefone', {
    notNull: true,
  });
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export async function down(pgm) {
  // Reverter: remover constraint NOT NULL da coluna telefone
  pgm.alterColumn('clientes', 'telefone', {
    notNull: false,
  });

  // Reverter: remover constraint NOT NULL da coluna cpf_cnpj
  pgm.alterColumn('clientes', 'cpf_cnpj', {
    notNull: false,
  });
}
