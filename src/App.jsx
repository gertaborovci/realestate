import React, { useState, useEffect, useRef } from 'react';
import RealEstateHero from './pages/RealEstateHero';
import PublicProperties from './pages/PublicProperties';
import PublicAgents from './pages/PublicAgents';
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
  setCurrentUser,
  DASHBOARD_VIEWS,
} from './lib/auth';

import { apiFetch } from './lib/api';

const VIEWS_WITHOUT_NAVBAR = [
  DASHBOARD_VIEWS.admin,
  DASHBOARD_VIEWS.agent,
  'hero',
  'properties',
  'agents',
  'agent-details',
  'user-dashboard',
  'user-profile',
];

function App() {
  const [view, setView] = useState('hero');
  const [selectedAgentId, setSelectedAgentId] = useState(null);

  // ── currentUser as React state so Navbar/components always re-render ──
  const [currentUser, setCurrentUserState] = useState(() => getCurrentUser());

  const updateUser = (user) => {
    setCurrentUser(user);        // persist to localStorage
    setCurrentUserState(user);   // trigger React re-render
  };

  // ── favorites ──
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kn_favorites') || '[]'); } catch { return []; }
  });
  const [initialPropertyId, setInitialPropertyId] = useState(null);
  const favLoadedForUser = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    if (favLoadedForUser.current === currentUser.id) return;
    favLoadedForUser.current = currentUser.id;
    apiFetch(`/api/favorites/${currentUser.id}`)
      .then((data) => { setFavorites(data); localStorage.setItem('kn_favorites', JSON.stringify(data)); })
      .catch(() => {});
  }, [view, currentUser]);

  const toggleFavorite = (property) => {
    setFavorites((prev) => {
      const alreadyFav = prev.some((f) => f.id === property.id);
      const updated = alreadyFav ? prev.filter((f) => f.id !== property.id) : [...prev, property];
      localStorage.setItem('kn_favorites', JSON.stringify(updated));
      if (currentUser) {
        if (alreadyFav) {
          apiFetch('/api/favorites', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: currentUser.id, property_id: property.id }) }).catch(console.error);
        } else {
          apiFetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: currentUser.id, property_id: property.id, property_data: property }) }).catch(console.error);
        }
      }
      return updated;
    });
  };

  const removeFromFavorites = (id) => {
    setFavorites((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      localStorage.setItem('kn_favorites', JSON.stringify(updated));
      if (currentUser) {
        apiFetch('/api/favorites', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: currentUser.id, property_id: id }) }).catch(console.error);
      }
      return updated;
    });
  };

  const handleSignIn = (user) => {
    updateUser(user);
  };

  const handleSignOut = () => {
    favLoadedForUser.current = null;
    setFavorites([]);
    localStorage.removeItem('kn_favorites');
    updateUser(null);
  };

  const viewPropertyDetail = (propertyId) => {
    setInitialPropertyId(propertyId);
    navigateTo('properties');
  };

  const navigateTo = (newView, options = {}) => {
    if (options.agentId != null) setSelectedAgentId(options.agentId);
    setView(newView);
    window.history.pushState({ view: newView }, '', '');
  };

  useEffect(() => {
    const handlePopState = (e) => setView(e.state?.view || 'hero');
    window.addEventListener('popstate', handlePopState);
    if (!window.history.state) window.history.replaceState({ view: 'hero' }, '', '');
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (view === DASHBOARD_VIEWS.admin && !canAccessAdminDashboard()) setView(currentUser ? 'hero' : 'signin');
    if (view === DASHBOARD_VIEWS.agent && !canAccessAgentDashboard())  setView(currentUser ? 'hero' : 'signin');
  }, [view]);

  const showNavbar = !VIEWS_WITHOUT_NAVBAR.includes(view);

  return (
    <div className="h-screen bg-black overflow-hidden text-white relative">

      {showNavbar && (
        <div className="absolute top-0 left-0 w-full z-[999]">
          <Navbar
            onNavigate={navigateTo}
            currentView={view}
            currentUser={currentUser}
            onSignOut={handleSignOut}
          />
        </div>
      )}

      <PanelButtons onNavigate={navigateTo} currentView={view} />

      <div className="h-full w-full overflow-y-auto">

        {view === 'hero' && (
          <RealEstateHero
            onNavigate={navigateTo}
            currentUser={currentUser}
            onSignOut={handleSignOut}
          />
        )}

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

        {view === 'agents' && (
          <PublicAgents onNavigate={navigateTo} onBack={() => navigateTo('hero')} />
        )}

        {view === 'agent-details' && (
          <AgentPages agentId={selectedAgentId} onBack={() => navigateTo('agents')} />
        )}

        {(view === 'user-dashboard' || view === 'user-profile') && (
          <UserDashboard
            onNavigate={navigateTo}
            onBack={() => navigateTo('hero')}
            currentUser={currentUser}
            onUserChange={updateUser}
            onSignOut={handleSignOut}
            favorites={favorites}
            onRemoveFavorite={removeFromFavorites}
            onViewProperty={viewPropertyDetail}
          />
        )}

        {view === DASHBOARD_VIEWS.agent && canAccessAgentDashboard() && (
          <AgentDashboard
            onBack={() => navigateTo('hero')}
            onNavigate={navigateTo}
            currentUser={currentUser}
            onUserChange={updateUser}
          />
        )}

        {view === DASHBOARD_VIEWS.admin && canAccessAdminDashboard() && (
          <AdminDashboard onBack={() => navigateTo('hero')} />
        )}

        {view === 'signin' && <Signin onNavigate={navigateTo} onSignIn={handleSignIn} />}
        {view === 'signup' && <Signup onNavigate={navigateTo} onSignIn={handleSignIn} />}

      </div>
    </div>
  );
}

export default App;
