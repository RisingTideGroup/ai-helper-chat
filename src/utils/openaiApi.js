export class OpenAIAPI {
  constructor() {
    this.apiKey = '';
    this.model = 'gpt-4';
  }

  async initialize() {
    const settings = await new Promise(resolve =>
      chrome.storage.local.get(['openaiKey', 'openaiModel'], resolve)
    );
    
    this.apiKey = settings.openaiKey;
    this.model = settings.openaiModel || 'gpt-4';
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
  }

  async sendMessage(messages, context = null) {
    await this.initialize();

    const systemMessage = {
      role: 'system',
      content: `You are a helpful assistant for HaloPSA (Professional Services Automation). You help users understand and work with their PSA data.

When responding:
- Be concise and helpful
- Format data in a readable way using markdown when appropriate
- Suggest relevant actions when appropriate
- If data seems incomplete, mention what additional information might be helpful
- Use tables for structured data when it makes sense
- Highlight important information like ticket numbers, client names, etc.

${context ? `Current HaloPSA data context: ${JSON.stringify(context, null, 2)}` : ''}`
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response generated';
  }

  async analyzeQuery(query) {
    await this.initialize();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{
          role: 'system',
          content: `Analyze the user's query and determine what HaloPSA data they're asking about. 
          
          Respond with a JSON object containing:
          - "intent": the main intent (e.g., "get_tickets", "get_clients", "create_ticket", "get_user_info")
          - "entities": any specific entities mentioned (ticket numbers, client names, user names, etc.)
          - "filters": any filters or conditions mentioned
          
          Example response:
          {
            "intent": "get_tickets",
            "entities": {"status": "open", "assigned_to": "john"},
            "filters": {"priority": "high"}
          }`
        }, {
          role: 'user',
          content: query
        }],
        temperature: 0.1,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    try {
      return JSON.parse(data.choices?.[0]?.message?.content || '{}');
    } catch {
      return { intent: 'general', entities: {}, filters: {} };
    }
  }
}

export const openaiApi = new OpenAIAPI();