import { Plus, Sparkles } from 'lucide-react';

const categories = [
  {
    title: 'Volatility Indices',
    matcher: (symbol) => /^R_/.test(symbol) && !/RANGE|RNG/.test(symbol),
  },
  {
    title: 'Boom / Crash',
    matcher: (symbol) => /BOOM|CRASH/i.test(symbol),
  },
  {
    title: 'Step Indices',
    matcher: (symbol) => /STEP|STP/i.test(symbol),
  },
  {
    title: 'Jump Indices',
    matcher: (symbol) => /JUMP/i.test(symbol),
  },
  {
    title: 'Range Break',
    matcher: (symbol) => /RANGE|RB|RNG/i.test(symbol),
  },
];

export default function MarketSidebar({ activeSymbols, selectedSymbol, onSelectSymbol }) {
  const symbolMap = activeSymbols.reduce((acc, symbol) => {
    acc[symbol.symbol] = symbol;
    return acc;
  }, {});

  const renderSection = (title, items) => (
    <div className="rounded-3xl border border-slate-700 bg-slate-950/75 p-4 shadow-glow">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">{title}</h3>
          <p className="text-xs text-slate-400">Live synthetic price list</p>
        </div>
        <Plus size={16} className="text-slate-400" />
      </div>
      <div className="space-y-3">
        {items.length ? (
          items.map((symbol) => (
            <button
              key={symbol.symbol}
              type="button"
              onClick={() => onSelectSymbol(symbol.symbol)}
              className={`w-full rounded-3xl border px-4 py-3 text-left transition ${
                selectedSymbol === symbol.symbol
                  ? 'border-cyan-400 bg-cyan-400/10 text-white shadow-[0_0_18px_rgba(56,189,248,0.15)]'
                  : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-600 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-white">{symbol.symbol}</p>
                  <p className="text-xs text-slate-500">{symbol.name}</p>
                </div>
                <span className="text-sm font-semibold text-emerald-400">{symbol.change || '+1.2%'}</span>
              </div>
            </button>
          ))
        ) : (
          <p className="text-sm text-slate-500">Loading symbols...</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const items = activeSymbols.filter((symbol) => category.matcher(symbol.symbol)).slice(0, 4);
        if (!items.length) return null;
        return renderSection(category.title, items);
      })}
      <div className="rounded-3xl border border-slate-700 bg-slate-950/75 p-5 shadow-glow">
        <div className="mb-3 flex items-center gap-3 text-slate-300">
          <Sparkles size={18} className="text-cyan-300" />
          <span className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Market Pulse</span>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          All indices update live and are available for instant chart analysis. Select a symbol to refresh the main chart, or use the dashboard actions to jump into trading.
        </p>
      </div>
    </div>
  );
}
