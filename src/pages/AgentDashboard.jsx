import React, { useState, useEffect } from 'react';
import { Menu, X, Building2 } from 'lucide-react';
import AgentCertifications from './AgentCertifications';
import ContactInquiries from './ContactInquiries';

import AgentVisits from '../components/AgentVisits';
import AgentProperties from '../components/AgentProperties';
import AgentContractsView from '../components/AgentContractsView';
import AgentTransactionsView from '../components/AgentTransactionsView';
import AgentRentalRequests from '../components/AgentRentalRequests';
import AgentQAManager from '../components/AgentQAManager';
import UserSupport from '../components/UserSupport';
import { getCurrentUser } from '../lib/auth';
import { apiFetch, API_BASE } from '../lib/api';

const AgentDashboard = ({ onBack, onNavigate, currentUser, onUserChange }) => {
  const [view, setView] = useState(() => sessionStorage.getItem('kn_agent_view') || 'list');

  // Persist agent panel section across refreshes
  React.useEffect(() => { sessionStorage.setItem('kn_agent_view', view); }, [view]);
  const [agentId,    setAgentId]    = useState(null);
  const [agentProps, setAgentProps] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const agentUser = currentUser || getCurrentUser();

  // Sync latest user data (photo, profile) when the panel opens
  useEffect(() => {
    if (!agentUser?.id) return;
    apiFetch(`/api/users/${agentUser.id}`)
      .then(fresh => { if (fresh && onUserChange) onUserChange(fresh); })
      .catch(() => {});
  }, [agentUser?.id]);

  useEffect(() => {
    if (!agentUser?.id) return;
    apiFetch(`/api/agents/by-user/${agentUser.id}`)
      .then(a => {
        setAgentId(a.id);
        return apiFetch(`/api/properties/agent/${a.id}`);
      })
      .then(props => setAgentProps(Array.isArray(props) ? props : []))
      .catch(() => {});
  }, [agentUser?.id]);

  const navItems = [
    { key: 'list',            label: 'Properties' },
    { key: 'contracts',       label: 'Contracts' },
    { key: 'payments',        label: 'Payments' },
    { key: 'visits',          label: 'Visits' },
    { key: 'certifications',  label: 'Certifications' },
    { key: 'inquiries',       label: 'Contact Inquiries' },
    { key: 'rentals',         label: 'Rental Requests' },
    { key: 'qa',              label: 'Property Q&A' },
    { key: 'support',         label: 'Support' },
  ];

  const handleNav = (key) => { setView(key); setMobileOpen(false); };

  return (
    <div className="flex h-screen bg-[#050505] text-white">

      {/* ── Hamburger (mobile only) ──────────────────────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-[#111] border border-white/10 text-white shadow-lg"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* ── Mobile overlay ───────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <div className={`
        flex flex-col w-64 border-r border-white/10 flex-shrink-0
        h-screen fixed md:static top-0 left-0 z-50 bg-[#050505]
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <Building2 size={20} className="text-white shrink-0" />
            <h1 className="text-lg font-black uppercase italic tracking-tight leading-none">KosovaNest</h1>
          </div>
          <button onClick={() => setMobileOpen(false)} className="md:hidden text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Agent mini-profile */}
        {agentUser && (
          <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 overflow-hidden shrink-0 flex items-center justify-center">
              {agentUser.photo_url ? (
                <img
                  src={agentUser.photo_url.startsWith('http') ? agentUser.photo_url : `${API_BASE}${agentUser.photo_url}`}
                  alt={agentUser.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white/40 text-xs font-black uppercase">
                  {(agentUser.username || 'A')[0]}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-black uppercase tracking-tight truncate">{agentUser.username}</p>
              <p className="text-white/30 text-[10px] font-bold tracking-widest uppercase">Agent</p>
            </div>
          </div>
        )}
        <nav className="flex-1 px-4 pb-8 overflow-y-auto">
          <div className="space-y-1 text-[12px] font-bold uppercase tracking-widest text-white/50">
            {navItems.map(({ key, label }) => (
              <p
                key={key}
                onClick={() => handleNav(key)}
                className={`cursor-pointer px-4 py-3 rounded-xl transition-all ${
                  view === key ? 'text-white font-black bg-white/10' : 'hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </p>
            ))}
          </div>
        </nav>
      </div>

      {/* ── Main panel ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto relative pt-14 md:pt-0">

        {view === 'list' && <AgentProperties />}
        {view === 'contracts' && <AgentContractsView />}
        {view === 'payments' && <AgentTransactionsView />}
        {view === 'visits' && <AgentVisits />}
        {view === 'certifications' && <div className="p-10"><AgentCertifications /></div>}
        {view === 'inquiries' && <div className="p-10"><ContactInquiries /></div>}
        {view === 'rentals'   && <AgentRentalRequests />}
        {view === 'qa' && agentId && (
          <div className="p-10">
            <AgentQAManager agentId={agentId} properties={agentProps} />
          </div>
        )}
        {view === 'qa' && !agentId && (
          <div className="p-10 text-white/30 text-sm">Loading Q&A manager…</div>
        )}
        {view === 'support'   && <div className="p-10"><UserSupport /></div>}

      </div>
    </div>
  );
};

export default AgentDashboard;
