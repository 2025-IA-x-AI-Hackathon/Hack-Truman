import styled from 'styled-components';
import { motion } from 'framer-motion';
import { theme } from '../../styles/theme';
import { useWorkflow } from '../../context/WorkflowContext';

const InfoContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.xl};
  width: 100%;
  max-width: 1200px;
`;

const InfoSection = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
  padding: ${theme.spacing.lg};
  background: ${theme.glass.container};
  border: ${theme.border.width} solid ${theme.glass.border};
  border-radius: ${theme.border.radius};
  backdrop-filter: blur(10px);
`;

const ThumbnailSection = styled(InfoSection)`
  justify-content: center;
  align-items: center;
`;

const Thumbnail = styled(motion.img)`
  width: 100%;
  max-width: 400px;
  aspect-ratio: 16 / 9;
  border-radius: ${theme.border.radius};
  border: ${theme.border.width} solid ${theme.glass.border};
  object-fit: cover;
`;

const TitleSection = styled(InfoSection)`
  justify-content: flex-start;
`;

const Title = styled(motion.h2)`
  font-size: ${theme.typography.h2.fontSize};
  font-weight: bold;
  line-height: 1.4;
  word-break: break-word;
`;

const InfoLabel = styled.p`
  font-size: ${theme.typography.caption.fontSize};
  color: ${theme.colors.tertiary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: ${theme.spacing.sm};
`;

export const InfoView = () => {
  const { videoData } = useWorkflow();

  return (
    <InfoContainer>
      <ThumbnailSection
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {videoData.thumbnail && (
          <Thumbnail
            src={videoData.thumbnail}
            alt="Video thumbnail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
        )}
      </ThumbnailSection>

      <TitleSection
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <InfoLabel>Video Information</InfoLabel>
        {videoData.title && (
          <Title
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {videoData.title}
          </Title>
        )}
        {videoData.url && (
          <motion.p
            style={{
              marginTop: theme.spacing.lg,
              fontSize: theme.typography.caption.fontSize,
              color: theme.colors.tertiary,
              wordBreak: 'break-all',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {videoData.url}
          </motion.p>
        )}
      </TitleSection>
    </InfoContainer>
  );
};
