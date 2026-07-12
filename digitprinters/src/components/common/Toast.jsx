/**
 * Toast Notification Component
 */

import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
  const icons = {
    success: <CheckCircle size={20} className="text-green-400" />,
    error: <XCircle size={20} className="text-red-400" />,
    warning: <AlertCircle size={20} className="text-yellow-400" />,
    info: <Info size={20} className="text-blue-400" />,
  };

  const bgColors = {
    success: 'bg-green-900 bg-opacity-30 border-green-800',
    error: 'bg-red-900 bg-opacity-30 border-red-800',
    warning: 'bg-yellow-900 bg-opacity-30 border-yellow-800',
    info: 'bg-blue-900 bg-opacity-30 border-blue-800',
  };

  return (
    <div
      className={`${bgColors[type]} border rounded-lg p-4 flex items-center gap-3 backdrop-blur-glass animate-slide-up`}
    >
      {icons[type]}
      <p className="flex-1 text-white">{message}</p>
      <button onClick={onClose} className="text-gray-400 hover:text-white">
        ✕
      </button>
    </div>
  );
}
