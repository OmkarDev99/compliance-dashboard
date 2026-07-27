import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Check, Crown, GitBranch, Pencil, Save, ShieldCheck, UsersRound, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const permissionOptions = [
  ['can_view_all_clients', 'View all clients'],
  ['can_assign_tasks', 'Assign tasks'],
  ['can_review_tasks', 'Review work'],
  ['can_approve_tasks', 'Approve work'],
  ['can_manage_users', 'Manage users'],
  ['can_manage_teams', 'Manage teams'],
  ['can_manage_companies', 'Manage companies'],
  ['can_upload_documents', 'Upload documents'],
  ['can_view_reports', 'View reports'],
  ['can_manage_settings', 'Manage settings'],
];

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50';

const Card = ({ icon: Icon, title, description, children, className = '' }) => (
  <section className={`premium-card p-5 ${className}`}>
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon className="h-4 w-4" /></div>
      <div><h2 className="text-sm font-semibold text-slate-950">{title}</h2>{description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}</div>
    </div>
    <div className="mt-5">{children}</div>
  </section>
);

const Metric = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-2xl font-semibold tracking-tight text-slate-950">{value ?? 0}</p>
    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
  </div>
);

const TeamStructure = ({ organization, partners, teams, people, onEdit }) => {
  const peopleById = Object.fromEntries(people.map((person) => [person.id, person]));
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-6">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{organization?.name || 'Firm workspace'}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {partners.length ? partners.map((partner) => <span key={partner.id} className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800"><Crown className="h-3.5 w-3.5" />{partner.name}</span>) : <span className="text-xs text-slate-500">Assign a partner to lead this workspace</span>}
        </div>
      </div>
      <div className="mx-auto h-8 w-px bg-slate-300" />
      <div className="relative grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teams.length > 1 && <div className="absolute left-[16.66%] right-[16.66%] top-0 hidden h-px bg-slate-300 xl:block" />}
        {teams.length ? teams.map((team) => {
          const manager = peopleById[team.manager_id];
          const members = (team.member_ids || []).map((id) => peopleById[id]).filter(Boolean);
          return <article key={team.id} className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="absolute left-1/2 top-[-17px] hidden h-4 w-px bg-slate-300 xl:block" />
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-sm font-semibold text-slate-900">{team.name}</p><p className="mt-1 text-[10px] text-slate-400">{members.length} member{members.length === 1 ? '' : 's'}</p></div>
              <button type="button" onClick={() => onEdit(team)} className="rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600" aria-label={`Edit ${team.name}`}><Pencil className="h-3.5 w-3.5" /></button>
            </div>
            {manager && <div className="mt-3 rounded-xl bg-blue-50 px-3 py-2"><p className="text-[9px] font-semibold uppercase tracking-wider text-blue-500">Team manager</p><p className="mt-0.5 text-xs font-medium text-blue-900">{manager.name}</p></div>}
            <div className="mt-3 space-y-2">{members.length ? members.map((member) => <div key={member.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2"><div className="flex min-w-0 items-center gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[9px] font-semibold text-slate-600">{member.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><span className="truncate text-xs font-medium text-slate-700">{member.name}</span></div>{member.id === team.manager_id && <span className="text-[9px] font-semibold text-blue-500">Lead</span>}</div>) : <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">No members assigned</p>}</div>
          </article>;
        }) : <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><UsersRound className="mx-auto h-5 w-5 text-slate-300" /><p className="mt-2 text-sm font-medium text-slate-600">No teams configured</p><p className="mt-1 text-xs text-slate-400">Create ROC, Secretarial, Annual Filing, or another team below.</p></div>}
      </div>
    </div>
  );
};

