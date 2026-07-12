/**
 * Bots Page
 * Free trading bots: RSI, MACD, Trend, Martingale
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Play, Square, TrendingUp, Activity } from 'lucide-react';

export default function Bots() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [runningBots, setRunningBots] = useState(new Set());

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const bots = [
    {
      id: 'rsi',
      name: 'RSI Bot',
      description: 'Uses Relative Strength Index indicator to generate buy/sell signals',
      stats: { wins: 245, losses: 89, winRate: '73%', profit: '+$12,450' },
      settings: { period: 14, overbought: 70, oversold: 30 },
    },
    {
      id: 'macd',
      name: 'MACD Bot',
      description: 'MACD momentum-based trading strategy for trend following',
      stats: { wins: 198, losses: 105, winRate: '65%', profit: '+$8,230' },
      settings: { fast: 12, slow: 26, signal: 9 },
    },
    {
      id: 'trend',
      name: 'Trend Bot',
      description: 'Trend following bot that trades support and resistance breaks',
      stats: { wins: 267, losses: 73, winRate: '79%', profit: '+$15,670' },
      settings: { lookback: 20, threshold: 0.5 },
    },
    {
      id: 'martingale',
      name: 'Martingale Bot',
      description: 'Progressive bet sizing strategy with risk management controls',
      stats: { wins: 312, losses: 88, winRate: '78%', profit: '+$18,900' },
      settings: { baseAmount: 10, multiplier: 2, maxLosses: 5 },
    },
  ];

  const toggleBot = (botId) => {
    const newRunning = new Set(runningBots);
    if (newRunning.has(botId)) {
      newRunning.delete(botId);
    } else {
      newRunning.add(botId);
    }
    setRunningBots(newRunning);
  };

  if (authLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Trading Bots</h1>
          <p className="text-gray-400">Run free automated trading strategies with real market data</p>
        </div>

        {/* Bot Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {bots.map((bot) => (
            <Card key={bot.id}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">{bot.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">{bot.description}</p>
                </div>
                {runningBots.has(bot.id) && (
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3 my-6">
                <div className="bg-slate-700 rounded p-3 text-center">
                  <p className="text-xs text-gray-400">Wins</p>
                  <p className="text-lg font-bold text-white">{bot.stats.wins}</p>
                </div>
                <div className="bg-slate-700 rounded p-3 text-center">
                  <p className="text-xs text-gray-400">Losses</p>
                  <p className="text-lg font-bold text-white">{bot.stats.losses}</p>
                </div>
                <div className="bg-slate-700 rounded p-3 text-center">
                  <p className="text-xs text-gray-400">Win Rate</p>
                  <p className="text-lg font-bold text-green-400">{bot.stats.winRate}</p>
                </div>
                <div className="bg-slate-700 rounded p-3 text-center">
                  <p className="text-xs text-gray-400">Profit</p>
                  <p className="text-lg font-bold text-green-400">{bot.stats.profit}</p>
                </div>
              </div>

              {/* Settings Preview */}
              <div className="bg-slate-700 rounded p-3 mb-4">
                <p className="text-xs text-gray-400 mb-2">Current Settings:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(bot.settings).map(([key, value]) => (
                    <span key={key} className="text-xs bg-slate-600 px-2 py-1 rounded text-gray-300">
                      {key}: {value}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => toggleBot(bot.id)}
                  className="flex-1"
                  variant={runningBots.has(bot.id) ? 'danger' : 'success'}
                >
                  {runningBots.has(bot.id) ? (
                    <>
                      <Square size={18} />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      Start
                    </>
                  )}
                </Button>
                <Button variant="secondary">Settings</Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Bots Status Summary */}
        <Card>
          <h2 className="text-2xl font-bold text-white mb-6">Bots Performance Summary</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-2">Total Wins</p>
              <p className="text-3xl font-bold text-green-400">1,022</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-2">Total Losses</p>
              <p className="text-3xl font-bold text-red-400">355</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-2">Average Win Rate</p>
              <p className="text-3xl font-bold text-white">74.2%</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-2">Total Profit</p>
              <p className="text-3xl font-bold text-green-400">+$55,250</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
