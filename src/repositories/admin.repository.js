const db = require('../config/db');

/**
 * Get all users (basic info)
 */
const getAllUsers = async () => {
  const [rows] = await db.execute(`
    SELECT 
      u.id,
      u.full_name,
      u.email,
      u.role,
      u.is_active,
      d.name AS department,
      u.created_at
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    ORDER BY u.created_at DESC
  `);

  return rows;
};

const pool = require('../config/db');

const getAgentsByCategory = async (categoryId) => {
  const [rows] = await pool.query(
    `
    SELECT DISTINCT
      u.id,
      u.full_name,
      u.email,
      u.level
    FROM users u
    LEFT JOIN categories c 
      ON u.department_id = c.department_id AND c.id = ?
    WHERE 
      u.role = 'agent'
      AND u.is_active = TRUE
      AND (c.id IS NOT NULL OR u.email LIKE '%@tixora.com')
    ORDER BY u.full_name ASC
    `,
    [categoryId]
  );

  return rows;
};

/**
 * Toggle user active status
 */
const toggleUserActiveStatus = async (userId, newStatus) => {
  const [result] = await db.execute(
    `UPDATE users SET is_active = ? WHERE id = ?`,
    [newStatus, userId]
  );

  return result;
};


/**
 * Update user role
 */
const updateUserRole = async (userId, role) => {
  const [result] = await db.execute(
    `UPDATE users SET role = ? WHERE id = ?`,
    [role, userId]
  );

  return result;
};

const getTicketAnalytics = async () => {
  const [rows] = await db.execute(`
    SELECT 
      COUNT(*) AS totalTickets,
      SUM(status = 'Open') AS open,
      SUM(status = 'In Progress') AS inProgress,
      SUM(status = 'Awaiting User Response') AS awaitingUserResponse,
      SUM(status = 'Resolved') AS resolved,
      SUM(status = 'Closed') AS closed
    FROM tickets
  `);

  return rows[0];
};

/**
 * Get advanced analytics for charts
 */
const getAdvancedAnalytics = async () => {
  // 1. Tickets per day (last 7 days)
  const [perDay] = await db.execute(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM tickets
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);

  // 2. Category distribution
  const [byCategory] = await db.execute(`
    SELECT c.name, COUNT(t.id) as count
    FROM categories c
    LEFT JOIN tickets t ON c.id = t.category_id
    GROUP BY c.id
  `);

  // 3. Resolution metrics (Average time in hours)
  const [metrics] = await db.execute(`
    SELECT 
      COALESCE(AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)), 0) as avgResolutionTime,
      COALESCE((SELECT COUNT(*) FROM tickets WHERE status = 'Resolved') / NULLIF(COUNT(*), 0) * 100, 0) as resolutionRate
    FROM tickets
  `);

  return {
    perDay,
    byCategory,
    metrics: metrics[0] || { avgResolutionTime: 0, resolutionRate: 0 }
  };
};

module.exports = {
  getAllUsers,
  toggleUserActiveStatus,
  updateUserRole,
  getTicketAnalytics,
  getAdvancedAnalytics,
  getAgentsByCategory
};