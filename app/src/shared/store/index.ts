
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  GlobalState, 
  OpenRouterConfig, 
  Document, 
  Finding, 
  ChatMessage, 
  AnalysisSession 
} from '../types';

// Initial state
const initialState: GlobalState = {
  openRouterConfig: null,
  agentId: null,
  analysisId: null,
  documents: [],
  findings: [],
  chatHistory: [],
  isLoading: false,
  isConfigured: false,
};

// Main slice
const legalAgentSlice = createSlice({
  name: 'legalAgent',
  initialState,
  reducers: {
    setOpenRouterConfig: (state, action: PayloadAction<OpenRouterConfig>) => {
      state.openRouterConfig = action.payload;
      state.isConfigured = true;
    },
    setAgentId: (state, action: PayloadAction<string>) => {
      state.agentId = action.payload;
    },
    setAnalysisId: (state, action: PayloadAction<string>) => {
      state.analysisId = action.payload;
      // Clear documents and findings when switching analysis
      state.documents = [];
      state.findings = [];
    },
    setDocuments: (state, action: PayloadAction<Document[]>) => {
      state.documents = action.payload;
    },
    addDocument: (state, action: PayloadAction<Document>) => {
      state.documents.push(action.payload);
    },
    setFindings: (state, action: PayloadAction<Finding[]>) => {
      state.findings = action.payload;
    },
    addFinding: (state, action: PayloadAction<Finding>) => {
      state.findings.push(action.payload);
    },
    setChatHistory: (state, action: PayloadAction<ChatMessage[]>) => {
      state.chatHistory = action.payload;
    },
    addMessageToChat: (state, action: PayloadAction<ChatMessage>) => {
      state.chatHistory.push(action.payload);
    },
    clearChatHistory: (state) => {
      state.chatHistory = [];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    resetState: (state) => {
      Object.assign(state, initialState);
    },
  },
});

// Export actions
export const {
  setOpenRouterConfig,
  setAgentId,
  setAnalysisId,
  setDocuments,
  addDocument,
  setFindings,
  addFinding,
  setChatHistory,
  addMessageToChat,
  clearChatHistory,
  setLoading,
  resetState,
} = legalAgentSlice.actions;

// Configure store
export const store = configureStore({
  reducer: {
    legalAgent: legalAgentSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

