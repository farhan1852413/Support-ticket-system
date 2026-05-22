const pool = require('../config/db');

const createMessage = async (ticketId, senderId, messageText) => {
  const [result] = await pool.query(
    `INSERT INTO ticket_messages (ticket_id, sender_id, message_text)
     VALUES (?, ?, ?)`,
    [ticketId, senderId, messageText]
  );

  const [rows] = await pool.query(
    `SELECT tm.id, tm.message_text, tm.created_at,
            u.full_name, u.role
     FROM ticket_messages tm
     JOIN users u ON tm.sender_id = u.id
     WHERE tm.id = ?`,
    [result.insertId]
  );

  return rows[0];
};

const getNewMessages = async (ticketId, lastId) => {
  const [rows] = await pool.query(
    `SELECT tm.id,tm.sender_id, tm.message_text, tm.created_at,
            u.full_name, u.role
     FROM ticket_messages tm
     JOIN users u ON tm.sender_id = u.id
     WHERE tm.ticket_id = ?
     AND tm.id > ?
     ORDER BY tm.id ASC`,
    [ticketId, lastId]
  );

  return rows;
};

module.exports = {
  createMessage,
  getNewMessages
};
