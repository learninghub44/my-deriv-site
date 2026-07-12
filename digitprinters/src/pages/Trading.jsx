import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTrading } from '../context/TradingContext';
import { useMarketData } from '../hooks/useMarketData';
import { useTicks } from '../hooks/useTicks';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MarketSidebar from '../components/trading/MarketSidebar';
import TradingChart from '../components/trading/TradingChart';
import LiveTicker from '../components/trading/LiveTicker';
import SymbolSelector from '../components/trading/SymbolSelector';
import { TrendingUp, TrendingDown } from 'lucide-react';

const parseDuration = (value) => {
  if (value.endsWith('s')) return { duration: Number(value.replace('s', '')), durationUnit: 's' };
  if (value.endsWith('m')) return { duration: Number(value.replace('m', '')), durationUnit: 'm' };
  if (value.endsWith('h')) return { duration: Number(value.replace('h', '')), durationUnit: 'h' };
  return { duration: 1, durationUnit: 'm' };
};

export default function Trading() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    activeSymbols,
    selectedSymbol,
    selectedTimeframe,
    setSelectedSymbol,
    setSelectedTimeframe,
    balance,
    loading,
    error,
    requestProposal,
    buyContract,
    websiteStatus,
  } = useTrading();

  const [amount, setAmount] = useState('25');
  const [tradeDuration, setTradeDuration] = useState('1m');
  const [contractType, setContractType] = useState('CALL');
  const [proposalData, setProposalData] = useState(null);
  const [tradeError, setTradeError] = useState(null);
  const [proposalLoading, setProposalLoading] = useState(false);

  const { addToast } = useToast();
  const marketSymbols = useMemo(
    () => activeSymbols.slice(0, 8).map((item) => item.symbol),
    [activeSymbols]
  );

  const { candles, loading: chartLoading } = useMarketData(selectedSymbol, selectedTimeframe);
  const { tick, price, direction } = useTicks(selectedSymbol);
  const { ticks: marketTicks = {}, directions: marketDirections = {} } = useTicks(marketSymbols);

  const selectedMarket = useMemo(
    () => activeSymbols.find((item) => item.symbol === selectedSymbol) || null,
    [activeSymbols, selectedSymbol]
  );

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleProposal = async () => {
    if (!selectedSymbol) return;
    setTradeError(null);
    setProposalLoading(true);

    try {
      const { duration, durationUnit } = parseDuration(tradeDuration);
      const proposal = await requestProposal({
        symbol: selectedSymbol,
        amount: Number(amount),
        duration,
        durationUnit,
        contractType,
      });
      setProposalData(proposal.proposal || proposal);
      addToast('Quote received successfully.', 'success');
    } catch (err) {
      setTradeError(err.message || 'Proposal request failed');
      addToast(err.message || 'Proposal request failed', 'error');
    } finally {
      setProposalLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!proposalData?.contract_id) {
      setTradeError('Request a proposal before buying.');
      return;
    }

    try {
      setTradeError(null);
      await buyContract(proposalData);
      setProposalData(null);
      addToast('Contract purchase executed successfully', 'success');
    } catch (err) {
      const errorMessage = err.message || 'Buy request failed';
      setTradeError(errorMessage);
      addToast(errorMessage, 'error');
    }
  };

  useEffect(() => {
    if (error) {
      addToast(error, 'error');
    }
  }, [error, addToast]);

  useEffect(() => {
    if (tradeError) {
      addToast(tradeError, 'error');
    }
  }, [tradeError, addToast]);

  if (authLoading || loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Deriv Companion</p>
              <h1 className="text-4xl font-bold text-white">Synthetic Indices Trading</h1>
              <p className="mt-2 text-slate-400 max-w-2xl">
                Live quotes, dynamic symbol discovery, and streaming market data backed by Deriv.
                Deposits and withdrawals remain directly on Deriv.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-800 bg-slate-900 px-5 py-4 text-white shadow-lg shadow-slate-950/40">
                <p className="text-sm text-slate-400">Connection</p>
                <p className="mt-1 font-semibold text-cyan-300">{websiteStatus?.status || 'Connected'}</p>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900 px-5 py-4 text-white shadow-lg shadow-slate-950/40">
                <p className="text-sm text-slate-400">Balance</p>
                <p className="mt-1 text-2xl font-semibold">${balance.toFixed(2)}</p>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900 px-5 py-4 text-white shadow-lg shadow-slate-950/40">
                <p className="text-sm text-slate-400">Active symbols</p>
                <p className="mt-1 text-2xl font-semibold">{activeSymbols.length}</p>
              </div>
            </div>
          </div>
          <LiveTicker
            symbols={activeSymbols}
            tickData={marketTicks}
            directionData={marketDirections}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px_1fr_360px]">
          <MarketSidebar
            symbols={activeSymbols}
            selectedSymbol={selectedSymbol}
            onSelect={setSelectedSymbol}
            loading={!activeSymbols.length}
          />

          <div className="space-y-6">
            <Card>
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Market</p>
                  <h2 className="text-3xl font-semibold text-white">
                    {selectedMarket?.name || selectedSymbol || 'Loading market'}
                  </h2>
                  <p className="mt-2 text-slate-400">{selectedMarket?.market}</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Last tick</p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {price ? price.toFixed(2) : '--'}
                  </p>
                  <p className={`mt-1 text-sm ${direction === 'up' ? 'text-emerald-400' : direction === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
                    {direction === 'up' ? 'Rising' : direction === 'down' ? 'Falling' : 'Stale'}
                  </p>
                </div>
              </div>
            </Card>

            <TradingChart
              symbol={selectedSymbol}
              candles={candles}
              loading={chartLoading}
              timeframe={selectedTimeframe}
              onChangeTimeframe={setSelectedTimeframe}
            />

            <SymbolSelector
              symbols={activeSymbols}
              selectedSymbol={selectedSymbol}
              onChange={setSelectedSymbol}
            />
          </div>

          <Card className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Trade panel</p>
              <h2 className="text-2xl font-semibold text-white">Live trade execution</h2>
            </div>

            {error && <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
            {tradeError && <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{tradeError}</p>}

            <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Stake</label>
                <input
                  type="number"
                  value={amount}
                  min="1"
                  onChange={(event) => setAmount(event.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Duration</label>
                <select
                  value={tradeDuration}
                  onChange={(event) => setTradeDuration(event.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="15s">15 seconds</option>
                  <option value="30s">30 seconds</option>
                  <option value="1m">1 minute</option>
                  <option value="5m">5 minutes</option>
                  <option value="15m">15 minutes</option>
                  <option value="1h">1 hour</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Direction</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setContractType('CALL')}
                    className={`rounded-2xl px-4 py-3 font-semibold transition ${
                      contractType === 'CALL'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <TrendingUp className="inline mr-2" size={16} /> UP
                  </button>
                  <button
                    type="button"
                    onClick={() => setContractType('PUT')}
                    className={`rounded-2xl px-4 py-3 font-semibold transition ${
                      contractType === 'PUT'
                        ? 'bg-red-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <TrendingDown className="inline mr-2" size={16} /> DOWN
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="success"
                  onClick={handleProposal}
                  disabled={!selectedSymbol || proposalLoading}
                  className="w-full"
                >
                  Request Quote
                </Button>
                <Button
                  variant="danger"
                  onClick={handleBuy}
                  disabled={!proposalData}
                  className="w-full"
                >
                  Execute Buy
                </Button>
              </div>

              {proposalData && (
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
                  <p className="font-semibold text-white">Proposal details</p>
                  <div className="mt-3 grid gap-2">
                    <div className="flex justify-between">
                      <span>Contract</span>
                      <span>{proposalData.contract_type || contractType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stake</span>
                      <span>${proposalData.ask_price?.toFixed(2) ?? amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expected payout</span>
                      <span>${proposalData.payout?.toFixed(2) ?? '--'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
