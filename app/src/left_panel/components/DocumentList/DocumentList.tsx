


import React, { useRef } from 'react';
import { Document } from '../../../shared/types';
import { documentsApi } from '../../api/platform';
import { useAppSelector } from '../../../shared/store';

interface DocumentListProps {
  documents: Document[];
  selectedDocumentId: string | null;
  onDocumentSelect: (documentId: string) => void;
  onFileUpload: (file: File) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  selectedDocumentId,
  onDocumentSelect,
  onFileUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { agentId, analysisId } = useAppSelector(state => state.legalAgent);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
      // Reset the input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteDocument = async (documentId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await documentsApi.deleteDocument(documentId);
      // The parent component should handle refreshing the document list
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toUpperCase() || '';
  };

  return (
    <div>
      {/* Upload Section */}
      <div style={{ marginBottom: '12px' }}>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          accept=".pdf,.doc,.docx,.txt,.rtf"
          style={{ display: 'none' }}
        />
        <button
          className="btn btn-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={!agentId || !analysisId}
          style={{ width: '100%' }}
        >
          📁 Upload Document
        </button>
        {(!agentId || !analysisId) && (
          <div style={{ 
            fontSize: '12px', 
            color: 'var(--secondary-color)', 
            marginTop: '4px',
            textAlign: 'center'
          }}>
            Select an analysis session first
          </div>
        )}
      </div>

      {/* Documents List */}
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {documents.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: 'var(--secondary-color)', 
            padding: '20px',
            fontSize: '14px'
          }}>
            No documents uploaded yet. Upload a document to get started.
          </div>
        ) : (
          documents.map((document) => (
            <div
              key={document._id}
              className={`list-item ${selectedDocumentId === document._id ? 'active' : ''}`}
              onClick={() => onDocumentSelect(document._id)}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                padding: '12px',
                cursor: 'pointer'
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontWeight: '500', 
                  fontSize: '14px',
                  marginBottom: '4px',
                  wordBreak: 'break-word'
                }}>
                  {document.name}
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  fontSize: '12px', 
                  color: 'var(--secondary-color)',
                  flexWrap: 'wrap'
                }}>
                  <span>{getFileExtension(document.name)}</span>
                  <span>•</span>
                  <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
                </div>

                {document.content && (
                  <div style={{ 
                    fontSize: '12px', 
                    color: 'var(--secondary-color)',
                    marginTop: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {document.content.substring(0, 100)}...
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                <button
                  className="btn btn-danger"
                  onClick={(e) => handleDeleteDocument(document._id, e)}
                  style={{ 
                    fontSize: '12px', 
                    padding: '4px 8px'
                  }}
                  title="Delete document"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Instructions */}
      <div style={{ 
        fontSize: '12px', 
        color: 'var(--secondary-color)', 
        marginTop: '8px',
        padding: '8px',
        backgroundColor: 'var(--hover-color)',
        borderRadius: '4px'
      }}>
        <strong>Supported formats:</strong> PDF, DOC, DOCX, TXT, RTF
        <br />
        <strong>Max size:</strong> 10MB per file
      </div>
    </div>
  );
};

export default DocumentList;



