// 🤖 AI Agent Controller
// Handles incoming requests for AI assistance

const aiAgentService = require('../services/ai-agent.service');
const userRepository = require('../repositories/user.repository');

// Draft ticket description
const draftDescription = async (req, res) => {
  try {
    const { title, category } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const draft = await aiAgentService.draftTicketDescription(title, category || 'General');

    // Log activity
    await userRepository.logActivity(req.user.id, 'AI_DRAFT', 'ticket', null, { title, category });

    res.json({ success: true, draft });
  } catch (error) {
    console.error('Draft description error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Suggest solutions
const suggestSolutions = async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const solutions = await aiAgentService.suggestSolutions(title, description, category || 'General');

    // Log activity
    await userRepository.logActivity(req.user.id, 'AI_SUGGEST', 'solution', null, { title, category });

    res.json({ success: true, solutions });
  } catch (error) {
    console.error('Suggest solutions error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Auto-categorize ticket
const categorizeTicket = async (req, res) => {
  try {
    const { title, description, categories } = req.body;

    if (!title || !description || !Array.isArray(categories)) {
      return res.status(400).json({
        error: 'Title, description, and categories array are required'
      });
    }

    const categorization = await aiAgentService.categorizeTicket(
      title,
      description,
      categories
    );

    // Log activity
    await userRepository.logActivity(req.user.id, 'AI_CATEGORIZE', 'ticket', null, { title });

    res.json({ success: true, categorization });
  } catch (error) {
    console.error('Categorize ticket error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Recommend priority and agent
const recommendPriorityAndAgent = async (req, res) => {
  try {
    const { title, description, category, agents } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const recommendation = await aiAgentService.recommendPriorityAndAgent(
      title,
      description,
      category || 'General',
      agents || []
    );

    // Log activity
    await userRepository.logActivity(req.user.id, 'AI_RECOMMEND', 'ticket', null, { title });

    res.json({ success: true, recommendation });
  } catch (error) {
    console.error('Recommend priority error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Chat with AI
const chat = async (req, res) => {
  try {
    const { message, context, ticketId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // If ticketId provided, fetch ticket context (would need to implement)
    let ticketData = null;
    if (ticketId) {
      // TODO: Fetch ticket from repository
      // ticketData = await ticketRepository.getTicketById(ticketId);
    }

    const response = await aiAgentService.chatWithAI(message, context || '', ticketData);

    // Log activity
    await userRepository.logActivity(req.user.id, 'AI_CHAT', 'message', ticketId, { message });

    res.json({ success: true, response });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Generate ticket summary
const generateSummary = async (req, res) => {
  try {
    const { ticketTitle, ticketDescription, messages } = req.body;

    if (!ticketTitle || !ticketDescription) {
      return res.status(400).json({ error: 'Ticket title and description are required' });
    }

    const summary = await aiAgentService.generateTicketSummary(
      ticketTitle,
      ticketDescription,
      messages || []
    );

    // Log activity
    await userRepository.logActivity(req.user.id, 'AI_SUMMARY', 'ticket', null, { ticketTitle });

    res.json({ success: true, summary });
  } catch (error) {
    console.error('Generate summary error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Predict resolution time
const predictResolutionTime = async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    const prediction = await aiAgentService.predictResolutionTime(title, description, priority);
    res.json({ success: true, prediction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get similar tickets
const getSimilarTickets = async (req, res) => {
  try {
    const { title, description } = req.body;
    const recommendations = await aiAgentService.getSimilarTickets(title, description);
    res.json({ success: true, recommendations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  draftDescription,
  suggestSolutions,
  categorizeTicket,
  recommendPriorityAndAgent,
  chat,
  generateSummary,
  predictResolutionTime,
  getSimilarTickets
};
