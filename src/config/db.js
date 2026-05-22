// 🎯Purpose : 
    // Create MySQL connection pool
    // Export it
    // Test DB connectivity early
// We will use mysql2/promise (very important).

// 🧠 Why We Use Pool :
    // ✔ Handles multiple requests
    // ✔ Prevents connection exhaustion
    // ✔ Production-ready pattern
// Never use single createConnection() in real projects.


const mysql = require('mysql2/promise');
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = require('./env');

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Optional: Test DB connection on startup & initialize schema
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    
    // Initialize schema for new tables
    await initializeSchema(connection);
    
    connection.release();
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    process.exit(1);
  }
};

const initializeSchema = async (connection) => {
  try {
    // User Profiles Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL UNIQUE,
        phone VARCHAR(20),
        address TEXT,
        department VARCHAR(100),
        team VARCHAR(100),
        avatar_url VARCHAR(500),
        bio TEXT,
        profile_visibility ENUM('public', 'private') DEFAULT 'public',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        KEY idx_user_id (user_id)
      )
    `);

    // Add sentiment_mood to tickets
    try {
      await connection.execute(`ALTER TABLE tickets ADD COLUMN sentiment_mood VARCHAR(50) DEFAULT 'Neutral'`);
      console.log('✅ Added sentiment_mood to tickets table');
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        console.error('Error adding sentiment_mood:', error.message);
      }
    }

    // User Achievements/Badges Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        achievement_type VARCHAR(50) NOT NULL,
        badge_name VARCHAR(100) NOT NULL,
        description TEXT,
        icon_url VARCHAR(500),
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        KEY idx_user_id (user_id),
        KEY idx_earned_at (earned_at)
      )
    `);

    // Activity Logs Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50),
        entity_id INT,
        details JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        KEY idx_user_id (user_id),
        KEY idx_created_at (created_at),
        KEY idx_action_type (action_type)
      )
    `);

    // Profile Edit Approvals Table (for pending profile changes)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS profile_edit_requests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        changes JSON NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP NULL,
        reviewed_by INT,
        review_notes TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
        KEY idx_user_id (user_id),
        KEY idx_status (status)
      )
    `);

    console.log('✅ Database schema initialized');
  } catch (error) {
    // Table might already exist, which is fine
    if (error.code !== 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️ Schema tables check completed');
    }
  }
};

testConnection();

module.exports = pool;
