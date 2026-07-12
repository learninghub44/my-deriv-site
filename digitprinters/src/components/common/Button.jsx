/**
 * Button Component
 */

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  ...props
}) {
  const baseClasses = 'font-semibold rounded-lg transition flex items-center justify-center gap-2';

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white disabled:bg-gray-600',
    success: 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-600',
    danger: 'bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-600',
    outline: 'border border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white',
  };

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
