import { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { useAuth } from '../../context/AuthContext';
import { useTrading } from '../../context/TradingContext';
import LoadingSpinner from '../common/LoadingSpinner';

const timeframeLabels = {
  60: '1m',
  300: '5m',
  900: '15m',
  1800: '30m',
  3600: '1h',
  14400: '4h',
  86400: '1D',
};

export default function TradeChart() {
  const chartContainer = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const resizeObserver = useRef(null);
  const { deriv } = useAuth();
  const { selectedSymbol, selectedTimeframe } = useTrading();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chartContainer.current) return;

    const chart = createChart(chartContainer.current, {
      layout: {
        background: { color: '#020617' },
        textColor: '#cbd5e1',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#334155',
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: true,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;

    resizeObserver.current = new ResizeObserver(() => {
      if (chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainer.current.clientWidth });
      }
    });
    resizeObserver.current.observe(chartContainer.current);

    return () => {
      if (resizeObserver.current) {
        resizeObserver.current.disconnect();
      }
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!deriv || !deriv.isConnected() || !selectedSymbol || !seriesRef.current) {
      return;
    }

    let unsubscribeTicks = null;
    setLoading(true);
    setError(null);

    const loadCandles = async () => {
      try {
        const response = await deriv.getHistoricalCandles(selectedSymbol, selectedTimeframe, 80);
        const candles = Array.isArray(response.candles) ? response.candles : response.history?.candles || [];

        const formatted = candles
          .map((candle) => ({
            time: candle.epoch || candle.time || candle.date,
            open: Number(candle.open || candle.o || 0),
            high: Number(candle.high || candle.h || 0),
            low: Number(candle.low || candle.l || 0),
            close: Number(candle.close || candle.c || 0),
          }))
          .filter((item) => item.time && item.open && item.high && item.low && item.close);

        if (formatted.length) {
          seriesRef.current.setData(formatted);
        }
      } catch (err) {
        setError(err.message || 'Unable to load chart data');
      } finally {
        setLoading(false);
      }
    };

    const startTickStream = async () => {
      try {
        unsubscribeTicks = await deriv.subscribeTicks(selectedSymbol, (tick) => {
          const price = Number(tick?.quote || tick?.quote_price || tick?.quote_value || tick?.tick || tick?.price);
          if (!price || !seriesRef.current) return;

          seriesRef.current.update({
            time: Math.floor(Date.now() / 1000),
            open: price,
            high: price,
            low: price,
            close: price,
          });
        });
      } catch (err) {
        console.error('Tick subscribe error:', err);
      }
    };

    loadCandles();
    startTickStream();

    return () => {
      if (unsubscribeTicks) {
        unsubscribeTicks();
      }
    };
  }, [deriv, selectedSymbol, selectedTimeframe]);

  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-slate-700 bg-slate-950/75 p-5 shadow-[0_26px_120px_rgba(15,23,42,0.35)]">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Live Candlestick</p>
          <h3 className="text-2xl font-semibold text-white">{selectedSymbol || 'Select a symbol'}</h3>
        </div>
        <div className="rounded-2xl bg-slate-900/80 px-4 py-2 text-sm text-slate-300 ring-1 ring-slate-700">
          {timeframeLabels[selectedTimeframe] || 'Custom'} chart
        </div>
      </div>

      <div className="relative h-[420px] rounded-3xl bg-slate-950/90" ref={chartContainer}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80">
            <LoadingSpinner size="lg" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center px-5 text-center text-sm text-rose-300">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
