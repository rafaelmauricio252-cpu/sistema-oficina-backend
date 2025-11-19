const db = require('./config/db');

async function listAllTables() {
  try {
    const result = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('Tabelas no banco de dados:');
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    console.log('\nAnálise de cada tabela:');
    
    // Para cada tabela, vamos obter as colunas
    for (const row of result.rows) {
      const tableName = row.table_name;
      console.log(`\n📋 Tabela: ${tableName}`);
      
      // Obter colunas
      const columns = await db.raw(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = ?
        ORDER BY ordinal_position;
      `, [tableName]);
      
      columns.rows.forEach(col => {
        console.log(`   • ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(opcional)' : '(obrigatório)'} ${col.column_default ? `[default: ${col.column_default}]` : ''}`);
      });
    }
    
  } catch (error) {
    console.error('Erro ao listar tabelas:', error);
  } finally {
    await db.destroy();
  }
}

listAllTables();