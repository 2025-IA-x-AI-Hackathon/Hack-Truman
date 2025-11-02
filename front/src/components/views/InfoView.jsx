import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { theme } from '../../styles/theme';
import { useWorkflow } from '../../context/WorkflowContext';
import { useSocket } from '../../hooks/useSocket';

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

const AnalyzeButton = styled(motion.button)`
  margin-top: ${theme.spacing.lg};
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid ${theme.colors.accent};
  color: ${theme.colors.accent};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-radius: ${theme.border.radius};
  font-size: ${theme.typography.body.fontSize};
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(12px);

  &:hover {
    background: rgba(0, 212, 255, 0.2);
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const InfoView = () => {
  const { videoData } = useWorkflow();
  const { send, ws } = useSocket();
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = () => {
    if (!videoData.url) {
      alert('비디오 정보가 없습니다.');
      return;
    }

    setIsLoading(true);

    // 백엔드에 분석 요청 전송
    // 여기서는 더미 데이터로 요청을 보냅니다
    // 실제로는 백엔드에서 파일 경로를 관리하고 해당 경로를 요청해야 합니다
    const analysisRequest = {
      file_path: 'downloads/example.wav', // 실제 파일 경로로 업데이트 필요
      language: 'en',
    };

    send(analysisRequest);
  };

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
        <AnalyzeButton
          onClick={handleAnalyze}
          disabled={isLoading}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? '분석 중...' : '분석 시작'}
        </AnalyzeButton>
      </TitleSection>
    </InfoContainer>
  );
};
