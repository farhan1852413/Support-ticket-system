const pool = require('./src/config/db');

async function checkCategories() {
  try {
    const [rows] = await pool.query('SELECT * FROM categories');
    console.log('Categories in DB:');
    console.table(rows);
    process.exit(0);
  } catch (error) {
    console.error('Error checking categories:', error.message);
    process.exit(1);
  }
}

checkCategories();
