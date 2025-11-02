import styled from 'styled-components';
import { Header } from './Header';
import { MainContent } from './MainContent';

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
`;

export const Layout = () => {
  return (
    <LayoutContainer>
      <ContentArea>
        <Header />
        <MainContent />
      </ContentArea>
    </LayoutContainer>
  );
};
