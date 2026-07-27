import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowRightLeft, BriefcaseBusiness, UsersRound } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Loader from '../components/Loader';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/dateUtils';

export default function WorkloadDashboard() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['team-workload'], queryFn: async () => (await api.get('/tasks/workload')).data, staleTime: 15000 });
  const reassign = useMutation({
    mutationFn: ({ taskId, assigned_user_id }) => api.post(`/tasks/${taskId}/reassign`, { assigned_user_id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['team-workload'] }); queryClient.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task reassigned'); },
    onError: (error) => toast.error(error?.response?.data?.detail || 'Could not reassign task'),
  });
  if (isLoading) return <Loader />;
  const teams = data?.teams || [];
  const totalMembers = teams.reduce((count, team) => count + team.members.length, 0);
  const activeTasks = teams.reduce((count, team) => count + team.members.reduce((sum, member) => sum + member.total_active, 0), 0);
  return <div className="page-transition space-y-6">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Team management</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Workload Dashboard</h1><p className="mt-2 text-sm text-slate-500">Balance active work across the teams you oversee.</p></div><div className="flex gap-2"><span className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">{totalMembers} members</span><span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">{activeTasks} active tasks</span></div></div>
    {teams.length === 0 ? <div className="premium-card p-10 text-center text-sm text-slate-500">No teams are assigned to you yet.</div> : teams.map((team) => <section key={team.id} className="premium-card overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div className="flex items-center gap-2"><UsersRound className="h-4 w-4 text-blue-600" /><div><h2 className="text-sm font-semibold text-slate-900">{team.name}</h2><p className="text-[10px] text-slate-500">Live active-work distribution</p></div></div></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Team member</th><th className="px-4 py-3 text-center">Pending</th><th className="px-4 py-3 text-center">In progress</th><th className="px-4 py-3 text-center">Overdue</th><th className="px-4 py-3 text-center">Total active</th><th className="px-5 py-3">Assigned tasks</th></tr></thead><tbody className="divide-y divide-slate-100">{team.members.map((member) => <tr key={member.id} className="align-top"><td className="px-5 py-4"><p className="text-xs font-semibold text-slate-800">{member.name}</p><p className="mt-0.5 text-[10px] text-slate-400">{member.email}</p></td><td className="px-4 py-4 text-center text-sm font-semibold text-slate-700">{member.pending}</td><td className="px-4 py-4 text-center text-sm font-semibold text-blue-700">{member.in_progress}</td><td className="px-4 py-4 text-center text-sm font-semibold text-rose-600">{member.overdue}</td><td className="px-4 py-4 text-center"><span className={`inline-flex min-w-7 justify-center rounded-full px-2 py-1 text-xs font-bold ${member.total_active >= 8 ? 'bg-rose-50 text-rose-700' : member.total_active <= 1 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{member.total_active}</span></td><td className="px-5 py-3">{member.tasks.length ? <div className="space-y-2">{member.tasks.map((task) => <div key={task.id} className="flex min-w-[330px] items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2"><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-medium text-slate-800">{task.title}</p><p className="mt-0.5 text-[9px] text-slate-400">Due {formatDate(task.due_date)}</p></div><StatusBadge status={task.status} /><select defaultValue="" disabled={reassign.isPending} onChange={(event) => { if (event.target.value) reassign.mutate({ taskId: task.id, assigned_user_id: event.target.value }); }} className="rounded border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-600 outline-none"><option value="">Reassign…</option>{team.members.filter((option) => option.id !== member.id).map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></div>)}</div> : <span className="text-[10px] text-slate-400">No active tasks</span>}</td></tr>)}</tbody></table></div></section>)}
  </div>;
}
