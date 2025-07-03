


import axios from 'axios';
import { 
  OpenRouterConfig, 
  OpenRouterRequest, 
  OpenRouterResponse, 
  ChatMessage,
  OpenRouterMessage 
} from '../../../shared/types';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export class OpenRouterAPI {
  private config: OpenRouterConfig;

  constructor(config: OpenRouterConfig) {
    this.config = config;
  }

  async sendChatCompletion(
    messages: ChatMessage[],
    systemPrompt?: string
  ): Promise<string> {
    try {
      // Convert ChatMessage[] to OpenRouterMessage[]
      const openRouterMessages: OpenRouterMessage[] = [];
      
      // Add system prompt if provided
      if (systemPrompt) {
        openRouterMessages.push({
          role: 'system',
          content: systemPrompt,
        });
      }

      // Add chat history
      messages.forEach(msg => {
        openRouterMessages.push({
          role: msg.role,
          content: msg.content,
        });
      });

      const requestPayload: OpenRouterRequest = {
        model: this.config.model,
        messages: openRouterMessages,
        temperature: 0.7,
        max_tokens: 4000,
      };

      const response = await axios.post<OpenRouterResponse>(
        `${OPENROUTER_BASE_URL}/chat/completions`,
        requestPayload,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Legal-Agent',
          },
          timeout: 60000, // 60 seconds timeout
        }
      );

      if (response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content;
      } else {
        throw new Error('No response from OpenRouter API');
      }
    } catch (error) {
      console.error('OpenRouter API error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid API key. Please check your OpenRouter configuration.');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (error.response?.status === 402) {
          throw new Error('Insufficient credits. Please check your OpenRouter account.');
        } else {
          throw new Error(`OpenRouter API error: ${error.response?.data?.error?.message || error.message}`);
        }
      }
      throw error;
    }
  }

  async analyzeDocument(
    documentContent: string,
    analysisType: 'legal_review' | 'contract_analysis' | 'compliance_check' | 'risk_assessment'
  ): Promise<string> {
    const systemPrompts = {
      legal_review: `You are a legal expert conducting a comprehensive legal review. Analyze the provided document for:
- Legal compliance issues
- Potential risks and liabilities
- Missing clauses or provisions
- Recommendations for improvement
Provide a detailed analysis with specific citations and actionable recommendations.`,
      
      contract_analysis: `You are a contract specialist analyzing the provided contract. Focus on:
- Key terms and conditions
- Obligations and rights of each party
- Termination clauses
- Payment terms
- Dispute resolution mechanisms
- Potential ambiguities or problematic clauses
Provide a structured analysis with recommendations.`,
      
      compliance_check: `You are a compliance officer reviewing the document for regulatory compliance. Examine:
- Adherence to relevant laws and regulations
- Industry-specific compliance requirements
- Data protection and privacy considerations
- Required disclosures and notices
- Compliance gaps and remediation steps
Provide a compliance assessment with specific recommendations.`,
      
      risk_assessment: `You are a risk management expert conducting a risk assessment. Identify:
- Legal risks and exposure
- Financial risks
- Operational risks
- Reputational risks
- Mitigation strategies
Provide a comprehensive risk analysis with prioritized recommendations.`
    };

    const messages: ChatMessage[] = [
      {
        id: Date.now().toString(),
        role: 'user',
        content: `Please analyze the following document:\n\n${documentContent}`,
        timestamp: new Date().toISOString(),
      }
    ];

    return this.sendChatCompletion(messages, systemPrompts[analysisType]);
  }

  async generateLegalAdvice(
    query: string,
    context?: string
  ): Promise<string> {
    const systemPrompt = `You are a legal AI assistant providing legal guidance. 
IMPORTANT: Always include appropriate disclaimers that this is not legal advice and users should consult with qualified attorneys for specific legal matters.

Provide helpful, accurate legal information while being clear about limitations.`;

    const userContent = context 
      ? `Context: ${context}\n\nQuestion: ${query}`
      : query;

    const messages: ChatMessage[] = [
      {
        id: Date.now().toString(),
        role: 'user',
        content: userContent,
        timestamp: new Date().toISOString(),
      }
    ];

    return this.sendChatCompletion(messages, systemPrompt);
  }

  async extractFindings(
    documentContent: string,
    findingTypes: string[]
  ): Promise<string> {
    const systemPrompt = `You are a legal document analyzer. Extract and identify specific findings from the document based on the requested types: ${findingTypes.join(', ')}.

For each finding, provide:
1. The exact text or clause
2. Location/section reference
3. Category/type of finding
4. Significance level (High/Medium/Low)
5. Brief explanation

Format your response as a structured list for easy parsing.`;

    const messages: ChatMessage[] = [
      {
        id: Date.now().toString(),
        role: 'user',
        content: `Please extract findings of types [${findingTypes.join(', ')}] from this document:\n\n${documentContent}`,
        timestamp: new Date().toISOString(),
      }
    ];

    return this.sendChatCompletion(messages, systemPrompt);
  }

  updateConfig(newConfig: OpenRouterConfig): void {
    this.config = newConfig;
  }
}

// Utility functions
export const createOpenRouterAPI = (config: OpenRouterConfig): OpenRouterAPI => {
  return new OpenRouterAPI(config);
};

export const validateOpenRouterConfig = (config: OpenRouterConfig): boolean => {
  return !!(config.apiKey && config.apiKey.trim() && config.model && config.model.trim());
};


