/**
 * Loading Spinner Component
 */

export default function LoadingSpinner({ size = 'md', fullScreen = false, message = '' }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const spinner = (
    <div className={`${sizeClasses[size]} border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin`} />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex flex-col items-center justify-center gap-4 z-50">
        {spinner}
        {message ? <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-200">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      {spinner}
      {message ? <p className="text-sm text-slate-300">{message}</p> : null}
    </div>
  );
}
