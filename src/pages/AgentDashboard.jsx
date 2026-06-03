import React, { useState, useRef, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import AgentCertifications from './AgentCertifications';
import ContactInquiries from './ContactInquiries';

import AgentVisits from '../components/AgentVisits';
import AgentProperties from '../components/AgentProperties';
import AgentContractsView from '../components/AgentContractsView';
import AgentTransactionsView from '../components/AgentTransactionsView';
import AgentRentalRequests from '../components/AgentRentalRequests';
import AgentQAManager from '../components/AgentQAManager';
import UserSupport from '../components/UserSupport';
import UserProfile from '../components/UserProfile';
import { getCurrentUser } from '../lib/auth';
import { apiFetch, API_BASE } from '../lib/api';
import { Camera, Trash2, User } from 'lucide-react';
import { showAlert, showConfirm } from '../lib/modal';

const AgentDashboard = ({ onBack, onNavigate, currentUser, onUserChange }) => {
  const [view,        setView]        = useState('list');
  const [uploading,   setUploading]   = useState(false);
  const [agentId,     setAgentId]     = useState(null);
  const [agentProps,  setAgentProps]  = useState([]);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const fileInputRef = useRef(null);

  const agentUser = currentUser || getCurrentUser();

  // Resolve agents.id + properties for Q&A manager
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

  const photoSrc = agentUser?.photo_url
    ? (agentUser.photo_url.startsWith('http') ? agentUser.photo_url : `${API_BASE}${agentUser.photo_url}`)
    : null;

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    setUploading(true);
    try {
      const data = await apiFetch(`/api/users/${agentUser.id}/photo`, { method: 'POST', body: formData });
      const updated = { ...agentUser, photo_url: data.photo_url };
      if (onUserChange) onUserChange(updated);
    } catch (err) { await showAlert(err.message, 'error'); }
    finally { setUploading(false); }
  };

  const handleDeletePhoto = async () => {
    if (!await showConfirm('Remove your profile photo?')) return;
    try {
      await apiFetch(`/api/users/${agentUser.id}/photo`, { method: 'DELETE' });
      const updated = { ...agentUser, photo_url: null };
      if (onUserChange) onUserChange(updated);
    } catch (err) { await showAlert(err.message, 'error'); }
  };

  const navItems = [
    { key: 'profile',         label: 'Profile' },
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
        <div className="p-8 flex items-center justify-between">
          <h1 className="text-xl font-extrabold uppercase tracking-tight">FIND HOME</h1>
          <button onClick={() => setMobileOpen(false)} className="md:hidden text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>
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

        {view === 'profile' && (
          <div className="p-10">
            <UserProfile currentUser={agentUser} onUserChange={onUserChange} />
          </div>
        )}
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
