



import React, { useState } from 'react';

interface ActionButtonsProps {
  onDocumentAnalysis: (analysisType: 'legal_review' | 'contract_analysis' | 'compliance_check' | 'risk_assessment') => void;
  onExtractFindings: (findingTypes: string[]) => void;
  onClearChat: () => void;
  disabled: boolean;
  hasDocuments: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onDocumentAnalysis,
  onExtractFindings,
  onClearChat,
  disabled,
  hasDocuments,
}) => {
  const [showFindingsOptions, setShowFindingsOptions] = useState(false);
  const [selectedFindingTypes, setSelectedFindingTypes] = useState<string[]>([]);

  const findingTypes = [
    'Legal Risks',
    'Contract Terms',
    'Compliance Issues',
    'Financial Terms',
    'Deadlines',
    'Obligations',
    'Termination Clauses',
    'Dispute Resolution',
    'Intellectual Property',
    'Data Protection',
  ];

  const handleFindingTypeToggle = (type: string) => {
    setSelectedFindingTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleExtractFindings = () => {
    if (selectedFindingTypes.length > 0) {
      onExtractFindings(selectedFindingTypes);
      setShowFindingsOptions(false);
      setSelectedFindingTypes([]);
    }
  };

  return (
    <div style={{ 
      padding: '16px',
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'var(--header-bg)'
    }}>
      <h4 style={{ 
        margin: '0 0 12px 0', 
        color: 'var(--text-color)',
        fontSize: '16px'
      }}>
        AI Analysis Tools
      </h4>

      {/* Document Analysis Buttons */}
      <div style={{ marginBottom: '16px' }}>
        <h5 style={{ 
          margin: '0 0 8px 0', 
          color: 'var(--text-color)',
          fontSize: '14px'
        }}>
          Document Analysis
        </h5>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '8px'
        }}>
          <button
            className="btn btn-primary"
            onClick={() => onDocumentAnalysis('legal_review')}
            disabled={disabled || !hasDocuments}
            style={{ fontSize: '12px', padding: '8px 12px' }}
          >
            📋 Legal Review
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onDocumentAnalysis('contract_analysis')}
            disabled={disabled || !hasDocuments}
            style={{ fontSize: '12px', padding: '8px 12px' }}
          >
            📄 Contract Analysis
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onDocumentAnalysis('compliance_check')}
            disabled={disabled || !hasDocuments}
            style={{ fontSize: '12px', padding: '8px 12px' }}
          >
            ✅ Compliance Check
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onDocumentAnalysis('risk_assessment')}
            disabled={disabled || !hasDocuments}
            style={{ fontSize: '12px', padding: '8px 12px' }}
          >
            ⚠️ Risk Assessment
          </button>
        </div>
      </div>

      {/* Findings Extraction */}
      <div style={{ marginBottom: '16px' }}>
        <h5 style={{ 
          margin: '0 0 8px 0', 
          color: 'var(--text-color)',
          fontSize: '14px'
        }}>
          Extract Findings
        </h5>
        
        {!showFindingsOptions ? (
          <button
            className="btn btn-secondary"
            onClick={() => setShowFindingsOptions(true)}
            disabled={disabled || !hasDocuments}
            style={{ width: '100%' }}
          >
            🔍 Extract Specific Findings
          </button>
        ) : (
          <div style={{ 
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '12px',
            backgroundColor: 'var(--bg-color)'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: 'var(--text-color)' }}>
                Select finding types to extract:
              </strong>
            </div>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '8px',
              marginBottom: '12px'
            }}>
              {findingTypes.map(type => (
                <label 
                  key={type}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontSize: '12px',
                    color: 'var(--text-color)',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedFindingTypes.includes(type)}
                    onChange={() => handleFindingTypeToggle(type)}
                    style={{ margin: 0 }}
                  />
                  {type}
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-primary"
                onClick={handleExtractFindings}
                disabled={selectedFindingTypes.length === 0}
                style={{ flex: 1 }}
              >
                Extract ({selectedFindingTypes.length})
              </button>
              <button
                className="btn"
                onClick={() => {
                  setShowFindingsOptions(false);
                  setSelectedFindingTypes([]);
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chat Controls */}
      <div>
        <h5 style={{ 
          margin: '0 0 8px 0', 
          color: 'var(--text-color)',
          fontSize: '14px'
        }}>
          Chat Controls
        </h5>
        <button
          className="btn btn-secondary"
          onClick={onClearChat}
          disabled={disabled}
          style={{ width: '100%' }}
        >
          🗑️ Clear Chat History
        </button>
      </div>

      {!hasDocuments && (
        <div style={{ 
          marginTop: '12px',
          padding: '8px',
          backgroundColor: 'var(--warning-color)',
          color: '#000',
          borderRadius: '4px',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          ⚠️ Upload documents in the left panel to enable analysis features
        </div>
      )}
    </div>
  );
};

export default ActionButtons;




