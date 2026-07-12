import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const normalizeSymbol = (symbol) => ({
  symbol: symbol.symbol,
  name: symbol.display_name || symbol.symbol,
  market: symbol.market_display_name || symbol.market || 'Synthetic Index',
  submarket: symbol.submarket_display_name || symbol.submarket || '',
  exchange: symbol.exchange || '',
});

export function useSymbols(productType = 'synthetic_index') {
  const { deriv } = useAuth();
  const [symbols, setSymbols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshSymbols = useCallback(async () => {
    if (!deriv || !deriv.isConnected()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await deriv.getActiveSymbols(productType);
      const items = Array.isArray(response.active_symbols) ? response.active_symbols : [];
      const normalized = items.map(normalizeSymbol).filter((item) => !!item.symbol);
      setSymbols(normalized);
    } catch (err) {
      setError(err.message || 'Unable to load symbols');
      setSymbols([]);
    } finally {
      setLoading(false);
    }
  }, [deriv, productType]);

  useEffect(() => {
    refreshSymbols();

    const interval = setInterval(() => {
      refreshSymbols();
    }, 60000);

    return () => clearInterval(interval);
  }, [refreshSymbols]);

  const symbolsByMarket = useMemo(() => symbols, [symbols]);

  return {
    symbols: symbolsByMarket,
    loading,
    error,
    refreshSymbols,
  };
}
