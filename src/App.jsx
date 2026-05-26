import React, { useState, useEffect } from 'react';
import RealEstateHero from './pages/RealEstateHero';
import PublicProperties from './pages/PublicProperties';
import Sidebar from './components/Sidebar';
import StatCard from './components/StatCard';
import PropertyTable from './components/PropertyTable';
import AddProperty from './pages/AddProperty';
import Signin from './pages/signin';
import Signup from './pages/signup';
import ManageAgents from './pages/ManageAgents';
import ManageUsers from './pages/ManageUsers';
import AgentProfile from './pages/AgentProfile';
import UserDashboard from './pages/UserDashboard';
import AgentPages from './pages/AgentPages'; 
import AgentDashboard from './pages/AgentDashboard';

import TransactionDashboard from './components/TransactionDashboard';
import MaintenanceVisits from './components/MaintenanceVisits';

import PublicAgents from './pages/PublicAgents';

import {
  Home,
  Shield,
  X,
  Users,
  DollarSign,
  Clock
} from 'lucide-react';

function App() {
  const [view, setView] = useState('hero');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingProperty, setEditingProperty] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState(null);

  const navigateTo = (newView) => {
    setView(newView);
    window.history.pushState({ view: newView }, "", "");
  };

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.view) {
        setView(event.state.view);
      } else {
        setView('hero');
      }
    };
    window.addEventListener('popstate', handlePopState);
    if (!window.history.state) {
      window.history.replaceState({ view: 'hero' }, "", "");
    }
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/properties');
      const data = await response.json();
      setProperties(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error:", error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const deleteProperty = async (id) => {
    if (window.confirm("⚠️ Are you sure?")) {
      const response = await fetch(`http://localhost:5000/api/properties/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setProperties(prev => prev.filter(p => p.id !== id));
      }
    }
  };

  const saveProperty = () => {
    fetchProperties();
    setEditingProperty(null);
    setActiveTab('properties');
  };

  return (
    <div className="h-screen bg-black overflow-y-auto text-white">

      {/* Floating Toggle Admin Button */}
      {view !== 'user-profile' && view !== 'user-dashboard' && (
        <button
          onClick={() => navigateTo(view === 'dashboard' ? 'hero' : 'dashboard')}
          className="fixed bottom-8 right-8 z-[100] flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-full hover:bg-white/20 transition-all shadow-2xl"
        >
          <div className="bg-white p-2 rounded-full text-black">
            {view === 'dashboard' ? <X size={20} /> : <Shield size={20} />}
          </div>
          <span className="font-bold text-[10px] tracking-widest pr-2 uppercase">
            {view === 'dashboard' ? "GO BACK" : "ADMIN PANEL"}
          </span>
        </button>
      )}

      {/* View/Page Routing */}
      {view === 'hero' && <RealEstateHero onNavigate={navigateTo} />}
      {view === 'signin' && <Signin onNavigate={navigateTo} />}
      {view === 'signup' && <Signup onNavigate={navigateTo} />}
      
      {/* Agent Page details Routing */}
      {view === 'agent-details' && (
        <AgentPages onBack={() => navigateTo('hero')} />
      )}

      {/* User Dashboard / Profiles */}
      {(view === 'user-dashboard' || view === 'user-profile') && (
        <UserDashboard onBack={() => navigateTo('hero')} />
      )}

      {/* Public Properties Gallery */}
      {view === 'properties' && (
        <div className="h-full overflow-y-auto">
          <PublicProperties onBack={() => navigateTo('hero')} />
        </div>
      )}

      {/* Public Agents Gallery */}
      {view === 'agents' && <PublicAgents onNavigate={navigateTo} />}

      {/* ADMIN DASHBOARD ROUTING */}
      {view === 'dashboard' && (
        <div className="flex h-full bg-[#050505]">
          <Sidebar onTabChange={setActiveTab} activeTab={activeTab} />
          
          <main className="flex-1 p-12 overflow-y-auto">
            {loading ? (
              <div className="text-xl animate-pulse">Duke ngarkuar...</div>
            ) : (
              <>
                {/* 1. Main Dashboard View (Stat Cards) */}
                {activeTab === 'dashboard' && (
                  <div className="animate-in fade-in duration-500">
                    <h1 className="text-5xl font-black tracking-tighter uppercase mb-10">DASHBOARD</h1>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <StatCard title="Total Properties" value={properties.length} icon={<Home size={24} />} />
                      <StatCard title="Active Agents" value="12" icon={<Users size={24} />} />
                      <StatCard title="Pending Transactions" value="12" icon={<Clock size={24} />} />
                    </div>
                  </div>
                )}

                {/* 2. Properties View (Table & Add/Edit Form) */}
                {activeTab === 'properties' && (
                  <div className="animate-in fade-in duration-500">
                    {!editingProperty ? (
                      <>
                        <div className="flex justify-between items-center mb-10">
                          <h1 className="text-5xl font-black tracking-tighter uppercase">Properties</h1>
                          <button 
                            onClick={() => setEditingProperty('new')}
                            className="bg-white text-black font-bold text-[11px] tracking-widest px-6 py-3 rounded-full uppercase hover:bg-gray-200 transition"
                          >
                            Shto +
                          </button>
                        </div>
                        <PropertyTable 
                          properties={properties} 
                          onDelete={deleteProperty} 
                          onEdit={(prop) => setEditingProperty(prop)} 
                        />
                      </>
                    ) : (
                      <AddProperty 
                        onBack={() => setEditingProperty(null)} 
                        onAdd={saveProperty} 
                        editData={editingProperty !== 'new' ? editingProperty : null}
                      />
                    )}
                  </div>
                )}

                {/* 3. Legacy Add Property Tab support */}
                {activeTab === 'add' && (
                  <AddProperty
                    onBack={() => setActiveTab('properties')}
                    onAdd={saveProperty}
                    editData={editingProperty}
                  />
                )}

                {/* 4. Transactions View */}
                {activeTab === 'transactions' && <TransactionDashboard />}
                
                {/* 5. Maintenance Visits View */}
                {activeTab === 'visits' && <MaintenanceVisits />}

                {/* 6. Agents Management View */}
                {activeTab === 'agents' && (
                  selectedAgentId ? 
                    <AgentProfile agentId={selectedAgentId} onBack={() => setSelectedAgentId(null)} /> : 
                    <ManageAgents onSelectAgent={setSelectedAgentId} onViewProfile={setSelectedAgentId} />
                )}

                {/* 7. Users Management View */}
                {activeTab === 'users' && <ManageUsers />}

                {/* 8. Dedicated Agent Profile Sub-View */}
                {activeTab === 'agent-profile' && (
                  <AgentProfile
                    agentId={selectedAgentId}
                    onBack={() => setActiveTab('agents')}
                  />
                )}
              </>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;