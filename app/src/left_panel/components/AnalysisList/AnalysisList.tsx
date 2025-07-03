

import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../shared/store';
import { setAgentId } from '../../../shared/store';
import { analysisApi } from '../../api/platform';
import { AnalysisSession } from '../../../shared/types';

interface AnalysisListProps {
  onAnalysisSelect: (analysisId: string) => void;
}

const AnalysisList: React.FC<AnalysisListProps> = ({ onAnalysisSelect }) => {
  const dispatch = useAppDispatch();
  const { agentId, analysisId } = useAppSelector(state => state.legalAgent);
  const [analyses, setAnalyses] = useState<AnalysisSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAnalysisName, setNewAnalysisName] = useState('');

  // Initialize with default agent ID if not set
  useEffect(() => {
    if (!agentId) {
      dispatch(setAgentId('legal-agent-default'));
    }
  }, [agentId, dispatch]);

  // Load analyses when agent ID is available
  useEffect(() => {
    if (agentId) {
      loadAnalyses();
    }
  }, [agentId]);

  const loadAnalyses = async () => {
    if (!agentId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await analysisApi.getAnalyses(agentId);
      setAnalyses(data);
    } catch (error) {
      console.error('Error loading analyses:', error);
      setError('Failed to load analysis sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnalysis = async () => {
    if (!agentId || !newAnalysisName.trim()) return;
    
    try {
      setError(null);
      const newAnalysis = await analysisApi.createAnalysis(agentId, newAnalysisName.trim());
      setAnalyses(prev => [...prev, newAnalysis]);
      setNewAnalysisName('');
      setShowCreateForm(false);
      onAnalysisSelect(newAnalysis._id);
    } catch (error) {
      console.error('Error creating analysis:', error);
      setError('Failed to create analysis session');
    }
  };

  const handleDeleteAnalysis = async (analysisIdToDelete: string) => {
    if (!confirm('Are you sure you want to delete this analysis session?')) return;
    
    try {
      await analysisApi.deleteAnalysis(analysisIdToDelete);
      setAnalyses(prev => prev.filter(a => a._id !== analysisIdToDelete));
      if (analysisId === analysisIdToDelete) {
        onAnalysisSelect('');
      }
    } catch (error) {
      console.error('Error deleting analysis:', error);
      setError('Failed to delete analysis session');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading analysis sessions...
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="error">
          {error}
          <button 
            className="btn btn-primary" 
            onClick={loadAnalyses}
            style={{ marginLeft: '8px', fontSize: '12px', padding: '4px 8px' }}
          >
            Retry
          </button>
        </div>
      )}

      <div style={{ marginBottom: '12px' }}>
        {!showCreateForm ? (
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
            style={{ width: '100%' }}
          >
            + New Analysis Session
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
            <input
              type="text"
              value={newAnalysisName}
              onChange={(e) => setNewAnalysisName(e.target.value)}
              placeholder="Analysis session name"
              className="form-input"
              style={{ fontSize: '14px' }}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateAnalysis()}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-primary"
                onClick={handleCreateAnalysis}
                disabled={!newAnalysisName.trim()}
                style={{ flex: 1 }}
              >
                Create
              </button>
              <button 
                className="btn"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewAnalysisName('');
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {analyses.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: 'var(--secondary-color)', 
            padding: '20px',
            fontSize: '14px'
          }}>
            No analysis sessions yet. Create one to get started.
          </div>
        ) : (
          analyses.map((analysis) => (
            <div
              key={analysis._id}
              className={`list-item ${analysisId === analysis._id ? 'active' : ''}`}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '8px 12px'
              }}
            >
              <div 
                onClick={() => onAnalysisSelect(analysis._id)}
                style={{ flex: 1, cursor: 'pointer' }}
              >
                <div style={{ fontWeight: '500', fontSize: '14px' }}>
                  {analysis.name}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: 'var(--secondary-color)',
                  marginTop: '2px'
                }}>
                  {new Date(analysis.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button
                className="btn btn-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteAnalysis(analysis._id);
                }}
                style={{ 
                  fontSize: '12px', 
                  padding: '4px 8px',
                  marginLeft: '8px'
                }}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnalysisList;


