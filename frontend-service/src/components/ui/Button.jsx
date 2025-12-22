import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'md',
  disabled = false, 
  className = '' 
}) => {
  const baseClasses = 'font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 transform active:scale-[0.98]';

  const sizeClasses = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 focus:ring-indigo-500 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-500 shadow-sm',
    danger: 'bg-gradient-to-r from-rose-500 to-red-600 text-white hover:from-rose-600 hover:to-red-700 focus:ring-rose-500 shadow-lg shadow-rose-500/25',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-800 focus:ring-slate-300',
  };

  const disabledClasses = 'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none disabled:hover:translate-y-0';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
