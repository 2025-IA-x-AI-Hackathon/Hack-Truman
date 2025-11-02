import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { theme } from '../../styles/theme';
import { useWorkflow } from '../../context/WorkflowContext';
import { WORKFLOW_STEPS } from '../../constants/workflowSteps';

const AnalysisContainer = styled.div`
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

const Subtitle = styled.p`
  font-size: ${theme.typography.body.fontSize};
  color: ${theme.colors.tertiary};
`;

const CandidatesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const CandidateCard = styled(motion.div)`
  background: ${(props) => props.cardBackground || 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${(props) => props.cardBorder || 'rgba(0, 212, 255, 0.2)'};
  border-radius: ${theme.border.radius};
  padding: ${theme.spacing.lg};
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(12px);
  overflow: hidden;
  box-shadow: 0 0 20px ${(props) => props.cardBackground ? 'transparent' : 'rgba(0, 212, 255, 0.05)'},
              inset 0 1px 0 rgba(0, 212, 255, 0.1);

  &:hover {
    border-color: ${theme.colors.accent};
    background: ${(props) => props.cardBackground || 'rgba(0, 212, 255, 0.08)'};
    transform: translateY(-4px);
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.2),
                inset 0 1px 0 rgba(0, 212, 255, 0.15);
  }
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

const CandidateTitle = styled.p`
  font-size: ${theme.typography.h3.fontSize};
  font-weight: bold;
  margin-bottom: ${theme.spacing.md};
  color: ${theme.colors.primary};
  line-height: 1.4;
`;

const TrustScoreContainer = styled.div`
  margin-top: ${theme.spacing.lg};
`;

const TrustScoreLabel = styled.p`
  font-size: ${theme.typography.caption.fontSize};
  color: ${theme.colors.tertiary};
  margin-bottom: ${theme.spacing.sm};
`;

const TrustScoreBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(0, 212, 255, 0.2);
  box-shadow: inset 0 1px 2px rgba(0, 212, 255, 0.1), 0 0 8px rgba(0, 212, 255, 0.1);
`;

const TrustScoreFill = styled(motion.div)`
  height: 100%;
  border-radius: 4px;
  background: ${(props) => {
    const score = props.score || 0;
    if (score >= 70) return 'rgba(0, 255, 150, 0.8)';
    if (score >= 40) return 'rgba(255, 200, 0, 0.7)';
    return 'rgba(255, 68, 68, 0.8)';
  }};
  box-shadow: ${(props) => {
    const score = props.score || 0;
    if (score >= 70) return '0 0 10px rgba(0, 255, 150, 0.6)';
    if (score >= 40) return '0 0 10px rgba(255, 200, 0, 0.5)';
    return '0 0 10px rgba(255, 68, 68, 0.5)';
  }};
`;

const TrustScorePercentage = styled.p`
  text-align: right;
  font-size: 0.85rem;
  margin-top: ${theme.spacing.sm};
  color: ${theme.colors.accent};
  font-weight: bold;
`;

// 확장 모달
const ExpandedOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 10, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const ExpandedCard = styled(motion.div)`
  background: rgba(10, 10, 10, 0.8);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: ${theme.border.radius};
  padding: ${theme.spacing.xl};
  width: 90%;
  max-width: 900px;
  max-height: 80vh;
  overflow-y: auto;
  backdrop-filter: blur(15px);
  box-shadow: 0 0 40px rgba(0, 212, 255, 0.15), inset 0 1px 0 rgba(0, 212, 255, 0.1);
`;

const ExpandedTitle = styled.h3`
  font-size: ${theme.typography.h2.fontSize};
  font-weight: bold;
  margin-bottom: ${theme.spacing.lg};
`;

const Section = styled.div`
  margin-bottom: ${theme.spacing.xl};
`;

const SectionTitle = styled.h4`
  font-size: ${theme.typography.h3.fontSize};
  font-weight: bold;
  margin-bottom: ${theme.spacing.md};
  color: ${theme.colors.accent};
`;

const Reasoning = styled.p`
  line-height: 1.8;
  color: ${theme.colors.primary};
  margin-bottom: ${theme.spacing.md};
`;

const References = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const Reference = styled.li`
  padding: ${theme.spacing.md};
  background: rgba(255, 255, 255, 0.05);
  border-left: 2px solid ${theme.colors.accent};
  border-radius: ${theme.border.radius};
  font-size: ${theme.typography.caption.fontSize};
  color: ${theme.colors.tertiary};
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${theme.spacing.lg};
  right: ${theme.spacing.lg};
  background: transparent;
  border: none;
  color: ${theme.colors.primary};
  font-size: 1.5rem;
  cursor: pointer;
  padding: ${theme.spacing.md};

  &:hover {
    color: ${theme.colors.accent};
  }
