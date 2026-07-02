import React from 'react';
import Modal from './Modal';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone. Please confirm.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDanger = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <p className="text-[#64748B] text-sm leading-relaxed">{description}</p>
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#E5E7EB] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] text-sm font-medium rounded-md transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isDanger
                ? "bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444]"
                : "bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
