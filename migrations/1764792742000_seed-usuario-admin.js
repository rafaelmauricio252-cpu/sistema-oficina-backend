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
  // Hash da senha 'admin123' gerado com bcrypt rounds=10
  const senhaHash = '$2b$10$dLcujpC9iSF5pgerpCvm8Of4CP4DP9gJq5ooAJaKwyhya33JY2Mie';

  pgm.sql(`
    INSERT INTO usuarios (nome, email, senha_hash, tipo, ativo, deve_trocar_senha)
    VALUES (
      'Administrador',
      'admin@oficina.com',
      '${senhaHash}',
      'admin',
      true,
      true
    )
    ON CONFLICT (email) DO NOTHING;
  `);
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export async function down(pgm) {
  pgm.sql(`
    DELETE FROM usuarios WHERE email = 'admin@oficina.com';
  `);
}
