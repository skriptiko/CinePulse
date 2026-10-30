import { ApiProvider } from '@repo/api';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app';
import { startErrorReporting } from './error-channel/error-reporting';
import { subscribeToNotifications } from './error-channel/notification-toasts';
import { handlePreloadError } from './stale-chunk-reload';
import './styles/globals.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

window.addEventListener('vite:preloadError', (event) => handlePreloadError(event));
// Once per page, before the first render: remotes may emit during their first render.
startErrorReporting();
subscribeToNotifications();

createRoot(rootElement).render(
  <StrictMode>
    <ApiProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ApiProvider>
  </StrictMode>
);
