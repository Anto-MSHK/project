
import React, { useState } from 'react';
import { useAppDispatch } from '../store';
import { setOpenRouterConfig } from '../store';
import { OpenRouterConfig } from '../types';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigurationModal: React.FC<ConfigurationModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('openai/gpt-4o');
  const [error, setError] = useState('');
  const dispatch = useAppDispatch();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError('API Key is required');
      return;
    }
    
    if (!model.trim()) {
      setError('Model selection is required');
      return;
    }

    const config: OpenRouterConfig = {
      apiKey: apiKey.trim(),
      model: model.trim(),
    };

    dispatch(setOpenRouterConfig(config));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        backgroundColor: 'var(--bg-color, #fff)',
        padding: '32px',
        borderRadius: '8px',
        width: '400px',
        maxWidth: '90vw',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}>
        <h2 style={{
          margin: '0 0 24px 0',
          color: 'var(--text-color, #000)',
          fontSize: '24px',
          fontWeight: '600',
        }}>
          Configure Legal-Agent
        </h2>
        
        <p style={{
          margin: '0 0 24px 0',
          color: 'var(--text-color, #666)',
          fontSize: '14px',
          lineHeight: '1.5',
        }}>
          Please provide your OpenRouter configuration to enable AI functionality.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: 'var(--text-color, #000)',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              OpenRouter API Key *
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border-color, #ddd)',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: 'var(--input-bg, #fff)',
                color: 'var(--text-color, #000)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: 'var(--text-color, #000)',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              LLM Model *
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border-color, #ddd)',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: 'var(--input-bg, #fff)',
                color: 'var(--text-color, #000)',
                boxSizing: 'border-box',
              }}
            >
              <option value="openai/gpt-4o">OpenAI GPT-4o</option>
              <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini</option>
              <option value="anthropic/claude-3-opus">Anthropic Claude 3 Opus</option>
              <option value="anthropic/claude-3-sonnet">Anthropic Claude 3 Sonnet</option>
              <option value="anthropic/claude-3-haiku">Anthropic Claude 3 Haiku</option>
              <option value="google/gemini-pro">Google Gemini Pro</option>
            </select>
          </div>

          {error && (
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              color: '#c33',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                backgroundColor: 'var(--primary-color, #007bff)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigurationModal;

