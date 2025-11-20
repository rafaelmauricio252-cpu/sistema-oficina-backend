/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.up = async (pgm) => {
  pgm.sql(`
    ALTER TABLE veiculos
    ADD COLUMN IF NOT EXISTS chassi VARCHAR(50),
    ADD COLUMN IF NOT EXISTS km INTEGER;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.down = async (pgm) => {
  pgm.sql(`
    ALTER TABLE veiculos
    DROP COLUMN IF EXISTS chassi,
    DROP COLUMN IF EXISTS km;
  `);
};
