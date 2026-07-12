/**
 * AI Analysis Page
 * AI-powered market analysis and signals
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Brain, TrendingUp, BarChart3, Zap, AlertCircle } from 'lucide-react';

export default function AIAnalysis() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const signals = [
    {
      symbol: 'R_25',
      type: 'STRONG BUY',
      confidence: 92,
      reason: 'Price broke above resistance with high volume',
      supportLevel: 1200,
      resistanceLevel: 1280,
      entry: 1240,
      target: 1320,
    },
    {
      symbol: 'R_50',
      type: 'BUY',
      confidence: 78,
      reason: 'RSI oversold, MACD bullish divergence',
      supportLevel: 2400,
      resistanceLevel: 2560,
      entry: 2480,
      target: 2640,
    },
    {
      symbol: 'R_10',
      type: 'SELL',
      confidence: 85,
      reason: 'Price rejected at resistance, bearish setup',
      supportLevel: 480,
      resistanceLevel: 512,
      entry: 500,
      target: 460,
    },
    {
      symbol: 'R_75',
      type: 'WAIT',
      confidence: 45,
      reason: 'Consolidation phase, unclear direction',
      supportLevel: 3600,
      resistanceLevel: 3840,
      entry: 3720,
      target: 3900,
    },
  ];

  if (authLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AI Analysis</h1>
          <p className="text-gray-400">Advanced machine learning market analysis and signals</p>
        </div>

        {/* Market Summary */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center gap-3 mb-2">
              <Brain className="text-blue-400" size={20} />
              <p className="text-gray-400 text-sm">Market Sentiment</p>
            </div>
            <p className="text-3xl font-bold text-green-400">Bullish</p>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="text-green-400" size={20} />
              <p className="text-gray-400 text-sm">Strong Signals</p>
            </div>
            <p className="text-3xl font-bold text-white">12</p>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="text-purple-400" size={20} />
              <p className="text-gray-400 text-sm">Signal Accuracy</p>
            </div>
            <p className="text-3xl font-bold text-white">87%</p>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-2">
              <Zap className="text-yellow-400" size={20} />
              <p className="text-gray-400 text-sm">Signal Updates</p>
            </div>
            <p className="text-3xl font-bold text-white">Every 5m</p>
          </Card>
        </div>

        {/* AI Signals */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Active AI Signals</h2>
          {signals.map((signal) => (
            <Card key={signal.symbol}>
              <div className="grid md:grid-cols-5 gap-6">
                {/* Signal Type */}
                <div>
                  <p className="text-gray-400 text-sm mb-2">Signal</p>
                  <div
                    className={`inline-block px-4 py-2 rounded font-bold text-white ${
                      signal.type === 'STRONG BUY'
                        ? 'bg-green-600'
                        : signal.type === 'BUY'
                          ? 'bg-green-700'
                          : signal.type === 'SELL'
                            ? 'bg-red-600'
                            : 'bg-yellow-600'
                    }`}
                  >
                    {signal.type}
                  </div>
                  <p className="text-2xl font-bold text-white mt-3">{signal.symbol}</p>
                </div>

                {/* Confidence & Reason */}
                <div className="md:col-span-2">
                  <p className="text-gray-400 text-sm mb-2">Confidence</p>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-400"
                          style={{ width: `${signal.confidence}%` }}
                        />
                      </div>
                      <span className="text-white font-semibold">{signal.confidence}%</span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">{signal.reason}</p>
                </div>

                {/* Price Levels */}
                <div>
                  <p className="text-gray-400 text-sm mb-2">Price Levels</p>
                  <div className="space-y-1">
                    <div>
                      <p className="text-xs text-gray-500">Support</p>
                      <p className="text-white font-semibold">${signal.supportLevel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Entry</p>
                      <p className="text-blue-400 font-semibold">${signal.entry}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Resistance</p>
                      <p className="text-white font-semibold">${signal.resistanceLevel}</p>
                    </div>
                  </div>
                </div>

                {/* Trade Target */}
                <div>
                  <p className="text-gray-400 text-sm mb-2">Target</p>
                  <p className="text-3xl font-bold text-green-400">${signal.target}</p>
                  <p className="text-sm text-gray-400 mt-4">
                    Potential gain:{' '}
                    <span className="text-green-400 font-semibold">
                      +${Math.abs(signal.target - signal.entry).toFixed(0)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3 border-t border-slate-700 pt-4">
                <Button
                  variant="success"
                  className="flex-1"
                >
                  Trade Now
                </Button>
                <Button variant="secondary">Full Analysis</Button>
                <Button variant="outline">Alert Me</Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Trend Analysis */}
        <Card className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-6">Trend Analysis</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-green-400" />
                Uptrend Markets
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>✓ R_25 - Strong uptrend</li>
                <li>✓ R_50 - Moderate uptrend</li>
                <li>✓ R_100 - Emerging uptrend</li>
              </ul>
            </div>

            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle size={20} className="text-yellow-400" />
                Consolidation
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>⚠ R_10 - Breakout pending</li>
                <li>⚠ R_75 - Range bound</li>
              </ul>
            </div>

            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-red-400" style={{ transform: 'rotate(180deg)' }} />
                Downtrend Markets
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>✓ None currently detected</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
