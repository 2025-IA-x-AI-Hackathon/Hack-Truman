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
  const { moveToStep, updateVideoData, updateTranscript, setCandidates, addVerification, setConclusion } =
    useWorkflow();
  const { on, emit } = useSocket('http://localhost:3001');

  useEffect(() => {
    // Socket event listeners
    on('video_info', (data) => {
      console.log('Received video info:', data);
      updateVideoData(data);
      moveToStep(WORKFLOW_STEPS.INFO);
    });

    on('transcript', (data) => {
      console.log('Received transcript:', data);
      updateTranscript(data);
      moveToStep(WORKFLOW_STEPS.EXTRACT);
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

    on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Request initial video data
    emit('request_analysis', {});

    return () => {
      // Cleanup listeners if needed
    };
  }, [on, emit, moveToStep, updateVideoData, updateTranscript, setCandidates, addVerification, setConclusion]);

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
