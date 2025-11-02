import styled from 'styled-components';
import { Header } from './Header';
import { MainContent } from './MainContent';
import { RotatingSphere } from '../common/RotatingSphere';

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
`;

const ContentArea = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  background:
  radial-gradient(circle at 5% 0%, #31949B33, #00000033 30%),
  radial-gradient(circle at 130% 100%, #00474A22 0%,  #00474A33 20%, #00000099 70%),
  rgb(0 0 0);
  position: relative;
`;

export const Layout = () => {
  return (
    <LayoutContainer>
      <ContentArea>
        <RotatingSphere />
        <Header />
        <MainContent />
      </ContentArea>
    </LayoutContainer>
  );
};
