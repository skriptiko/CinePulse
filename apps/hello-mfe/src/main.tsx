import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import HelloWorld from './components/HelloWorld';
import './styles/globals.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <div id="mfe-hello-root" className="min-h-screen bg-background">
      <HelloWorld />
    </div>
  </StrictMode>
);
