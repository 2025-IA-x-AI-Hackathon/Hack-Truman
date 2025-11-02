import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { theme } from '../../styles/theme';
import { useWorkflow } from '../../context/WorkflowContext';
import { STEP_ORDER, STEP_LABELS } from '../../constants/workflowSteps';

const HeaderContainer = styled(motion.header)`
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
`;

const TopSection = styled.div`
  backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(0, 212, 255, 0.3);
  background: rgba(10, 10, 10, 0.8);
  display: flex;
  z-index: 100;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 ${theme.spacing.xl};
  box-shadow: 0 0 30px rgba(0, 212, 255, 0.05), inset 0 1px 0 rgba(0, 212, 255, 0.1);
`;

const Logo = styled.h3`
  font-size: ${theme.typography.h2.fontSize};
  font-weight: 700;
  color: ${theme.colors.accent};
  letter-spacing: 0.1em;
  margin: 0;
  font-family: ${theme.typography.retroFont};
  text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
  font-style: italic;
`;

const VideoTitle = styled(motion.h2)`
  font-size: ${theme.typography.body.fontSize};
  color: ${theme.colors.tertiary};
  text-align: center;
  flex: 1;
  margin: 0;
`;

const MenuButton = styled(motion.button)`
  background: transparent;
  border: ${theme.border.width} solid ${theme.glass.border};
  color: ${theme.colors.primary};
  padding: ${theme.spacing.md};
  border-radius: ${theme.border.radius};
  cursor: pointer;
  font-size: 1.5rem;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    background: ${theme.glass.containerHover};
    border-color: ${theme.colors.accent};
  }
`;

const MenuDropdown = styled(motion.div)`
  position: absolute;
  top: calc(100% + ${theme.spacing.sm});
  right: 0;
  background: ${theme.glass.container};
  border: ${theme.border.width} solid ${theme.glass.border};
  border-radius: ${theme.border.radius};
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: ${theme.spacing.md};
  min-width: 150px;
  z-index: 200;
  backdrop-filter: blur(10px);
`;

const MenuItem = styled(motion.button)`
  background: transparent;
  border: none;
  color: ${theme.colors.primary};
  padding: ${theme.spacing.md};
  cursor: pointer;
  font-size: ${theme.typography.body.fontSize};
  font-weight: bold;
  transition: all 0.3s ease;
  text-align: left;

  &:hover {
    color: ${theme.colors.accent};
  }
`;

const ProgressBarContainer = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  width: 100%;
  align-items: center;
  position: relative;
  height: 24px;
  margin-top: -12px;
  padding: 0 ${theme.spacing.xl};
  background: rgba(10, 10, 10, 0.6);
  border-top: 1px solid rgba(0, 212, 255, 0.1);
  backdrop-filter: blur(12px);
  box-shadow: inset 0 1px 0 rgba(0, 212, 255, 0.05);
`;

const ProgressStep = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  align-items: center;
  cursor: pointer;
  position: relative;
  height: 100%;
  justify-content: center;
`;

const ProgressDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(props) =>
    props.completed ? theme.colors.accent : props.active ? theme.colors.accent : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid
    ${(props) => (props.completed || props.active ? theme.colors.accent : 'rgba(0, 212, 255, 0.2)')};
  transition: all 0.3s ease;
  z-index: 5;
  position: relative;
  top: 0%;
  box-shadow: ${(props) =>
    props.completed || props.active
      ? '0 0 12px rgba(0, 212, 255, 0.6), inset 0 0 4px rgba(0, 212, 255, 0.3)'
      : '0 0 4px rgba(0, 212, 255, 0.2)'};
`;

const ProgressLine = styled.div`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: calc(50% + 12px);
  right: -50%;
  height: 2px;
  background: ${(props) =>
    props.completed
      ? 'linear-gradient(to right, rgba(0, 212, 255, 0.8), rgba(0, 212, 255, 0.3))'
      : 'rgba(0, 212, 255, 0.1)'};
  transition: all 0.3s ease;
  z-index: 1;
  box-shadow: ${(props) =>
    props.completed ? '0 0 8px rgba(0, 212, 255, 0.4)' : 'none'};
`;

const StepLabel = styled(motion.span)`
  font-size: 0.7rem;
  color: ${theme.colors.tertiary};
  text-align: center;
  opacity: 0;
  transition: all 0.3s ease;
  white-space: nowrap;
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  font-family: ${theme.typography.retroFont};

  ${ProgressStep}:hover & {
    opacity: 1;
    color: ${theme.colors.primary};
  }
`;

export const Header = () => {
  const { currentStep, videoData } = useWorkflow();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <HeaderContainer
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <TopSection>
        <Logo>FACTRAY</Logo>
        {videoData.title && (
          <VideoTitle
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {videoData.title}
          </VideoTitle>
        )}
        <div style={{ position: 'relative' }}>
          <MenuButton
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ☰
          </MenuButton>
          <AnimatePresence>
            {isMenuOpen && (
              <MenuDropdown
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <MenuItem>홈</MenuItem>
                <MenuItem>히스토리</MenuItem>
                <MenuItem>만든이들</MenuItem>
              </MenuDropdown>
            )}
          </AnimatePresence>
        </div>
      </TopSection>

      <ProgressBarContainer>
        {STEP_ORDER.map((step, index) => {
          const isActive = step === currentStep;
          const isCompleted = index < currentStepIndex;

          return (
            <ProgressStep key={step}>
              <ProgressDot active={isActive} completed={isCompleted} />
              {index < STEP_ORDER.length - 1 && (
                <ProgressLine completed={isCompleted} />
              )}
              <StepLabel>{STEP_LABELS[step]}</StepLabel>
            </ProgressStep>
          );
        })}
      </ProgressBarContainer>
    </HeaderContainer>
  );
};
