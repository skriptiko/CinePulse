import { ErrorBoundary, MfeContainer } from '@repo/ui';
import { Suspense, lazy } from 'react';

const HelloWorld = lazy(() => import('helloMfe/HelloWorld'));

function MfeLoadingFallback() {
  return (
    <MfeContainer id="mfe-hello-loading" isLoading>
      <div />
    </MfeContainer>
  );
}

function App() {
  return (
    <ErrorBoundary level="shell">
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <ErrorBoundary level="module">
            <MfeContainer id="mfe-hello-root" minHeight="100px">
              <Suspense fallback={<MfeLoadingFallback />}>
                <HelloWorld />
              </Suspense>
            </MfeContainer>
          </ErrorBoundary>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
