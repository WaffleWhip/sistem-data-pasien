import React from 'react';

const Logo = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: { box: "h-8 w-8", text: "text-lg" },
    md: { box: "h-10 w-10", text: "text-2xl" },
    lg: { box: "h-12 w-12", text: "text-3xl" },
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${currentSize.box} bg-brand-primary flex-shrink-0 flex items-center justify-center rounded-lg`}>
        <svg viewBox="0 0 100 100" className="w-1/2 h-1/2 text-white" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
          <path d="M50 20 v60 M20 50 h60" />
        </svg>
      </div>
      <span className={`${currentSize.text} font-bold tracking-tight text-brand-dark`}>
        Health<span className="text-brand-primary">Cure</span>
      </span>
    </div>
  );
};

export default Logo;
