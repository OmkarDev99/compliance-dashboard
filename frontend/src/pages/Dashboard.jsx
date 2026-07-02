import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertCircle, Clock, Calendar, CheckCircle2, ChevronDown, ChevronUp,
  PlusCircle, FileText, ArrowRight, ShieldAlert, Activity, TrendingUp,
  Building2
} from 'lucide-react';
import { getReportsSummary } from '../services/reports';
import { getTasks } from '../services/tasks';
import { DashboardSkeleton } from '../components/Loader';
import TaskCard from '../components/TaskCard';
import TaskDetail from './TaskDetail';
import api from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ─── Animated Counter Hook ──────────────────────────────────────────────────
const useCountUp = (target = 0, duration = 800) => {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;

    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, accentColor, delay = 0, icon: Icon }) => {
  const count = useCountUp(value || 0, 900);

  return (
    <div
      className="bg-white border border-[#E5E7EB] rounded-xl p-5 relative overflow-hidden stat-card group shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Color bar at bottom */}
      <div className={`absolute bottom-0 left-0 right-0 h-[3px] ${accentColor}`} />
      {/* Subtle glow on hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl`}
        style={{ background: `radial-gradient(ellipse at bottom left, ${color}08 0%, transparent 70%)` }} />

      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest block">{label}</span>
          <span className={`text-3xl font-extrabold font-mono mt-2 block ${color} animate-count`}>
            {count.toLocaleString()}
          </span>
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg bg-[#F8FAFC] ${color} opacity-50 group-hover:opacity-80 transition-opacity`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Chart date labels ────────────────────────────────────────────────────────
const getChartDates = () => {
  const labels = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 4);
    labels.push(d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));
  }
  return labels;
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({
    overdue: true,
    due_soon: true,
    upcoming: false,
  });

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: getReportsSummary,
  });

  const { data: tasks, isLoading: isTasksLoading } = useQuery({
    queryKey: ['tasks', { status: 'pending' }],
    queryFn: () => getTasks(),
    staleTime: 30000,
  });

  const { data: auditLogs, isLoading: isLogsLoading } = useQuery({
    queryKey: ['system-audit-logs'],
    queryFn: async () => {
      const res = await api.get('/reports/audit-logs?limit=6');
      return res.data;
    },
  });

  const toggleGroup = (group) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const handleTaskClick = (taskId) => {
    setSelectedTaskId(taskId);
    setDrawerOpen(true);
  };

  if (isSummaryLoading || isTasksLoading || isLogsLoading) {
    return <DashboardSkeleton />;
  }

  const groupedTasks = {
    overdue: tasks?.filter((t) => t.status === 'overdue') || [],
    due_soon: tasks?.filter((t) => t.status === 'due_soon') || [],
    upcoming: tasks?.filter((t) => t.status === 'upcoming') || [],
  };

  const dates = getChartDates();
  const completedTotal = summary?.completed_count || 0;
  const overdueTotal = summary?.overdue_count || 0;

  const chartData = [
    { date: dates[0], completed: Math.max(0, Math.floor(completedTotal * 0.10)), overdue: Math.floor(overdueTotal * 0.6) },
    { date: dates[1], completed: Math.max(0, Math.floor(completedTotal * 0.22)), overdue: Math.floor(overdueTotal * 0.8) },
    { date: dates[2], completed: Math.max(0, Math.floor(completedTotal * 0.40)), overdue: Math.floor(overdueTotal * 0.9) },
    { date: dates[3], completed: Math.max(0, Math.floor(completedTotal * 0.55)), overdue: Math.floor(overdueTotal * 1.0) },
    { date: dates[4], completed: Math.max(0, Math.floor(completedTotal * 0.70)), overdue: Math.floor(overdueTotal * 1.1) },
    { date: dates[5], completed: Math.max(0, Math.floor(completedTotal * 0.85)), overdue: Math.floor(overdueTotal * 1.0) },
    { date: dates[6], completed: completedTotal, overdue: overdueTotal },
  ];

  // Compliance health score
  const total = summary?.total_tasks || 1;
  const healthScore = Math.round(((total - overdueTotal) / total) * 100);

  return (
    <div className="space-y-6 page-transition">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Compliance Feed</h1>
          <p className="text-xs text-[#64748B] mt-0.5">Real-time ROC compliance monitoring and team updates.</p>
        </div>

        {/* Health score pill */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] rounded-xl shadow-sm">
          <TrendingUp className="w-4 h-4 text-[#22C55E]" />
          <span className="text-xs text-[#64748B]">Portfolio Health</span>
          <span className={`text-sm font-extrabold font-mono ml-1 ${
            healthScore >= 80 ? 'text-[#22C55E]' : healthScore >= 50 ? 'text-[#F59E0B]' : 'text-[#EF4444]'
          }`}>{healthScore}%</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Companies"
          value={summary?.total_companies || 0}
          color="text-[#0F172A]"
          accentColor="bg-[#2563EB]"
          icon={Building2}
          delay={0}
        />
        <StatCard
          label="Overdue Tasks"
          value={summary?.overdue_count || 0}
          color="text-[#EF4444]"
          accentColor="bg-[#EF4444]"
          icon={AlertCircle}
          delay={80}
        />
        <StatCard
          label="Due This Week"
          value={summary?.due_soon_count || 0}
          color="text-[#F59E0B]"
          accentColor="bg-[#F59E0B]"
          icon={Clock}
          delay={160}
        />
        <StatCard
          label="Completed"
          value={summary?.completed_count || 0}
          color="text-[#3B82F6]"
          accentColor="bg-[#3B82F6]"
          icon={CheckCircle2}
          delay={240}
        />
      </div>

      {/* Quick Actions bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl px-5 py-3.5 flex flex-wrap gap-4 items-center shadow-sm">
        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Quick Actions:</span>
        <button
          onClick={() => navigate('/clients', { state: { openAddDrawer: true } })}
          className="h-8 px-3.5 border border-[#E5E7EB] hover:bg-[#F1F5F9] hover:border-[#2563EB]/30 rounded-lg text-[#0F172A] text-xs font-medium inline-flex items-center gap-1.5 transition-all"
        >
          <PlusCircle className="w-4 h-4 text-[#2563EB]" />
          Add Client
        </button>
        <button
          onClick={() => navigate('/tasks', { state: { filterStatus: 'overdue' } })}
          className="h-8 px-3.5 border border-[#E5E7EB] hover:bg-[#F1F5F9] hover:border-[#EF4444]/30 rounded-lg text-[#0F172A] text-xs font-medium inline-flex items-center gap-1.5 transition-all"
        >
          <AlertCircle className="w-4 h-4 text-[#EF4444]" />
          View Overdue
        </button>
        <button
          onClick={() => navigate('/reports')}
          className="h-8 px-3.5 border border-[#E5E7EB] hover:bg-[#F1F5F9] hover:border-[#3B82F6]/30 rounded-lg text-[#0F172A] text-xs font-medium inline-flex items-center gap-1.5 transition-all"
        >
          <FileText className="w-4 h-4 text-[#3B82F6]" />
          Generate Report
        </button>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 60% Task Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[#0F172A] text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2563EB]" />
              Obligation Feed
            </h2>
            <Link to="/tasks" className="text-xs text-[#2563EB] hover:underline flex items-center gap-1">
              See all tasks <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {/* OVERDUE FEED */}
            <div className="border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleGroup('overdue')}
                className="w-full px-4 py-3 bg-white flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#EF4444] animate-overdue" />
                  <span className="text-xs font-bold text-[#EF4444] font-mono tracking-wider">
                    OVERDUE ({groupedTasks.overdue.length})
                  </span>
                </div>
                {expandedGroups.overdue ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
              </button>
              {expandedGroups.overdue && (
                <div className="p-3 bg-[#F8FAFC] space-y-2">
                  {groupedTasks.overdue.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#64748B]">✓ No overdue compliance tasks. Great job!</div>
                  ) : (
                    groupedTasks.overdue.slice(0, 5).map((task) => (
                      <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task.id)} />
                    ))
                  )}
                </div>
              )}
            </div>

            {/* DUE SOON FEED */}
            <div className="border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleGroup('due_soon')}
                className="w-full px-4 py-3 bg-white flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                  <span className="text-xs font-bold text-[#F59E0B] font-mono tracking-wider">
                    DUE THIS WEEK ({groupedTasks.due_soon.length})
                  </span>
                </div>
                {expandedGroups.due_soon ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
              </button>
              {expandedGroups.due_soon && (
                <div className="p-3 bg-[#F8FAFC] space-y-2">
                  {groupedTasks.due_soon.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#64748B]">No tasks due in the next 7 days.</div>
                  ) : (
                    groupedTasks.due_soon.slice(0, 5).map((task) => (
                      <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task.id)} />
                    ))
                  )}
                </div>
              )}
            </div>

            {/* UPCOMING FEED */}
            <div className="border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleGroup('upcoming')}
                className="w-full px-4 py-3 bg-white flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
                  <span className="text-xs font-bold text-[#22C55E] font-mono tracking-wider">
                    UPCOMING ({groupedTasks.upcoming.length})
                  </span>
                </div>
                {expandedGroups.upcoming ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
              </button>
              {expandedGroups.upcoming && (
                <div className="p-3 bg-[#F8FAFC] space-y-2">
                  {groupedTasks.upcoming.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#64748B]">No upcoming compliance tasks scheduled.</div>
                  ) : (
                    groupedTasks.upcoming.slice(0, 5).map((task) => (
                      <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task.id)} />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 40% — Charts + Activity */}
        <div className="space-y-6">
          {/* Recharts Compliance activity */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-4 shadow-sm">
            <h2 className="text-[#0F172A] text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#2563EB]" />
              Compliance Activity
            </h2>
            <div className="h-48 w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOverdue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" stroke="#94A3B8" tickLine={false} tick={{ fontSize: 9 }} />
                  <YAxis stroke="#94A3B8" tickLine={false} tick={{ fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '11px' }}
                    labelStyle={{ color: '#0F172A', fontFamily: 'monospace' }}
                    itemStyle={{ color: '#64748B' }}
                  />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="#3B82F6" fillOpacity={1} fill="url(#colorCompleted)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="overdue" name="Overdue" stroke="#EF4444" fillOpacity={1} fill="url(#colorOverdue)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 text-[10px] font-mono">
              <span className="flex items-center gap-1.5 text-[#64748B]">
                <span className="w-2 h-0.5 bg-[#3B82F6] rounded inline-block" /> Completed
              </span>
              <span className="flex items-center gap-1.5 text-[#64748B]">
                <span className="w-2 h-0.5 bg-[#EF4444] rounded inline-block" /> Overdue
              </span>
            </div>
          </div>

          {/* Audit trail */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-3 shadow-sm">
            <h2 className="text-[#0F172A] text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#2563EB]" />
              Activity Log
            </h2>
            <div>
              {auditLogs && auditLogs.length > 0 ? (
                <div className="relative border-l border-[#E5E7EB] ml-2.5 pl-4 space-y-3.5">
                  {auditLogs.map((log) => {
                    const actionLabel = log.action.replace(/_/g, ' ');
                    let dotColor = 'bg-[#E5E7EB]';
                    if (log.action.includes('complete')) dotColor = 'bg-[#22C55E]';
                    else if (log.action.includes('overdue') || log.action.includes('delete')) dotColor = 'bg-[#EF4444]';
                    else if (log.action.includes('generate')) dotColor = 'bg-[#2563EB]';

                    return (
                      <div key={log.id} className="relative group text-xs">
                        <div className={`absolute -left-[21.5px] top-1 w-2.5 h-2.5 rounded-full ${dotColor} border-2 border-white transition-all group-hover:scale-125`} />
                        <div className="flex flex-col space-y-0.5">
                          <p className="text-[#0F172A] font-medium leading-relaxed">
                            <span className="font-semibold">{log.user?.full_name || 'System'}</span>{' '}
                            <span className="text-[#64748B]">{actionLabel}</span>
                            {log.action_metadata?.company_name && (
                              <span className="text-[#64748B] italic"> · {log.action_metadata.company_name}</span>
                            )}
                          </p>
                          <span className="text-[10px] text-[#94A3B8] font-mono">
                            {new Date(log.created_at).toLocaleString('en-IN', {
                              day: '2-digit', month: 'short',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-xs text-[#64748B] py-6">No recent compliance events found.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task detail drawer */}
      <TaskDetail
        taskId={selectedTaskId}
        isOpen={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedTaskId(null); }}
      />
    </div>
  );
};

export default Dashboard;
