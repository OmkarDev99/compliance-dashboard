import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CheckSquare, Settings, BarChart2, LogOut, ShieldCheck, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRoleMeta } from '../utils/roleUtils';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getInitials = () => {
    if (!user) return 'CS';
    if (user.full_name) {
      return user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/clients', label: 'Clients', icon: Users },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/chat', label: 'Compliance Assistant', icon: MessageCircle },
  ];

  if (user?.role === 'admin') {
    links.push(
      { to: '/admin', label: 'Admin Panel', icon: Settings },
      { to: '/reports', label: 'Reports', icon: BarChart2 }
    );
  } else if (user?.role === 'partner') {
    links.push({ to: '/reports', label: 'Reports', icon: BarChart2 });
  }

  const roleMeta = getRoleMeta(user?.role);

  return (
    <div className="w-[240px] h-screen bg-[#0F172A] border-r border-[#1E293B] flex flex-col fixed left-0 top-0 shrink-0 z-40">
      {/* Logo */}
      <div className="h-14 border-b border-[#1E293B] flex items-center px-5 gap-2.5">
        <div className="w-7 h-7 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-md shadow-[#2563EB]/30 shrink-0">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-white font-mono font-bold text-sm tracking-wider block leading-tight">
            CS DASHBOARD
          </span>
          <span className="text-[#475569] text-[9px] font-mono tracking-wider">ROC COMPLIANCE PLATFORM</span>
        </div>
      </div>

      {/* Nav section label */}
      <div className="px-4 pt-4 pb-1">
        <span className="text-[10px] font-bold text-[#475569] uppercase tracking-widest">Navigation</span>
      </div>

      {/* Nav Links */}
      <div className="flex-1 py-1 px-2 space-y-0.5 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 h-10 rounded-lg text-sm font-medium transition-all duration-150 relative group ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-sm shadow-[#2563EB]/30'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <link.icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[13px]">{link.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Separator */}
      <div className="mx-4 border-t border-[#1E293B]" />

      {/* Bottom Profile Info */}
      <div className="p-3 flex flex-col space-y-2">
        <div className="flex items-center space-x-2.5 px-2 py-2 rounded-lg min-w-0 bg-[#1E293B] border border-[#334155]">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#2563EB]/20 border border-[#2563EB]/40 flex items-center justify-center text-[#60A5FA] text-xs font-bold uppercase shrink-0">
            {getInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate leading-tight">
              {user?.full_name || 'CS Agent'}
            </p>
            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] uppercase font-mono tracking-wider font-bold mt-0.5 ${roleMeta.badgeClass}`}>
              {roleMeta.label}
            </span>
          </div>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 h-8 border border-[#334155] hover:bg-[#EF4444]/10 hover:border-[#EF4444]/30 rounded-lg text-[#64748B] hover:text-[#EF4444] text-xs font-medium transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>

        {/* Version */}
        <div className="text-center">
          <span className="text-[9px] text-[#334155] font-mono">v1.0.0 · MVP Phase 1</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
