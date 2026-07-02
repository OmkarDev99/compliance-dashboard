import React from 'react';
import { getStatusMeta } from '../utils/statusUtils';

const StatusBadge = ({ status }) => {
  const { label, badgeClass } = getStatusMeta(status);

  return (
    <span className={`px-2.5 py-1 text-[11px] font-mono rounded-md font-bold tracking-wider inline-flex items-center justify-center ${badgeClass}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
