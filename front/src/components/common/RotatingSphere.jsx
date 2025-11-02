import styled, { keyframes } from 'styled-components';
import SphereWireframe from '../../assets/Sphere_wireframe.svg';

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const SphereContainer = styled.div`
  position: fixed;
  top: -30%; // 상단에서 100px 위로 (반쯤 가려지도록)
  left: 50%;
  transform: translateX(-50%);
  width: 400px;
  height: 400px;
  z-index: 10; // Header(z-index: 100)보다 낮게
  pointer-events: none; // 클릭 이벤트 무시
  opacity: 0.08; // 더 은은하게
`;

const RotatingSphereImg = styled.img`
  width: 100%;
  height: 100%;
  animation: ${rotate} 45s linear infinite; // 조금 더 천천히 회전
  filter: invert(1) drop-shadow(0 0 20px rgba(0, 212, 255, 0.3)); // 색상 반전 + 글로우 효과
`;

export const RotatingSphere = () => {
  return (
    <SphereContainer>
      <RotatingSphereImg src={SphereWireframe} alt="Rotating sphere" />
    </SphereContainer>
  );
};