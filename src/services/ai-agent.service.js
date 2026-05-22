// 🤖 AI Agent Service
// Handles all interactions with Google Gemini API
// Backend-proxied for security

const axios = require('axios');
const { GEMINI_API_KEY, GEMINI_API_URL } = require('../config/env');
const ticketRepository = require('../repositories/ticket.repository');

/**
 * Enhanced Gemini API caller with proper history and error handling
 * @param {string} prompt - The current user message
 * @param {string} systemContext - System instructions
 * @param {Array} history - Previous conversation turns
 */
const callGemini = async (prompt, systemContext = '', history = []) => {
  try {
    if (!GEMINI_API_KEY) {
      console.error('AI Agent Service: GEMINI_API_KEY is missing');
      throw new Error('GEMINI_API_KEY not configured');
    }

    const contents = [];

    // Add history turns if any
    if (history && Array.isArray(history)) {
      history.forEach(msg => {
        // Map common frontend roles to Gemini roles
        let role = 'user';
        if (msg.type === 'ai' || msg.type === 'model' || msg.role === 'model' || msg.role === 'ai') {
          role = 'model';
        }
        
        contents.push({
          role: role,
          parts: [{ text: msg.content || msg.text || msg.message_text || '' }]
        });
      });
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: systemContext ? `${systemContext}\n\n${prompt}` : prompt }]
    });

    console.log(`AI Agent Service: Calling Gemini [${contents.length} turns]`);

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: contents,
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30s timeout
      }
    );

    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return response.data.candidates[0].content.parts[0].text;
    }

    throw new Error('Empty response from AI engine');
  } catch (error) {
    const errorDetail = error.response?.data || error.message;
    console.error('AI Agent Service - Gemini API Error:', JSON.stringify(errorDetail));
    
    // Check for high demand / rate limits
    if (error.response?.status === 503 || error.response?.status === 429) {
      throw new Error('AI engine is currently at high capacity. Please try again in a moment.');
    }
    
    throw new Error(`AI Service Error: ${error.message}`);
  }
};

// Draft ticket description
const draftTicketDescription = async (title, category) => {
  const prompt = `As a support ticket system assistant, help me draft a professional and clear description for a support ticket.

Title: ${title}
Category: ${category}

Please provide a well-structured ticket description template with:
1. Problem Summary (2-3 sentences)
2. Steps to Reproduce (if applicable)
3. Expected Behavior
4. Current Behavior
5. Additional Context

Keep it concise but comprehensive.`;

  const systemContext = `You are a helpful support ticket assistant. Your role is to help users create clear, professional, and complete support tickets.`;

  return await callGemini(prompt, systemContext);
};

// Suggest solutions based on ticket content
const suggestSolutions = async (title, description, category) => {
  const prompt = `As a support system AI, analyze this ticket and suggest 3-5 potential solutions.

Title: ${title}
Category: ${category}
Description: ${description}

For each solution, provide:
1. Solution title (max 10 words)
2. Description (2-3 sentences)
3. Difficulty level (Easy/Medium/Hard)
4. Estimated resolution time
5. Whether it requires admin intervention

Format as a JSON array of solutions. Return ONLY the JSON.`;

  const systemContext = `You are a technical support expert. Analyze support tickets and provide practical, actionable solutions. Always return valid JSON.`;

  const response = await callGemini(prompt, systemContext);
  
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { solutions: response };
  } catch {
    return { solutions: response };
  }
};

// Predict resolution time (ML feature)
const predictResolutionTime = async (title, description, priority) => {
  const prompt = `Based on the following support ticket, predict the estimated time to resolve it in hours.
  
  Title: ${title}
  Description: ${description}
  Priority: ${priority}
  
  Provide:
  1. Estimated Hours (a single number)
  2. Confidence level (0.0 to 1.0)
  3. Complexity factor (Low/Medium/High/Extreme)
  4. Short reasoning (1 sentence)
  
  Format as JSON: { "hours": number, "confidence": number, "complexity": "string", "reasoning": "string" }`;

  const systemContext = `You are an AI specialized in project management and technical support estimation. Return ONLY valid JSON.`;

  const response = await callGemini(prompt, systemContext);
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { hours: 4, confidence: 0.5, complexity: "Medium", reasoning: "Default estimate." };
  } catch {
    return { hours: 4, confidence: 0.5, complexity: "Medium", reasoning: "Error parsing prediction." };
  }
};

// Suggest similar old tickets (Recommendation Engine)
const getSimilarTickets = async (title, description) => {
  // Fetch historical tickets
  const historicalTickets = await ticketRepository.getResolvedTickets(15);
  
  const ticketsContext = historicalTickets.map(t => `ID: ${t.id}, Title: ${t.title}`).join('\n');
  
  const prompt = `Analyze this NEW ticket and compare it with the following HISTORICAL tickets.
  New Ticket Title: ${title}
  New Ticket Description: ${description}
  
  Historical Tickets:
  ${ticketsContext}
  
  Find the 2-3 most similar historical tickets.
  Respond with a JSON array of objects: [ { "id": number, "similarity": number, "reason": "string" } ]
  Return ONLY the JSON.`;

  const systemContext = `You are a ticket similarity engine. You identify patterns and relate current issues to past resolutions. Return ONLY valid JSON.`;

  const response = await callGemini(prompt, systemContext);
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    return [];
  }
};

