import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const getQuote = (tick) => tick?.quote ?? tick?.bid ?? tick?.ask ?? null;

export function useMarketData(symbol, timeframe) {
  const { deriv } = useAuth();
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol || !deriv || !deriv.isConnected()) {
      setCandles([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    deriv
      .getHistoricalCandles(symbol, timeframe, 80)
      .then((response) => {
        if (!isMounted) return;
        const items = Array.isArray(response.candles)
          ? response.candles
          : Array.isArray(response.history)
          ? response.history
          : [];
        const candleData = items.map((candle) => ({
          time: candle.epoch || Math.floor(candle.time / 1000),
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }));
        setCandles(candleData);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Unable to load chart data');
        setCandles([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [symbol, timeframe, deriv]);

  useEffect(() => {
    if (!symbol || !deriv || !deriv.isConnected()) {
      return;
    }

    const updateLiveCandle = (tick) => {
      const price = getQuote(tick);
      if (price === null) return;

      setCandles((previous) => {
        if (!previous.length) return previous;

        const last = previous[previous.length - 1];
        const time = Math.floor(tick.epoch || Date.now() / 1000);

        if (last.time === time) {
          return [
            ...previous.slice(0, -1),
            {
              ...last,
              close: price,
              high: Math.max(last.high, price),
              low: Math.min(last.low, price),
            },
          ];
        }

        return [
          ...previous,
          {
            time,
            open: last.close,
            high: Math.max(last.close, price),
            low: Math.min(last.close, price),
            close: price,
          },
        ];
      });
    };

    let unsubscribe;
    const subscribe = async () => {
      try {
        unsubscribe = await deriv.subscribeTicks(symbol, updateLiveCandle);
      } catch (err) {
        setError(err.message || 'Live chart subscription failed');
      }
    };

    subscribe();

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [symbol, deriv]);

  return {
    candles,
    loading,
    error,
  };
}
