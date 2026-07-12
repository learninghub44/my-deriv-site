import Button from '../../components/common/Button';

export default function MarketSidebar({ symbols, selectedSymbol, onSelect, loading }) {
  return (
    <aside className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg shadow-slate-950/40">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Markets</p>
            <h2 className="text-xl font-semibold text-white">Synthetic Indices</h2>
          </div>
        </div>
        <div className="space-y-3">
          {loading ? (
            <div className="text-sm text-slate-400">Loading symbols...</div>
          ) : symbols.length === 0 ? (
            <div className="text-sm text-slate-400">No synthetic symbols available.</div>
          ) : (
            symbols.slice(0, 12).map((symbol) => {
              const active = selectedSymbol === symbol.symbol;
              return (
                <button
                  key={symbol.symbol}
                  type="button"
                  onClick={() => onSelect(symbol.symbol)}
                  className={`w-full text-left rounded-2xl px-4 py-3 transition ${
                    active ? 'bg-slate-700 border border-cyan-400/40 text-white' : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{symbol.name}</p>
                      <p className="text-xs text-slate-400">{symbol.symbol}</p>
                    </div>
                    <span className="text-xs text-slate-400">{symbol.market}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg shadow-slate-950/40">
        <div className="mb-4">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Quick actions</p>
          <h3 className="text-lg font-semibold text-white">Deriv tools</h3>
        </div>
        <div className="space-y-3">
          <Button variant="secondary" className="w-full" onClick={() => window.open('https://deriv.com/cashier/deposit', '_blank')}>
            Deposit on Deriv
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => window.open('https://deriv.com/cashier/withdrawal', '_blank')}>
            Withdraw on Deriv
          </Button>
        </div>
      </div>
    </aside>
  );
}
