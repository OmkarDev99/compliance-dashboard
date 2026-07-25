import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import { getComplianceCalendar } from '../services/calendar';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/dateUtils';

const filters = [['all', 'All'], ['today', 'Today'], ['week', 'This Week'], ['month', 'This Month'], ['overdue', 'Overdue']];

export default function ComplianceCalendar() {
  const [period, setPeriod] = useState('all');
  const { data: items = [], isLoading } = useQuery({ queryKey: ['compliance-calendar', period], queryFn: () => getComplianceCalendar(period === 'all' ? {} : { period }) });
  if (isLoading) return <Loader fullScreen />;
  return <div className="page-transition space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Compliance planning</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Compliance Calendar</h1><p className="mt-2 text-sm text-slate-500">Scheduled monthly, quarterly, half-yearly, annual, and event-based obligations.</p></div><CalendarDays className="h-8 w-8 text-blue-600" /></div>
    <div className="flex flex-wrap gap-2">{filters.map(([value, label]) => <button key={value} onClick={() => setPeriod(value)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${period === value ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{label}</button>)}</div>
    {items.length === 0 ? <EmptyState title="No calendar items" description="No compliance dates match this time window." /> : <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="min-w-full text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="p-4">Compliance</th><th className="p-4">Frequency</th><th className="p-4">Due date</th><th className="p-4">Status</th></tr></thead><tbody>{items.map(item => <tr key={item.id} className="border-t border-slate-100"><td className="p-4 font-semibold text-slate-900">{item.rule_name}</td><td className="p-4 capitalize text-slate-600">{item.frequency.replaceAll('_', ' ')}</td><td className="p-4 text-slate-600">{formatDate(item.due_date)}</td><td className="p-4"><StatusBadge status={item.status} /></td></tr>)}</tbody></table></div>}
  </div>;
}
