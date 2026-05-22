// Read request body
// Extract logged-in user
// Call service
// Send response
// Handle errors

const ticketService = require('../services/ticket.service');

const createTicket = async (req, res, next) => {
  try {
    const userId = req.user.id; // comes from auth middleware
    const result = await ticketService.createTicket(userId, req.body);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getTickets = async (req, res, next) => {
  try {
    const user = req.user;
    const filters = req.query;

    const tickets = await ticketService.getTickets(user, filters);

    res.status(200).json(tickets);
  } catch (error) {
    next(error);
  }
};


const getTicketById = async (req, res, next) => {
  try {
    const ticketId = req.params.id;
    const user = req.user;

    const ticket = await ticketService.getTicketById(ticketId, user);

    res.status(200).json(ticket);
  } catch (error) {
    next(error);
  }
};


const updateTicketStatus = async (req, res, next) => {
  try {
    const ticketId = req.params.id;
    const { status } = req.body;
    const user = req.user;

    const result = await ticketService.updateTicketStatus(
      ticketId,
      status,
      user
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateTicketPriority = async (req, res, next) => {
  try {
    const ticketId = req.params.id;
    const { priority } = req.body;
    const user = req.user;

    const result = await ticketService.updateTicketPriority(
      ticketId,
      priority,
      user
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const assignTicket = async (req, res, next) => {
  try {
    const ticketId = req.params.id;
    const { agentId } = req.body;
    const user = req.user;

    const result = await ticketService.assignTicket(
      ticketId,
      agentId,
      user
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const startTicket = async (req, res, next) => {
  try {
    const ticketId = req.params.id;
    const agentId = req.user.id; // From authMiddleware

    const result = await ticketService.startTicket(ticketId, agentId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  updateTicketPriority,
  assignTicket,
  startTicket
};
