import React from 'react';
import { Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

const NotificationPanel = ({ isOpen, onClose, notifications = [] }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 bg-[#1C2128] border border-[#30363D] rounded-lg shadow-2xl z-50 overflow-hidden page-transition">
      <div className="p-3 border-b border-[#30363D] flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[#E6EDF3] flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-[#2D7DD2]" />
          Notifications
        </h4>
        {notifications.length > 0 && (
          <span className="text-[10px] bg-[#2D7DD2]/15 text-[#2D7DD2] px-1.5 py-0.5 rounded-full font-mono font-bold">
            {notifications.length} NEW
          </span>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto divide-y divide-[#21262D]">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-[#8B949E] text-xs">
            No new notifications
          </div>
        ) : (
          notifications.map((n, idx) => {
            let Icon = Info;
            let iconColor = 'text-[#2D7DD2]';
            if (n.type === 'overdue') {
              Icon = AlertTriangle;
              iconColor = 'text-[#F85149]';
            } else if (n.type === 'completed') {
              Icon = CheckCircle;
              iconColor = 'text-[#3FB950]';
            }

            return (
              <div key={idx} className="p-3 hover:bg-[#21262D] transition-colors flex gap-2.5 items-start cursor-pointer">
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#E6EDF3] leading-normal font-medium">{n.message}</p>
                  <span className="text-[10px] text-[#8B949E] block mt-1 font-mono">{formatDate(n.date)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
