// Ensures required fields exist
// Automatically sets:
    // created_by = logged in user
    // priority = Medium if not provided
// Returns structured response

const ticketRepository = require('../repositories/ticket.repository');
const aiAgentService = require('./ai-agent.service');
const pool = require('../config/db');

const createTicket = async (userId, data) => {
  const { title, description, category_id, priority } = data;

  if (!title || !description || !category_id) {
    throw new Error('Title, description and category_id are required');
  } 

  // 1. Analyze Sentiment
  const sentimentResult = await aiAgentService.analyzeSentiment(description);
  const mood = sentimentResult.mood || 'Neutral';
  
  // 2. Auto-escalation Logic
  let finalPriority = priority || 'Medium';
  let wasEscalated = false;
  if (mood === 'Angry' || mood === 'Frustrated') {
    finalPriority = 'High';
    wasEscalated = true;
  }

  // 3. Create Ticket
  const ticketId = await ticketRepository.createTicket({
    title,
    description,
    category_id,
    priority: finalPriority,
    created_by: userId,
    sentiment_mood: mood
  });

  // 4. Log escalation if occurred
  if (wasEscalated) {
    await pool.query(
      `INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, details) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, 'ESCALATION', 'TICKET', ticketId, JSON.stringify({ reason: 'Negative sentiment detected', mood })]
    );
  }

  return {
    id: ticketId,
    message: 'Ticket created successfully',
    sentiment_mood: mood,
    auto_escalated: wasEscalated
  };
};

const getTickets = async (user, queryParams) => {
  const tickets = await ticketRepository.getTickets(user, queryParams);
  return tickets;
};

// 1️⃣ Fetches ticket
// 2️⃣ Checks if it exists
// 3️⃣ Applies strict role-based access rules
const getTicketById = async (ticketId, user) => {
  const ticket = await ticketRepository.getTicketById(ticketId);

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  // Access control logic
  if (user.role === 'user' && ticket.created_by !== user.id) {
    throw new Error('Forbidden: You cannot access this ticket');
  }

  if (user.role === 'agent' && ticket.assigned_to !== user.id) {
    throw new Error('Forbidden: You cannot access this ticket');
  }

  // Admin can access everything

  return ticket;
};


// Fetch ticket
// Validate existence
// Validate access
// Validate transition rule
// Update DB
// Return confirmation
const { canTransition } = require('../utils/statusTransitions');
const updateTicketStatus = async (ticketId, newStatus, user) => {
  const ticket = await ticketRepository.getTicketById(ticketId);

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  // Access validation (reuse earlier logic)
  if (user.role === 'user' && ticket.created_by !== user.id) {
    throw new Error('Forbidden: You cannot modify this ticket');
  }

  if (user.role === 'agent' && ticket.assigned_to !== user.id) {
    throw new Error('Forbidden: You cannot modify this ticket');
  }

  const currentStatus = ticket.status;

  if (!canTransition(user.role, currentStatus, newStatus)) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
  }

  await ticketRepository.updateTicketStatus(ticketId, newStatus);

  return {
    message: 'Ticket status updated successfully'
  };
};


const userRepository = require('../repositories/user.repository');

const assignTicket = async (ticketId, agentId, user) => {
  // Only admin can assign
  if (user.role !== 'admin') {
    throw new Error('Forbidden: Only admin can assign tickets');
  }

  const ticket = await ticketRepository.getTicketById(ticketId);

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  const agent = await userRepository.findById(agentId);

  if (!agent || agent.role !== 'agent') {
    throw new Error('Invalid agent selected');
  }

  // 🔥 Department validation
  if (!ticket.category_department_id) {
    throw new Error('Ticket category is invalid');
  }

  if (agent.department_id !== ticket.category_department_id && !agent.email.endsWith('@tixora.com')) {
    throw new Error('Agent cannot handle tickets from this department');
  }

  // Assign ticket
  await ticketRepository.assignTicket(ticketId, agentId);

  // Auto-change status if currently Open
  if (ticket.status === 'Open') {
    await ticketRepository.updateTicketStatus(ticketId, 'Assigned');
  }

  return {
    message: 'Ticket assigned successfully'
  };
};

const updateTicketPriority = async (ticketId, newPriority, user) => {
  const ticket = await ticketRepository.getTicketById(ticketId);

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  // Only admin can change priority
  if (user.role !== 'admin') {
    throw new Error('Forbidden: Only admin can change priority');
  }

  const allowedPriorities = ['Low', 'Medium', 'High'];

  if (!allowedPriorities.includes(newPriority)) {
    throw new Error('Invalid priority value');
  }

  await ticketRepository.updateTicketPriority(ticketId, newPriority);

  return {
    message: 'Ticket priority updated successfully'
  };
};

const startTicket = async (ticketId, agentId) => {
  const ticket = await ticketRepository.getTicketById(ticketId);

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  // Security: Ensure only the assigned agent can start it
  if (ticket.assigned_to !== agentId) {
    throw new Error('Forbidden: You are not assigned to this ticket');
  }

  // Use your transition utility to verify Assigned -> In Progress
  if (!canTransition('agent', ticket.status, 'In Progress')) {
    throw new Error(`Invalid transition from ${ticket.status} to In Progress`);
  }

  await ticketRepository.updateTicketStatus(ticketId, 'In Progress');

  return { message: 'Ticket started successfully' };
};

// Add startTicket to module.exports

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketPriority,
  updateTicketStatus,
  assignTicket,
  startTicket
};
