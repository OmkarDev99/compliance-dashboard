import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const { user } = useAuth();
  const [workspaceMode, setWorkspaceModeState] = useState('cs');

  useEffect(() => {
    if (user) {
      if (user.role === 'ca') {
        setWorkspaceModeState('ca');
      } else {
        setWorkspaceModeState('cs');
      }
    } else {
      setWorkspaceModeState('cs');
    }
  }, [user]);

  useEffect(() => {
    // Sync initial state to document body class
    document.body.classList.remove('theme-cs', 'theme-ca');
    document.body.classList.add(`theme-${workspaceMode}`);
  }, [workspaceMode]);

  const config = {
    mode: workspaceMode,
    isCS: workspaceMode === 'cs',
    isCA: workspaceMode === 'ca',
    // Theme details
    brandColor: workspaceMode === 'cs' ? 'blue' : 'emerald',
    primaryColorClass: workspaceMode === 'cs' ? 'bg-[#3157D5] hover:bg-[#2749BC]' : 'bg-emerald-600 hover:bg-emerald-700',
    textColorClass: workspaceMode === 'cs' ? 'text-blue-600' : 'text-emerald-600',
    borderColorClass: workspaceMode === 'cs' ? 'border-[#3157D5]' : 'border-emerald-600',
    title: workspaceMode === 'cs' ? 'CS Command' : 'CA Command',
    subtitle: workspaceMode === 'cs' ? 'Compliance workspace' : 'Taxation & Audit Ledger',
  };

  return (
    <WorkspaceContext.Provider value={config}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

export default WorkspaceContext;
