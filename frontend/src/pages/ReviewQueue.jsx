import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, ShieldCheck, ClipboardCheck, AlertCircle, Clock, CheckSquare } from 'lucide-react';
import { getTasks } from '../services/tasks';
import { getUsers } from '../services/auth';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import TaskDetail from './TaskDetail';
import { formatDate } from '../utils/dateUtils';

const ReviewQueue = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch all tasks waiting for review or in review status
  const { data: tasks, isLoading: isTasksLoading } = useQuery({
    queryKey: ['tasks', 'review-queue'],
    queryFn: () => getTasks({ status: 'waiting_for_review' }),
    staleTime: 10000,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const handleRowClick = (taskId) => {
    setSelectedTaskId(taskId);
    setDrawerOpen(true);
  };

  // Filter tasks based on stage selection and search query
  const filteredTasks = tasks?.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.company?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStage = selectedStage === 'all' || task.current_stage === selectedStage;
    
    return matchesSearch && matchesStage;
  }) || [];

  // Calculate counts for stats
  const leadCount = tasks?.filter((t) => t.current_stage === 'team_lead').length || 0;

  return (
    <div className="space-y-6 page-transition relative pb-20">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Review & Approval Queue</h1>
        <p className="text-xs text-[#64748B] mt-0.5">Approve, reject, or request changes for regulatory filings pending professional sign-off.</p>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 gap-4">
        <div 
          onClick={() => setSelectedStage('team_lead')}
          className={`bg-white border p-4 rounded-lg shadow-sm cursor-pointer hover:border-indigo-400 transition-all ${selectedStage === 'team_lead' ? 'ring-2 ring-indigo-500 border-indigo-400' : 'border-[#E5E7EB]'}`}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Team Lead Review</span>
              <span className="text-2xl font-bold text-slate-800">{leadCount}</span>
            </div>
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center bg-[#F8FAFC] border border-[#E5E7EB] rounded-md px-3 py-2 text-xs focus-within:border-[#2563EB] transition-colors">
            <Search className="w-4 h-4 text-[#64748B] mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search by task title or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-[#0F172A] placeholder-[#94A3B8] outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mr-2 shrink-0">Stage Filter:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { value: 'all', label: 'ALL STAGES' },
                { value: 'team_lead', label: 'TEAM LEAD' }
              ].map((stage) => (
                <button
                  key={stage.value}
                  onClick={() => setSelectedStage(stage.value)}
                  className={`px-3 py-1 text-[10px] font-mono font-bold tracking-wider rounded-md transition-all ${
                    selectedStage === stage.value
                      ? 'bg-slate-800 text-white'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {stage.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Table */}
      {isTasksLoading ? (
        <Loader />
      ) : filteredTasks.length === 0 ? (
        <EmptyState title="No review tasks found" description="All compliance filings are currently fully approved and up to date." />
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[10px] font-bold text-[#64748B] uppercase tracking-wider h-11">
                  <th className="p-4">Obligation Title</th>
                  <th className="p-4">Company</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Current Reviewer Stage</th>
                  <th className="p-4">Assigned To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredTasks.map((task) => {
                  const assigned = users?.find((u) => u.id === task.assigned_to);
                  const stageLabels = {
                    team_lead: 'Team Lead'
                  };

                  return (
                    <tr
                      key={task.id}
                      onClick={() => handleRowClick(task.id)}
                      className="h-12 hover:bg-[#F8FAFC] cursor-pointer transition-all duration-150 group"
                    >
                      <td className="p-4 font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors max-w-xs truncate">
                        {task.title}
                      </td>
                      <td className="p-4 text-[#64748B] font-medium truncate max-w-[150px]">
                        {task.company?.name || 'Client Company'}
                      </td>
                      <td className="p-4 font-mono text-[#475569]">
                        {formatDate(task.due_date)}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono rounded ${
                          task.current_stage === 'team_lead' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                          task.current_stage === 'manager' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {stageLabels[task.current_stage] || 'Executive'}
                        </span>
                      </td>
                      <td className="p-4 text-[#0F172A]">
                        {assigned ? assigned.full_name || assigned.email : 'Unassigned'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      <TaskDetail
        taskId={selectedTaskId}
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTaskId(null);
        }}
      />
    </div>
  );
};

export default ReviewQueue;
