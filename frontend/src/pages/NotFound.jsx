import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4">
      <div className="p-4 bg-white border border-[#E5E7EB] rounded-full mb-4 shadow-sm">
        <AlertCircle className="w-12 h-12 text-[#EF4444]" strokeWidth={1.5} />
      </div>
      <h1 className="text-[#0F172A] text-2xl font-bold mb-2">404 - Page Not Found</h1>
      <p className="text-[#64748B] text-sm max-w-sm mb-6 leading-relaxed">
        The compliance resource or path you followed does not exist.
      </p>
      <Link
        to="/dashboard"
        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2 text-xs font-semibold rounded-md transition-colors shadow-md"
      >
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
