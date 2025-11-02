import styled from 'styled-components';
import { motion } from 'framer-motion';
import { theme } from '../../styles/theme';
import { useWorkflow } from '../../context/WorkflowContext';

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  gap: ${theme.spacing.xl};
`;

const Thumbnail = styled(motion.img)`
  width: 200px;
  height: 200px;
  border-radius: ${theme.border.radius};
  border: ${theme.border.width} solid ${theme.glass.border};
  background: ${theme.glass.container};
  object-fit: cover;
`;

const Placeholder = styled(motion.div)`
  width: 200px;
  height: 200px;
  border-radius: ${theme.border.radius};
  border: ${theme.border.width} solid ${theme.glass.border};
  background: linear-gradient(
    45deg,
    ${theme.glass.container},
    ${theme.glass.containerHover}
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.tertiary};
  font-weight: bold;
`;

const LoadingSpinner = styled(motion.div)`
  width: 60px;
  height: 60px;
  border: ${theme.border.width} solid ${theme.glass.border};
  border-top: ${theme.border.width} solid ${theme.colors.accent};
  border-radius: 50%;
`;

const LoadingText = styled(motion.p)`
  font-size: ${theme.typography.body.fontSize};
  color: ${theme.colors.tertiary};
`;

export const LoadingView = () => {
  const { videoData } = useWorkflow();

  const spinnerVariants = {
    spin: {
      rotate: 360,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };

  return (
    <LoadingContainer>
      {videoData.thumbnail ? (
        <Thumbnail
          src={videoData.thumbnail}
          alt="Video thumbnail"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
      ) : (
        <Placeholder
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          ▶
        </Placeholder>
      )}

      <LoadingSpinner
        variants={spinnerVariants}
        animate="spin"
        initial={{ opacity: 0 }}
        transition={{ delay: 0.3 }}
      />

      <LoadingText
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        Processing video...
      </LoadingText>
    </LoadingContainer>
  );
};
