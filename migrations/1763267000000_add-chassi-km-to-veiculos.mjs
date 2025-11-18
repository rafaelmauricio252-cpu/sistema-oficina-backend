/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export async function up(pgm) {
  pgm.sql(`
    ALTER TABLE veiculos
    ADD COLUMN IF NOT EXISTS chassi VARCHAR(50),
    ADD COLUMN IF NOT EXISTS km INTEGER;
  `);
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export async function down(pgm) {
  pgm.sql(`
    ALTER TABLE veiculos
    DROP COLUMN IF EXISTS chassi,
    DROP COLUMN IF EXISTS km;
  `);
}
