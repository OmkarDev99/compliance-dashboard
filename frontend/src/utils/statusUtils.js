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
  completed: {
    label: 'COMPLETED',
    badgeClass: 'bg-[#3B82F6]/10 text-[#3B82F6]',
    indicatorClass: 'bg-[#3B82F6]',
    textClass: 'text-[#3B82F6]',
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
