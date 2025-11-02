import styled from 'styled-components';
import { motion } from 'framer-motion';
import { theme } from '../../styles/theme';
import { useWorkflow } from '../../context/WorkflowContext';

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

export const ExtractView = () => {
  const { videoData, transcript } = useWorkflow();

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
    </ExtractContainer>
  );
};
