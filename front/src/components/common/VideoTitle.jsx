import styled from 'styled-components';
import { motion } from 'framer-motion';
import { theme } from '../../styles/theme';
import { useWorkflow } from '../../context/WorkflowContext';

const TitleContainer = styled(motion.div)`
  display: flex;
  justify-content: center;
  align-items: center;
  width: max-content;
  padding: ${theme.spacing.lg} ${theme.spacing.xl};
  background: rgba(10, 10, 10, 0.3);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);
  margin-bottom: ${theme.spacing.lg};
`;

const Title = styled(motion.h2)`
  font-size: ${theme.typography.h3.fontSize};
  color: ${theme.colors.primary};
  text-align: center;
  margin: 0;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
  max-width: 800px;
  line-height: 1.4;
`;

const Subtitle = styled.span`
  display: block;
  font-size: ${theme.typography.body.fontSize};
  color: ${theme.colors.tertiary};
  margin-top: ${theme.spacing.sm};
  font-weight: 400;
  opacity: 0.8;
`;

export const VideoTitle = () => {
  const { videoData } = useWorkflow();

  if (!videoData.title) return null;

  return (
    <TitleContainer
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <Title>
        {videoData.title}
      </Title>
    </TitleContainer>
  );
};