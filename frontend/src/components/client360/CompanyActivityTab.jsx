import React from 'react';
import EmptyState from '../EmptyState';

const readableAction = (action) => action.replaceAll('_', ' ');
const CompanyActivityTab = ({ logs }) => logs.length === 0 ? <EmptyState title="No activity logged yet" description="Company and task activity will appear here." /> : (
  <div className="relative ml-2 border-l border-[#E5E7EB] pl-5">{logs.map((log) => <div key={log.id} className="relative pb-6 last:pb-0"><span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#2563EB]" /><p className="text-sm text-[#0F172A]"><strong>{log.user?.full_name || log.user?.email || 'System'}</strong> {readableAction(log.action)}</p><p className="mt-1 text-[11px] text-[#94A3B8]">{new Date(log.created_at).toLocaleString('en-IN')}</p></div>)}</div>
);

export default CompanyActivityTab;
