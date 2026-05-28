import React, { useState, useEffect } from 'react';
import RealEstateHero from './pages/RealEstateHero';
import PublicProperties from './pages/PublicProperties';
import PublicAgents from './pages/PublicAgents';
import AddProperty from './pages/AddProperty';
import Signin from './pages/signin';
import Signup from './pages/signup';
import UserDashboard from './pages/UserDashboard';
import AgentPages from './pages/AgentPages';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import PanelButtons from './components/PanelButtons';

import {
  canAccessAdminDashboard,
  canAccessAgentDashboard,
  getCurrentUser,
  DASHBOARD_VIEWS,
} from './lib/auth';

// These views render their own built-in navbar — don't add a second one on top
const VIEWS_WITHOUT_NAVBAR = [
  DASHBOARD_VIEWS.admin,   // 'dashboard'
  DASHBOARD_VIEWS.agent,   // 'agent-dashboard'
  'hero',                  // RealEstateHero has its own nav
  'properties',            // PublicProperties has its own nav
  'agents',                // PublicAgents has its own nav
  'agent-details',         // AgentPages has its own nav
];

function App() {
  const [view, setView] = useState('hero');
  const [selectedAgentId, setSelectedAgentId] = useState(null);

  // --- FAVORITES (persisted in localStorage) ---
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kn_favorites') || '[]'); } catch { return []; }
  });
  const [initialPropertyId, setInitialPropertyId] = useState(null);

  const toggleFavorite = (property) => {
    setFavorites((prev) => {
      const updated = prev.some((f) => f.id === property.id)
        ? prev.filter((f) => f.id !== property.id)
        : [...prev, property];
      localStorage.setItem('kn_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromFavorites = (id) => {
    setFavorites((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      localStorage.setItem('kn_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const viewPropertyDetail = (propertyId) => {
    setInitialPropertyId(propertyId);
    navigateTo('properties');
  };

  const navigateTo = (newView, options = {}) => {
    if (options.agentId != null) {
      setSelectedAgentId(options.agentId);
    }
    setView(newView);
    window.history.pushState({ view: newView }, '', '');
  };

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state?.view) {
        setView(event.state.view);
      } else {
        setView('hero');
      }
    };

    window.addEventListener('popstate', handlePopState);

    if (!window.history.state) {
      window.history.replaceState({ view: 'hero' }, '', '');
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const user = getCurrentUser();

    if (view === DASHBOARD_VIEWS.admin && !canAccessAdminDashboard()) {
      setView(user ? 'hero' : 'signin');
    }
    if (view === DASHBOARD_VIEWS.agent && !canAccessAgentDashboard()) {
      setView(user ? 'hero' : 'signin');
    }
  }, [view]);

  const showNavbar = !VIEWS_WITHOUT_NAVBAR.includes(view);

  return (
    <div className="h-screen bg-black overflow-hidden text-white relative">
      
      {/* NAVBAR NOTUES (S'e prek as Adminin, s'e shtyn as faqen) */}
      {showNavbar && (
        <div className="absolute top-0 left-0 w-full z-[999]">
          <Navbar onNavigate={navigateTo} currentView={view} />
        </div>
      )}

      {/* BUTONI YT I DASHBOARDIT (Siç e kishe) */}
      <PanelButtons onNavigate={navigateTo} currentView={view} />

      {/* PËRMBAJTJA (h-full dhe overflow-y-auto sigurojnë që dashbordet të punojnë) */}
      <div className="h-full w-full overflow-y-auto">
        
        {view === 'hero' && <RealEstateHero onNavigate={navigateTo} />}

        {view === 'properties' && (
          <PublicProperties
            onNavigate={navigateTo}
            onBack={() => navigateTo('hero')}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            initialPropertyId={initialPropertyId}
            onPropertyOpened={() => setInitialPropertyId(null)}
          />
        )}

        {/* Public Agents Gallery (Shtuar nga shoku i skuadrës) */}
        {view === 'agents' && (
          <PublicAgents onNavigate={navigateTo} onBack={() => navigateTo('hero')} />
        )}

        {view === 'agent-details' && (
          <AgentPages agentId={selectedAgentId} onBack={() => navigateTo('agents')} />
        )}

        {(view === 'user-dashboard' || view === 'user-profile') && (
          <UserDashboard
            onBack={() => navigateTo('hero')}
            favorites={favorites}
            onRemoveFavorite={removeFromFavorites}
            onViewProperty={viewPropertyDetail}
          />
        )}

        {view === DASHBOARD_VIEWS.agent && canAccessAgentDashboard() && (
          <AgentDashboard onBack={() => navigateTo('hero')} />
        )}

        {view === DASHBOARD_VIEWS.admin && canAccessAdminDashboard() && (
          <AdminDashboard onBack={() => navigateTo('hero')} />
        )}

        {view === 'signin' && <Signin onNavigate={navigateTo} />}
        {view === 'signup' && <Signup onNavigate={navigateTo} />}

      </div>
    </div>
  );
}

export default App;