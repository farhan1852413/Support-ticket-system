const express = require('express');
const router = express.Router();

const ticketController = require('../controllers/ticket.controller');
const authMiddleware = require('../middleware/auth.middleware');
const messageController = require('../controllers/message.controller');


router.post('/', authMiddleware, ticketController.createTicket);
router.get('/', authMiddleware, ticketController.getTickets);
router.get('/:id', authMiddleware, ticketController.getTicketById);
router.patch('/:id/status', authMiddleware, ticketController.updateTicketStatus);
router.patch('/:id/priority', authMiddleware, ticketController.updateTicketPriority);
router.patch('/:id/assign', authMiddleware, ticketController.assignTicket);
router.post('/:id/messages', authMiddleware, messageController.createMessage);
router.get('/:id/messages', authMiddleware, messageController.getMessages);
router.patch('/:id/start', authMiddleware, ticketController.startTicket);

module.exports = router;
