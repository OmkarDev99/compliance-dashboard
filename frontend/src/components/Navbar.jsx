import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, AlertTriangle, CheckCircle2, Info, ShieldCheck, Archive, Check, Settings } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

const pageNames = {
  dashboard: 'Portfolio overview', clients: 'Companies', tasks: 'Obligations',
  'regulatory-updates': 'Regulatory intelligence', reports: 'Reports',
  admin: 'Administration', chat: 'Compliance assistant',
  organization: 'Firm workspace', calendar: 'Compliance calendar',
};

const Navbar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const section = location.pathname.split('/').filter(Boolean)[0] || 'dashboard';
  const title = pageNames[section] || 'CS Command';
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['navbar-notifications'],
    queryFn: async () => (await api.get('/notifications?limit=30')).data,
    staleTime: 30000,
  });
  const { data: preferences = {} } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => (await api.get('/notifications/preferences')).data,
    enabled: open && showPreferences,
  });

  const unread = notifications.filter((item) => !item.is_read).length;
  const urgent = notifications.filter((item) => item.type === 'escalations' && !item.is_read).length;
  const updateNotification = async (id, action) => {
    await api.post(`/notifications/${id}/${action}`);
    queryClient.invalidateQueries({ queryKey: ['navbar-notifications'] });
  };
  const updatePreference = async (key) => {
    await api.put('/notifications/preferences', { preferences: { ...preferences, [key]: !preferences[key] } });
    queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
  };

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
          {unread > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />}
        </button>
        {open && (
          <>
            <button className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} aria-label="Close activity feed" />
            <div className="absolute right-0 z-50 mt-2 w-[min(340px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(16,24,40,0.16)]">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
                <div><p className="text-xs font-semibold text-slate-900">Notification Center</p><p className="text-[10px] text-slate-500">Assignments, reminders and mentions</p></div>
                <div className="flex items-center gap-2"><button onClick={() => setShowPreferences(!showPreferences)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Notification preferences"><Settings className="h-3.5 w-3.5" /></button>{unread > 0 && <span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-600">{unread} unread</span>}</div>
              </div>
              {showPreferences && <div className="border-b border-slate-100 bg-slate-50 px-4 py-3"><p className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-slate-500">Notification preferences</p><div className="grid grid-cols-2 gap-2">{Object.entries(preferences).map(([key, enabled]) => <label key={key} className="flex items-center gap-1.5 text-[10px] capitalize text-slate-600"><input type="checkbox" checked={Boolean(enabled)} onChange={() => updatePreference(key)} className="rounded border-slate-300 text-blue-600" />{key}</label>)}</div></div>}
              <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                {notifications.length === 0 ? <p className="p-8 text-center text-xs text-slate-500">No notifications</p> : notifications.map((item) => {
                  const Icon = item.type === 'escalations' ? AlertTriangle : item.type === 'completion' || item.type === 'approval' ? CheckCircle2 : Info;
                  const color = item.type === 'escalations' ? 'text-rose-500 bg-rose-50' : item.type === 'completion' || item.type === 'approval' ? 'text-emerald-600 bg-emerald-50' : 'text-blue-600 bg-blue-50';
                  return <div key={item.id} className={`flex gap-3 px-4 py-3.5 ${item.is_read ? 'bg-white' : 'bg-blue-50/40'}`}><div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${color}`}><Icon className="h-3.5 w-3.5" /></div><div className="min-w-0 flex-1"><p className="text-[11px] font-medium leading-4 text-slate-800">{item.title}</p><p className="mt-0.5 text-[10px] leading-4 text-slate-500">{item.message}</p><p className="mt-1 text-[9px] text-slate-400">{new Date(item.created_at).toLocaleString('en-IN')}</p></div><div className="flex shrink-0 flex-col gap-1">{!item.is_read && <button onClick={() => updateNotification(item.id, 'read')} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600" aria-label="Mark as read"><Check className="h-3.5 w-3.5" /></button>}<button onClick={() => updateNotification(item.id, 'archive')} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Archive"><Archive className="h-3.5 w-3.5" /></button></div></div>;
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
