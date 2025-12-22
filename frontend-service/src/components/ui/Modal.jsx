import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-brand-dark/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl w-full max-w-2xl shadow-xl transform transition-all animate-in fade-in-90 slide-in-from-bottom-10 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-brand-dark">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-brand-light hover:bg-gray-200 hover:text-brand-secondary transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
