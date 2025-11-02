import React, { createContext, useContext, useState, useCallback } from 'react';
import { WORKFLOW_STEPS } from '../constants/workflowSteps';

const WorkflowContext = createContext();

export const WorkflowProvider = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(WORKFLOW_STEPS.LOADING);
  const [videoData, setVideoData] = useState({
    title: '',
    thumbnail: '',
    url: '',
  });
  const [transcript, setTranscript] = useState({
    text: '',
    timeline: [],
  });
  const [candidates, setCandidates] = useState([]);
  const [argumentGraph, setArgumentGraph] = useState({
    nodes: [],
    edges: [],
  });
  const [extractSummary, setExtractSummary] = useState({
    total_segments: 0,
    claims: 0,
    facts: 0,
    relationships: 0,
    relationship_types: {},
    avg_confidence: 0,
  });
  const [verifications, setVerifications] = useState({});
  const [conclusion, setConclusion] = useState({
    opinionCount: 0,
    factCount: 0,
    trustScore: 0,
  });
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isShowingConclusion, setIsShowingConclusion] = useState(false);

  const updateVideoData = useCallback((data) => {
    setVideoData((prev) => ({ ...prev, ...data }));
  }, []);

  const updateTranscript = useCallback((data) => {
    setTranscript((prev) => ({ ...prev, ...data }));
  }, []);

  const addVerification = useCallback((candidateId, verification) => {
    setVerifications((prev) => ({
      ...prev,
      [candidateId]: verification,
    }));
  }, []);

  const moveToStep = useCallback((step) => {
    setCurrentStep(step);
  }, []);

  const updateArgumentGraph = useCallback((data) => {
    setArgumentGraph((prev) => ({ ...prev, ...data }));
  }, []);

  const updateExtractSummary = useCallback((data) => {
    setExtractSummary((prev) => ({ ...prev, ...data }));
  }, []);

  const value = {
    currentStep,
    moveToStep,
    videoData,
    updateVideoData,
    transcript,
    updateTranscript,
    candidates,
    setCandidates,
    argumentGraph,
    updateArgumentGraph,
    extractSummary,
    updateExtractSummary,
    verifications,
    addVerification,
    conclusion,
    setConclusion,
    selectedCandidate,
    setSelectedCandidate,
    isShowingConclusion,
    setIsShowingConclusion,
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within WorkflowProvider');
  }
  return context;
};
