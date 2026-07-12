/**
 * Card Component
 * Reusable card with glass morphism effect
 */

export default function Card({ children, className = '', hover = true, onClick }) {
  const baseClasses =
    'bg-slate-800 border border-slate-700 rounded-lg p-6 backdrop-blur-glass';
  const hoverClasses = hover ? 'hover:border-slate-600 hover:bg-slate-750 transition' : '';

  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
