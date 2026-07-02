import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ShieldAlert, FileText, CheckCircle2, ChevronRight, User, MapPin, Hash, Building2, Trash2 } from 'lucide-react';
import { getCompany, getCompanyTasks } from '../services/clients';
import { getUsers } from '../services/auth';
import { useDeleteClientMutation } from '../hooks/useClients';
import Loader, { Skeleton } from '../components/Loader';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import TaskDetail from './TaskDetail';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate } from '../utils/dateUtils';
import api from '../services/api';

const ClientDetail = () => {
  const { id: clientId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: company, isLoading: isCompLoading } = useQuery({
    queryKey: ['company', clientId],
    queryFn: () => getCompany(clientId),
  });

  const { data: tasks, isLoading: isTasksLoading } = useQuery({
    queryKey: ['company-tasks', clientId],
    queryFn: () => getCompanyTasks(clientId),
  });

  const { data: auditLogs, isLoading: isLogsLoading } = useQuery({
    queryKey: ['company-audit-logs', clientId],
    queryFn: async () => {
      const res = await api.get(`/companies/${clientId}/audit-logs`);
      return res.data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const deleteClientMutation = useDeleteClientMutation();

  const handleDelete = () => {
    deleteClientMutation.mutate(clientId, {
      onSuccess: () => navigate('/clients'),
    });
  };

  if (isCompLoading || isTasksLoading || isLogsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 lg:col-span-2" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!company) {
    return <EmptyState title="Company not found" description="The requested company record could not be found." />;
  }

  const summary = company.tasks_summary || { completed: 0, total: 0 };
  const complianceScore = summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 100;

  const radius = 40;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * complianceScore) / 100;

  const assignedUser = users?.find((u) => u.id === company.assigned_to);

  const tabs = ['overview', 'tasks', 'audit_log'];

  return (
    <div className="space-y-6 page-transition">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">{company.name}</h1>
          <p className="text-xs text-[#64748B] mt-0.5">Corporate Identity Number: <span className="font-mono">{company.cin}</span></p>
        </div>
        {company.is_active && (
          <button
            onClick={() => setIsDeleteOpen(true)}
            className="h-8 px-3 border border-[#EF4444]/25 hover:bg-[#EF4444]/8 text-[#EF4444] rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Deactivate
          </button>
        )}
      </div>

      {/* Profile Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start space-x-2.5">
              <Building2 className="w-4 h-4 text-[#64748B] mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Company Type</span>
                <span className="text-xs text-[#0F172A] font-medium uppercase font-mono mt-0.5 block">{company.company_type.replace('_', ' ')}</span>
              </div>
            </div>
            <div className="flex items-start space-x-2.5">
              <User className="w-4 h-4 text-[#64748B] mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Assigned CS</span>
                <span className="text-xs text-[#0F172A] font-medium mt-0.5 block">{assignedUser ? assignedUser.full_name || assignedUser.email : 'Unassigned'}</span>
              </div>
            </div>
            <div className="flex items-start space-x-2.5 col-span-2">
              <MapPin className="w-4 h-4 text-[#64748B] mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Registered Address</span>
                <span className="text-xs text-[#0F172A] mt-0.5 leading-relaxed block">{company.address || 'No address registered.'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ring Chart */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Compliance Score</h3>
            <span className="text-2xl font-bold font-mono text-[#0F172A] block">{complianceScore}%</span>
            <span className="text-[10px] text-[#64748B] block">
              {summary.completed} of {summary.total} tasks completed
            </span>
          </div>

          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} className="stroke-[#F1F5F9]" strokeWidth={strokeWidth} fill="transparent" />
              <circle
                cx="50" cy="50" r={radius}
                className="stroke-[#2563EB] transition-all duration-300"
                strokeWidth={strokeWidth} fill="transparent"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xs font-bold font-mono text-[#0F172A]">{complianceScore}%</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E5E7EB] flex space-x-6 text-sm font-semibold">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 transition-colors capitalize ${
              activeTab === tab
                ? 'border-b-2 border-[#2563EB] text-[#2563EB]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 min-h-[200px] shadow-sm">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wide">Key Dates</h3>
            <div className="border border-[#E5E7EB] rounded-lg overflow-hidden max-w-lg">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <tbody>
                  <tr className="border-b border-[#E5E7EB] h-10">
                    <td className="p-3 bg-[#F8FAFC] font-semibold text-[#64748B] w-1/3">Registration Date</td>
                    <td className="p-3 text-[#0F172A]">{formatDate(company.reg_date)}</td>
                  </tr>
                  <tr className="h-10">
                    <td className="p-3 bg-[#F8FAFC] font-semibold text-[#64748B] w-1/3">Financial Year End</td>
                    <td className="p-3 text-[#0F172A]">{formatDate(company.financial_year_end)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-3">
            {tasks && tasks.length > 0 ? (
              <div className="space-y-2.5">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => { setSelectedTaskId(task.id); setDrawerOpen(true); }}
                    className="p-3.5 bg-[#F8FAFC] border border-[#E5E7EB] hover:bg-white hover:border-[#2563EB]/25 rounded-md cursor-pointer transition-colors flex items-center justify-between group text-xs font-mono"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <span className="text-[#0F172A] font-semibold font-sans block truncate group-hover:text-[#2563EB]">
                        {task.title}
                      </span>
                      <span className="text-[#64748B] text-[10px] mt-1 block">Due: {formatDate(task.due_date)}</span>
                    </div>
                    <div className="flex items-center space-x-3 shrink-0">
                      <StatusBadge status={task.status} />
                      <ChevronRight className="w-4 h-4 text-[#CBD5E1]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No tasks generated" description="There are no compliance obligations associated with this company type." />
            )}
          </div>
        )}

        {activeTab === 'audit_log' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wide">Company Audit Trail</h3>
            {auditLogs && auditLogs.length > 0 ? (
              <div className="relative border-l border-[#E5E7EB] ml-2.5 pl-4 space-y-4 text-xs leading-relaxed">
                {auditLogs.map((log) => (
                  <div key={log.id} className="relative group">
                    <div className="absolute -left-[21.5px] top-1 w-2.5 h-2.5 rounded-full bg-[#E5E7EB] border-2 border-white" />
                    <div>
                      <p className="text-[#0F172A] font-medium">
                        <span className="font-semibold">{log.user?.full_name || 'System'}</span>{' '}
                        {log.action.replace('_', ' ')}
                      </p>
                      <span className="text-[10px] text-[#94A3B8] font-mono">
                        {new Date(log.created_at).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#64748B] italic">No audit trail logged for this company record.</p>
            )}
          </div>
        )}
      </div>

      <TaskDetail taskId={selectedTaskId} isOpen={drawerOpen} onClose={() => { setDrawerOpen(false); setSelectedTaskId(null); }} />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Deactivate Company?"
        description={`Are you sure you want to deactivate ${company.name}? This will change the status to inactive.`}
        confirmLabel="Deactivate"
        isDanger={true}
      />
    </div>
  );
};

export default ClientDetail;
