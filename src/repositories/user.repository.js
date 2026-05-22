// 🧠 What This Layer Does
    // Only SQL.
    // Nothing else.

// Later:
    // Service will call this
    // Controller will call service
    // This is clean layering.

const pool = require('../config/db');

const findByEmail = async (email) => {
  const [rows] = await pool.query(
    'SELECT u.*, up.avatar_url FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE u.email = ? LIMIT 1',
    [email]
  );
  return rows[0];
};

const findById = async (id) => {
  const [rows] = await pool.query(
    'SELECT u.id, u.full_name, u.email, u.role, u.department_id, u.is_active, up.avatar_url FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE u.id = ?',
    [id]
  );
  return rows[0];
};

const findPasswordByUserId = async (id) => {
  const [rows] = await pool.query(
    'SELECT password_hash FROM users WHERE id = ?',
    [id]
  );
  return rows[0]?.password_hash;
};

const updateResetToken = async (userId, token, expiry) => {
  await pool.query(
    'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
    [token, expiry, userId]
  );
};

const updatePassword = async (userId, hashedPassword) => {
  await pool.query(
    'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
    [hashedPassword, userId]
  );
};

// Profile-related queries
const getProfileWithStats = async (userId) => {
  const [rows] = await pool.query(`
    SELECT 
      u.id, u.full_name, u.email, u.role, u.created_at,
      up.phone, up.address, up.department, up.team, up.avatar_url, up.bio,
      COUNT(DISTINCT t.id) as total_tickets,
      COUNT(DISTINCT CASE WHEN t.status = 'Resolved' THEN t.id END) as resolved_tickets,
      COUNT(DISTINCT CASE WHEN t.status = 'Open' THEN t.id END) as open_tickets,
      COUNT(DISTINCT CASE WHEN t.status = 'In Progress' THEN t.id END) as in_progress_tickets
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN tickets t ON u.id = t.created_by OR u.id = t.assigned_to
    WHERE u.id = ?
    GROUP BY u.id
  `, [userId]);
  return rows[0];
};

const createOrUpdateProfile = async (userId, profileData) => {
  const { phone, address, department, team, avatar_url, bio } = profileData;
  
  const [result] = await pool.query(`
    INSERT INTO user_profiles (user_id, phone, address, department, team, avatar_url, bio)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      phone = VALUES(phone),
      address = VALUES(address),
      department = VALUES(department),
      team = VALUES(team),
      avatar_url = VALUES(avatar_url),
      bio = VALUES(bio),
      updated_at = CURRENT_TIMESTAMP
  `, [userId, phone, address, department, team, avatar_url, bio]);
  
  return result;
};

const getActivityLog = async (userId, limit = 50) => {
  const [rows] = await pool.query(`
    SELECT id, action_type, entity_type, entity_id, details, created_at
    FROM activity_logs
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `, [userId, limit]);
  
  return rows;
};

const logActivity = async (userId, actionType, entityType, entityId, details) => {
  await pool.query(`
    INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details)
    VALUES (?, ?, ?, ?, ?)
  `, [userId, actionType, entityType, entityId, JSON.stringify(details)]);
};

const getAchievements = async (userId) => {
  const [rows] = await pool.query(`
    SELECT id, achievement_type, badge_name, description, icon_url, earned_at
    FROM user_achievements
    WHERE user_id = ?
    ORDER BY earned_at DESC
  `, [userId]);
  
  return rows;
};

const addAchievement = async (userId, achievementType, badgeName, description, iconUrl) => {
  const [result] = await pool.query(`
    INSERT INTO user_achievements (user_id, achievement_type, badge_name, description, icon_url)
    VALUES (?, ?, ?, ?, ?)
  `, [userId, achievementType, badgeName, description, iconUrl]);
  
  return result;
};

const getProfileEditRequest = async (requestId) => {
  const [rows] = await pool.query(`
    SELECT * FROM profile_edit_requests WHERE id = ?
  `, [requestId]);
  
  return rows[0];
};

const createProfileEditRequest = async (userId, changes) => {
  const [result] = await pool.query(`
    INSERT INTO profile_edit_requests (user_id, changes)
    VALUES (?, ?)
  `, [userId, JSON.stringify(changes)]);
  
  return result;
};

const getPendingProfileEdits = async (limit = 50) => {
  const [rows] = await pool.query(`
    SELECT per.id, per.user_id, u.full_name, u.email, per.changes, per.requested_at
    FROM profile_edit_requests per
    JOIN users u ON per.user_id = u.id
    WHERE per.status = 'pending'
    ORDER BY per.requested_at DESC
    LIMIT ?
  `, [limit]);
  
  return rows;
};

const approveProfileEdit = async (requestId, reviewedById) => {
  const [result] = await pool.query(`
    UPDATE profile_edit_requests
    SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?
    WHERE id = ?
  `, [reviewedById, requestId]);
  
  return result;
};

const rejectProfileEdit = async (requestId, reviewedById, notes) => {
  const [result] = await pool.query(`
    UPDATE profile_edit_requests
    SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?, review_notes = ?
    WHERE id = ?
  `, [reviewedById, notes, requestId]);
  
  return result;
};


module.exports = {
  findByEmail,
  findById,
  updateResetToken,
  updatePassword,
  findPasswordByUserId,
  getProfileWithStats,
  createOrUpdateProfile,
  getActivityLog,
  logActivity,
  getAchievements,
  addAchievement,
  getProfileEditRequest,
  createProfileEditRequest,
  getPendingProfileEdits,
  approveProfileEdit,
  rejectProfileEdit
};
