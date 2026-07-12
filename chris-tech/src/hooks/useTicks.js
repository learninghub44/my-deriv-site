import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const getQuote = (tick) => tick?.quote ?? tick?.bid ?? tick?.ask ?? null;

export function useTicks(symbolOrSymbols) {
  const { deriv } = useAuth();
  const [singleTick, setSingleTick] = useState(null);
  const [singleDirection, setSingleDirection] = useState('flat');
  const [marketTicks, setMarketTicks] = useState({});
  const [marketDirections, setMarketDirections] = useState({});
  const [error, setError] = useState(null);

  const symbols = useMemo(() => {
    if (!symbolOrSymbols) return [];
    return Array.isArray(symbolOrSymbols) ? symbolOrSymbols : [symbolOrSymbols];
  }, [symbolOrSymbols]);

  useEffect(() => {
    if (!symbols.length || !deriv || !deriv.isConnected()) {
      setSingleTick(null);
      setSingleDirection('flat');
      setMarketTicks({});
      setMarketDirections({});
      return;
    }

    const unsubscribeFunctions = [];
    const lastPrices = {};

    symbols.forEach((symbol) => {
      let unsubscribe;

      const subscribe = async () => {
        try {
          unsubscribe = await deriv.subscribeTicks(symbol, (nextTick) => {
            const price = getQuote(nextTick);

            if (Array.isArray(symbolOrSymbols)) {
              setMarketTicks((prev) => ({ ...prev, [symbol]: nextTick }));
              setMarketDirections((prev) => {
                const previousPrice = lastPrices[symbol];
                let nextDirection = previousPrice === null || previousPrice === undefined ? 'flat' : prev[symbol] || 'flat';
                if (price !== null && previousPrice !== null && previousPrice !== undefined) {
                  if (price > previousPrice) nextDirection = 'up';
                  if (price < previousPrice) nextDirection = 'down';
                }
                lastPrices[symbol] = price;
                return { ...prev, [symbol]: nextDirection };
              });
            } else {
              setSingleTick(nextTick);
              setSingleDirection((currentDirection) => {
                if (lastPrices[symbol] === null || lastPrices[symbol] === undefined || price === null) return 'flat';
                if (price > lastPrices[symbol]) return 'up';
                if (price < lastPrices[symbol]) return 'down';
                return currentDirection;
              });
            }

            lastPrices[symbol] = price;
          });

          unsubscribeFunctions.push(unsubscribe);
        } catch (err) {
          setError(err.message || 'Tick subscription failed');
        }
      };

      subscribe();
    });

    return () => {
      unsubscribeFunctions.forEach((fn) => fn && fn());
    };
  }, [deriv, symbols, symbolOrSymbols]);

  const price = getQuote(singleTick);

  return Array.isArray(symbolOrSymbols)
    ? {
        ticks: marketTicks,
        directions: marketDirections,
        error,
        isLive: Object.keys(marketTicks).length > 0,
      }
    : {
        tick: singleTick,
        price,
        direction: singleDirection,
        error,
        isLive: Boolean(singleTick),
      };
}
