import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-[4px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xl shadow-[#0F172A]/15 w-full max-w-[600px] z-10 overflow-hidden transform scale-100 p-6 m-4 page-transition">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4 mb-4">
          <h3 className="text-[#0F172A] text-base font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-md hover:bg-[#F1F5F9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
