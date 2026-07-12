/**
 * Navbar Component
 */

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, LogOut, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const navigation = [
  { label: 'Dashboard', href: '/dashboard', internal: true },
  { label: 'Markets', href: '/trading', internal: true },
  { label: 'DTrader', href: 'https://app.deriv.com/desktop', internal: false },
  { label: 'Bots', href: '/bots', internal: true },
  { label: 'Copy Trading', href: '/copy-trading', internal: true },
  { label: 'AI Analysis', href: '/ai-analysis', internal: true },
  { label: 'Settings', href: '/settings', internal: true },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated = false, logout, login } = useAuth() || {};

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl shadow-[0_25px_80px_rgba(15,23,42,0.35)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <Logo compact />
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {navigation.map((item) =>
            item.internal ? (
              <Link
                key={item.label}
                to={item.href}
                className="text-sm font-medium text-slate-300 transition hover:text-white"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-slate-300 transition hover:text-white"
              >
                {item.label}
              </a>
            )
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <button
              onClick={() => typeof logout === 'function' && logout()}
              className="inline-flex items-center rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              <LogOut size={16} />
              Logout
            </button>
          ) : (
            <button
              onClick={() => typeof login === 'function' && login()}
              className="inline-flex items-center rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              <LogIn size={16} />
              Login with Deriv
            </button>
          )}
        </div>

        <button
          className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-slate-300 transition hover:text-white md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-slate-800 bg-slate-950 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {navigation.map((item) =>
              item.internal ? (
                <Link
                  key={item.label}
                  to={item.href}
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-900"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-900"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              )
            )}
            {isAuthenticated ? (
              <button
                onClick={() => {
                  if (typeof logout === 'function') logout();
                  setIsOpen(false);
                }}
                className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => {
                  if (typeof login === 'function') login();
                  setIsOpen(false);
                }}
                className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Login with Deriv
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
