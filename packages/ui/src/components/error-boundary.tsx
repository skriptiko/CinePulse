import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  level?: 'shell' | 'module';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isShellLevel = this.props.level === 'shell';

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-destructive">
              {isShellLevel ? 'Application Error' : 'Something went wrong'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {isShellLevel
                ? 'The application encountered a critical error.'
                : 'This module failed to load properly.'}
            </p>
            {this.state.error && (
              <p className="mt-2 text-xs text-muted-foreground font-mono">
                {this.state.error.message}
              </p>
            )}
          </div>
          {!isShellLevel && (
            <Button variant="outline" size="sm" onClick={this.handleRetry}>
              Retry
            </Button>
          )}
          {isShellLevel && (
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Reload Application
            </Button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
export type { ErrorBoundaryProps };
