import React, { useMemo, useState } from 'react';
import StatusBadge from '../StatusBadge';
import EmptyState from '../EmptyState';
import { formatDate } from '../../utils/dateUtils';

const CompanyCalendarTab = ({ calendar = [] }) => {
  const [period, setPeriod] = useState('all');
  const visibleItems = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return calendar.filter((item) => {
      const due = new Date(`${item.due_date}T00:00:00`);
      const days = Math.floor((due - today) / 86400000);
      if (period === 'today') return days === 0;
      if (period === 'week') return days >= 0 && days <= 6;
      if (period === 'month') return days >= 0 && days <= 30;
      return period !== 'overdue' || (days < 0 && item.status !== 'completed');
    });
  }, [calendar, period]);

  return <div className="space-y-4">
    <div className="flex flex-wrap gap-3">
      <label className="text-xs text-[#64748B]">Due window
        <select value={period} onChange={(event) => setPeriod(event.target.value)} className="ml-2 rounded-md border border-[#E5E7EB] bg-white px-2 py-1.5 text-xs text-[#0F172A]">
          <option value="all">All</option><option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option><option value="overdue">Overdue</option>
        </select>
      </label>
    </div>
    {visibleItems.length === 0 ? <EmptyState title="No matching calendar items" description="Try changing the selected due window." /> :
      <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]"><table className="min-w-full text-left text-xs"><thead className="bg-[#F8FAFC] text-[10px] uppercase tracking-wider text-[#64748B]"><tr><th className="p-3">Compliance</th><th className="p-3">Frequency</th><th className="p-3">Due date</th><th className="p-3">Status</th></tr></thead><tbody>{visibleItems.map((item) => <tr key={item.id} className="border-t border-[#E5E7EB]"><td className="p-3 font-semibold text-[#0F172A]">{item.rule_name}</td><td className="p-3 capitalize text-[#475569]">{item.frequency.replaceAll('_', ' ')}</td><td className="p-3 text-[#475569]">{formatDate(item.due_date)}</td><td className="p-3"><StatusBadge status={item.status} /></td></tr>)}</tbody></table></div>}
  </div>;
};

export default CompanyCalendarTab;
