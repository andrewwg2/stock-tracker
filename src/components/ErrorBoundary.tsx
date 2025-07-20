/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */

import React, { Component, ReactNode } from 'react';
import { Card, Container, Button } from './';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, { extra: errorInfo });
    }
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-neutral-200 flex items-center justify-center px-4">
          <Container maxWidth="md">
            <Card padding="lg" className="text-center">
              {/* Error Icon */}
              <div className="text-red-500 text-6xl mb-6" role="img" aria-label="Error">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>

              {/* Error Message */}
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Oops! Something went wrong
              </h1>
              
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                We're sorry, but something unexpected happened. This might be a temporary issue.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
                <Button 
                  variant="primary" 
                  onClick={this.handleRetry}
                  className="order-1 sm:order-first"
                >
                  Try Again
                </Button>
                
                <Button 
                  variant="secondary" 
                  onClick={this.handleRefresh}
                  className="order-2"
                >
                  Refresh Page
                </Button>
              </div>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left bg-gray-50 rounded-lg p-4 border">
                  <summary className="cursor-pointer font-medium text-gray-700 mb-3 select-none">
                    🔍 Error Details (Development Mode)
                  </summary>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Error Message:</h4>
                      <p className="text-sm text-red-600 font-mono bg-red-50 p-2 rounded">
                        {this.state.error.message}
                      </p>
                    </div>
                    
                    {this.state.error.stack && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Stack Trace:</h4>
                        <pre className="text-xs text-gray-600 bg-gray-100 p-3 rounded overflow-auto max-h-40">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    
                    {this.state.errorInfo && this.state.errorInfo.componentStack && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Component Stack:</h4>
                        <pre className="text-xs text-gray-600 bg-gray-100 p-3 rounded overflow-auto max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
              
              {/* Help Text */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  If this problem persists, please try refreshing the page or contact support.
                </p>
              </div>
            </Card>
          </Container>
        </div>
      );
    }

    return this.props.children;
  }
}
