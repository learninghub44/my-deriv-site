export default function SymbolSelector({ symbols, selectedSymbol, onChange }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4 shadow-lg shadow-slate-950/40">
      <div className="mb-4">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Symbol selector</p>
        <h3 className="text-lg font-semibold text-white">Pick a market</h3>
      </div>
      <div className="space-y-3">
        <select
          value={selectedSymbol || ''}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
        >
          <option value="" disabled>
            Select a synthetic index
          </option>
          {symbols.map((symbol) => (
            <option key={symbol.symbol} value={symbol.symbol}>
              {symbol.name} — {symbol.symbol}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
