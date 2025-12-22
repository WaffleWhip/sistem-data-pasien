import React from 'react';

const Logo = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: { box: "h-9 w-9", text: "text-lg", icon: "w-4 h-4" },
    md: { box: "h-11 w-11", text: "text-xl", icon: "w-5 h-5" },
    lg: { box: "h-14 w-14", text: "text-2xl", icon: "w-6 h-6" },
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${currentSize.box} relative flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25`}>
        <svg viewBox="0 0 100 100" className={`${currentSize.icon} text-white`} fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
          <path d="M50 20 v60 M20 50 h60" />
        </svg>
        <div className="absolute inset-0 rounded-xl bg-white/10"></div>
      </div>
      <span className={`${currentSize.text} font-bold tracking-tight text-slate-800`}>
        Health<span className="text-gradient">Cure</span>
      </span>
    </div>
  );
};

export default Logo;
