import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center border-error/20 bg-error/5 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-center mb-4 text-error">
              <AlertTriangle className="w-12 h-12" />
            </div>
            <h1 className="text-xl md:text-2xl font-headline font-bold text-error mb-2">Something went wrong</h1>
            <p className="text-on-surface-variant font-body mb-6">
              We've encountered an unexpected error. Please refresh the page to try again.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.reload()} variant="primary">
                Refresh Page
              </Button>
              <Button onClick={() => window.location.href = '/'} variant="secondary">
                Go to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
