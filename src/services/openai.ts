import { CONFIG, SYSTEM_PROMPT } from '@/config/constants';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export class OpenAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: CONFIG.OPENAI_MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          ],
          max_tokens: CONFIG.MAX_TOKENS,
          temperature: CONFIG.TEMPERATURE,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  async analyzeFinancialText(text: string, context?: string): Promise<string> {
    const analysisPrompt = `Analyze this financial text for sentiment and key insights:

Text: "${text}"
${context ? `Context: ${context}` : ''}

Provide:
1. Sentiment score (0-1)
2. Key events detected
3. Market implications
4. Risk factors`;

    return this.sendMessage([
      { role: 'user', content: analysisPrompt }
    ]);
  }
}