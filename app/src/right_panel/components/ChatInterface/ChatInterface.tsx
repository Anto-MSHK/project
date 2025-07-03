




import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../../../shared/types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessageContent = (content: string): React.ReactNode => {
    // Simple markdown-like formatting
    const parts = content.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} style={{ color: 'var(--primary-color)' }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="chat-container">
      {/* Messages Area */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: 'var(--secondary-color)',
            padding: '40px 20px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
            <h3 style={{ margin: '0 0 8px 0' }}>Legal AI Assistant</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Ask me questions about your documents, request analysis, or get legal guidance.
            </p>
            <div style={{ 
              marginTop: '20px', 
              fontSize: '12px',
              padding: '12px',
              backgroundColor: 'var(--hover-color)',
              borderRadius: '8px',
              textAlign: 'left'
            }}>
              <strong>Example questions:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li>What are the key risks in this contract?</li>
                <li>Summarize the payment terms</li>
                <li>Are there any compliance issues?</li>
                <li>What happens if either party wants to terminate?</li>
              </ul>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`chat-message ${message.role}`}
              style={{
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{ 
                fontSize: '12px', 
                opacity: 0.7, 
                marginBottom: '4px',
                color: message.role === 'user' ? 'rgba(255,255,255,0.8)' : 'var(--secondary-color)'
              }}>
                {message.role === 'user' ? 'You' : 'AI Assistant'} • {formatTimestamp(message.timestamp)}
              </div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                {renderMessageContent(message.content)}
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="chat-message assistant">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: 'var(--secondary-color)'
            }}>
              <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
              AI is thinking...
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your documents or request legal analysis..."
            className="chat-input"
            disabled={isLoading}
            rows={1}
            style={{
              flex: 1,
              minHeight: '40px',
              maxHeight: '120px',
              resize: 'none',
              overflow: 'hidden'
            }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!inputValue.trim() || isLoading}
            style={{ 
              alignSelf: 'flex-end',
              minWidth: '60px',
              height: '40px'
            }}
          >
            {isLoading ? '...' : '📤'}
          </button>
        </form>
        
        <div style={{ 
          fontSize: '11px', 
          color: 'var(--secondary-color)',
          marginTop: '8px',
          textAlign: 'center'
        }}>
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;





