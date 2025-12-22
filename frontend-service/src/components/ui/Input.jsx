import React from 'react';

const Input = ({ label, id, name, className, labelClassName, ...props }) => {
  const inputName = name || id;
  return (
    <div className="group">
      {label && (
        <label 
          htmlFor={id} 
          className={`text-sm font-medium text-slate-600 mb-1.5 block transition-colors group-focus-within:text-indigo-600 ${labelClassName}`}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        name={inputName}
        className={`block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 hover:border-slate-300 ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;
