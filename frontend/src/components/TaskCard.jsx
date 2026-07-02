import React from 'react';
import { ChevronRight, Calendar } from 'lucide-react';
import { getStatusMeta } from '../utils/statusUtils';
import { formatDate, getDeadlineColorClass, getDeadlineLabel } from '../utils/dateUtils';
import StatusBadge from './StatusBadge';

const TaskCard = ({ task, onClick }) => {
  const { indicatorClass } = getStatusMeta(task.status);
  const deadlineColor = getDeadlineColorClass(task.due_date, task.status === 'completed');
  const deadlineLabel = getDeadlineLabel(task.due_date);

  const getInitials = (user) => {
    if (!user) return 'CS';
    if (user.full_name) {
      return user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  const assigned = task.assigned_user || (task.assigned_to_user);

  return (
    <div
      onClick={onClick}
      className="bg-white border border-[#E5E7EB] rounded-lg flex items-stretch overflow-hidden cursor-pointer hover:bg-[#F8FAFC] hover:border-[#2563EB]/30 hover:shadow-md hover:shadow-[#2563EB]/5 transition-all duration-150 group shadow-sm"
    >
      {/* 4px vertical status colored bar */}
      <div className={`w-[4px] ${indicatorClass} shrink-0`} />

      <div className="flex-1 p-4 flex items-center justify-between min-w-0">
        <div className="flex flex-col min-w-0 pr-4">
          <h4 className="text-[#0F172A] text-sm font-semibold truncate group-hover:text-[#2563EB] transition-colors">
            {task.title}
          </h4>
          <span className="text-[#64748B] text-xs truncate mt-0.5">
            {task.company?.name || 'Client Company'}
          </span>
          <div className="flex items-center space-x-2 mt-2 font-mono text-[11px]">
            <Calendar className={`w-3.5 h-3.5 ${deadlineColor}`} />
            <span className={deadlineColor}>{formatDate(task.due_date)}</span>
            {task.status !== 'completed' && (
              <span className="text-[#94A3B8]">({deadlineLabel})</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div
            title={assigned?.full_name || 'Unassigned'}
            className="w-7 h-7 rounded-full bg-[#EFF6FF] border border-[#2563EB]/25 text-[#2563EB] text-[10px] font-bold flex items-center justify-center font-sans uppercase shrink-0"
          >
            {getInitials(assigned)}
          </div>

          <StatusBadge status={task.status} />

          <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#64748B] transition-colors" />
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
