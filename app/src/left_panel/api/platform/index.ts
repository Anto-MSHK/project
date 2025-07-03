

import axios from 'axios';
import { Document, AnalysisSession, Finding, ApiResponse } from '../../../shared/types';

const baseURL = 'http://localhost:3000';
const moduleId = 'legal-agent';

const api = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'X-Module-Id': moduleId,
  },
});

// Analysis Sessions API
export const analysisApi = {
  async getAnalyses(agentId: string): Promise<AnalysisSession[]> {
    try {
      const response = await api.get(`/api/db/${moduleId}/analyses`, {
        params: {
          filter: JSON.stringify({ agentId }),
        },
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching analyses:', error);
      throw error;
    }
  },

  async createAnalysis(agentId: string, name: string): Promise<AnalysisSession> {
    try {
      const response = await api.post(`/api/db/${moduleId}/analyses`, {
        name,
        agentId,
        createdAt: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating analysis:', error);
      throw error;
    }
  },

  async deleteAnalysis(analysisId: string): Promise<void> {
    try {
      await api.delete(`/api/db/${moduleId}/analyses/${analysisId}`);
    } catch (error) {
      console.error('Error deleting analysis:', error);
      throw error;
    }
  },
};

// Documents API
export const documentsApi = {
  async getDocuments(agentId: string, analysisId: string): Promise<Document[]> {
    try {
      const response = await api.get(`/api/db/${moduleId}/documents`, {
        params: {
          filter: JSON.stringify({ agentId, analysisId }),
        },
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  async uploadDocument(file: File, agentId: string, analysisId: string): Promise<Document> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('agentId', agentId);
      formData.append('analysisId', analysisId);

      const response = await api.post(`/api/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  async getDocument(documentId: string): Promise<Document> {
    try {
      const response = await api.get(`/api/db/${moduleId}/documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  },

  async deleteDocument(documentId: string): Promise<void> {
    try {
      await api.delete(`/api/db/${moduleId}/documents/${documentId}`);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },
};

// Findings API
export const findingsApi = {
  async getFindings(agentId: string, analysisId: string): Promise<Finding[]> {
    try {
      const response = await api.get(`/api/db/${moduleId}/findings`, {
        params: {
          filter: JSON.stringify({ agentId, analysisId }),
        },
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching findings:', error);
      throw error;
    }
  },

  async createFinding(finding: Omit<Finding, '_id'>): Promise<Finding> {
    try {
      const response = await api.post(`/api/db/${moduleId}/findings`, finding);
      return response.data;
    } catch (error) {
      console.error('Error creating finding:', error);
      throw error;
    }
  },

  async deleteFinding(findingId: string): Promise<void> {
    try {
      await api.delete(`/api/db/${moduleId}/findings/${findingId}`);
    } catch (error) {
      console.error('Error deleting finding:', error);
      throw error;
    }
  },
};

// WebSocket for real-time communication
export class PlatformWebSocket {
  private ws: WebSocket | null = null;
  private moduleId: string;
  private panelId: string;

  constructor(panelId: 'left' | 'right') {
    this.moduleId = moduleId;
    this.panelId = panelId;
  }

  connect(onMessage?: (message: any) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `ws://localhost:3000/ws?moduleId=${this.moduleId}&panel=${this.panelId}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'connection_established') {
              console.log('WebSocket connection established');
              return;
            }
            if (onMessage) {
              onMessage(message);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        ...message,
        sender: this.panelId,
      }));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}