export default function OrganizationManagement() {
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [teamForm, setTeamForm] = useState({ name: '', manager_id: '', member_ids: [] });
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: '', permissions: [] });

  const { data: org } = useQuery({ queryKey: ['organization'], queryFn: async () => (await api.get('/organizations/current')).data });
  const { data: summary = {} } = useQuery({ queryKey: ['organization-summary'], queryFn: async () => (await api.get('/organizations/summary')).data });
  const { data: teams = [] } = useQuery({ queryKey: ['teams'], queryFn: async () => (await api.get('/organizations/teams')).data });
  const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: async () => (await api.get('/organizations/roles')).data });
  const { data: hierarchy = [] } = useQuery({ queryKey: ['hierarchy'], queryFn: async () => (await api.get('/organizations/hierarchy')).data });
  const users = hierarchy;

  useEffect(() => {
    if (org) setProfile({ name: org.name || '', email: org.email || '', phone: org.phone || '' });
  }, [org]);

  const updateProfile = useMutation({
    mutationFn: async () => (await api.patch('/organizations/current', profile)).data,
    onSuccess: (data) => {
      queryClient.setQueryData(['organization'], data);
      toast.success('Workspace profile updated');
    },
    onError: (error) => toast.error(error?.response?.data?.detail || 'Could not update workspace'),
  });

  const saveTeam = useMutation({
    mutationFn: async () => {
      const payload = {
      ...teamForm,
      manager_id: teamForm.manager_id || null,
      };
      return editingTeamId
        ? (await api.put(`/organizations/teams/${editingTeamId}`, payload)).data
        : (await api.post('/organizations/teams', payload)).data;
    },
    onSuccess: () => {
      setTeamForm({ name: '', manager_id: '', member_ids: [] });
      setEditingTeamId(null);
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['organization-summary'] });
      toast.success(editingTeamId ? 'Team updated' : 'Team created');
    },
    onError: (error) => toast.error(error?.response?.data?.detail || 'Could not save team'),
  });

  const createRole = useMutation({
    mutationFn: async () => (await api.post('/organizations/roles', roleForm)).data,
    onSuccess: () => {
      setRoleForm({ name: '', permissions: [] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role created');
    },
    onError: (error) => toast.error(error?.response?.data?.detail || 'Could not create role'),
  });

  const toggleMember = (id) => setTeamForm((current) => ({
    ...current,
    member_ids: current.member_ids.includes(id) ? current.member_ids.filter((item) => item !== id) : [...current.member_ids, id],
  }));
  const togglePermission = (permission) => setRoleForm((current) => ({
    ...current,
    permissions: current.permissions.includes(permission) ? current.permissions.filter((item) => item !== permission) : [...current.permissions, permission],
  }));
  const startEditingTeam = (team) => {
    setEditingTeamId(team.id);
    setTeamForm({ name: team.name, manager_id: team.manager_id || '', member_ids: team.member_ids || [] });
  };
  const cancelEditingTeam = () => {
    setEditingTeamId(null);
    setTeamForm({ name: '', manager_id: '', member_ids: [] });
  };
  const partners = hierarchy.filter((person) => person.role === 'partner');
  const workspaceLeaders = partners.length ? partners : hierarchy.filter((person) => person.role === 'admin');

  return (
    <div className="page-transition space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Isolated firm workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{org?.name || 'Firm settings'}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">Users, teams, clients, tasks, reports, and activity in this workspace are isolated from every other firm.</p>
        </div>
        <span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Tenant active</span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Active members" value={summary.members} />
        <Metric label="Teams" value={summary.teams} />
        <Metric label="Client companies" value={summary.companies} />
        <Metric label="Open obligations" value={summary.open_tasks} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="xl:col-span-2" icon={GitBranch} title="Team structure" description="Partner-led teams with their managers and members. Every person shown belongs to this firm workspace.">
          <TeamStructure organization={org} partners={workspaceLeaders} teams={teams} people={hierarchy} onEdit={startEditingTeam} />
        </Card>

        <Card icon={Building2} title="Firm identity" description="This identity appears throughout the private workspace.">
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); updateProfile.mutate(); }}>
            <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-medium text-slate-600">Firm name</span><input className={inputCls} value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} required /></label>
            <label><span className="mb-1.5 block text-xs font-medium text-slate-600">Firm email</span><input className={inputCls} type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} /></label>
            <label><span className="mb-1.5 block text-xs font-medium text-slate-600">Phone</span><input className={inputCls} value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label>
            <div className="flex items-center justify-between sm:col-span-2"><p className="text-xs capitalize text-slate-400">{org?.subscription_plan || 'starter'} plan</p><button disabled={updateProfile.isPending} className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"><Save className="h-3.5 w-3.5" /> Save profile</button></div>
          </form>
        </Card>

        <Card icon={UsersRound} title={editingTeamId ? 'Edit team' : 'Create a team'} description="Group firm members without exposing them to another tenant.">
          <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); saveTeam.mutate(); }}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label><span className="mb-1.5 block text-xs font-medium text-slate-600">Team name</span><input className={inputCls} value={teamForm.name} onChange={(event) => setTeamForm({ ...teamForm, name: event.target.value })} placeholder="Secretarial Team" required /></label>
              <label><span className="mb-1.5 block text-xs font-medium text-slate-600">Team manager</span><select className={inputCls} value={teamForm.manager_id} onChange={(event) => setTeamForm({ ...teamForm, manager_id: event.target.value })}><option value="">No manager</option>{users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            </div>
            <div><p className="mb-2 text-xs font-medium text-slate-600">Members</p><div className="grid max-h-32 gap-2 overflow-y-auto sm:grid-cols-2">{users.map((item) => <button type="button" key={item.id} onClick={() => toggleMember(item.id)} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition ${teamForm.member_ids.includes(item.id) ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><span className={`flex h-4 w-4 items-center justify-center rounded ${teamForm.member_ids.includes(item.id) ? 'bg-blue-600 text-white' : 'border border-slate-300'}`}>{teamForm.member_ids.includes(item.id) && <Check className="h-3 w-3" />}</span><span className="truncate">{item.name}</span></button>)}</div></div>
            <div className="flex justify-end gap-2">{editingTeamId && <button type="button" onClick={cancelEditingTeam} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"><X className="h-3.5 w-3.5" /> Cancel</button>}<button disabled={saveTeam.isPending} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">{editingTeamId ? 'Save team' : 'Create team'}</button></div>
          </form>
        </Card>

        <Card icon={ShieldCheck} title="Roles & permissions" description="Designation and system access remain separate.">
          <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); createRole.mutate(); }}>
            <label><span className="mb-1.5 block text-xs font-medium text-slate-600">Role name</span><input className={inputCls} value={roleForm.name} onChange={(event) => setRoleForm({ ...roleForm, name: event.target.value })} placeholder="Compliance reviewer" required /></label>
            <div className="grid gap-2 sm:grid-cols-2">{permissionOptions.map(([permission, label]) => <label key={permission} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-100 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"><input type="checkbox" checked={roleForm.permissions.includes(permission)} onChange={() => togglePermission(permission)} className="accent-blue-600" />{label}</label>)}</div>
            <div className="flex justify-end"><button disabled={createRole.isPending} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">Create role</button></div>
          </form>
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">{roles.map((role) => <div key={role.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5"><p className="text-sm font-medium text-slate-700">{role.name}</p><span className="text-[10px] text-slate-400">{role.permissions?.length || 0} permissions</span></div>)}</div>
        </Card>
      </div>
    </div>
  );
}
