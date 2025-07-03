// OpenRouter Configuration
export interface OpenRouterConfig {
  apiKey: string;
  model: string;
}

// Document types
export interface Document {
  _id: string;
  name: string;
  content: string;
  uploadedAt: string;
  analysisId: string;
}

// Analysis Session types
export interface AnalysisSession {
  _id: string;
  name: string;
  createdAt: string;
  agentId: string;
}

// Finding types
export interface Finding {
  _id: string;
  text: string;
  documentId: string;
  startPosition: number;
  endPosition: number;
  category: string;
  confidence: number;
  analysisId: string;
}

// Chat Message types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Global State
export interface GlobalState {
  openRouterConfig: OpenRouterConfig | null;
  agentId: string | null;
  analysisId: string | null;
  documents: Document[];
  findings: Finding[];
  chatHistory: ChatMessage[];
  isLoading: boolean;
  isConfigured: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// OpenRouter API types
export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}
