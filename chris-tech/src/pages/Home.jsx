import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';

// Deriv referral link - only used for Create Account button
const DERIV_REFERRAL = 'https://partner-tracking.deriv.com/click?a=14252&o=1&c=3&link_id=1';

const logHome = (msg, data) => {
  console.info(`[Home] ${msg}`, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

export default function Home() {
  const { login, isAuthenticated = false, loading = false } = useAuth() || {};
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      logHome('User already authenticated, redirecting to dashboard', {});
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLoginClick = () => {
    logHome('Login button clicked', {
      isAuthenticated,
      loading,
    });
    if (!isAuthenticated && !loading && typeof login === 'function') {
      login();
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.16),_transparent_28%)]" />
      <div className="absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_22%)] blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-14 sm:px-6 lg:px-8">
        <div className="w-full rounded-[2.5rem] border border-slate-800/80 bg-slate-950/95 p-10 shadow-[0_50px_120px_-40px_rgba(15,23,42,0.9)] backdrop-blur-2xl sm:p-14">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-10 text-center">
            <div className="group inline-flex items-center justify-center rounded-full border border-slate-800/90 bg-slate-900/90 px-5 py-4 shadow-[0_25px_60px_-40px_rgba(14,165,233,0.4)] transition duration-500 hover:-translate-y-0.5 hover:border-cyan-400/40 hover:bg-slate-900/95">
              <Logo compact className="transition duration-500 group-hover:scale-105" />
            </div>

            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Chris Tech</p>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Trade Synthetic Markets Smarter
              </h1>
              <p className="mx-auto max-w-xl text-base leading-8 text-slate-400 sm:text-lg">
                A refined fintech entry screen for Deriv traders—sleek, minimal, and built for high-performance synthetic index access.
              </p>
            </div>

            <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                onClick={handleLoginClick}
                disabled={loading}
                className="w-full max-w-[260px] bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 shadow-[0_20px_80px_rgba(34,211,238,0.24)] transition duration-300 hover:scale-[1.01] hover:from-cyan-300 hover:to-sky-400"
                size="lg"
              >
                {loading ? 'Loading...' : 'Login with Deriv'}
              </Button>
              <a
                href={DERIV_REFERRAL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-[54px] w-full max-w-[260px] items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 px-6 text-base font-semibold text-cyan-300 transition duration-300 hover:border-cyan-500 hover:bg-slate-800 hover:text-white"
              >
                Create Account
              </a>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              On login, Deriv will request secure read/write permissions for account balances, trading access, and synthetic markets.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
