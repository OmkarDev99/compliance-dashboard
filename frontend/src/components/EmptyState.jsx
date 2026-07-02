import React from 'react';
import { AlertCircle } from 'lucide-react';

const EmptyState = ({
  icon: Icon = AlertCircle,
  title = "No data available",
  description = "There are no records to display at this time.",
  actionLabel,
  onActionClick
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-white border border-[#E5E7EB] rounded-xl">
      <div className="p-4 bg-[#F8FAFC] rounded-full border border-[#E5E7EB] mb-4">
        <Icon className="w-8 h-8 text-[#64748B]" strokeWidth={1.5} />
      </div>
      <h3 className="text-[#0F172A] text-base font-semibold mb-1">{title}</h3>
      <p className="text-[#64748B] text-sm max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionLabel && onActionClick && (
        <button
          onClick={onActionClick}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 text-sm font-medium rounded-md transition-colors shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
