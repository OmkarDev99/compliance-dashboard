import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, CalendarDays, CheckCircle2, CircleAlert, FileText, History, UsersRound } from 'lucide-react';
import { getCompany360View } from '../services/clients';
import { Skeleton } from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/dateUtils';
import CompanyCalendarTab from '../components/client360/CompanyCalendarTab';
import CompanyDocumentsTab from '../components/client360/CompanyDocumentsTab';
import CompanyContactsTab from '../components/client360/CompanyContactsTab';
import CompanyActivityTab from '../components/client360/CompanyActivityTab';

const tabs = [
  { id: 'calendar', label: 'Compliance Calendar', icon: CalendarDays },
  { id: 'documents', label: 'Client Documents', icon: FileText },
  { id: 'contacts', label: 'Contacts & Management', icon: UsersRound },
  { id: 'activity', label: 'Audit Trail', icon: History },
];

const Kpi = ({ label, value, icon: Icon, className }) => <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-medium text-[#64748B]">{label}</span><Icon className={`h-4 w-4 ${className}`} /></div><p className="mt-2 text-2xl font-bold text-[#0F172A]">{value}</p></div>;

const Client360Skeleton = () => <div className="space-y-6"><Skeleton className="h-8 w-1/3" /><div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-24" />)}</div><Skeleton className="h-10 w-full" /><Skeleton className="h-64 w-full" /></div>;

const Client360View = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTab = tabs.some((tab) => tab.id === searchParams.get('tab')) ? searchParams.get('tab') : 'calendar';
  const { data, isLoading, isError } = useQuery({ queryKey: ['company-360-view', id], queryFn: () => getCompany360View(id), enabled: Boolean(id) });

  if (isLoading) return <Client360Skeleton />;
  if (isError || !data) return <EmptyState title="Company not found" description="The requested company record could not be loaded." />;

  const { company, industry, tasks_summary: summary, tasks, documents, contacts, audit_logs: logs, assignment, calendar } = data;
  const pending = summary.upcoming + summary.due_soon + summary.overdue;
  const identity = company.cin || company.pan || 'Not recorded';

  return <div className="space-y-6 page-transition">
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row">
        <div className="flex gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50"><Building2 className="h-5 w-5 text-[#2563EB]" /></div><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-bold tracking-tight text-[#0F172A]">{company.name}</h1><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${company.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{company.is_active ? 'ACTIVE' : 'INACTIVE'}</span></div><p className="mt-1 text-xs text-[#64748B]">CIN / PAN: <span className="font-mono text-[#334155]">{identity}</span></p></div></div>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs sm:grid-cols-3"><div><dt className="text-[#94A3B8]">Registration type</dt><dd className="mt-1 font-semibold capitalize text-[#334155]">{company.company_type.replaceAll('_', ' ')}</dd></div><div><dt className="text-[#94A3B8]">Industry</dt><dd className="mt-1 font-semibold text-[#334155]">{industry || 'Not recorded'}</dd></div><div><dt className="text-[#94A3B8]">Incorporated</dt><dd className="mt-1 font-semibold text-[#334155]">{formatDate(company.reg_date)}</dd></div></dl>
      </div>
    </section>

    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><UsersRound className="h-4 w-4 text-[#2563EB]" /><h2 className="text-sm font-bold text-[#0F172A]">Client assignment</h2></div><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div><dt className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">Relationship Partner</dt><dd className="mt-1 text-xs font-semibold text-[#334155]">{assignment?.relationship_partner?.full_name || assignment?.relationship_partner?.email || 'Not assigned'}</dd></div><div><dt className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">Primary Manager</dt><dd className="mt-1 text-xs font-semibold text-[#334155]">{assignment?.manager?.full_name || assignment?.manager?.email || 'Not assigned'}</dd></div><div><dt className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">Assigned Team</dt><dd className="mt-1 text-xs font-semibold text-[#334155]">{assignment?.team_name || 'Not assigned'}</dd></div><div><dt className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">Primary Executive</dt><dd className="mt-1 text-xs font-semibold text-[#334155]">{assignment?.primary_executive?.full_name || assignment?.primary_executive?.email || 'Not assigned'}</dd></div></dl></section>

    <section className="grid gap-4 md:grid-cols-3"><Kpi label="Pending compliances" value={pending} icon={CalendarDays} className="text-[#2563EB]" /><Kpi label="Overdue tasks" value={summary.overdue} icon={CircleAlert} className="text-red-500" /><Kpi label="Completed compliances" value={summary.completed} icon={CheckCircle2} className="text-emerald-600" /></section>

    <section className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm"><div className="overflow-x-auto border-b border-[#E5E7EB]"><div className="flex min-w-max gap-1 px-3 pt-3">{tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} onClick={() => setSearchParams({ tab: tab.id })} className={`inline-flex items-center gap-2 rounded-t-md px-3 py-3 text-xs font-semibold transition-colors ${selectedTab === tab.id ? 'border-b-2 border-[#2563EB] bg-blue-50/60 text-[#2563EB]' : 'text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A]'}`}><Icon className="h-3.5 w-3.5" />{tab.label}</button>; })}</div></div><div className="p-5">{selectedTab === 'calendar' && <CompanyCalendarTab calendar={calendar} />}{selectedTab === 'documents' && <CompanyDocumentsTab documents={documents} />}{selectedTab === 'contacts' && <CompanyContactsTab contacts={contacts} />}{selectedTab === 'activity' && <CompanyActivityTab logs={logs} />}</div></section>
  </div>;
};

export default Client360View;
