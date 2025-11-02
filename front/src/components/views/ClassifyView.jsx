import styled from 'styled-components';
import { motion } from 'framer-motion';
import { theme } from '../../styles/theme';
import { useWorkflow } from '../../context/WorkflowContext';

const ClassifyContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xl};
  width: 100%;
  max-width: 1400px;
`;

const Header = styled(motion.div)`
  display: flex;
  gap: ${theme.spacing.lg};
  align-items: flex-start;
`;

const Thumbnail = styled.img`
  width: 150px;
  height: 84px;
  border-radius: ${theme.border.radius};
  border: ${theme.border.width} solid ${theme.glass.border};
  object-fit: cover;
  flex-shrink: 0;
`;

const TitleSection = styled.div`
  flex: 1;
`;

const Title = styled.h2`
  font-size: ${theme.typography.h3.fontSize};
  font-weight: bold;
  margin-bottom: ${theme.spacing.lg};
`;

const CandidatesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${theme.spacing.lg};
`;

const CandidateCard = styled(motion.div)`
  background: ${theme.glass.container};
  border: ${theme.border.width} solid ${theme.glass.border};
  border-radius: ${theme.border.radius};
  padding: ${theme.spacing.lg};
  backdrop-filter: blur(10px);
  cursor: not-allowed;
  opacity: 0.8;
`;

const CandidateTitle = styled.p`
  font-size: ${theme.typography.h3.fontSize};
  font-weight: bold;
  margin-bottom: ${theme.spacing.md};
  color: ${(props) => {
    if (props.type === 'fact') return theme.colors.primary;
    if (props.type === 'claim') return theme.colors.claim;
    return theme.colors.primary;
  }};
`;

const CandidateType = styled.span`
  display: inline-block;
  font-size: ${theme.typography.caption.fontSize};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: ${(props) => {
    if (props.type === 'fact') return 'rgba(255, 255, 255, 0.1)';
    if (props.type === 'claim') return 'rgba(136, 136, 136, 0.1)';
    return 'rgba(255, 255, 255, 0.05)';
  }};
  border-radius: ${theme.border.radius};
  margin-bottom: ${theme.spacing.md};
`;

export const ClassifyView = () => {
  const { videoData, candidates } = useWorkflow();

  return (
    <ClassifyContainer>
      <Header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {videoData.thumbnail && (
          <Thumbnail src={videoData.thumbnail} alt="Video" />
        )}
        <TitleSection>
          <Title>{videoData.title || 'Video Analysis'}</Title>
          <p style={{ color: theme.colors.tertiary, fontSize: '0.9rem' }}>
            {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} found
          </p>
        </TitleSection>
      </Header>

      <CandidatesList>
        {candidates.map((candidate, index) => (
          <CandidateCard
            key={candidate.id || index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
          >
            <CandidateType type={candidate.type}>
              {candidate.type}
            </CandidateType>
            <CandidateTitle type={candidate.type}>
              {candidate.text}
            </CandidateTitle>
            {candidate.timestamp && (
              <p
                style={{
                  fontSize: '0.85rem',
                  color: theme.colors.tertiary,
                  marginTop: theme.spacing.md,
                }}
              >
                Time: {candidate.timestamp}
              </p>
            )}
          </CandidateCard>
        ))}
      </CandidatesList>

      {candidates.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center',
            padding: theme.spacing.xl,
            color: theme.colors.tertiary,
          }}
        >
          <p>Classifying candidates...</p>
        </motion.div>
      )}
    </ClassifyContainer>
  );
};
