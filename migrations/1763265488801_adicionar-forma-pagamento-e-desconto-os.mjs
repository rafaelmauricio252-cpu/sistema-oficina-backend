/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Adicionar coluna forma_pagamento
  pgm.addColumn('ordem_servico', {
    forma_pagamento: {
      type: 'varchar(50)',
      notNull: false,
      comment: 'Forma de pagamento (Dinheiro, Cartão, PIX, etc.)'
    }
  });

  // Adicionar coluna desconto
  pgm.addColumn('ordem_servico', {
    desconto: {
      type: 'decimal(10, 2)',
      notNull: true,
      default: 0.00,
      comment: 'Valor do desconto aplicado'
    }
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Remover colunas
  pgm.dropColumn('ordem_servico', 'desconto', { ifExists: true });
  pgm.dropColumn('ordem_servico', 'forma_pagamento', { ifExists: true });
};
