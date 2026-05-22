const aiAgentService = require('./src/services/ai-agent.service');

async function testAI() {
  try {
    console.log('Testing AI Agent...');
    const response = await aiAgentService.chatWithAI('Hello, how can you help me today?');
    console.log('AI Agent Response:', response);
    process.exit(0);
  } catch (error) {
    console.error('AI Agent Error:', error.message);
    process.exit(1);
  }
}

testAI();
