import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import AgentCertifications from './AgentCertifications';
import ContactInquiries from './ContactInquiries';
import AddProperty from './AddProperty';

import TransactionDashboard from '../components/TransactionDashboard';
import MaintenanceVisits from '../components/MaintenanceVisits';

const AgentProfile = () => {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    licenseId: '',
    photo: null,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setProfile({ ...profile, photo: e.target.files[0] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Duke ruajtur profilin:", profile);
    alert("Profili u përditësua!");
  };

  return (
    <div className="flex flex-col items-center w-full p-10">
      <div className="w-full max-w-2xl text-white">
        <h2 className="text-4xl font-extrabold uppercase tracking-tight mb-10 text-left">EDIT PROFILE</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <input name="firstName" placeholder="Name" onChange={handleInputChange} className="bg-white/5 border border-white/10 p-4 rounded-lg w-full outline-none focus:border-white text-white" />
            <input name="lastName" placeholder="Last Name" onChange={handleInputChange} className="bg-white/5 border border-white/10 p-4 rounded-lg w-full outline-none focus:border-white text-white" />
          </div>
          <input name="email" type="email" placeholder="Email" onChange={handleInputChange} className="bg-white/5 border border-white/10 p-4 rounded-lg w-full outline-none focus:border-white text-white" />
          <input name="licenseId" placeholder="License ID" onChange={handleInputChange} className="bg-white/5 border border-white/10 p-4 rounded-lg w-full outline-none focus:border-white text-white" />
          
          <input name="currentPassword" type="password" placeholder="Current Password" onChange={handleInputChange} className="bg-white/5 border border-white/10 p-4 rounded-lg w-full outline-none focus:border-white text-white" />
          <input name="newPassword" type="password" placeholder="New Password" onChange={handleInputChange} className="bg-white/5 border border-white/10 p-4 rounded-lg w-full outline-none focus:border-white text-white" />
          
          <div className="border border-dashed border-white/20 p-8 text-center rounded-lg hover:border-white transition-colors">
            <label className="cursor-pointer block">
              <span className="text-white/50">Upload Profile Photo</span>
              <input type="file" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          <button type="submit" className="bg-white text-black px-10 py-4 font-bold uppercase tracking-widest text-[12px] rounded-full hover:bg-neutral-200 transition-all">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

const AgentDashboard = ({ onBack }) => {
  const [view, setView] = useState('profile');

  return (
    <div className="flex h-screen bg-[#050505] text-white">
      <div className="w-64 border-r border-white/10 p-10 flex flex-col justify-between">
        <div>
          <h1 className="text-xl font-extrabold uppercase tracking-tight mb-12">FIND HOME</h1>
          <div className="space-y-8 text-[12px] font-bold uppercase tracking-widest text-white/50">
            <p onClick={() => setView('profile')} className={`cursor-pointer transition-colors ${view === 'profile' ? 'text-white font-black' : 'hover:text-white'}`}>Profile</p>
            <p onClick={() => setView('list')} className={`cursor-pointer transition-colors ${view === 'list' ? 'text-white font-black' : 'hover:text-white'}`}>Properties</p>
            <p onClick={() => setView('transactions')} className={`cursor-pointer transition-colors ${view === 'transactions' ? 'text-white font-black' : 'hover:text-white'}`}>Transactions</p>
            <p onClick={() => setView('visits')} className={`cursor-pointer transition-colors ${view === 'visits' ? 'text-white font-black' : 'hover:text-white'}`}>Visits</p>
            <p onClick={() => setView('certifications')} className={`cursor-pointer transition-colors ${view === 'certifications' ? 'text-white font-black' : 'hover:text-white'}`}>Certifications</p>
            <p onClick={() => setView('inquiries')} className={`cursor-pointer transition-colors ${view === 'inquiries' ? 'text-white font-black' : 'hover:text-white'}`}>Contact Inquiries</p>
          </div>
        </div>
        <p className="hover:text-red-500 cursor-pointer text-[12px] font-bold uppercase flex items-center" onClick={onBack}>
          <LogOut size={14} className="mr-2"/> Log Out
        </p>
      </div>

      <div className="flex-1 overflow-y-auto relative">
        
        {view === 'profile' && <AgentProfile />}

        {view === 'list' && (
          <div className="p-10">
            <h2 className="text-4xl font-extrabold uppercase tracking-tight mb-10">MY PROPERTIES</h2>
            <button onClick={() => setView('add')} className="bg-white text-black px-8 py-3 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-all">
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

        {view === 'transactions' && (
          <TransactionDashboard />
        )}

        {view === 'visits' && (
          <MaintenanceVisits />
        )}

        {view === 'certifications' && <div className="p-10"><AgentCertifications /></div>}
        {view === 'inquiries' && <div className="p-10"><ContactInquiries /></div>}
      </div>
    </div>
  );
};

export default AgentDashboard;