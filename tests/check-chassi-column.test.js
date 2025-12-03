const knex = require('../config/db');

describe('Verificar colunas chassi e km', () => {
  afterAll(async () => {
    await knex.destroy();
  });

  it('Deve ter a coluna chassi na tabela veiculos', async () => {
    const hasColumn = await knex.schema.hasColumn('veiculos', 'chassi');
    console.log('✅ Coluna chassi existe?', hasColumn);
    expect(hasColumn).toBe(true);
  });

  it('Deve ter a coluna km na tabela veiculos', async () => {
    const hasColumn = await knex.schema.hasColumn('veiculos', 'km');
    console.log('✅ Coluna km existe?', hasColumn);
    expect(hasColumn).toBe(true);
  });
});
