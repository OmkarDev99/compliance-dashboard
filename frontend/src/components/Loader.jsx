import React from 'react';

export const Spinner = ({ className = "w-6 h-6" }) => (
  <svg className={`animate-spin text-[#2563EB] ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export const Skeleton = ({ className = "h-4 w-full" }) => (
  <div className={`animate-shimmer rounded ${className}`}></div>
);

export const TableRowSkeleton = ({ cols = 5 }) => (
  <tr className="border-b border-[#E5E7EB]">
    {Array.from({ length: cols }).map((_, idx) => (
      <td key={idx} className="p-4">
        <Skeleton className="h-4 w-5/6" />
      </td>
    ))}
  </tr>
);

export const TaskCardSkeleton = () => (
  <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg flex justify-between items-center space-x-4">
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-1/4" />
    </div>
    <Skeleton className="h-6 w-20 rounded-full" />
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="p-4 bg-white border border-[#E5E7EB] rounded-lg">
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Skeleton className="h-6 w-1/4" />
        {Array.from({ length: 3 }).map((_, idx) => (
          <TaskCardSkeleton key={idx} />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <div className="h-48 bg-white border border-[#E5E7EB] rounded-lg flex items-center justify-center">
          <Spinner />
        </div>
      </div>
    </div>
  </div>
);

const Loader = ({ fullScreen }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[#F8FAFC] flex items-center justify-center z-50">
        <Spinner className="w-12 h-12" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center p-8">
      <Spinner className="w-8 h-8" />
    </div>
  );
};

export default Loader;
