import React from 'react';
import { Shield, ShieldCheck } from 'lucide-react';
import { canAccessAdminDashboard, canAccessAgentDashboard } from '../lib/auth';

const PanelButtons = ({ onNavigate, currentView }) => {
  const showAdmin = canAccessAdminDashboard() && currentView !== 'dashboard';
  const showAgent = canAccessAgentDashboard() && currentView !== 'agent-dashboard';

  if (!showAdmin && !showAgent) return null;

  return (
    <>
      {showAgent && (
        <button
          type="button"
          onClick={() => onNavigate('agent-dashboard')}
          className="fixed bottom-8 left-8 z-[100] flex items-center gap-3 bg-[#1f1f1f] border border-white/10 px-6 py-3 rounded-full shadow-lg hover:bg-[#2a2a2a] transition-all"
        >
          <div className="bg-white text-black p-1.5 rounded-full">
            <ShieldCheck size={16} />
          </div>
          <span className="font-bold tracking-widest text-[10px] uppercase text-white">
            Agent Panel
          </span>
        </button>
      )}
      {showAdmin && (
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="fixed bottom-8 right-8 z-[100] flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-full"
        >
          <div className="bg-white p-2 rounded-full text-black">
            <Shield size={18} />
          </div>
          <span className="font-bold text-[10px] tracking-widest pr-1 text-white">
            Admin Panel
          </span>
        </button>
      )}
    </>
  );
};

export default PanelButtons;
