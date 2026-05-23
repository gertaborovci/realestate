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
import { Home, Shield, X } from 'lucide-react';

function App() {
  const [view, setView] = useState('hero');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingProperty, setEditingProperty] = useState(null);
  const [properties, setProperties] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState(null);

  const navigateTo = (newView) => {
    setView(newView);
    window.history.pushState({ view: newView }, "", "");
  };

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.view) setView(event.state.view);
      else setView('hero');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const fetchProperties = () => {
    fetch('http://localhost:5000/api/properties')
      .then(response => response.json())
      .then(data => setProperties(data))
      .catch(error => console.error("Error:", error));
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const deleteProperty = async (id) => {
    if (window.confirm("⚠️ A jeni të sigurt?")) {
      const response = await fetch(`http://localhost:5000/api/properties/${id}`, { method: 'DELETE' });
      if (response.ok) setProperties(prev => prev.filter(p => p.id !== id));
    }
  };

  const saveProperty = () => {
    fetchProperties();
    setEditingProperty(null);
    setActiveTab('properties');
  };

  return (
    <div className="h-screen bg-black overflow-hidden text-white">
      {/* Floating Toggle Admin Button */}
      <button 
        onClick={() => navigateTo(view === 'dashboard' ? 'hero' : 'dashboard')}
        className="fixed bottom-8 right-8 z-[100] flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-full"
      >
        <div className="bg-white p-2 rounded-full text-black">
          {view === 'dashboard' ? <X size={20} /> : <Shield size={20} />}
        </div>
        <span className="font-bold text-[10px] tracking-widest pr-2">
          {view === 'dashboard' ? "KTHEHU" : "ADMIN PANEL"}
        </span>
      </button>

      {/* Pages Routing */}
      {view === 'hero' && <RealEstateHero onNavigate={navigateTo} />}
      {view === 'signin' && <Signin onNavigate={navigateTo} />}
      {view === 'signup' && <Signup onNavigate={navigateTo} />}
      
      {view === 'properties' && (
        <div className="h-full overflow-y-auto">
          <PublicProperties onBack={() => navigateTo('hero')} />
        </div>
      )}

      {view === 'dashboard' && (
        <div className="flex h-full bg-[#050505]">
          <Sidebar onTabChange={setActiveTab} activeTab={activeTab} />
          <main className="flex-1 p-12 overflow-y-auto">
            {activeTab === 'dashboard' && (
              <>
                <h1 className="text-5xl font-bold mb-12">DASHBOARD</h1>
                <StatCard title="Total Prona" value={properties.length} icon={<Home size={20} />} />
              </>
            )}
            {activeTab === 'properties' && (
              <>
                <div className="flex justify-between mb-12">
                  <h1 className="text-5xl font-bold">PRONAT</h1>
                  <button onClick={() => { setEditingProperty(null); setActiveTab('add'); }} className="bg-white text-black px-8 py-4 rounded-full text-xs font-bold hover:bg-gray-200">
                    SHTO +
                  </button>
                </div>
                <PropertyTable properties={properties} onDelete={deleteProperty} onEdit={(p) => { setEditingProperty(p); setActiveTab('add'); }} />
              </>
            )}
            {activeTab === 'add' && (
              <AddProperty onBack={() => setActiveTab('properties')} onAdd={saveProperty} editData={editingProperty} />
            )}
            {activeTab === 'agents' && (
              <ManageAgents onViewProfile={(id) => { setSelectedAgentId(id); setActiveTab('agent-profile'); }} />
            )}
            {activeTab === 'users' && <ManageUsers />}
            {activeTab === 'agent-profile' && (
              <AgentProfile agentId={selectedAgentId} onBack={() => setActiveTab('agents')} />
            )}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;