// Auto-categorize ticket
const categorizeTicket = async (title, description, availableCategories) => {
  const categoriesList = availableCategories.map(c => c.name).join(', ');
  
  const prompt = `As a support system AI, categorize this ticket into one of the available categories.

Title: ${title}
Description: ${description}

Available Categories: ${categoriesList}

Respond with ONLY the category name that best matches this ticket. Choose from the available categories list.`;

  const systemContext = `You are a support ticket categorization expert. Return only the category name, nothing else.`;

  const response = await callGemini(prompt, systemContext);
  const suggestedCategory = response.trim();

  const validCategory = availableCategories.find(
    c => c.name.toLowerCase() === suggestedCategory.toLowerCase()
  );

  return {
    suggested_category: validCategory?.name || availableCategories[0].name,
    confidence: 0.8,
    reasoning: response
  };
};

// Recommend priority and assign agent
const recommendPriorityAndAgent = async (title, description, category, availableAgents = []) => {
  const agentsList = availableAgents.length > 0 
    ? availableAgents.map(a => `${a.full_name} (${a.specialization || 'General'})`).join(', ')
    : 'No specific agents available';

  const prompt = `As a support system AI, analyze this ticket and recommend:
1. Priority level (Low/Medium/High/Urgent)
2. Best agent assignment (if available)
3. Reasoning for the recommendation

Ticket:
Title: ${title}
Category: ${category}
Description: ${description}

Available Agents: ${agentsList}

Respond in JSON format with keys: priority, recommended_agent, reasoning. Return ONLY JSON.`;

  const systemContext = `You are a support ticket triaging expert. Analyze tickets and recommend appropriate priority and agent assignments. Always return valid JSON.`;

  const response = await callGemini(prompt, systemContext);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { priority: 'Medium', reasoning: response };
  } catch {
    return { priority: 'Medium', reasoning: response };
  }
};

// Chat with AI (real-time conversation)
const chatWithAI = async (userMessage, conversationContext = [], ticketData = null) => {
  let systemContext = `You are "Aura", a premium support AI assistant. 
  Your tone is professional, efficient, and slightly futuristic. 
  You help users with their support tickets, technical issues, and platform navigation.
  
  Platform Features:
  - Create tickets for hardware, software, network, access, or general issues.
  - Real-time status updates.
  - Priority management.
  - Achievement system for active users.`;

  if (ticketData) {
    systemContext += `\n\nCurrent Ticket Context:
    - ID: #${ticketData.id}
    - Title: ${ticketData.title}
    - Category: ${ticketData.category_name || ticketData.category}
    - Status: ${ticketData.status}
    - Description: ${ticketData.description}`;
  }

  return await callGemini(userMessage, systemContext, conversationContext);
};

// Generate ticket summary
const generateTicketSummary = async (title, description, messages = []) => {
  const messagesSummary = messages.map(m => `${m.sender_name}: ${m.content}`).join('\n');

  const prompt = `As a support system AI, create a concise summary of this support ticket conversation.

Title: ${title}
Description: ${description}

Conversation:
${messagesSummary || 'No messages yet'}

Provide:
1. Brief issue summary (1-2 sentences)
2. Key points discussed (3-5 bullet points)
3. Current status/progress
4. Next recommended action`;

  const systemContext = `You are a support ticket analyst. Create clear, concise summaries of support ticket conversations.`;

  return await callGemini(prompt, systemContext);
};

// Analyze sentiment and detect mood
const analyzeSentiment = async (text) => {
  const prompt = `Perform sentiment analysis on this text as if you were an ensemble of models (VADER, TextBlob, DistilBERT).
  
  Text: "${text}"
  
  Classify the customer's mood into EXACTLY ONE of these categories:
  - Angry
  - Frustrated
  - Neutral
  - Happy
  
  Also provide a sentiment score between -1.0 (very negative) and 1.0 (very positive).
  
  Format as JSON: { "mood": "Angry|Frustrated|Neutral|Happy", "score": number, "reasoning": "string" }
  Return ONLY valid JSON.`;

  const systemContext = `You are an advanced sentiment analysis engine simulating VADER, TextBlob, and DistilBERT. Return ONLY valid JSON.`;

  const response = await callGemini(prompt, systemContext);
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { mood: "Neutral", score: 0, reasoning: response };
  } catch {
    return { mood: "Neutral", score: 0, reasoning: "Error parsing sentiment." };
  }
};

module.exports = {
  callGemini,
  draftTicketDescription,
  suggestSolutions,
  categorizeTicket,
  recommendPriorityAndAgent,
  chatWithAI,
  generateTicketSummary,
  predictResolutionTime,
  getSimilarTickets,
  analyzeSentiment
};
