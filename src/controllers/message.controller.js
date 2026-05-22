const messageService = require('../services/message.service');

const createMessage = async (req, res, next) => {
  try {
    const ticketId = req.params.id;
    const { message } = req.body;
    const user = req.user;

    const newMessage = await messageService.createMessage(
      ticketId,
      message,
      user
    );

    res.status(201).json(newMessage);
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const ticketId = req.params.id;
    const user = req.user;
    const lastSeenMessageId = parseInt(req.query.lastId) || 0;

    const timeout = 30000;
    const pollInterval = 2000;
    const startTime = Date.now();

    const checkForMessages = async () => {
      const newMessages = await messageService.getNewMessages(
        ticketId,
        user,
        lastSeenMessageId
      );

      if (newMessages.length > 0) {
        return res.status(200).json(newMessages);
      }

      if (Date.now() - startTime >= timeout) {
        return res.status(200).json([]);
      }

      setTimeout(checkForMessages, pollInterval);
    };
    
    checkForMessages();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  createMessage 
};