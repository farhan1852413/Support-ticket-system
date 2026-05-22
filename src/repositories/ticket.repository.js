const pool = require('../config/db');

const createTicket = async (data) => {
  const {
    title,
    description,
    category_id,
    priority,
    created_by,
    sentiment_mood
  } = data;

  const [result] = await pool.query(
    `INSERT INTO tickets 
     (title, description, category_id, priority, created_by, sentiment_mood) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [title, description, category_id, priority, created_by, sentiment_mood || 'Neutral']
  );

  return result.insertId;
};

const getTickets = async (user, filters) => {
  let baseQuery = `
    FROM tickets t
    LEFT JOIN categories c ON t.category_id = c.id
  `;

  let conditions = [];
  let values = [];

  // 🔹 ROLE-BASED VISIBILITY
  if (user.role === 'user') {
    conditions.push('t.created_by = ?');
    values.push(user.id);
  }

  if (user.role === 'agent') {
    conditions.push('t.assigned_to = ?');
    values.push(user.id);
  }

  // 🔹 ASSIGNED FILTER (admin only)
  if (filters.assigned === 'unassigned' && user.role === 'admin') {
    conditions.push('t.assigned_to IS NULL');
  }

  // 🔹 STATUS FILTER
  if (filters.status) {
    conditions.push('t.status = ?');
    values.push(filters.status);
  }

  // 🔹 PRIORITY FILTER
  if (filters.priority) {
    conditions.push('t.priority = ?');
    values.push(filters.priority);
  }

  // 🔹 CATEGORY FILTER
  if (filters.category_id) {
    conditions.push('t.category_id = ?');
    values.push(filters.category_id);
  }

  // Apply WHERE clause
  if (conditions.length > 0) {
    baseQuery += ' WHERE ' + conditions.join(' AND ');
  }

  // 🔹 COUNT QUERY (for pagination)
  const [countRows] = await pool.query(
    `SELECT COUNT(*) as total ${baseQuery}`,
    values
  );

  const total = countRows[0].total;

  // 🔹 PAGINATION
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 5;
  const offset = (page - 1) * limit;

  // 🔹 SAFE SORTING (whitelisted)
  const allowedSortFields = [
    'created_at',
    'updated_at',
    'priority',
    'status'
  ];

  const sortField = allowedSortFields.includes(filters.sort)
    ? filters.sort
    : 'updated_at';

  const order = filters.order === 'asc' ? 'ASC' : 'DESC';

  // 🔹 FINAL QUERY
  const [rows] = await pool.query(
    `SELECT t.*, c.name AS category_name ${baseQuery}
     ORDER BY t.${sortField} ${order}
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  return {
    data: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

const getTicketById = async (id) => {
  const [rows] = await pool.query(
    `
    SELECT 
      t.*, 
      c.name AS category_name,
      c.department_id AS category_department_id
    FROM tickets t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
    `,
    [id]
  );

  return rows[0];
};

const updateTicketStatus = async (ticketId, newStatus) => {
  let extraFields = '';
  let values = [newStatus];

  if (newStatus === 'Resolved') {
    extraFields = ', resolved_at = NOW()';
  }

  if (newStatus === 'Closed') {
    extraFields = ', closed_at = NOW()';
  }

  values.push(ticketId);

  await pool.query(
    `UPDATE tickets 
     SET status = ? ${extraFields} 
     WHERE id = ?`,
    values
  );
};

const updateStatus = async (ticketId, status) => {
  await pool.query(
    'UPDATE tickets SET status = ? WHERE id = ?',
    [status, ticketId]
  );
};

const assignTicket = async (ticketId, agentId) => {
  await pool.query(
    `UPDATE tickets 
     SET assigned_to = ?
     WHERE id = ?`,
    [agentId, ticketId]
  );
};

const updateTicketPriority = async (ticketId, newPriority) => {
  await pool.query(
    `UPDATE tickets 
     SET priority = ?
     WHERE id = ?`,
    [newPriority, ticketId]
  );
};

const getResolvedTickets = async (limit = 10) => {
  const [rows] = await pool.query(
    `SELECT id, title, description, category_id, status 
     FROM tickets 
     WHERE status = 'Resolved' 
     ORDER BY created_at DESC 
     LIMIT ?`,
    [limit]
  );
  return rows;
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  updateTicketPriority,
  assignTicket,
  updateStatus,
  getResolvedTickets
};