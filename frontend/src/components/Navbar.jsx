import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Bell, Search, X, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const Navbar = ({ pageTitle, onSearch }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // Pull live audit logs as notification feed
  const { data: auditLogs } = useQuery({
    queryKey: ['navbar-notifications'],
    queryFn: async () => {
      const res = await api.get('/reports/audit-logs?limit=8');
      return res.data;
    },
    staleTime: 60000,
    refetchInterval: 120000, // Refresh every 2 min
  });

  // Map audit logs to notification shape
  const notifications = (auditLogs || []).map((log) => {
    let type = 'info';
    if (log.action.includes('overdue') || log.action.includes('delete')) type = 'overdue';
    else if (log.action.includes('complete')) type = 'completed';

    const label = (log.action || '').replace(/_/g, ' ');
    const who = log.user?.full_name || 'System';
    const co = log.action_metadata?.company_name ? ` · ${log.action_metadata.company_name}` : '';
    return { type, message: `${who} ${label}${co}`, date: log.created_at };
  });

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter((p) => p);
    if (paths.length === 0) return <span className="text-[#0F172A] font-semibold text-sm">Dashboard</span>;

    return (
      <div className="flex items-center space-x-2 text-xs text-[#64748B]">
        <Link to="/dashboard" className="hover:text-[#0F172A] transition-colors">Home</Link>
        {paths.map((path, idx) => {
          const isLast = idx === paths.length - 1;
          const label = path.charAt(0).toUpperCase() + path.slice(1);
          const to = `/${paths.slice(0, idx + 1).join('/')}`;

          return (
            <React.Fragment key={path}>
              <span className="text-[#94A3B8] font-mono">/</span>
              {isLast ? (
                <span className="text-[#0F172A] font-semibold text-sm">{pageTitle || label}</span>
              ) : (
                <Link to={to} className="hover:text-[#0F172A] transition-colors capitalize">
                  {label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const getInitials = () => {
    if (!user) return 'CS';
    if (user.full_name) {
      return user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  const unreadCount = notifications.filter((n) => n.type === 'overdue').length;

  return (
    <nav className="h-14 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-sm flex items-center justify-between px-6 fixed top-0 right-0 left-[240px] z-30">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center space-x-3">
        {getBreadcrumbs()}
      </div>

      {/* Right: Search, Notifications, Avatar */}
      <div className="flex items-center space-x-3 relative">
        {showSearch ? (
          <div className="flex items-center bg-[#F8FAFC] border border-[#2563EB]/40 rounded-lg px-2.5 py-1 text-sm w-64 page-transition">
            <Search className="w-4 h-4 text-[#64748B] mr-2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="bg-transparent border-none text-[#0F172A] placeholder-[#94A3B8] outline-none w-full text-xs"
              autoFocus
            />
            <button onClick={() => { setShowSearch(false); setSearchQuery(''); if (onSearch) onSearch(''); }}>
              <X className="w-4 h-4 text-[#64748B] hover:text-[#0F172A]" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="p-1.5 hover:bg-[#F1F5F9] rounded-md text-[#64748B] hover:text-[#0F172A] transition-all"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 hover:bg-[#F1F5F9] rounded-md text-[#64748B] hover:text-[#0F172A] transition-all relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#EF4444] rounded-full border border-white animate-overdue" />
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5E7EB] rounded-xl shadow-2xl shadow-[#0F172A]/10 z-50 overflow-hidden page-transition">
                <div className="p-3 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAFC]">
                  <h4 className="text-sm font-semibold text-[#0F172A] flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-[#2563EB]" />
                    Activity Feed
                  </h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-[#EF4444]/10 text-[#EF4444] px-1.5 py-0.5 rounded-full font-mono font-bold">
                      {unreadCount} OVERDUE
                    </span>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-[#F1F5F9]">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-[#64748B] text-xs">
                      <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
                      No recent activity
                    </div>
                  ) : (
                    notifications.map((n, idx) => {
                      let Icon = Info;
                      let iconColor = 'text-[#3B82F6]';
                      if (n.type === 'overdue') { Icon = AlertTriangle; iconColor = 'text-[#EF4444]'; }
                      else if (n.type === 'completed') { Icon = CheckCircle2; iconColor = 'text-[#22C55E]'; }

                      return (
                        <div key={idx} className="p-3 hover:bg-[#F8FAFC] transition-colors flex gap-2.5 items-start cursor-pointer">
                          <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${iconColor}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#0F172A] leading-normal font-medium">{n.message}</p>
                            <span className="text-[10px] text-[#94A3B8] block mt-0.5 font-mono">
                              {new Date(n.date).toLocaleString('en-IN', {
                                day: '2-digit', month: 'short',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#2563EB]/30 text-[#2563EB] text-xs font-bold flex items-center justify-center uppercase select-none cursor-default"
          title={user?.full_name || user?.email}
        >
          {getInitials()}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
