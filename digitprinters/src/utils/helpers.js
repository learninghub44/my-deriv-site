/**
 * Helper Functions
 */

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export const formatPercent = (value) => {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

export const formatNumber = (value, decimals = 2) => {
  return parseFloat(value).toFixed(decimals);
};

export const getColorByTrend = (value) => {
  if (value > 0) return 'text-green-400';
  if (value < 0) return 'text-red-400';
  return 'text-gray-400';
};

export const getColorByTrendBg = (value) => {
  if (value > 0) return 'bg-green-400';
  if (value < 0) return 'bg-red-400';
  return 'bg-gray-400';
};

export const getDurationInSeconds = (duration) => {
  const units = {
    s: 1,
    m: 60,
    h: 3600,
  };

  const match = duration.match(/^(\d+)([smh])$/);
  if (!match) return 60;

  const value = parseInt(match[1]);
  const unit = match[2];

  return value * (units[unit] || 1);
};

export const formatTime = (epoch) => {
  const date = new Date(epoch * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatDate = (epoch) => {
  const date = new Date(epoch * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const truncateAddress = (address, chars = 4) => {
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
