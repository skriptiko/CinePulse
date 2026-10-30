import { ApiProvider } from '@repo/api';
import { startAuthSession } from '@repo/firebase';
import { AppLayout } from '@repo/ui';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useRoutes } from 'react-router-dom';
import { routes } from './routes';
import './styles/globals.css';

// This file is used ONLY for standalone development
// When integrated into the host, only the routes export is used
function App() {
  return useRoutes(routes);
}

const rootElement = document.getElementById('mfe-user-root');

if (!rootElement) {
  throw new Error('Root element not found');
}

startAuthSession();

// Standalone development: with all providers and the layout
createRoot(rootElement).render(
  <StrictMode>
    <ApiProvider>
      <BrowserRouter>
        <AppLayout>
          <App />
        </AppLayout>
      </BrowserRouter>
    </ApiProvider>
  </StrictMode>
);