`;

// Helper function to get card colors based on type and trust score
const getCardColors = (candidate, verification, isVerifyPhase) => {
  // In CLASSIFY phase, use default glass morphism style
  if (!isVerifyPhase) {
    return {
      background: theme.glass.container,
      border: theme.glass.border,
    };
  }

  // In VERIFY phase, color based on type and trust score
  const trustScore = verification.trustScore || 0;

  if (candidate.type === 'claim') {
    // claim candidates are gray
    return {
      background: 'rgba(136, 136, 136, 0.15)',
      border: 'rgba(136, 136, 136, 0.3)',
    };
  }

  // Fact candidates: white (100) → red (0) gradient
  if (trustScore >= 75) {
    // High trust - white
    return {
      background: 'rgba(255, 255, 255, 0.1)',
      border: 'rgba(255, 255, 255, 0.2)',
    };
  } else if (trustScore >= 50) {
    // Medium trust - light yellow/orange
    return {
      background: 'rgba(255, 200, 100, 0.1)',
      border: 'rgba(255, 200, 100, 0.2)',
    };
  } else if (trustScore >= 25) {
    // Low trust - orange/red
    return {
      background: 'rgba(255, 100, 80, 0.1)',
      border: 'rgba(255, 100, 80, 0.2)',
    };
  } else {
    // Very low trust - red
    return {
      background: 'rgba(255, 50, 50, 0.15)',
      border: 'rgba(255, 50, 50, 0.3)',
    };
  }
};

export const CandidateAnalysisView = ({ isInConcludePhase = false }) => {
  const { candidates, verifications, currentStep, videoData } = useWorkflow();
  const [expandedId, setExpandedId] = useState(null);

  // 분류 단계에서는 신뢰도 미표시, 검증 단계에서는 표시
  const isVerifyPhase = currentStep === WORKFLOW_STEPS.VERIFY || isInConcludePhase;
  const isCandidatesReady = candidates.length > 0;

  const handleCardClick = (candidate) => {
    if (isVerifyPhase) {
      setExpandedId(candidate.id || candidate.text);
    }
  };

  const handleClose = () => {
    setExpandedId(null);
  };

  return (
    <AnalysisContainer>
      <CandidatesList>
        {candidates.map((candidate, index) => {
          const verification = verifications[candidate.id || candidate.text] || {};
          const score = verification.trustScore || 0;
          const { background, border } = getCardColors(candidate, verification, isVerifyPhase);

          return (
            <CandidateCard
              key={candidate.id || index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              onClick={() => handleCardClick(candidate)}
              cardBackground={background}
              cardBorder={border}
              style={{
                cursor: isVerifyPhase ? 'pointer' : 'default',
              }}
            >
              <CandidateType type={candidate.type}>
                {candidate.type}
              </CandidateType>
              <CandidateTitle>{candidate.text}</CandidateTitle>

              {candidate.timestamp && (
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: theme.colors.tertiary,
                    marginBottom: theme.spacing.md,
                  }}
                >
                  Time: {candidate.timestamp}
                </p>
              )}

              {/* 검증 데이터가 있으면 신뢰도 표시 */}
              {verification && verification.trustScore !== undefined && (
                <TrustScoreContainer>
                  <TrustScoreLabel>Trust Score</TrustScoreLabel>
                  <TrustScoreBar>
                    <TrustScoreFill
                      score={score}
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </TrustScoreBar>
                  <TrustScorePercentage>{score}%</TrustScorePercentage>
                </TrustScoreContainer>
              )}

              {/* 분류 단계에서 미리보기 텍스트 */}
              {!isVerifyPhase && verification.reasoning && (
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: theme.colors.tertiary,
                    marginTop: theme.spacing.md,
                    opacity: 0.7,
                  }}
                >
                  Verification pending...
                </p>
              )}
            </CandidateCard>
          );
        })}
      </CandidatesList>

      {!isCandidatesReady && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center',
            padding: theme.spacing.xl,
            color: theme.colors.tertiary,
          }}
        >
          <p>
            {isVerifyPhase ? 'Verifying candidates...' : 'Classifying candidates...'}
          </p>
        </motion.div>
      )}

      {/* 확장 모달 - 검증 단계에서만 */}
      <AnimatePresence>
        {isVerifyPhase && expandedId && (
          <ExpandedOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          >
            <ExpandedCard
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <CloseButton onClick={handleClose}>✕</CloseButton>

              {(() => {
                const candidate = candidates.find(
                  (c) => (c.id || c.text) === expandedId
                );
                const verification = verifications[expandedId] || {};

                if (!candidate) return null;

                return (
                  <>
                    <ExpandedTitle>{candidate.text}</ExpandedTitle>

                    <Section>
                      <SectionTitle>Trust Score</SectionTitle>
                      <TrustScoreBar>
                        <TrustScoreFill
                          score={verification.trustScore || 0}
                          initial={{ width: 0 }}
                          animate={{ width: `${verification.trustScore || 0}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </TrustScoreBar>
                      <p
                        style={{
                          marginTop: theme.spacing.md,
                          fontSize: '1.2rem',
                          color: theme.colors.accent,
                          fontWeight: 'bold',
                        }}
                      >
                        {verification.trustScore || 0}% Trustworthy
                      </p>
                    </Section>

                    {verification.reasoning && (
                      <Section>
                        <SectionTitle>AI Reasoning</SectionTitle>
                        <Reasoning>{verification.reasoning}</Reasoning>
                      </Section>
                    )}

                    {verification.references &&
                      verification.references.length > 0 && (
                        <Section>
                          <SectionTitle>References</SectionTitle>
                          <References>
                            {verification.references.map((ref, idx) => (
                              <Reference key={idx}>{ref}</Reference>
                            ))}
                          </References>
                        </Section>
                      )}

                    {candidate.timestamp && (
                      <Section>
                        <SectionTitle>Timestamp in Video</SectionTitle>
                        <p style={{ color: theme.colors.tertiary }}>
                          {candidate.timestamp}
                        </p>
                      </Section>
                    )}
                  </>
                );
              })()}
            </ExpandedCard>
          </ExpandedOverlay>
        )}
      </AnimatePresence>
    </AnalysisContainer>
  );
};
