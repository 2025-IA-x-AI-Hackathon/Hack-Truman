import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { theme } from '../../styles/theme';
import { useWorkflow } from '../../context/WorkflowContext';
import { WORKFLOW_STEPS } from '../../constants/workflowSteps';
import { LoadingView } from '../views/LoadingView';
import { InfoView } from '../views/InfoView';
import { ExtractView } from '../views/ExtractView';
import { CandidateAnalysisView } from '../views/CandidateAnalysisView';
import { ConcludeView } from '../views/ConcludeView';

const ContentContainer = styled(motion.main)`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  scroll-behavior: smooth;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${theme.glass.border};
    border-radius: 4px;

    &:hover {
      background: ${theme.glass.containerHover};
    }
  }
`;

// Fullscreen view with centered content
const FullscreenView = styled(motion.section)`
  min-height: 100vh;
  width: 100%;
  padding: ${theme.spacing.xl};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
`;

// Extract stays visible but compressed to header corner
const CompressedExtractContainer = styled(motion.div)`
  position: fixed;
  top: 80px;
  right: ${theme.spacing.lg};
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: ${theme.border.radius};
  cursor: pointer;
  z-index: 50;
  backdrop-filter: blur(12px);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.1), inset 0 1px 0 rgba(0, 212, 255, 0.1);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 212, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.5);
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.3), inset 0 1px 0 rgba(0, 212, 255, 0.15);
  }
`;

const ButtonContainer = styled(motion.div)`
  position: fixed;
  bottom: ${theme.spacing.xl};
  right: ${theme.spacing.xl};
  display: flex;
  gap: 20px;
`
// Transcript button in bottom-right
const TranscriptButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.3);
  color: ${theme.colors.primary};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-radius: ${theme.border.radius};
  cursor: pointer;
  font-size: ${theme.typography.body.fontSize};
  font-weight: bold;
  transition: all 0.3s ease;
  z-index: 60;
  backdrop-filter: blur(12px);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.1), inset 0 1px 0 rgba(0, 212, 255, 0.1);

  &:hover {
    background: rgba(0, 212, 255, 0.1);
    border-color: ${theme.colors.accent};
    color: ${theme.colors.accent};
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.3), inset 0 1px 0 rgba(0, 212, 255, 0.15);
  }
`;

const ShareButton = styled(TranscriptButton)`
  right: 100px;
`;

// Classify candidates section with scrollable area below
const ClassifySection = styled(motion.section)`
  min-height: 100vh;
  width: 100%;
  padding: ${theme.spacing.xl};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
`;

// Conclude appears below classify with scroll reveal
const ConcludeSection = styled(motion.section)`
  min-height: 100vh;
  width: 100%;
  padding: ${theme.spacing.xl};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
`;




export const MainContent = () => {
  const { currentStep } = useWorkflow();
  const containerRef = useRef(null);
  const [showExtractIcon, setShowExtractIcon] = useState(false);
  const [showTranscriptButton, setShowTranscriptButton] = useState(false);
  const [showShareButton, setShowShareButton] = useState(false);

  // Determine which views to show based on current step
  const showLoading = currentStep === WORKFLOW_STEPS.LOADING;
  const showInfo = currentStep === WORKFLOW_STEPS.INFO;
  const showExtract = currentStep === WORKFLOW_STEPS.EXTRACT;
  const showClassify = [WORKFLOW_STEPS.CLASSIFY, WORKFLOW_STEPS.VERIFY, WORKFLOW_STEPS.CONCLUDE].includes(currentStep);
  const showConclude = currentStep === WORKFLOW_STEPS.CONCLUDE;

  // When transitioning from EXTRACT to CLASSIFY, show the icon in header
  useEffect(() => {
    if ([WORKFLOW_STEPS.CLASSIFY, WORKFLOW_STEPS.VERIFY, WORKFLOW_STEPS.CONCLUDE].includes(currentStep)) {
      setShowExtractIcon(true);
    } else {
      setShowExtractIcon(false);
    }
  }, [currentStep]);

  // Show transcript button when past EXTRACT phase
  useEffect(() => {
    if ([WORKFLOW_STEPS.CLASSIFY, WORKFLOW_STEPS.VERIFY, WORKFLOW_STEPS.CONCLUDE].includes(currentStep)) {
      setShowTranscriptButton(true);
    } else {
      setShowTranscriptButton(false);
    }
  }, [currentStep]);

  useEffect(()=> {
    if (WORKFLOW_STEPS.CONCLUDE === currentStep) {
      setShowShareButton(true);
    }
  })

  return (
    <ContentContainer ref={containerRef}>
      <AnimatePresence mode="wait">
        {showLoading && (
          <FullscreenView
            key="loading"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LoadingView />
          </FullscreenView>
        )}

        {showInfo && (
          <FullscreenView
            key="info"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 0.8,
              filter: 'blur(10px)',
            }}
            transition={{ duration: 0.6 }}
          >
            <InfoView />
          </FullscreenView>
        )}

        {showExtract && (
          <FullscreenView
            key="extract"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 0.5,
            }}
            transition={{ duration: 0.4 }}
          >
            <ExtractView />
          </FullscreenView>
        )}
      {/* When in CONCLUDE, show both Classify (scrolled to) and Conclude below */}
      {showConclude && (
          <ConcludeSection
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <ConcludeView />
          </ConcludeSection>
      )}

        {showClassify && (
          <ClassifySection
            key="classify"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <CandidateAnalysisView isInConcludePhase={showConclude} />
          </ClassifySection>
        )}
      </AnimatePresence>

      {/* Transcript button in bottom-right */}
      <ButtonContainer>

      <AnimatePresence>
        {showTranscriptButton && (
          <TranscriptButton
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          >
            대본 보기
          </TranscriptButton>
        )}
        {showShareButton && (
          <ShareButton
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          >
            공유하기
          </ShareButton>
        )}
      </AnimatePresence>
        </ButtonContainer>
      

    </ContentContainer>
  );
};
