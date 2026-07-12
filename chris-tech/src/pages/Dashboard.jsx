import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTrading } from '../context/TradingContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Logo from '../components/common/Logo';
import MarketSidebar from '../components/dashboard/MarketSidebar';
import TradeChart from '../components/dashboard/TradeChart';
import {
  ArrowUpRight,
  ArrowDownRight,
  CircleDot,
  Sparkles,
  ArrowRight,
  Activity,
} from 'lucide-react';

const formatCurrency = (value, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  } catch {
    return `${currency} ${Number(value || 0).toFixed(2)}`;
  }
};

const accountTypeLabel = (account) => {
  if (!account) return 'Unknown';
  if (account.is_virtual || account.is_virtual === '1' || account.account_type === 'virtual') {
    return 'Demo Account';
  }
  return 'Real Account';
};

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    isAuthenticated = false,
    loading: authLoading = false,
    user,
    accounts = [],
    selectedAccount,
    setSelectedAccount,
    status = 'disconnected',
    websiteStatus,
    logout,
  } = useAuth() || {};
  const {
    selectedSymbol,
    setSelectedSymbol,
    activeSymbols = [],
    selectedTimeframe,
    setSelectedTimeframe,
    loading: tradingLoading = false,
    openPositions = [],
    recentTrades = [],
  } = useTrading() || {};

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const activeAccount = selectedAccount || (Array.isArray(accounts) && accounts[0]) || null;
  const totalBalance = useMemo(
    () => (Array.isArray(accounts) ? accounts.reduce((sum, account) => sum + Number(account?.balance || 0), 0) : 0),
    [accounts]
  );
  const profitLoss = useMemo(
    () => (Array.isArray(openPositions) ? openPositions.reduce((sum, position) => sum + Number(position?.profit || 0), 0) : 0),
    [openPositions]
  );
  const accountCount = Array.isArray(accounts) ? accounts.length : 0;
  const connectionColor = status === 'connected' ? 'bg-emerald-500 text-emerald-100' : status === 'connecting' ? 'bg-amber-500 text-slate-950' : 'bg-rose-500 text-white';

  if (authLoading || tradingLoading) {
    return <LoadingSpinner fullScreen message="Loading dashboard..." />;
  }

  if (!isAuthenticated) {
    return <LoadingSpinner fullScreen message="Verifying session..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-slate-900 via-slate-950 to-transparent opacity-80" />
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
          <div className="relative z-10 rounded-[32px] border border-slate-800 bg-slate-950/90 p-6 shadow-glow backdrop-blur-glass">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <Logo />
                  <div className="rounded-3xl bg-slate-900/80 px-4 py-3 text-slate-300 ring-1 ring-slate-700">
                    <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Connected account</p>
                    <p className="mt-1 text-sm font-semibold text-white">{user?.accountId || user?.loginid || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                  <div className="rounded-3xl bg-slate-900/80 px-4 py-3 text-sm text-slate-300 ring-1 ring-slate-700">
                    <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Deriv status</p>
                    <p className="mt-1 font-medium text-white">{status}</p>
                  </div>
                  <div className={`rounded-3xl px-4 py-3 text-sm font-semibold ${connectionColor}`}>
                    {status === 'connected' ? 'Live stream' : status === 'connecting' ? 'Connecting' : 'Offline'}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="rounded-3xl bg-slate-900/80 px-4 py-3 text-slate-300 ring-1 ring-slate-700">
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Market health</p>
                  <p className="mt-1 text-sm text-white">{websiteStatus?.markets || 'Live'}</p>
                </div>
                <Button className="min-w-[148px]" variant="danger" onClick={() => logout && logout()}>
                  Logout
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="space-y-6">
              <div className="rounded-[28px] border border-slate-800 bg-slate-950/90 p-5 shadow-glow backdrop-blur-glass">
                <h2 className="text-lg font-semibold text-white">Dashboard Menu</h2>
                <p className="mt-2 text-sm text-slate-400">Navigate the Deriv portfolio and explore fast action workflows.</p>
                <div className="mt-6 space-y-2">
                  {[
                    { label: 'Dashboard', url: '/dashboard' },
                    { label: 'Markets', url: '/trading' },
                    { label: 'DTrader', url: 'https://app.deriv.com/desktop', external: true },
                    { label: 'Bots', url: '/bots' },
                    { label: 'Copy Trading', url: '/copy-trading' },
                    { label: 'AI Analysis', url: '/ai-analysis' },
                    { label: 'Settings', url: '/settings' },
                  ].map((item) => (
                    item.external ? (
                      <a
                        key={item.label}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-white"
                      >
                        <span>{item.label}</span>
                        <ArrowRight size={16} />
                      </a>
                    ) : (
                      <Link
                        key={item.label}
                        to={item.url}
                        className="flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-white"
                      >
                        <span>{item.label}</span>
                        <ArrowRight size={16} />
                      </Link>
                    )
                  ))}
                </div>
              </div>

              <MarketSidebar
                activeSymbols={activeSymbols}
                selectedSymbol={selectedSymbol}
                onSelectSymbol={setSelectedSymbol}
              />
            </aside>

            <main className="space-y-6">
              <section className="grid gap-6 lg:grid-cols-2">
                <Card className="rounded-[28px] p-6 bg-slate-950/90 shadow-glow backdrop-blur-glass border border-slate-800">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.32em] text-cyan-300/80">Total Balance</p>
                      <p className="mt-3 text-4xl font-semibold text-white">{formatCurrency(totalBalance, activeAccount?.currency)}</p>
                    </div>
                    <div className="rounded-3xl bg-cyan-500/15 px-4 py-3 text-cyan-200 ring-1 ring-cyan-400/20">
                      {accountCount} accounts
                    </div>
                  </div>
                </Card>

                <Card className="rounded-[28px] p-6 bg-slate-950/90 shadow-glow backdrop-blur-glass border border-slate-800">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.32em] text-cyan-300/80">Active Account</p>
                      <p className="mt-3 text-4xl font-semibold text-white">{accountTypeLabel(activeAccount)}</p>
                    </div>
                    <div className="rounded-full bg-slate-900/90 px-4 py-3 text-slate-200 ring-1 ring-slate-700">
                      {activeAccount?.currency || 'USD'}
                    </div>
                  </div>
                </Card>
              </section>

              <section className="rounded-[32px] border border-slate-800 bg-slate-950/90 p-6 shadow-glow backdrop-blur-glass">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.32em] text-cyan-300/80">Account selector</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">All accounts at a glance</h2>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:auto-cols-min lg:grid-flow-col">
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedTimeframe(60)}
                      className={`${selectedTimeframe === 60 ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400' : ''}`}
                    >
                      1m
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedTimeframe(300)}
                      className={`${selectedTimeframe === 300 ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400' : ''}`}
                    >
                      5m
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedTimeframe(900)}
                      className={`${selectedTimeframe === 900 ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400' : ''}`}
                    >
                      15m
                    </Button>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {accounts.map((account) => {
                    const isSelected = selectedAccount?.account_number === account.account_number || selectedAccount?.loginid === account.loginid;
                    return (
                      <button
                        key={account.account_number || account.loginid || account.loginid}
                        type="button"
                        onClick={() => setSelectedAccount(account)}
                        className={`group rounded-[26px] border p-5 text-left transition ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_40px_rgba(34,211,238,0.12)]'
                            : 'border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm uppercase tracking-[0.32em] text-slate-400">{accountTypeLabel(account)}</p>
                            <p className="mt-2 text-lg font-semibold text-white">{formatCurrency(account.balance, account.currency)}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-950 px-3 py-2 text-xs uppercase tracking-[0.25em] text-slate-300">
                            {account.currency || 'USD'}
                          </div>
                        </div>
                        <p className="mt-4 text-sm text-slate-400">{account.account_number || account.loginid}</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              <TradeChart />

              <div className="grid gap-6 xl:grid-cols-3">
                <Card className="rounded-[28px] p-6 bg-slate-950/90 shadow-glow backdrop-blur-glass border border-slate-800">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.32em] text-cyan-300/80">Unrealized P/L</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{formatCurrency(profitLoss, activeAccount?.currency)}</p>
                    </div>
                    <div className="rounded-full bg-slate-900/80 px-4 py-3 text-slate-300 ring-1 ring-slate-700">
                      {openPositions.length} Positions
                    </div>
                  </div>
                </Card>

                <Card className="rounded-[28px] p-6 bg-slate-950/90 shadow-glow backdrop-blur-glass border border-slate-800">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.32em] text-cyan-300/80">Live Market</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{selectedSymbol || '---'}</p>
                    </div>
                    <div className="rounded-full bg-emerald-500/10 px-4 py-3 text-emerald-200 ring-1 ring-emerald-500/20">
                      {activeSymbols.length} symbols
                    </div>
                  </div>
                </Card>

                <Card className="rounded-[28px] p-6 bg-slate-950/90 shadow-glow backdrop-blur-glass border border-slate-800">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.32em] text-cyan-300/80">Live status</p>
                      <p className="mt-3 text-3xl font-semibold text-white">
                        {status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting' : 'Disconnected'}
                      </p>
                    </div>
                    <CircleDot size={32} className={status === 'connected' ? 'text-emerald-400' : status === 'connecting' ? 'text-amber-400' : 'text-rose-400'} />
                  </div>
                </Card>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <Card className="rounded-[28px] p-6 bg-slate-950/90 shadow-glow backdrop-blur-glass border border-slate-800">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.32em] text-cyan-300/80">Recent Trades</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">Latest activity</h3>
                    </div>
                    <Sparkles size={20} className="text-cyan-300" />
                  </div>
                  <div className="mt-6 space-y-4">
                    {recentTrades.length ? (
                      recentTrades.map((trade) => (
                        <div key={trade.id} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-white">{trade.symbol}</p>
                              <p className="text-sm text-slate-400">{trade.status}</p>
                            </div>
                            <div className="text-right text-sm">
                              <p className="font-semibold text-slate-100">{formatCurrency(trade.amount, activeAccount?.currency)}</p>
                              <p className={trade.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{trade.profit >= 0 ? `+${formatCurrency(trade.profit, activeAccount?.currency)}` : formatCurrency(trade.profit, activeAccount?.currency)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 text-sm text-slate-400">No recent trades available yet.</div>
                    )}
                  </div>
                </Card>

                <Card className="rounded-[28px] p-6 bg-slate-950/90 shadow-glow backdrop-blur-glass border border-slate-800">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.32em] text-cyan-300/80">Open Positions</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">Managing capital</h3>
                    </div>
                    <Activity size={20} className="text-cyan-300" />
                  </div>
                  <div className="mt-6 space-y-4">
                    {openPositions.length ? (
                      openPositions.slice(0, 4).map((position) => (
                        <div key={position.contract_id || position.transaction_id || position.underlying} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold text-white">{position.underlying || position.symbol || 'Unknown'}</p>
                              <p className="text-sm text-slate-400">{position.longcode || position.contract_type || 'Active position'}</p>
                            </div>
                            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                              {position.is_sold ? 'Closed' : 'Open'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 text-sm text-slate-400">No open positions at the moment.</div>
                    )}
                  </div>
                </Card>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
