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
    // URL 파라미터에서 videoUrl 추출 (확장 프로그램에서 전달)
    const params = new URLSearchParams(window.location.search);
    const videoUrl = params.get('videoUrl');

    if (videoUrl) {
      console.log('확장 프로그램에서 전달받은 videoUrl:', videoUrl);

      // 로딩 단계로 이동
      moveToStep(WORKFLOW_STEPS.LOADING);

      // 비디오 정보 업데이트 (더미 데이터)
      updateVideoData({
        title: 'YouTube Video',
        url: videoUrl,
        thumbnail: 'https://via.placeholder.com/320x180',
      });

      // WebSocket으로 분석 요청 전송
      const analysisRequest = {
        file_path: videoUrl, // 확장 프로그램에서 처리한 파일 경로가 전달됨
        language: 'en',
      };

      // 약간의 지연 후 분석 요청 (WebSocket 연결 보장)
      setTimeout(() => {
        send(analysisRequest);
      }, 500);
    }
  }, [moveToStep, updateVideoData, send]);

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
