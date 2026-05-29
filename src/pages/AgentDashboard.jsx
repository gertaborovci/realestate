import React, { useState, useRef } from 'react';
import AgentCertifications from './AgentCertifications';
import ContactInquiries from './ContactInquiries';

<<<<<<< HEAD
import AgentVisits from '../components/AgentVisits';
import AgentProperties from '../components/AgentProperties';
import AgentContractsView from '../components/AgentContractsView';
import AgentTransactionsView from '../components/AgentTransactionsView';
=======
import TransactionDashboard from '../components/TransactionDashboard';
import MaintenanceVisits from '../components/MaintenanceVisits';
import { getCurrentUser, setCurrentUser } from '../lib/auth';
import { apiFetch, API_BASE } from '../lib/api';
import { Camera, Trash2, User } from 'lucide-react';
>>>>>>> origin/main

const AgentDashboard = ({ onBack, onNavigate, currentUser, onUserChange }) => {
  const [view, setView] = useState('list');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const agentUser = currentUser || getCurrentUser();

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
<<<<<<< HEAD
            <p onClick={() => setView('profile')} className={`cursor-pointer transition-colors ${view === 'profile' ? 'text-white font-black' : 'hover:text-white'}`}>Profile</p>
            <p onClick={() => setView('list')} className={`cursor-pointer transition-colors ${view === 'list' ? 'text-white font-black' : 'hover:text-white'}`}>Properties</p>
            <p onClick={() => setView('contracts')} className={`cursor-pointer transition-colors ${view === 'contracts' ? 'text-white font-black' : 'hover:text-white'}`}>Contracts</p>
            <p onClick={() => setView('payments')} className={`cursor-pointer transition-colors ${view === 'payments' ? 'text-white font-black' : 'hover:text-white'}`}>Payments</p>
            <p onClick={() => setView('visits')} className={`cursor-pointer transition-colors ${view === 'visits' ? 'text-white font-black' : 'hover:text-white'}`}>Visits</p>
            <p onClick={() => setView('certifications')} className={`cursor-pointer transition-colors ${view === 'certifications' ? 'text-white font-black' : 'hover:text-white'}`}>Certifications</p>
            <p onClick={() => setView('inquiries')} className={`cursor-pointer transition-colors ${view === 'inquiries' ? 'text-white font-black' : 'hover:text-white'}`}>Contact Inquiries</p>
=======
            <p
              onClick={() => setView('list')}
              className={`cursor-pointer transition-colors ${view === 'list' ? 'text-white font-black' : 'hover:text-white'}`}
            >
              Properties
            </p>
            <p
              onClick={() => setView('transactions')}
              className={`cursor-pointer transition-colors ${view === 'transactions' ? 'text-white font-black' : 'hover:text-white'}`}
            >
              Transactions
            </p>
            <p
              onClick={() => setView('visits')}
              className={`cursor-pointer transition-colors ${view === 'visits' ? 'text-white font-black' : 'hover:text-white'}`}
            >
              Visits
            </p>
            <p
              onClick={() => setView('certifications')}
              className={`cursor-pointer transition-colors ${view === 'certifications' ? 'text-white font-black' : 'hover:text-white'}`}
            >
              Certifications
            </p>
            <p
              onClick={() => setView('inquiries')}
              className={`cursor-pointer transition-colors ${view === 'inquiries' ? 'text-white font-black' : 'hover:text-white'}`}
            >
              Contact Inquiries
            </p>
>>>>>>> origin/main
          </div>
        </div>

      </div>

      {/* Main panel */}
      <div className="flex-1 overflow-y-auto relative">

<<<<<<< HEAD
        {view === 'list' && <AgentProperties />}

        {view === 'contracts' && <AgentContractsView />}

        {view === 'payments' && <AgentTransactionsView />}

        {view === 'visits' && (
          <AgentVisits />
        )}

=======
        {view === 'list' && (
          <div className="p-10">
            <h2 className="text-4xl font-extrabold uppercase tracking-tight mb-10">MY PROPERTIES</h2>
            <button
              onClick={() => setView('add')}
              className="bg-white text-black px-8 py-3 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-all"
            >
              + Add Property
            </button>
          </div>
        )}

        {view === 'add' && (
          <div className="fixed inset-0 z-50 bg-[#050505] p-20 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <AddProperty
                onBack={() => setView('list')}
                onAdd={() => setView('list')}
              />
            </div>
          </div>
        )}

        {view === 'transactions' && <TransactionDashboard />}
        {view === 'visits' && <MaintenanceVisits />}
>>>>>>> origin/main
        {view === 'certifications' && <div className="p-10"><AgentCertifications /></div>}
        {view === 'inquiries' && <div className="p-10"><ContactInquiries /></div>}

      </div>
    </div>
  );
};

export default AgentDashboard;
