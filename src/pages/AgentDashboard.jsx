import React, { useState, useRef, useEffect } from 'react';
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
import { Camera, Trash2, User } from 'lucide-react';

const AgentDashboard = ({ onBack, onNavigate, currentUser, onUserChange }) => {
  const [view,      setView]      = useState('list');
  const [uploading, setUploading] = useState(false);
  const [agentId,   setAgentId]   = useState(null);
  const [agentProps,setAgentProps]= useState([]);
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
    } catch (err) { alert(err.message); }
    finally { setUploading(false); }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm('Remove your profile photo?')) return;
    try {
      await apiFetch(`/api/users/${agentUser.id}/photo`, { method: 'DELETE' });
      const updated = { ...agentUser, photo_url: null };
      if (onUserChange) onUserChange(updated);
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/10 p-10 flex flex-col justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-extrabold uppercase tracking-tight mb-12">FIND HOME</h1>
          <div className="space-y-8 text-[12px] font-bold uppercase tracking-widest text-white/50">
            <p onClick={() => setView('profile')} className={`cursor-pointer transition-colors ${view === 'profile' ? 'text-white font-black' : 'hover:text-white'}`}>Profile</p>
            <p onClick={() => setView('list')} className={`cursor-pointer transition-colors ${view === 'list' ? 'text-white font-black' : 'hover:text-white'}`}>Properties</p>
            <p onClick={() => setView('contracts')} className={`cursor-pointer transition-colors ${view === 'contracts' ? 'text-white font-black' : 'hover:text-white'}`}>Contracts</p>
            <p onClick={() => setView('payments')} className={`cursor-pointer transition-colors ${view === 'payments' ? 'text-white font-black' : 'hover:text-white'}`}>Payments</p>
            <p onClick={() => setView('visits')} className={`cursor-pointer transition-colors ${view === 'visits' ? 'text-white font-black' : 'hover:text-white'}`}>Visits</p>
            <p onClick={() => setView('certifications')} className={`cursor-pointer transition-colors ${view === 'certifications' ? 'text-white font-black' : 'hover:text-white'}`}>Certifications</p>
            <p onClick={() => setView('inquiries')} className={`cursor-pointer transition-colors ${view === 'inquiries' ? 'text-white font-black' : 'hover:text-white'}`}>Contact Inquiries</p>
            <p onClick={() => setView('rentals')} className={`cursor-pointer transition-colors ${view === 'rentals' ? 'text-white font-black' : 'hover:text-white'}`}>Rental Requests</p>
            <p onClick={() => setView('qa')} className={`cursor-pointer transition-colors ${view === 'qa' ? 'text-white font-black' : 'hover:text-white'}`}>Property Q&A</p>
            <p onClick={() => setView('support')} className={`cursor-pointer transition-colors ${view === 'support' ? 'text-white font-black' : 'hover:text-white'}`}>Support</p>
          </div>
        </div>

      </div>

      {/* Main panel */}
      <div className="flex-1 overflow-y-auto relative">

        {view === 'list' && <AgentProperties />}
        {view === 'contracts' && <AgentContractsView />}
        {view === 'payments' && <AgentTransactionsView />}
        {view === 'visits' && <AgentVisits />}
        {view === 'certifications' && <div className="p-10"><AgentCertifications /></div>}
        {view === 'inquiries' && <div className="p-10"><ContactInquiries /></div>}
        {view === 'rentals'   && <AgentRentalRequests />}
        {view === 'qa'        && (
          <div className="p-10">
            <AgentQAManager agentId={agentId} properties={agentProps} />
          </div>
        )}
        {view === 'support'   && <div className="p-10"><UserSupport /></div>}

      </div>
    </div>
  );
};

export default AgentDashboard;
