export const ROLE_MAP = {
  admin: {
    label: 'admin',
    badgeClass: 'bg-amber-500/15 text-amber-500 border border-amber-500/20 font-semibold',
  },
  staff: {
    label: 'staff',
    badgeClass: 'bg-blue-500/15 text-blue-400 border border-blue-500/20 font-semibold',
  },
  partner: {
    label: 'partner',
    badgeClass: 'bg-purple-500/15 text-purple-400 border border-purple-500/20 font-semibold',
  },
};

export const getRoleMeta = (role) => {
  const normalized = (role || '').toLowerCase();
  return ROLE_MAP[normalized] || {
    label: role || '',
    badgeClass: 'bg-neutral-800 text-neutral-400',
  };
};

export const hasPermission = (user, requiredRole) => {
  if (!user) return false;
  if (user.role === 'admin') return true;  // Admin bypass
  if (requiredRole === 'admin') return user.role === 'admin';
  if (requiredRole === 'partner') return user.role === 'partner';
  return true;  // Staff
};
