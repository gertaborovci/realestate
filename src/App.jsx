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
import UserDashboard from './pages/UserDashboard'; // <--- SHTO KËTË

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

  // ... (pjesa tjetër e useEffect dhe fetchProperties mbetet e njëjtë)
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

  useEffect(() => {
    fetchProperties();
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

  const deleteProperty = async (id) => {
    if (window.confirm("⚠️ Are you sure?")) {
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

      {/* Floating Toggle Admin Button - Mos e shfaq kur je te profili */}
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
      {view === 'hero' && <RealEstateHero onNavigate={navigateTo} />}
      {view === 'signin' && <Signin onNavigate={navigateTo} />}
      {view === 'signup' && <Signup onNavigate={navigateTo} />}
      
      {/* KETU ESHTE SHTESA PER DASHBOARDIN E PERDORUESIT */}
      {view === 'user-profile' && (
        <UserDashboard onBack={() => navigateTo('hero')} />
      )}

      {view === 'properties' && (
        <div className="h-full overflow-y-auto">
          <PublicProperties onBack={() => navigateTo('hero')} />
        </div>
      )}

      {view === 'dashboard' && (
        <div className="flex h-full bg-[#050505]">
          <Sidebar onTabChange={setActiveTab} activeTab={activeTab} />
          <main className="flex-1 p-12 overflow-y-auto">
            {/* ... (pjesa e brendshme e dashboard-it mbetet e njëjtë) */}
            {loading ? <div className="text-xl">Duke ngarkuar...</div> : (
              <>
                {/* Dashboard logic here... */}
                {activeTab === 'dashboard' && <h1>DASHBOARD</h1>}
                {/* ... shtoni pjesët e tjera siç i keni pasur ... */}
              </>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;