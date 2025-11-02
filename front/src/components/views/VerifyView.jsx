import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { theme } from '../../styles/theme';
import { useWorkflow } from '../../context/WorkflowContext';

const VerifyContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xl};
  width: 100%;
  max-width: 1400px;
`;

const CandidatesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const CandidateCard = styled(motion.div)`
  background: ${theme.glass.container};
  border: ${theme.border.width} solid ${theme.glass.border};
  border-radius: ${theme.border.radius};
  padding: ${theme.spacing.lg};
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    border-color: ${theme.colors.accent};
    background: ${theme.glass.containerHover};
  }
`;

const CandidateTitle = styled.p`
  font-size: ${theme.typography.h3.fontSize};
  font-weight: bold;
  margin-bottom: ${theme.spacing.md};
  color: ${theme.colors.primary};
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
  background: ${theme.glass.container};
  border-radius: 4px;
  overflow: hidden;
  border: ${theme.border.width} solid ${theme.glass.border};
`;

const TrustScoreFill = styled(motion.div)`
  height: 100%;
  border-radius: 4px;
  background: ${(props) => {
    const score = props.score || 0;
    if (score >= 70) return theme.trustScore.high;
    if (score >= 40) return theme.trustScore.medium;
    return theme.trustScore.low;
  }};
`;

const ExpandedContent = styled(motion.div)`
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
  background: ${theme.glass.container};
  border: ${theme.border.width} solid ${theme.glass.border};
  border-radius: ${theme.border.radius};
  padding: ${theme.spacing.xl};
  width: 90%;
  max-width: 900px;
  max-height: 80vh;
  overflow-y: auto;
  backdrop-filter: blur(10px);
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

export const VerifyView = () => {
  const { candidates, verifications, setSelectedCandidate, selectedCandidate } =
    useWorkflow();
  const [expandedId, setExpandedId] = useState(null);

  const handleCardClick = (candidate) => {
    setExpandedId(candidate.id || candidate.text);
    setSelectedCandidate(candidate);
  };

  const handleClose = () => {
    setExpandedId(null);
    setSelectedCandidate(null);
  };

  return (
    <VerifyContainer>
      <CandidatesList>
        {candidates.map((candidate, index) => {
          const verification = verifications[candidate.id || candidate.text] || {};
          const score = verification.trustScore || 0;

          return (
            <CandidateCard
              key={candidate.id || index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleCardClick(candidate)}
            >
              <CandidateTitle>{candidate.text}</CandidateTitle>
              {verification.reasoning && (
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: theme.colors.tertiary,
                    marginBottom: theme.spacing.md,
                  }}
                >
                  {verification.reasoning.substring(0, 100)}...
                </p>
              )}
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
                <p
                  style={{
                    textAlign: 'right',
                    fontSize: '0.85rem',
                    marginTop: theme.spacing.sm,
                    color: theme.colors.accent,
                    fontWeight: 'bold',
                  }}
                >
                  {score}%
                </p>
              </TrustScoreContainer>
            </CandidateCard>
          );
        })}
      </CandidatesList>

      <AnimatePresence>
        {expandedId && selectedCandidate && (
          <ExpandedContent
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

              <ExpandedTitle>{selectedCandidate.text}</ExpandedTitle>

              {(() => {
                const verification = verifications[selectedCandidate.id || selectedCandidate.text] || {};

                return (
                  <>
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

                    {verification.references && verification.references.length > 0 && (
                      <Section>
                        <SectionTitle>References</SectionTitle>
                        <References>
                          {verification.references.map((ref, idx) => (
                            <Reference key={idx}>{ref}</Reference>
                          ))}
                        </References>
                      </Section>
                    )}

                    {selectedCandidate.timestamp && (
                      <Section>
                        <SectionTitle>Timestamp in Video</SectionTitle>
                        <p style={{ color: theme.colors.tertiary }}>
                          {selectedCandidate.timestamp}
                        </p>
                      </Section>
                    )}
                  </>
                );
              })()}
            </ExpandedCard>
          </ExpandedContent>
        )}
      </AnimatePresence>
    </VerifyContainer>
  );
};
