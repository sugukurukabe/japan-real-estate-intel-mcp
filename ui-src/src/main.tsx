import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell } from './app/AppShell';

const container = document.getElementById('root');
if (!container) {
  throw new Error('root element not found');
}

createRoot(container).render(
  <StrictMode>
    <AppShell />
  </StrictMode>,
);
