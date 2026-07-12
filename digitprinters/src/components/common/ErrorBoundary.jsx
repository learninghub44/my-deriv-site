import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] React Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 rounded-lg p-6 border border-red-500/20">
            <div className="text-center">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <h1 className="text-xl font-bold text-red-400 mb-2">Application Error</h1>
              <p className="text-slate-300 mb-4">
                Something went wrong while loading Chris Tech. This is usually temporary.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Reload Page
              </button>
              {import.meta.env?.DEV && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-slate-400 hover:text-slate-300">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs text-red-300 bg-slate-800 p-2 rounded overflow-auto">
                    {this.state.error && this.state.error.toString()}
                    <br />
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;