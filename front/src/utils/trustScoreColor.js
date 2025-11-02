import { theme } from '../styles/theme';

/**
 * 신뢰도 점수에 따른 색상 반환
 * @param {number} score - 신뢰도 점수 (0-100)
 * @returns {string} - 해당하는 색상값
 */
export const getTrustScoreColor = (score) => {
  if (score >= 70) return theme.trustScore.high;
  if (score >= 40) return theme.trustScore.medium;
  return theme.trustScore.low;
};

/**
 * 신뢰도 점수에 따른 평가 텍스트 반환
 * @param {number} score - 신뢰도 점수 (0-100)
 * @returns {string} - 신뢰도 평가 텍스트
 */
export const getTrustScoreLabel = (score) => {
  if (score >= 80) return 'Highly Trustworthy';
  if (score >= 60) return 'Mostly Trustworthy';
  if (score >= 40) return 'Mixed';
  if (score >= 20) return 'Questionable';
  return 'Unreliable';
};

/**
 * 신뢰도 점수에 따른 설명 반환
 * @param {number} score - 신뢰도 점수 (0-100)
 * @returns {string} - 신뢰도 설명
 */
export const getTrustScoreDescription = (score) => {
  if (score >= 70) {
    return 'This video appears to contain mostly accurate information based on fact-checking.';
  }
  if (score >= 40) {
    return 'This video contains a mix of accurate and questionable claims. Review individual facts for details.';
  }
  return 'This video contains significant inaccuracies or unverified claims. Proceed with caution.';
};
