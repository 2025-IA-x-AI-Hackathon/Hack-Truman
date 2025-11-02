import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { theme } from '../../styles/theme';
import { useWorkflow } from '../../context/WorkflowContext';
import { useSocket } from '../../hooks/useSocket';

const ExtractContainer = styled.div`
  display: flex;
  gap: ${theme.spacing.xl};
  width: 100%;
  max-width: 1400px;
  max-height: 600px;
`;

const ThumbnailSection = styled(motion.div)`
  width: 250px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

const Thumbnail = styled.img`
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: ${theme.border.radius};
  border: ${theme.border.width} solid ${theme.glass.border};
  object-fit: cover;
`;

const TranscriptSection = styled(motion.div)`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
  min-width: 0;
`;

const TranscriptContainer = styled.div`
  flex: 1;
  background: ${theme.glass.container};
  border: ${theme.border.width} solid ${theme.glass.border};
  border-radius: ${theme.border.radius};
  padding: ${theme.spacing.lg};
  overflow-y: auto;
  overflow-x: hidden;
  backdrop-filter: blur(10px);
`;

const TranscriptText = styled(motion.p)`
  font-size: ${theme.typography.body.fontSize};
  line-height: 1.8;
  color: ${theme.colors.primary};
  white-space: pre-wrap;
  word-wrap: break-word;

  span {
    display: inline;
  }
`;

const Label = styled.p`
  font-size: ${theme.typography.caption.fontSize};
  color: ${theme.colors.tertiary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const SummarySection = styled(motion.div)`
  width: 200px;
  flex-shrink: 0;
  background: ${theme.glass.container};
  border: ${theme.border.width} solid ${theme.glass.border};
  border-radius: ${theme.border.radius};
  padding: ${theme.spacing.lg};
  overflow-y: auto;
  backdrop-filter: blur(10px);
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.md};
  font-size: ${theme.typography.body.fontSize};
  color: ${theme.colors.primary};

  &:last-child {
    margin-bottom: 0;
  }
`;

const StatLabel = styled.span`
  color: ${theme.colors.tertiary};
`;

const StatValue = styled.span`
  font-weight: 600;
  color: ${theme.colors.secondary};
`;

export const ExtractView = () => {
  const { videoData, transcript, argumentGraph, extractSummary, updateTranscript, updateArgumentGraph, updateExtractSummary } = useWorkflow();
  const { on, send } = useSocket();

  // WebSocket 메시지 수신 설정
  useEffect(() => {
    on('extract', (data) => {
      console.log('Extract data received:', data);

      // Transcript 업데이트
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

    on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return () => {
      // Cleanup if needed
    };
  }, [on, updateTranscript, updateArgumentGraph, updateExtractSummary]);

  // Split transcript into chunks for animation
  const transcriptChunks = transcript.text
    ? transcript.text.split(/(?<=[.!?])\s+/)
    : [];

  return (
    <ExtractContainer>
      <ThumbnailSection
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Label>Video</Label>
        {videoData.thumbnail && (
          <Thumbnail
            src={videoData.thumbnail}
            alt="Video thumbnail"
          />
        )}
      </ThumbnailSection>

      <TranscriptSection
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Label>Transcript</Label>
        <TranscriptContainer>
          {transcriptChunks.length > 0 ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
            >
              {transcriptChunks.map((chunk, index) => (
                <TranscriptText
                  key={index}
                  variants={{
                    hidden: { opacity: 0, y: 5 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  {chunk}{' '}
                </TranscriptText>
              ))}
            </motion.div>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ color: theme.colors.tertiary }}
            >
              Extracting transcript...
            </motion.p>
          )}
        </TranscriptContainer>
      </TranscriptSection>

      <SummarySection
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Label>Summary</Label>
        <StatItem>
          <StatLabel>Segments:</StatLabel>
          <StatValue>{extractSummary.total_segments}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Claims:</StatLabel>
          <StatValue>{extractSummary.claims}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Facts:</StatLabel>
          <StatValue>{extractSummary.facts}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Relationships:</StatLabel>
          <StatValue>{extractSummary.relationships}</StatValue>
        </StatItem>
        {extractSummary.avg_confidence > 0 && (
          <StatItem>
            <StatLabel>Avg Confidence:</StatLabel>
            <StatValue>{(extractSummary.avg_confidence * 100).toFixed(1)}%</StatValue>
          </StatItem>
        )}
      </SummarySection>
    </ExtractContainer>
  );
};
