import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl transform transition-all animate-scale-in overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all duration-200"
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
