



import React, { useState, useEffect } from 'react';
import { Document, Finding } from '../../../shared/types';

interface DocumentViewerProps {
  document: Document;
  findings: Finding[];
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, findings }) => {
  const [highlightedContent, setHighlightedContent] = useState<string>('');
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  useEffect(() => {
    if (document.content) {
      highlightFindings(document.content, findings);
    }
  }, [document.content, findings]);

  const highlightFindings = (content: string, findings: Finding[]) => {
    if (!findings.length) {
      setHighlightedContent(content);
      return;
    }

    // Sort findings by start position (descending) to avoid position shifts when inserting HTML
    const sortedFindings = [...findings].sort((a, b) => b.startPosition - a.startPosition);
    
    let highlightedText = content;
    
    sortedFindings.forEach((finding, index) => {
      const { startPosition, endPosition, category, confidence } = finding;
      
      if (startPosition >= 0 && endPosition <= content.length && startPosition < endPosition) {
        const beforeText = highlightedText.substring(0, startPosition);
        const findingText = highlightedText.substring(startPosition, endPosition);
        const afterText = highlightedText.substring(endPosition);
        
        const confidenceClass = confidence >= 0.8 ? 'high' : confidence >= 0.5 ? 'medium' : 'low';
        const categoryClass = category.toLowerCase().replace(/\s+/g, '-');
        
        highlightedText = 
          beforeText + 
          `<span 
            class="highlighted-text ${confidenceClass} ${categoryClass}" 
            data-finding-id="${finding._id}"
            data-category="${category}"
            data-confidence="${confidence}"
            title="${category} (${Math.round(confidence * 100)}% confidence)"
            style="
              background-color: ${getHighlightColor(category, confidence)};
              cursor: pointer;
              padding: 2px 4px;
              border-radius: 2px;
              border-bottom: 2px solid ${getCategoryColor(category)};
            "
          >${findingText}</span>` + 
          afterText;
      }
    });
    
    setHighlightedContent(highlightedText);
  };

  const getHighlightColor = (category: string, confidence: number): string => {
    const alpha = Math.max(0.2, confidence * 0.5);
    
    switch (category.toLowerCase()) {
      case 'legal_risk':
      case 'compliance_issue':
        return `rgba(220, 53, 69, ${alpha})`; // Red
      case 'contract_term':
      case 'obligation':
        return `rgba(0, 123, 255, ${alpha})`; // Blue
      case 'financial_term':
      case 'payment':
        return `rgba(40, 167, 69, ${alpha})`; // Green
      case 'deadline':
      case 'termination':
        return `rgba(255, 193, 7, ${alpha})`; // Yellow
      default:
        return `rgba(108, 117, 125, ${alpha})`; // Gray
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'legal_risk':
      case 'compliance_issue':
        return '#dc3545'; // Red
      case 'contract_term':
      case 'obligation':
        return '#007bff'; // Blue
      case 'financial_term':
      case 'payment':
        return '#28a745'; // Green
      case 'deadline':
      case 'termination':
        return '#ffc107'; // Yellow
      default:
        return '#6c757d'; // Gray
    }
  };

  const handleFindingClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    const findingId = target.getAttribute('data-finding-id');
    
    if (findingId) {
      const finding = findings.find(f => f._id === findingId);
      if (finding) {
        setSelectedFinding(finding);
      }
    }
  };

  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Document Header */}
      <div style={{ 
        padding: '12px',
        backgroundColor: 'var(--header-bg)',
        borderBottom: '1px solid var(--border-color)',
        borderRadius: '4px 4px 0 0'
      }}>
        <h4 style={{ margin: 0, color: 'var(--text-color)' }}>
          {document.name}
        </h4>
        <div style={{ 
          fontSize: '12px', 
          color: 'var(--secondary-color)',
          marginTop: '4px'
        }}>
          Uploaded: {new Date(document.uploadedAt).toLocaleString()}
          {findings.length > 0 && (
            <span style={{ marginLeft: '16px' }}>
              {findings.length} finding{findings.length !== 1 ? 's' : ''} highlighted
            </span>
          )}
        </div>
      </div>

      {/* Document Content */}
      <div style={{ 
        flex: 1, 
        display: 'flex',
        minHeight: 0
      }}>
        {/* Main Content Area */}
        <div style={{ 
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-color)',
          border: '1px solid var(--border-color)',
          fontFamily: 'Georgia, serif',
          lineHeight: '1.6',
          fontSize: '14px'
        }}>
          {highlightedContent ? (
            <div 
              dangerouslySetInnerHTML={{ __html: highlightedContent }}
              onClick={handleFindingClick}
              style={{ color: 'var(--text-color)' }}
            />
          ) : (
            <div style={{ color: 'var(--text-color)' }}>
              {document.content || 'No content available'}
            </div>
          )}
        </div>

        {/* Finding Details Sidebar */}
        {selectedFinding && (
          <div style={{ 
            width: '300px',
            padding: '16px',
            backgroundColor: 'var(--panel-bg)',
            border: '1px solid var(--border-color)',
            borderLeft: 'none',
            overflowY: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <h5 style={{ margin: 0, color: 'var(--text-color)' }}>
                Finding Details
              </h5>
              <button
                onClick={() => setSelectedFinding(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: 'var(--secondary-color)'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: 'var(--text-color)' }}>Category:</strong>
              <div style={{ 
                marginTop: '4px',
                padding: '4px 8px',
                backgroundColor: getHighlightColor(selectedFinding.category, 1),
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                {selectedFinding.category}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: 'var(--text-color)' }}>Confidence:</strong>
              <div style={{ 
                marginTop: '4px',
                fontSize: '14px',
                color: 'var(--text-color)'
              }}>
                {formatConfidence(selectedFinding.confidence)}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: 'var(--text-color)' }}>Text:</strong>
              <div style={{ 
                marginTop: '4px',
                padding: '8px',
                backgroundColor: 'var(--hover-color)',
                borderRadius: '4px',
                fontSize: '13px',
                fontStyle: 'italic',
                color: 'var(--text-color)'
              }}>
                "{selectedFinding.text}"
              </div>
            </div>

            <div>
              <strong style={{ color: 'var(--text-color)' }}>Position:</strong>
              <div style={{ 
                marginTop: '4px',
                fontSize: '12px',
                color: 'var(--secondary-color)'
              }}>
                Characters {selectedFinding.startPosition} - {selectedFinding.endPosition}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {findings.length > 0 && (
        <div style={{ 
          padding: '8px 12px',
          backgroundColor: 'var(--header-bg)',
          borderTop: '1px solid var(--border-color)',
          fontSize: '12px'
        }}>
          <strong style={{ color: 'var(--text-color)' }}>Legend:</strong>
          <div style={{ display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
            {Array.from(new Set(findings.map(f => f.category))).map(category => (
              <div key={category} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: getHighlightColor(category, 0.8),
                  border: `1px solid ${getCategoryColor(category)}`,
                  borderRadius: '2px'
                }} />
                <span style={{ color: 'var(--text-color)' }}>{category}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;




