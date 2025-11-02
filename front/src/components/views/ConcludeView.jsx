import styled from 'styled-components';
import { motion } from 'framer-motion';
import { theme } from '../../styles/theme';
import { useWorkflow } from '../../context/WorkflowContext';
import { getTrustScoreDescription } from '../../utils';

const ConcludeContainer = styled.div`
  width: 100%;
  max-width: 1000px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  gap: ${theme.spacing.xl};
`;

const ThumbnailImage = styled(motion.img)`
  width: 200px;
  height: 112px;
  border-radius: ${theme.border.radius};
  border: ${theme.border.width} solid ${theme.glass.border};
  object-fit: cover;
`;

const TrustScoreDisplay = styled(motion.div)`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.spacing.lg};
  width: 100%;
`;

const GaugeContainer = styled.div`
  position: relative;
  width: 280px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const GaugeBackground = styled.svg`
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 20px rgba(0, 212, 255, 0.2));
  background: radial-gradient(ellipse at 50% 140px, rgba(0, 212, 255, 0.05) 0%, transparent 70%);
  border-radius: 50%;
`;

const ScoreLabel = styled.p`
  font-size: ${theme.typography.body.fontSize};
  color: ${theme.colors.tertiary};
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-family: ${theme.typography.retroFont};
`;

const TrustScoreNumber = styled.div`
  font-size: 3.5rem;
  font-weight: bold;
  color: ${(props) => {
    const score = props.score || 0;
    if (score >= 75) return 'rgba(0, 255, 150, 0.95)';
    if (score >= 50) return 'rgba(255, 200, 0, 0.95)';
    return 'rgba(255, 68, 68, 0.95)';
  }};
  line-height: 1;
  font-family: ${theme.typography.retroFont};
`;

const TrustScoreText = styled.p`
  font-size: ${theme.typography.h3.fontSize};
  font-weight: bold;
  color: ${theme.colors.primary};
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.lg};
  width: 100%;
  margin: ${theme.spacing.xl} 0;
`;

const Stat = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  padding: ${theme.spacing.lg};
  border-radius: ${theme.border.radius};
  border: ${theme.border.width} solid ${theme.glass.border};
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: ${theme.typography.h2.fontSize};
  font-weight: bold;
  color: ${theme.colors.accent};
  margin-bottom: ${theme.spacing.sm};
`;

const StatLabel = styled.p`
  font-size: ${theme.typography.caption.fontSize};
  color: ${theme.colors.tertiary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;


const Gauge = ({ score }) => {
  // Calculate needle rotation: -90 to 90 degrees (180 degree range)
  const rotation = (score / 100) * 180 - 90;

  return (
    <GaugeContainer>
      <motion.div
        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <GaugeBackground viewBox="0 0 280 160">
          {/* Outer glow circle */}
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background arc sections - red to yellow to green to cyan */}
          {/* Red section (0-25) */}
          <path
            d="M 40 140 A 100 100 0 0 1 70 47"
            fill="none"
            stroke="rgba(255, 68, 68, 0.4)"
            strokeWidth="24"
            strokeLinecap="round"
            filter="url(#glow)"
          />
          {/* Orange section (25-50) */}
          <path
            d="M 70 47 A 100 100 0 0 1 140 20"
            fill="none"
            stroke="rgba(255, 200, 0, 0.4)"
            strokeWidth="24"
            strokeLinecap="round"
            filter="url(#glow)"
          />
          {/* Green section (50-75) */}
          <path
            d="M 140 20 A 100 100 0 0 1 210 47"
            fill="none"
            stroke="rgba(0, 255, 150, 0.4)"
            strokeWidth="24"
            strokeLinecap="round"
            filter="url(#glow)"
          />
          {/* Light green section (75-100) */}
          <path
            d="M 210 47 A 100 100 0 0 1 240 140"
            fill="none"
            stroke="rgba(0, 212, 255, 0.5)"
            strokeWidth="24"
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* Center circle - glow effect */}
          <circle cx="140" cy="140" r="14" fill="none" stroke="rgba(0, 212, 255, 0.3)" strokeWidth="2" />
          <circle cx="140" cy="140" r="10" fill="none" stroke="rgba(0, 212, 255, 0.2)" strokeWidth="1" />
          <circle cx="140" cy="140" r="8" fill="rgba(0, 212, 255, 0.9)" filter="url(#glow)" />

          {/* Needle - animated */}
          <motion.g
            transform={`rotate(${rotation} 140 140)`}
            initial={{ rotate: -90 }}
            animate={{ rotate: rotation }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            {/* Main needle line with glow */}
            <line
              x1="170"
              y1="140"
              x2="140"
              y2="35"
              stroke={
                score >= 75
                  ? 'rgba(0, 255, 150, 0.95)'
                  : score >= 50
                  ? 'rgba(255, 200, 0, 0.95)'
                  : 'rgba(255, 68, 68, 0.95)'
              }
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#glow)"
            />
            {/* Needle shadow for depth */}
            <line
              x1="170"
              y1="140"
              x2="140"
              y2="35"
              stroke="rgba(0, 212, 255, 0.3)"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.4"
            />
            {/* Center pivot circle */}
            <circle cx="170" cy="140" r="6" fill="rgba(0, 212, 255, 0.95)" filter="url(#glow)" />
          </motion.g>

          {/* Labels */}
          <text
            x="45"
            y="158"
            fontSize="11"
            fill="rgba(255, 68, 68, 0.8)"
            textAnchor="middle"
            fontFamily={theme.typography.retroFont}
            fontWeight="bold"
          >
            POOR
          </text>
          <text
            x="140"
            y="158"
            fontSize="11"
            fill="rgba(255, 200, 0, 0.8)"
            textAnchor="middle"
            fontFamily={theme.typography.retroFont}
            fontWeight="bold"
          >
            FAIR
          </text>
          <text
            x="235"
            y="158"
            fontSize="11"
            fill="rgba(0, 255, 150, 0.8)"
            textAnchor="middle"
            fontFamily={theme.typography.retroFont}
            fontWeight="bold"
          >
            GOOD
          </text>
        </GaugeBackground>
      </motion.div>
    </GaugeContainer>
  );
};

export const ConcludeView = () => {
  const { videoData, conclusion } = useWorkflow();

  return (
    <ConcludeContainer>
      {videoData.thumbnail && (
        <ThumbnailImage
          src={videoData.thumbnail}
          alt="Video thumbnail"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        />
      )}

      <TrustScoreDisplay
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Gauge score={conclusion.trustScore || 0} />
        <TrustScoreNumber score={conclusion.trustScore}>
          {conclusion.trustScore}%
        </TrustScoreNumber>
        <TrustScoreText>
          Trustworthiness Score
        </TrustScoreText>
      </TrustScoreDisplay>

      <StatsContainer>
        <Stat
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatNumber>{conclusion.factCount}</StatNumber>
          <StatLabel>Facts Found</StatLabel>
        </Stat>

        <Stat
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatNumber>{conclusion.opinionCount}</StatNumber>
          <StatLabel>Opinions</StatLabel>
        </Stat>
      </StatsContainer>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          textAlign: 'center',
          color: theme.colors.tertiary,
          fontSize: '0.95rem',
          lineHeight: 1.6,
          maxWidth: '500px',
        }}
      >
        {getTrustScoreDescription(conclusion.trustScore)}
      </motion.p>

    </ConcludeContainer>
  );
};
