import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, AlertTriangle, CheckCircle2, Info, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const pageNames = {
  dashboard: 'Portfolio overview', clients: 'Companies', tasks: 'Obligations',
  'regulatory-updates': 'Regulatory intelligence', reports: 'Reports',
  admin: 'Administration', chat: 'Compliance assistant',
};

const Navbar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const section = location.pathname.split('/').filter(Boolean)[0] || 'dashboard';
  const title = pageNames[section] || 'CS Command';

  const { data: logs = [] } = useQuery({
    queryKey: ['navbar-notifications'],
    queryFn: async () => (await api.get('/reports/audit-logs?limit=8')).data,
    staleTime: 60000,
  });

  const notifications = logs.map((log) => ({
    ...log,
    type: log.action?.includes('overdue') ? 'overdue' : log.action?.includes('complete') ? 'completed' : 'info',
    label: `${log.user?.full_name || 'System'} ${(log.action || 'updated').replace(/_/g, ' ')}`,
  }));
  const urgent = notifications.filter((item) => item.type === 'overdue').length;

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/70 bg-[#F7F8FA]/90 px-5 backdrop-blur-xl lg:left-[236px] lg:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0B1220] lg:hidden"><ShieldCheck className="h-4 w-4 text-white" /></div>
        <div>
          <p className="text-sm font-semibold tracking-[-0.01em] text-[#101828]">{title}</p>
          <p className="hidden text-[10px] text-slate-500 sm:block">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </div>

      <div className="relative">
        <button onClick={() => setOpen(!open)} className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-950" aria-label="Open activity feed">
          <Bell className="h-4 w-4" />
          {urgent > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />}
        </button>
        {open && (
          <>
            <button className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} aria-label="Close activity feed" />
            <div className="absolute right-0 z-50 mt-2 w-[min(340px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(16,24,40,0.16)]">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
                <div><p className="text-xs font-semibold text-slate-900">Recent activity</p><p className="text-[10px] text-slate-500">Latest portfolio actions</p></div>
                {urgent > 0 && <span className="rounded-full bg-rose-50 px-2 py-1 text-[9px] font-semibold text-rose-600">{urgent} urgent</span>}
              </div>
              <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                {notifications.length === 0 ? <p className="p-8 text-center text-xs text-slate-500">No recent activity</p> : notifications.map((item, index) => {
                  const Icon = item.type === 'overdue' ? AlertTriangle : item.type === 'completed' ? CheckCircle2 : Info;
                  const color = item.type === 'overdue' ? 'text-rose-500 bg-rose-50' : item.type === 'completed' ? 'text-emerald-600 bg-emerald-50' : 'text-blue-600 bg-blue-50';
                  return <div key={item.id || index} className="flex gap-3 px-4 py-3.5"><div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${color}`}><Icon className="h-3.5 w-3.5" /></div><div><p className="text-[11px] font-medium leading-4 text-slate-800">{item.label}</p><p className="mt-1 text-[9px] text-slate-400">{new Date(item.created_at).toLocaleString('en-IN')}</p></div></div>;
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
