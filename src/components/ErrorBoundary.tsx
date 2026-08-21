import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button, Card, CardContent } from './ui';

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
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by SmartServe ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-soft-lg border-neutral-200">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-priority-high-bg text-priority-high-text mx-auto flex items-center justify-center mb-4 border border-priority-high-border">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Something Went Wrong</h2>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                An unexpected application error occurred. We've logged this event for investigation.
              </p>

              {this.state.error?.message && (
                <div className="mt-4 p-3 rounded-lg bg-neutral-100 border border-neutral-200 text-left">
                  <span className="text-[11px] font-mono text-neutral-700 break-words line-clamp-3">
                    {this.state.error.message}
                  </span>
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full sm:w-auto"
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto"
                  leftIcon={<Home className="w-4 h-4" />}
                  onClick={this.handleReset}
                >
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
