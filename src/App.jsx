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
import TransactionDashboard from './TransactionDashboard';
import UserDashboard from './pages/UserDashboard';
import AgentPages from './pages/AgentPages'; 

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

      {/* Floating Toggle Admin / Back Button */}
      {view !== 'user-profile' && (
        <button
          onClick={() => navigateTo(view === 'dashboard' ? 'hero' : 'dashboard')}
          className="fixed bottom-8 right-8 z-[100] flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-full"
        >
          <div className="bg-white p-2 rounded-full text-black">
            {view === 'dashboard' ? <X size={20} /> : <Shield size={20} />}
          </div>
          <span className="font-bold text-[10px] tracking-widest pr-2">
            {view === 'dashboard' ? "GO BACK" : "ADMIN PANEL"}
          </span>
        </button>
      )}

      {/* View/Page Routing */}
      {view === 'hero' && (
        <RealEstateHero onNavigate={navigateTo} />
      )}

      {/* Rruga për faqen publike të Agjentëve - Hapet direkt pa kërkuar ID në App.jsx */}
      {view === 'agent-details' && (
        <AgentPages onBack={() => navigateTo('hero')} />
      )}

      {view === 'user-dashboard' && (
        <UserDashboard onBack={() => navigateTo('hero')} />
      )}

      {view === 'signin' && (
        <Signin onNavigate={navigateTo} />
      )}

      {view === 'signup' && (
        <Signup onNavigate={navigateTo} />
      )}

      {view === 'properties' && (
        <div className="h-full overflow-y-auto">
          <PublicProperties onBack={() => navigateTo('hero')} />
        </div>
      )}

      {/* ADMIN DASHBOARD ROUTING */}
      {view === 'dashboard' && (
        <div className="flex h-full bg-[#050505]">
          <Sidebar
            onTabChange={setActiveTab}
            activeTab={activeTab}
          />
          <main className="flex-1 p-12 overflow-y-auto">
            {loading ? (
              <div className="text-xl">Duke ngarkuar...</div>
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <>
                    <h1 className="text-5xl font-bold mb-12">DASHBOARD</h1>
                    <div className="flex flex-wrap gap-6">
                      <StatCard title="Total Properties" value={properties.length} icon={<Home size={20} />} />
                      <StatCard title="Agents" value="12" icon={<Users size={20} />} />
                      <StatCard title="Revenue" value="$120K" icon={<DollarSign size={20} />} />
                      <StatCard title="Pending" value="8" icon={<Clock size={20} />} />
                    </div>
                  </>
                )}

                {activeTab === 'properties' && (
                  <>
                    <div className="flex justify-between mb-12">
                      <h1 className="text-5xl font-bold">PROPERTIES</h1>
                      <button
                        onClick={() => { setEditingProperty(null); setActiveTab('add'); }}
                        className="bg-white text-black px-8 py-4 rounded-full text-xs font-bold hover:bg-gray-200"
                      >
                        ADD NEW +
                      </button>
                    </div>
                    <PropertyTable
                      properties={properties}
                      onDelete={deleteProperty}
                      onEdit={(p) => { setEditingProperty(p); setActiveTab('add'); }}
                    />
                  </>
                )}

                {activeTab === 'add' && (
                  <AddProperty
                    onBack={() => setActiveTab('properties')}
                    onAdd={saveProperty}
                    editData={editingProperty}
                  />
                )}

                {activeTab === 'transactions' && <TransactionDashboard />}

                {activeTab === 'agents' && (
                  <ManageAgents
                    onViewProfile={(id) => {
                      setSelectedAgentId(id);
                      setActiveTab('agent-profile');
                    }}
                  />
                )}

                {activeTab === 'users' && <ManageUsers />}

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