import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useRoutes } from 'react-router-dom';
import { routes } from './routes';
import './styles/globals.css';

function App() {
  return useRoutes(routes);
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <div id="mfe-pages-root" className="min-h-screen bg-background">
        <App />
      </div>
    </BrowserRouter>
  </StrictMode>
);
