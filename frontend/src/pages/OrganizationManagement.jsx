import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, GitBranch, ShieldCheck, UsersRound } from 'lucide-react';
import api from '../services/api';

const Card = ({ icon: Icon, title, children }) => <section className="premium-card p-5"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-blue-600"/><h1 className="text-sm font-semibold text-slate-950">{title}</h1></div><div className="mt-4">{children}</div></section>;

export default function OrganizationManagement() {
  const { data: org } = useQuery({ queryKey: ['organization'], queryFn: async () => (await api.get('/organizations/current')).data });
  const { data: teams = [] } = useQuery({ queryKey: ['teams'], queryFn: async () => (await api.get('/organizations/teams')).data });
  const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: async () => (await api.get('/organizations/roles')).data });
  const { data: hierarchy = [] } = useQuery({ queryKey: ['hierarchy'], queryFn: async () => (await api.get('/organizations/hierarchy')).data });
  return <div className="page-transition space-y-6">
    <div><p className="eyebrow">Organization settings</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Teams, hierarchy & permissions</h1><p className="mt-2 text-sm text-slate-500">Manage your firm’s operating structure without changing existing client workflows.</p></div>
    <div className="grid gap-5 lg:grid-cols-2">
      <Card icon={Building2} title={org?.name || 'Organization'}><p className="text-sm text-slate-700">{org?.email || 'Tenant workspace'}</p><p className="mt-1 text-xs capitalize text-slate-500">{org?.subscription_plan || 'starter'} plan · {org?.status || 'active'}</p></Card>
      <Card icon={UsersRound} title="Teams"><div className="space-y-2">{teams.length ? teams.map(t => <div key={t.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{t.name}<span className="float-right text-xs text-slate-400">{t.member_ids?.length || 0} members</span></div>) : <p className="text-sm text-slate-500">No teams yet.</p>}</div></Card>
      <Card icon={GitBranch} title="Reporting hierarchy"><div className="space-y-2">{hierarchy.map(person => <div key={person.id} className="flex justify-between rounded-xl border border-slate-100 px-3 py-2"><span className="text-sm text-slate-700">{person.name}</span><span className="text-xs text-slate-400">{person.designation || 'Member'}</span></div>)}</div></Card>
      <Card icon={ShieldCheck} title="Roles & permissions"><div className="space-y-2">{roles.length ? roles.map(role => <div key={role.id} className="rounded-xl border border-slate-100 px-3 py-2"><p className="text-sm font-medium text-slate-700">{role.name}</p><p className="mt-1 text-xs text-slate-400">{role.permissions?.length || 0} permissions</p></div>) : <p className="text-sm text-slate-500">Use role permissions to separate designation from access.</p>}</div></Card>
    </div>
  </div>;
}
