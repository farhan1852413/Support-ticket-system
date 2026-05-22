const pool = require('./src/config/db');

async function migrate() {
  try {
    const connection = await pool.getConnection();
    
    // Add sentiment_mood column if it doesn't exist (MySQL doesn't support IF NOT EXISTS for ADD COLUMN natively in a simple query, so we try/catch)
    try {
      await connection.query('ALTER TABLE tickets ADD COLUMN sentiment_mood VARCHAR(50) DEFAULT "Neutral"');
      console.log('✅ Added sentiment_mood to tickets table');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ sentiment_mood column already exists in tickets table');
      } else {
        throw err;
      }
    }
    
    connection.release();
    process.exit(0);
  } catch (err) {
    console.error('Migration Failed:', err);
    process.exit(1);
  }
}

migrate();
