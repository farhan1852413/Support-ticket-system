const pool = require('./src/config/db');
const { hashPassword } = require('./src/utils/password');

async function seed() {
  try {
    const password = await hashPassword('agent123');
    
    // Clear previously seeded Tixora users and profiles to avoid duplicates and starting fresh
    const [existingUsers] = await pool.query("SELECT id FROM users WHERE email LIKE '%@tixora.com'");
    const existingIds = existingUsers.map(u => u.id);
    if (existingIds.length > 0) {
      await pool.query("DELETE FROM user_profiles WHERE user_id IN (?)", [existingIds]);
      await pool.query("DELETE FROM users WHERE id IN (?)", [existingIds]);
    }
    console.log('🧹 Cleared previous @tixora.com users and profiles');

    const users = [
      { full_name: 'Aarav Patel', email: 'aarav@tixora.com', role: 'user', department_id: 4, gender: 'male' },
      { full_name: 'Diya Sharma', email: 'diya@tixora.com', role: 'user', department_id: 2, gender: 'female' },
      { full_name: 'Kabir Malhotra', email: 'kabir@tixora.com', role: 'user', department_id: 3, gender: 'male' },
      { full_name: 'Farru Prasad', email: 'farru@tixora.com', role: 'user', department_id: 4, gender: 'male' },
      { full_name: 'Rohan Gupta', email: 'rohan@tixora.com', role: 'agent', department_id: 1, gender: 'male' }, // IT
      { full_name: 'Priya Sharma', email: 'priya@tixora.com', role: 'agent', department_id: 9, gender: 'female' }, // Security
      { full_name: 'Ananya Iyer', email: 'ananya@tixora.com', role: 'agent', department_id: 7, gender: 'female' }, // Operations
      { full_name: 'Kotagasti Kumar', email: 'kotagasti@tixora.com', role: 'agent', department_id: 1, gender: 'male' }, // IT
      { full_name: 'Arjun Mehta', email: 'arjun@tixora.com', role: 'admin', department_id: 8, gender: 'male' } // Admin
    ];

    const maleAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop";
    const femaleAvatar = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop";

    for (const u of users) {
      try {
        const [res] = await pool.query(
          'INSERT INTO users (full_name, email, password_hash, role, department_id) VALUES (?, ?, ?, ?, ?)',
          [u.full_name, u.email, password, u.role, u.department_id]
        );
        const userId = res.insertId;

        // Choose avatar based on gender
        const avatarUrl = u.gender === 'male' ? maleAvatar : femaleAvatar;

        // Create initial profile for the user
        await pool.query(
          'INSERT INTO user_profiles (user_id, avatar_url, bio, phone, address, department, team) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userId, avatarUrl, `System ${u.role} profile for ${u.full_name}`, '+91 99999 99999', 'Mumbai, India', u.role === 'admin' ? 'Administration' : 'Support', 'Tixora Core Team']
        );

        console.log(`Inserted ${u.role}: ${u.email} (with ${u.gender} avatar)`);
      } catch (err) {
        console.error(`Failed to insert ${u.email}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Fatal error:', err);
  } finally {
    process.exit();
  }
}

seed();
