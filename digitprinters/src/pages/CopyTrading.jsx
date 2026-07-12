/**
 * Copy Trading Page
 * Leaderboard and copy trading interface
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Users, TrendingUp, Award } from 'lucide-react';

export default function CopyTrading() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const traders = [
    {
      id: 1,
      name: 'ProTrader123',
      roi: '+285%',
      followers: 1240,
      winRate: '82%',
      trades: 342,
      profit: '+$125,430',
      avatar: '👨‍💼',
      followed: false,
    },
    {
      id: 2,
      name: 'EliteSignals',
      roi: '+245%',
      followers: 985,
      winRate: '78%',
      trades: 298,
      profit: '+$98,650',
      avatar: '📊',
      followed: true,
    },
    {
      id: 3,
      name: 'TrendMaster',
      roi: '+198%',
      followers: 756,
      winRate: '75%',
      trades: 267,
      profit: '+$87,340',
      avatar: '🎯',
      followed: false,
    },
    {
      id: 4,
      name: 'VolatilityKing',
      roi: '+176%',
      followers: 634,
      winRate: '71%',
      trades: 245,
      profit: '+$72,190',
      avatar: '🚀',
      followed: false,
    },
    {
      id: 5,
      name: 'GainSeeker',
      roi: '+164%',
      followers: 521,
      winRate: '69%',
      trades: 218,
      profit: '+$61,450',
      avatar: '💰',
      followed: false,
    },
    {
      id: 6,
      name: 'RiskManager',
      roi: '+152%',
      followers: 412,
      winRate: '67%',
      trades: 195,
      profit: '+$54,320',
      avatar: '🛡️',
      followed: false,
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
          <h1 className="text-4xl font-bold text-white mb-2">Copy Trading</h1>
          <p className="text-gray-400">Follow successful traders and copy their strategies automatically</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 bg-opacity-20 rounded-lg flex items-center justify-center">
                <Users className="text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Active Traders</p>
                <p className="text-3xl font-bold text-white">856</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-600 bg-opacity-20 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-green-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Your Followers</p>
                <p className="text-3xl font-bold text-white">234</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-600 bg-opacity-20 rounded-lg flex items-center justify-center">
                <Award className="text-yellow-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Your ROI</p>
                <p className="text-3xl font-bold text-green-400">+125%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Leaderboard */}
        <Card>
          <h2 className="text-2xl font-bold text-white mb-6">Leaderboard</h2>
          <div className="space-y-4">
            {traders.map((trader, index) => (
              <div
                key={trader.id}
                className="flex items-center justify-between p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
              >
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-2xl font-bold text-gray-500 w-8">#{index + 1}</span>
                  <div className="text-3xl">{trader.avatar}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{trader.name}</p>
                    <div className="flex gap-4 mt-1 text-sm">
                      <span className="text-gray-400">Win Rate: <span className="text-green-400">{trader.winRate}</span></span>
                      <span className="text-gray-400">Trades: <span className="text-white">{trader.trades}</span></span>
                      <span className="text-gray-400">Followers: <span className="text-white">{trader.followers}</span></span>
                    </div>
                  </div>
                </div>

                <div className="text-right mr-6">
                  <p className="text-lg font-bold text-white">{trader.roi}</p>
                  <p className="text-sm text-green-400">{trader.profit}</p>
                </div>

                <Button
                  variant={trader.followed ? 'secondary' : 'success'}
                  size="sm"
                >
                  {trader.followed ? 'Following' : 'Follow'}
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Your Copy Trades */}
        <Card className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-6">Your Active Copies</h2>
          <div className="space-y-4">
            {[
              { trader: 'ProTrader123', amount: '$500', return: '+$145', status: 'Active' },
              { trader: 'EliteSignals', amount: '$250', return: '+$78', status: 'Active' },
              { trader: 'TrendMaster', amount: '$100', return: '-$15', status: 'Paused' },
            ].map((copy, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                <div>
                  <p className="font-semibold text-white">{copy.trader}</p>
                  <p className="text-sm text-gray-400">Amount: {copy.amount}</p>
                </div>
                <div className="text-right">
                  <p className={copy.return.startsWith('+') ? 'text-green-400' : 'text-red-400'}>
                    {copy.return}
                  </p>
                  <p className={`text-sm ${
                    copy.status === 'Active' ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {copy.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
