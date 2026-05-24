import React, { useState, useEffect } from 'react';
import { User, Shield, MapPin, Mail, ArrowLeft } from 'lucide-react';

const AgentProfile = ({ agentId, onBack }) => {
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // 1. Lexojmë listën live nga localStorage
    const savedAgents = localStorage.getItem('my_agents_list');
    let foundAgent = null;

    if (savedAgents) {
      const agentsList = JSON.parse(savedAgents);
      // Gjejmë agjentin që përputhet me ID-në e klikuar
      foundAgent = agentsList.find(a => a.id === Number(agentId) || a.id === agentId);
    }

    // 2. Nëse agjenti ekziston në listë, përdorim të dhënat e tij reale
    if (foundAgent) {
      setAgent({
        name: foundAgent.username.toUpperCase(),
        email: `${foundAgent.username.replace(/\s+/g, '.').toLowerCase()}@ubt-uni.net`, // Formatim më i pastër i emailit
        license_number: foundAgent.license_number,
        specialization: foundAgent.specialization,
        zone: foundAgent.zone
      });
    } else {
      // Fallback nëse diçka dështon rastësisht
      setAgent({
        name: 'Filan Fisteku',
        email: 'filan@ubt-uni.net',
        license_number: 'LIC-2026-001',
        specialization: 'Sale',
        zone: 'Prishtinë'
      });
    }

    setLoading(false);
  }, [agentId]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 font-medium tracking-widest text-xs uppercase animate-pulse">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Back Button - Ndryshuar teksti këtu */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold tracking-widest text-gray-500 hover:text-white transition uppercase"
      >
        <ArrowLeft size={16} /> Back to Agents
      </button>

      {/* Profile Card */}
      <div className="bg-[#121212] border border-gray-800 rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row gap-8 items-center">
        <div className="w-24 h-24 bg-white/5 border border-gray-800 rounded-full flex items-center justify-center text-white shrink-0">
          <User size={40} />
        </div>

        <div className="flex-1 space-y-4 text-center md:text-left w-full">
          <div>
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-white">{agent.name}</h1>
              <span className="w-max mx-auto md:mx-0 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase bg-blue-500/15 text-blue-400 border border-blue-500/30">
                Verified Agent
              </span>
            </div>
            <p className="text-gray-500 text-sm flex items-center justify-center md:justify-start gap-1.5 mt-1">
              <Mail size={14} /> {agent.email}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-gray-800/50 text-left">
              <span className="text-[10px] font-bold text-gray-500 tracking-wider block uppercase mb-1">License Number</span>
              <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Shield size={14} className="text-blue-400" /> {agent.license_number}
              </span>
            </div>

            <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-gray-800/50 text-left">
              <span className="text-[10px] font-bold text-gray-500 tracking-wider block uppercase mb-1">Specialization</span>
              <span className="text-sm font-semibold text-white uppercase tracking-wide">{agent.specialization}</span>
            </div>

            <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-gray-800/50 text-left">
              <span className="text-[10px] font-bold text-gray-500 tracking-wider block uppercase mb-1">Assigned Zone</span>
              <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                <MapPin size={14} className="text-red-400" /> {agent.zone}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentProfile;