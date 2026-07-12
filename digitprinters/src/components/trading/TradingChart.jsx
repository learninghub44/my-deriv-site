import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

const timeframeOptions = [
  { label: '1m', value: 60 },
  { label: '5m', value: 300 },
  { label: '15m', value: 900 },
  { label: '1h', value: 3600 },
];

export default function TradingChart({ symbol, candles, loading, timeframe, onChangeTimeframe }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const seriesRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = createChart(chartRef.current, {
      layout: {
        background: { color: '#020617' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      rightPriceScale: { borderColor: '#334155' },
      timeScale: { borderColor: '#334155', timeVisible: true, secondsVisible: false },
      crosshair: { mode: 1 },
      localization: { dateFormat: 'dd MMM' },
    });

    seriesRef.current = chartInstance.current.addCandlestickSeries({
      upColor: '#16a34a',
      downColor: '#dc2626',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#f87171',
    });

    const resizeObserver = new ResizeObserver(() => {
      chartInstance.current.applyOptions({ width: chartRef.current.clientWidth, height: chartRef.current.clientHeight });
    });

    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
      chartInstance.current?.remove();
      chartInstance.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !candles.length) return;
    seriesRef.current.setData(candles);
  }, [candles]);

  return (
    <div className="rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-lg shadow-slate-950/40">
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between bg-slate-900 border-b border-slate-800">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Chart</p>
          <h2 className="text-2xl font-semibold text-white">{symbol || 'Select symbol'}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {timeframeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChangeTimeframe(option.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                timeframe === option.value
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative h-[420px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80">
            <div className="text-slate-300">Loading chart...</div>
          </div>
        )}
        <div ref={chartRef} className="h-full w-full" />
      </div>
    </div>
  );
}
