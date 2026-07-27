export const STATUS_MAP = {
  overdue: {
    label: 'OVERDUE',
    badgeClass: 'bg-[#EF4444]/10 text-[#EF4444]',
    indicatorClass: 'bg-[#EF4444]',
    textClass: 'text-[#EF4444]',
  },
  due_soon: {
    label: 'DUE SOON',
    badgeClass: 'bg-[#F59E0B]/10 text-[#F59E0B]',
    indicatorClass: 'bg-[#F59E0B]',
    textClass: 'text-[#F59E0B]',
  },
  upcoming: {
    label: 'UPCOMING',
    badgeClass: 'bg-[#22C55E]/10 text-[#22C55E]',
    indicatorClass: 'bg-[#22C55E]',
    textClass: 'text-[#22C55E]',
  },
  scheduled: {
    label: 'SCHEDULED',
    badgeClass: 'bg-[#22C55E]/10 text-[#22C55E]',
    indicatorClass: 'bg-[#22C55E]',
    textClass: 'text-[#22C55E]',
  },
  completed_by_executive: {
    label: 'COMPLETED BY EXECUTIVE',
    badgeClass: 'bg-[#3B82F6]/10 text-[#3B82F6]',
    indicatorClass: 'bg-[#3B82F6]',
    textClass: 'text-[#3B82F6]',
  },
  pending: {
    label: 'PENDING',
    badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200',
    indicatorClass: 'bg-slate-400',
    textClass: 'text-slate-700',
  },
  in_progress: {
    label: 'IN PROGRESS',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
    indicatorClass: 'bg-blue-500',
    textClass: 'text-blue-700',
  },
  waiting_for_review: {
    label: 'WAITING FOR REVIEW',
    badgeClass: 'bg-purple-50 text-purple-700 border border-purple-250',
    indicatorClass: 'bg-purple-500',
    textClass: 'text-purple-700',
  },
  returned_with_comments: {
    label: 'RETURNED WITH COMMENTS',
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
    indicatorClass: 'bg-amber-500',
    textClass: 'text-amber-700',
  },
  approved: {
    label: 'APPROVED',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-250',
    indicatorClass: 'bg-emerald-500',
    textClass: 'text-emerald-700',
  },
  closed: {
    label: 'CLOSED',
    badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200',
    indicatorClass: 'bg-slate-500',
    textClass: 'text-slate-700',
  },
};

export const getStatusMeta = (status) => {
  const normalized = (status || '').toLowerCase().replace(' ', '_');
  return STATUS_MAP[normalized] || {
    label: (status || '').toUpperCase(),
    badgeClass: 'bg-[#F1F5F9] text-[#64748B]',
    indicatorClass: 'bg-[#94A3B8]',
    textClass: 'text-[#64748B]',
  };
};
