import React, { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../shared/store";
import { addMessageToChat, clearChatHistory } from "../../../shared/store";
import { createOpenRouterAPI, validateOpenRouterConfig } from "../../api/openrouter";
import { ChatMessage } from "../../../shared/types";
import { getLocalizedString } from "../../lib/i18n";
import { PlatformWebSocket } from "../../../left_panel/api/platform";
import ActionButtons from "../ActionButtons/ActionButtons";
import ChatInterface from "../ChatInterface/ChatInterface";
import "../../../shared/styles/global.css";

const Panel = () => {
  const dispatch = useAppDispatch();
  const { 
    openRouterConfig, 
    chatHistory, 
    documents, 
    analysisId, 
    isLoading 
  } = useAppSelector(state => state.legalAgent);
  
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<PlatformWebSocket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const websocket = new PlatformWebSocket('right');
    websocket.connect((message) => {
      // Handle real-time messages from left panel
      console.log('Received message from left panel:', message);
    }).catch(console.error);
    
    setWs(websocket);
    
    return () => {
      websocket.disconnect();
    };
  }, []);

  const sendChatMessage = async (message: string) => {
    if (!openRouterConfig || !validateOpenRouterConfig(openRouterConfig)) {
      setError('OpenRouter configuration is invalid. Please check your settings.');
      return;
    }

    try {
      setError(null);
      
      // Add user message to chat
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };
      dispatch(addMessageToChat(userMessage));

      // Create OpenRouter API instance and send request
      const openRouterAPI = createOpenRouterAPI(openRouterConfig);
      const response = await openRouterAPI.sendChatCompletion([...chatHistory, userMessage]);

      // Add assistant response to chat
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      dispatch(addMessageToChat(assistantMessage));

    } catch (error) {
      console.error('Error sending chat message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    }
  };

  const handleDocumentAnalysis = async (analysisType: 'legal_review' | 'contract_analysis' | 'compliance_check' | 'risk_assessment') => {
    if (!openRouterConfig || !validateOpenRouterConfig(openRouterConfig)) {
      setError('OpenRouter configuration is invalid. Please check your settings.');
      return;
    }

    if (!documents.length) {
      setError('No documents available for analysis. Please upload documents first.');
      return;
    }

    try {
      setError(null);
      
      const openRouterAPI = createOpenRouterAPI(openRouterConfig);
      
      // Analyze each document
      for (const document of documents) {
        if (document.content) {
          const analysis = await openRouterAPI.analyzeDocument(document.content, analysisType);
          
          // Add analysis result to chat
          const analysisMessage: ChatMessage = {
            id: Date.now().toString() + document._id,
            role: 'assistant',
            content: `**${analysisType.replace('_', ' ').toUpperCase()} - ${document.name}**\n\n${analysis}`,
            timestamp: new Date().toISOString(),
          };
          dispatch(addMessageToChat(analysisMessage));
        }
      }

    } catch (error) {
      console.error('Error analyzing documents:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze documents');
    }
  };

  const handleExtractFindings = async (findingTypes: string[]) => {
    if (!openRouterConfig || !validateOpenRouterConfig(openRouterConfig)) {
      setError('OpenRouter configuration is invalid. Please check your settings.');
      return;
    }

    if (!documents.length) {
      setError('No documents available for analysis. Please upload documents first.');
      return;
    }

    try {
      setError(null);
      
      const openRouterAPI = createOpenRouterAPI(openRouterConfig);
      
      // Extract findings from each document
      for (const document of documents) {
        if (document.content) {
          const findings = await openRouterAPI.extractFindings(document.content, findingTypes);
          
          // Add findings to chat
          const findingsMessage: ChatMessage = {
            id: Date.now().toString() + document._id,
            role: 'assistant',
            content: `**FINDINGS EXTRACTED - ${document.name}**\n\n${findings}`,
            timestamp: new Date().toISOString(),
          };
          dispatch(addMessageToChat(findingsMessage));

          // Send message to left panel to highlight findings
          if (ws) {
            ws.sendMessage({
              type: 'FINDINGS_EXTRACTED',
              payload: {
                documentId: document._id,
                findings: findings,
              },
            });
          }
        }
      }

    } catch (error) {
      console.error('Error extracting findings:', error);
      setError(error instanceof Error ? error.message : 'Failed to extract findings');
    }
  };

  const handleClearChat = () => {
    dispatch(clearChatHistory());
  };

  return (
    <div className="legal-agent-right-panel">
      <div className="panel-header">
        {getLocalizedString("legalAgentRightPanel", "Legal Agent - AI Assistant")}
        {openRouterConfig && (
          <span style={{ 
            fontSize: '12px', 
            color: 'var(--secondary-color)',
            marginLeft: '8px'
          }}>
            ({openRouterConfig.model})
          </span>
        )}
      </div>
      
      <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {error && (
          <div className="error">
            {error}
            <button 
              className="btn btn-primary" 
              onClick={() => setError(null)}
              style={{ marginLeft: '12px' }}
            >
              Dismiss
            </button>
          </div>
        )}

        {!openRouterConfig && (
          <div style={{ 
            padding: '20px',
            textAlign: 'center',
            color: 'var(--secondary-color)'
          }}>
            Please configure OpenRouter settings to use the AI assistant.
          </div>
        )}

        {openRouterConfig && (
          <>
            {/* Action Buttons */}
            <ActionButtons
              onDocumentAnalysis={handleDocumentAnalysis}
              onExtractFindings={handleExtractFindings}
              onClearChat={handleClearChat}
              disabled={isLoading}
              hasDocuments={documents.length > 0}
            />

            {/* Chat Interface */}
            <ChatInterface
              messages={chatHistory}
              onSendMessage={sendChatMessage}
              isLoading={isLoading}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Panel;
