import { useEffect } from 'react';
import { ThemeProvider } from 'styled-components';
import { GlobalStyles } from './styles/GlobalStyles';
import { theme } from './styles/theme';
import { WorkflowProvider } from './context/WorkflowContext';
import { Layout } from './components/layout/Layout';
import { useSocket } from './hooks/useSocket';
import { useWorkflow } from './context/WorkflowContext';
import { WORKFLOW_STEPS } from './constants/workflowSteps';

function AppContent() {
  const { moveToStep, updateVideoData, updateTranscript, setCandidates, addVerification, setConclusion, updateArgumentGraph, updateExtractSummary } =
    useWorkflow();
  const { on, send } = useSocket();

  useEffect(() => {
    // WebSocket event listeners
    on('extract', (data) => {
      console.log('Received extract data:', data);

      // Extract 단계로 이동
      moveToStep(WORKFLOW_STEPS.EXTRACT);

      // Transcript 업데이트 (full_text)
      if (data.full_text) {
        updateTranscript({ text: data.full_text });
      }

      // Argument Graph 업데이트
      if (data.argument_graph) {
        updateArgumentGraph(data.argument_graph);
      }

      // Summary 업데이트
      if (data.summary) {
        updateExtractSummary(data.summary);
      }
    });

    on('candidates', (data) => {
      console.log('Received candidates:', data);
      setCandidates(data.candidates || []);
      moveToStep(WORKFLOW_STEPS.CLASSIFY);
    });

    on('verification', (data) => {
      console.log('Received verification:', data);
      addVerification(data.candidateId, data.verification);
    });

    on('conclusion', (data) => {
      console.log('Received conclusion:', data);
      setConclusion(data);
      moveToStep(WORKFLOW_STEPS.CONCLUDE);
    });

    on('complete', (data) => {
      console.log('Analysis complete:', data);
    });

    on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return () => {
      // Cleanup listeners if needed
    };
  }, [on, moveToStep, updateVideoData, updateTranscript, setCandidates, addVerification, setConclusion, updateArgumentGraph, updateExtractSummary]);

  return <Layout />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <WorkflowProvider>
        <AppContent />
      </WorkflowProvider>
    </ThemeProvider>
  );
}

export default App;
