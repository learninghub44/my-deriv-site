import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy load components to prevent import errors from crashing the app
const ToastProvider = React.lazy(() => import('./context/ToastContext').then(module => ({ default: module.ToastProvider })));
const AuthProvider = React.lazy(() => import('./context/AuthContext').then(module => ({ default: module.AuthProvider })));
const TradingProvider = React.lazy(() => import('./context/TradingContext').then(module => ({ default: module.TradingProvider })));
const Navbar = React.lazy(() => import('./components/common/Navbar'));
const Home = React.lazy(() => import('./pages/Home'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Trading = React.lazy(() => import('./pages/Trading'));
const Bots = React.lazy(() => import('./pages/Bots'));
const CopyTrading = React.lazy(() => import('./pages/CopyTrading'));
const AIAnalysis = React.lazy(() => import('./pages/AIAnalysis'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Callback = React.lazy(() => import('./pages/Callback'));
const ProtectedRoute = React.lazy(() => import('./components/common/ProtectedRoute'));

const CANONICAL_HOST = 'www.digitprinters.site';
const NON_CANONICAL_HOST = 'digitprinters.site';

const logApp = (msg, data) => {
  console.info(`[App] ${msg}`, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

// Safe redirect component that doesn't crash
const SafeRedirect = ({ to, replace = true }) => {
  useEffect(() => {
    logApp('Safe redirect triggered', { to, replace });
    try {
      window.location.replace(to);
    } catch (error) {
      logApp('Redirect failed, using fallback', { error: error.message });
      window.location.href = to;
    }
  }, [to, replace]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
};

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

// Safe App component that handles errors gracefully
function SafeApp() {
  useEffect(() => {
    logApp('SafeApp component mounted', {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });
  }, []);

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <ToastProvider>
          <AuthProvider>
            <TradingProvider>
              <BrowserRouter>
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <Navbar />
                  </Suspense>
                </ErrorBoundary>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={
                    <ErrorBoundary>
                      <Suspense fallback={<LoadingFallback />}>
                        <Home />
                      </Suspense>
                    </ErrorBoundary>
                  } />

                  {/* OAuth callback routes - support multiple paths for flexibility */}
                  <Route path="/auth/callback" element={
                    <ErrorBoundary>
                      <Suspense fallback={<LoadingFallback />}>
                        <Callback />
                      </Suspense>
                    </ErrorBoundary>
                  } />
                  <Route path="/callback" element={
                    <ErrorBoundary>
                      <Suspense fallback={<LoadingFallback />}>
                        <Callback />
                      </Suspense>
                    </ErrorBoundary>
                  } />
                  <Route path="/oauth/callback" element={
                    <ErrorBoundary>
                      <Suspense fallback={<LoadingFallback />}>
                        <Callback />
                      </Suspense>
                    </ErrorBoundary>
                  } />

                  {/* Protected routes */}
                  <Route element={
                    <ErrorBoundary>
                      <Suspense fallback={<LoadingFallback />}>
                        <ProtectedRoute />
                      </Suspense>
                    </ErrorBoundary>
                  }>
                    <Route path="/dashboard" element={
                      <ErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                          <Dashboard />
                        </Suspense>
                      </ErrorBoundary>
                    } />
                    <Route path="/trading" element={
                      <ErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                          <Trading />
                        </Suspense>
                      </ErrorBoundary>
                    } />
                    <Route path="/bots" element={
                      <ErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                          <Bots />
                        </Suspense>
                      </ErrorBoundary>
                    } />
                    <Route path="/copy-trading" element={
                      <ErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                          <CopyTrading />
                        </Suspense>
                      </ErrorBoundary>
                    } />
                    <Route path="/ai-analysis" element={
                      <ErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                          <AIAnalysis />
                        </Suspense>
                      </ErrorBoundary>
                    } />
                    <Route path="/settings" element={
                      <ErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                          <Settings />
                        </Suspense>
                      </ErrorBoundary>
                    } />
                  </Route>

                  {/* Catch-all redirect to home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </TradingProvider>
          </AuthProvider>
        </ToastProvider>
      </Suspense>
    </ErrorBoundary>
  );
}

// Main App component with safe initialization
function App() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentHost = window.location.hostname;
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    const currentHash = window.location.hash;

    logApp('App initialized', {
      hostname: currentHost,
      pathname: currentPath,
      isCanonical: currentHost === CANONICAL_HOST,
      userAgent: navigator.userAgent?.substring(0, 100),
    });

    if (currentHost === NON_CANONICAL_HOST && !currentSearch.includes('redirected')) {
      const separator = currentSearch ? '&' : '?';
      const destination = `https://${CANONICAL_HOST}${currentPath}${currentSearch}${separator}redirected=1${currentHash}`;
      logApp('Redirecting to canonical host', {
        from: currentHost,
        to: destination,
      });
      window.location.replace(destination);
    }
  }, []);

  return <SafeApp />;
}

export default App;
