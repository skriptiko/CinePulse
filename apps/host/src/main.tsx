import { ApiProvider } from '@repo/api';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app';
import { handlePreloadError } from './stale-chunk-reload';
import './styles/globals.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

window.addEventListener('vite:preloadError', (event) => handlePreloadError(event));

createRoot(rootElement).render(
  <StrictMode>
    <ApiProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ApiProvider>
  </StrictMode>
);
