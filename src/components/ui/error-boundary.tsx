import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  public state: State = {
    hasError: false,
    error: null,
    errorId: null,
    retryCount: 0,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      retryCount: 0,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.logErrorToDatabase(error, errorInfo);
  }

  private async logErrorToDatabase(error: Error, errorInfo: ErrorInfo) {
    try {
      // Log to console for now (database logging will be enabled once types are updated)
      console.error('Error logged for future database storage:', {
        error_type: 'frontend_error',
        error_message: error.message,
        error_stack: error.stack,
        component_stack: errorInfo.componentStack,
        error_id: this.state.errorId,
        timestamp: new Date().toISOString(),
        metadata: {
          userAgent: navigator.userAgent,
          url: window.location.href,
        }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorId: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl text-destructive">Something went wrong</CardTitle>
              <p className="text-muted-foreground mt-2">
                We apologize for the inconvenience. An unexpected error occurred in the application.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Error ID:</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {this.state.errorId}
                  </Badge>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Technical Details
                  </summary>
                  <pre className="mt-2 text-xs bg-background p-2 rounded border overflow-auto max-h-40">
                    {this.state.error?.message}
                    {'\n\n'}
                    {this.state.error?.stack}
                  </pre>
                </details>
              </div>

              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  You can try the following actions to resolve this issue:
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {this.state.retryCount < this.maxRetries && (
                    <Button onClick={this.handleRetry} className="flex items-center">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry ({this.maxRetries - this.state.retryCount} left)
                    </Button>
                  )}
                  
                  <Button variant="outline" onClick={this.handleReload}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reload Page
                  </Button>
                  
                  <Button variant="outline" onClick={this.handleGoHome}>
                    <Home className="mr-2 h-4 w-4" />
                    Go Home
                  </Button>
                </div>
              </div>

              <div className="text-center pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  If this problem persists, please contact support with the Error ID above.
                  <br />
                  Our technical team has been automatically notified of this issue.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for handling async errors
export const useErrorHandler = () => {
  const handleError = (error: Error, context?: string) => {
    console.error(`Error in ${context || 'unknown context'}:`, error);
    
    // For async errors that aren't caught by ErrorBoundary
    const errorEvent = new ErrorEvent('error', {
      error,
      message: error.message,
    });
    
    window.dispatchEvent(errorEvent);
  };

  return { handleError };
};