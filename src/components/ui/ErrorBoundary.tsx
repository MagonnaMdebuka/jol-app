import { Component, type ReactNode, type ErrorInfo } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import Button from './Button';

interface IErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface IErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component to catch runtime errors in child components.
 * Displays a user-friendly error message with retry option.
 */
class ErrorBoundary extends Component<IErrorBoundaryProps, IErrorBoundaryState> {
  constructor(props: IErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): IErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to monitoring service in production
    if (!import.meta.env.PROD) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    const { hasError } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
          <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <h2
            className="text-nz-text text-lg font-bold mb-2"
            style={{ fontFamily: '"Bricolage Grotesque", system-ui' }}
          >
            Something went wrong
          </h2>
          <p className="text-nz-muted text-sm mb-6 max-w-sm">
            We hit an unexpected error. Try refreshing the page or come back later.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={this.handleRetry} icon={<RefreshCw size={14} />}>
              Try again
            </Button>
            <Button onClick={this.handleReload}>Refresh page</Button>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
