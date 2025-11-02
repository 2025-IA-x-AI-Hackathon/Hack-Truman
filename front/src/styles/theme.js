// Glass-morphism, Wire-frame, 3D, Bold, X-Ray Design System
// @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

export const theme = {
  colors: {
    primary: '#ffffff',
    secondary: '#f0f0f0',
    tertiary: '#e0e0e0',
    background: '#0a0a0a',
    accent: '#00d4ff',
    success: '#00ff00',
    error: '#ff4444',
    warning: '#ffaa00',
    claim: '#888888',
    factTrue: '#ffffff',
    factFalse: '#ff4444',
  },

  // Trust score colors gradient
  trustScore: {
    high: 'rgba(255, 255, 255, 0.95)',
    medium: 'rgba(200, 200, 200, 0.9)',
    low: 'rgba(255, 68, 68, 0.9)',
  },

  glass: {
    container: 'rgba(255, 255, 255, 0.1)',
    containerHover: 'rgba(255, 255, 255, 0.15)',
    border: 'rgba(255, 255, 255, 0.2)',
  },

  typography: {
    fontFamily: '"IBM Plex Mono", "Courier New", monospace',
    monoFont: '"IBM Plex Mono", "Courier New", monospace',
    retroFont: '"IBM 3270", "Courier New", monospace',
    sansFont: '"Helvetica Neue", "Arial", sans-serif',
    h1: { fontSize: '3rem', fontWeight: 'bold', letterSpacing: '-0.02em' },
    h2: { fontSize: '2rem', fontWeight: 'bold', letterSpacing: '-0.015em' },
    h3: { fontSize: '1.5rem', fontWeight: 'bold' },
    body: { fontSize: '1rem', fontWeight: '400', lineHeight: '1.6' },
    caption: { fontSize: '0.875rem', fontWeight: '400', opacity: 0.8 },
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },

  border: {
    radius: '12px',
    width: '1px',
  },

  shadows: {
    sm: '0 2px 8px rgba(0, 212, 255, 0.1)',
    md: '0 8px 24px rgba(0, 212, 255, 0.15)',
    lg: '0 16px 48px rgba(0, 212, 255, 0.2)',
  },

  grid: {
    columns: 12,
    gap: '1rem',
  },
};

export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

  @font-face {
    font-family: 'IBM 3270';
    src: url('https://cdn.jsdelivr.net/npm/ibm-plex@1.2.0/IBM-Plex-Mono/fonts/IBMPlexMono-Regular.woff2') format('woff2'),
         url('https://cdn.jsdelivr.net/npm/ibm-plex@1.2.0/IBM-Plex-Mono/fonts/IBMPlexMono-Regular.woff') format('woff');
    font-weight: normal;
    font-style: normal;
  }

  @font-face {
    font-family: 'IBM 3270';
    src: url('https://cdn.jsdelivr.net/npm/ibm-plex@1.2.0/IBM-Plex-Mono/fonts/IBMPlexMono-Bold.woff2') format('woff2'),
         url('https://cdn.jsdelivr.net/npm/ibm-plex@1.2.0/IBM-Plex-Mono/fonts/IBMPlexMono-Bold.woff') format('woff');
    font-weight: 700;
    font-style: normal;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${theme.typography.fontFamily};
    background-color: ${theme.colors.background};
    color: ${theme.colors.primary};
    overflow: hidden;
    background-image:
      radial-gradient(circle at 20% 50%, rgba(0, 212, 255, 0.03) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(0, 212, 255, 0.02) 0%, transparent 50%);
  }

  #root {
    height: 100vh;
    width: 100vw;
  }
`;
