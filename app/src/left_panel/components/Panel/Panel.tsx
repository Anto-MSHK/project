import React, { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../shared/store";
import { setAnalysisId, setDocuments, setFindings, addDocument } from "../../../shared/store";
import { analysisApi, documentsApi, findingsApi, PlatformWebSocket } from "../../api/platform";
import { getLocalizedString } from "../../lib/i18n";
import AnalysisList from "../AnalysisList/AnalysisList";
import DocumentList from "../DocumentList/DocumentList";
import DocumentViewer from "../DocumentViewer/DocumentViewer";
import "../../../shared/styles/global.css";

const Panel = () => {
  const dispatch = useAppDispatch();
  const { agentId, analysisId, documents, findings, isLoading } = useAppSelector(state => state.legalAgent);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [ws, setWs] = useState<PlatformWebSocket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const websocket = new PlatformWebSocket('left');
    websocket.connect((message) => {
      // Handle real-time messages from right panel
      if (message.type === 'SHOW_FINDING' && message.payload) {
        const { documentId, findingId } = message.payload;
        setSelectedDocumentId(documentId);
        // Could highlight specific finding here
      }
    }).catch(console.error);
    
    setWs(websocket);
    
    return () => {
      websocket.disconnect();
    };
  }, []);

  // Load documents when analysis changes
  useEffect(() => {
    if (agentId && analysisId) {
      loadDocuments();
      loadFindings();
    }
  }, [agentId, analysisId]);

  const loadDocuments = async () => {
    if (!agentId || !analysisId) return;
    
    try {
      setError(null);
      const docs = await documentsApi.getDocuments(agentId, analysisId);
      dispatch(setDocuments(docs));
    } catch (error) {
      console.error("Error loading documents:", error);
      setError("Failed to load documents");
    }
  };

  const loadFindings = async () => {
    if (!agentId || !analysisId) return;
    
    try {
      const findingsData = await findingsApi.getFindings(agentId, analysisId);
      dispatch(setFindings(findingsData));
    } catch (error) {
      console.error("Error loading findings:", error);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!agentId || !analysisId) {
      setError("Please select an analysis session first");
      return;
    }

    try {
      setError(null);
      const newDocument = await documentsApi.uploadDocument(file, agentId, analysisId);
      dispatch(addDocument(newDocument));
    } catch (error) {
      console.error("Error uploading document:", error);
      setError("Failed to upload document");
    }
  };

  const handleAnalysisSelect = (newAnalysisId: string) => {
    dispatch(setAnalysisId(newAnalysisId));
    setSelectedDocumentId(null);
  };

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocumentId(documentId);
  };

  const selectedDocument = documents.find(doc => doc._id === selectedDocumentId);

  return (
    <div className="legal-agent-left-panel">
      <div className="panel-header">
        {getLocalizedString("legalAgentLeftPanel", "Legal Agent - Documents")}
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

        {/* Analysis Sessions Section */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ marginBottom: '8px', color: 'var(--text-color)' }}>Analysis Sessions</h3>
          <AnalysisList onAnalysisSelect={handleAnalysisSelect} />
        </div>

        {/* Documents Section */}
        {analysisId && (
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-color)' }}>Documents</h3>
            <DocumentList 
              documents={documents}
              selectedDocumentId={selectedDocumentId}
              onDocumentSelect={handleDocumentSelect}
              onFileUpload={handleFileUpload}
            />
          </div>
        )}

        {/* Document Viewer Section */}
        {selectedDocument && (
          <div style={{ flex: 1, minHeight: 0 }}>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-color)' }}>Document Viewer</h3>
            <DocumentViewer 
              document={selectedDocument}
              findings={findings.filter(f => f.documentId === selectedDocument._id)}
            />
          </div>
        )}

        {!analysisId && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flex: 1,
            color: 'var(--secondary-color)',
            textAlign: 'center'
          }}>
            Select an analysis session to view documents
          </div>
        )}
      </div>
    </div>
  );
};

export default Panel;
