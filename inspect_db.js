const db = require('./config/db');

async function inspectMecanicosTable() {
  try {
    const columns = await db.raw("SELECT column_name, data_type, column_default, is_nullable FROM information_schema.columns WHERE table_name = 'mecanicos' ORDER BY ordinal_position;");
    console.log('Schema for mecanicos table:');
    console.table(columns.rows);
  } catch (error) {
    console.error('Error inspecting mecanicos table:', error);
  } finally {
    await db.destroy();
  }
}

inspectMecanicosTable();
