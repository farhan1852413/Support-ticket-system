const ticketRepository = require('../repositories/ticket.repository');
const messageRepository = require('../repositories/message.repository');
const { canTransition } = require('../utils/statusTransitions');
const messageEmitter = require('../utils/messageEvents');

const createMessage = async (ticketId, messageText, user) => {
  if (!messageText) {
    throw new Error('Message text is required');
  }

  const ticket = await ticketRepository.getTicketById(ticketId);

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  // Access control
  if (user.role === 'user' && ticket.created_by !== user.id) {
    throw new Error('Forbidden: You cannot message this ticket');
  }

  if (user.role === 'agent' && ticket.assigned_to !== user.id) {
    throw new Error('Forbidden: You cannot message this ticket');
  }

  const createdMessage = await messageRepository.createMessage(
  ticketId,
  user.id,
  messageText
);

  // Auto status updates
  const currentStatus = ticket.status;

  let newStatus = null;

  if (user.role === 'agent' && currentStatus === 'In Progress') {
    newStatus = 'Awaiting User Response';
  }

  if (user.role === 'user' && currentStatus === 'Awaiting User Response') {
    newStatus = 'In Progress';
  }

  if (newStatus && canTransition(user.role, currentStatus, newStatus)) {
    await ticketRepository.updateTicketStatus(ticketId, newStatus);
  }

  messageEmitter.emit('newMessage', {
    ticketId,
    message: createdMessage
  });

  return createdMessage;
};


const getNewMessages = async (ticketId, user, lastId) => {
  const ticket = await ticketRepository.getTicketById(ticketId);

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  if (user.role === 'user' && ticket.created_by !== user.id) {
    throw new Error('Forbidden');
  }

  if (user.role === 'agent' && ticket.assigned_to !== user.id) {
    throw new Error('Forbidden');
  }

  return await messageRepository.getNewMessages(ticketId, lastId);
};

module.exports = {
  createMessage,
  getNewMessages
};
