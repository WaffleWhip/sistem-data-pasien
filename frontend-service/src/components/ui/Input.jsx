import React from 'react';

const Input = ({ label, id, name, className, labelClassName, ...props }) => {
  const inputName = name || id;
  return (
    <div>
      {label && <label htmlFor={id} className={`text-sm font-medium text-brand-secondary mb-1 block ${labelClassName}`}>{label}</label>}
      <input
        id={id}
        name={inputName}
        className={`block w-full px-3 py-2.5 bg-white border border-brand-light rounded-lg text-brand-dark placeholder-brand-light focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;
