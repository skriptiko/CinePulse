import { AppLayout, Providers } from '@repo/ui';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useRoutes } from 'react-router-dom';
import { routes } from './routes';
import './styles/globals.css';

// Цей файл використовується ТІЛЬКИ для standalone розробки
// При інтеграції з host використовується тільки експорт routes
function App() {
  return useRoutes(routes);
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

// Для standalone розробки - з усіма провайдерами та layout
createRoot(rootElement).render(
  <StrictMode>
    <Providers>
      <BrowserRouter>
        <AppLayout>
          <App />
        </AppLayout>
      </BrowserRouter>
    </Providers>
  </StrictMode>
);
