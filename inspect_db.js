const pool = require('./src/config/db');

async function inspectTicketsTable() {
  try {
    const [rows] = await pool.query('DESCRIBE tickets');
    console.log('Tickets Table Structure:');
    console.table(rows);
    process.exit(0);
  } catch (error) {
    console.error('Error inspecting tickets table:', error.message);
    process.exit(1);
  }
}

inspectTicketsTable();
