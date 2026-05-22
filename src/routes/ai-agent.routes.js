const express = require('express');
const router = express.Router();
const aiAgentController = require('../controllers/ai-agent.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All AI routes require authentication
router.use(authMiddleware);

// Draft ticket description
router.post('/draft-description', aiAgentController.draftDescription);

// Suggest solutions
router.post('/suggest-solutions', aiAgentController.suggestSolutions);

// Auto-categorize ticket
router.post('/categorize', aiAgentController.categorizeTicket);

// Recommend priority and agent assignment
router.post('/recommend', aiAgentController.recommendPriorityAndAgent);

// Chat with AI
router.post('/chat', aiAgentController.chat);

// Generate ticket summary
router.post('/summary', aiAgentController.generateSummary);

// Predict resolution time
router.post('/predict-resolution', aiAgentController.predictResolutionTime);

// Get similar tickets
router.post('/similar-tickets', aiAgentController.getSimilarTickets);

module.exports = router;
