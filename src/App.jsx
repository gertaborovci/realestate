import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';

// Eagerly loaded — needed immediately on first visit
import RealEstateHero from './pages/RealEstateHero';
import Signin from './pages/signin';
import Signup from './pages/signup';
import Navbar from './components/Navbar';
import PanelButtons from './components/PanelButtons';
import ErrorBoundary from './components/ErrorBoundary';

// Lazily loaded — only fetched when the user navigates to them
const PublicProperties   = lazy(() => import('./pages/PublicProperties'));
const PublicAgents       = lazy(() => import('./pages/PublicAgents'));
const PublicNeighborhoods= lazy(() => import('./pages/PublicNeighborhoods'));
const UserDashboard      = lazy(() => import('./pages/UserDashboard'));
const AgentPages         = lazy(() => import('./pages/AgentPages'));
const AgentDashboard     = lazy(() => import('./pages/AgentDashboard'));
const AdminDashboard     = lazy(() => import('./pages/AdminDashboard'));

// Fallback shown while a lazy page is loading
const PageLoader = () => (
  <div className="h-screen w-full bg-black flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
  </div>
);

import {
  canAccessAdminDashboard,
  canAccessAgentDashboard,
  getCurrentUser,
  setCurrentUser,
  setAuthToken,
  setRefreshToken,
  DASHBOARD_VIEWS,
} from './lib/auth';

import { apiFetch } from './lib/api';

const VIEWS_WITHOUT_NAVBAR = [
  DASHBOARD_VIEWS.admin,
  DASHBOARD_VIEWS.agent,
  'hero',
  'properties',
  'agents',
  'neighborhoods',
  'agent-details',
  'user-dashboard',
  'user-profile',
];

function App() {
  const [view, setView] = useState(() => sessionStorage.getItem('kn_view') || 'hero');
  const [viewHistory, setViewHistory] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('kn_history') || '[]'); } catch { return []; }
  });
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
  const [initialPropertyId,  setInitialPropertyId]  = useState(null);
  const [initialCityFilter,  setInitialCityFilter]  = useState('');
  const [initialHomeType,      setInitialHomeType]      = useState('');
  const [initialFilterType,    setInitialFilterType]    = useState('');
  const [initialAgentFilters,  setInitialAgentFilters]  = useState(null);
  const favLoadedForUser = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    if (favLoadedForUser.current === currentUser.id) return;
    favLoadedForUser.current = currentUser.id;
    apiFetch(`/api/favorites/${currentUser.id}`)
      .then((data) => { setFavorites(data); localStorage.setItem('kn_favorites', JSON.stringify(data)); })
      .catch(() => {});
  }, [currentUser]); // removed `view` — no need to re-fetch favourites on every navigation

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
    sessionStorage.removeItem('kn_view');
    sessionStorage.removeItem('kn_history');
    setViewHistory([]);
    setAuthToken(null);
    setRefreshToken(null);
    updateUser(null);
    // Redirect to hero if on a protected page (agent/admin dashboard)
    // or any page that would render blank without a user
    setView((current) => {
      const protectedViews = [DASHBOARD_VIEWS.admin, DASHBOARD_VIEWS.agent, 'user-dashboard', 'user-profile'];
      return protectedViews.includes(current) ? 'hero' : current;
    });
  };

  const viewPropertyDetail = (propertyId) => {
    setInitialPropertyId(propertyId);
    navigateTo('properties');
  };

  const viewPropertiesInCity = (city) => {
    setInitialCityFilter(city);
    navigateTo('properties');
  };

  // Called by HeroSearch — combines city + keyword into the properties search bar
  const handleHeroSearch = (city, keyword) => {
    const combined = [city, keyword].filter(Boolean).join(' ');
    setInitialCityFilter(combined);
    navigateTo('properties');
  };

  const navigateToPropertiesFiltered = ({ homeType = '', filterType = '', searchQuery = '' } = {}) => {
    setInitialHomeType(homeType);
    setInitialFilterType(filterType);
    setInitialCityFilter(searchQuery);
    navigateTo('properties');
  };

  useEffect(() => { sessionStorage.setItem('kn_view', view); }, [view]);
  useEffect(() => { sessionStorage.setItem('kn_history', JSON.stringify(viewHistory)); }, [viewHistory]);

  // Called by property/agent cards when they open a detail overlay.
  // Pushes the current view onto history so "back" closes the overlay
  // instead of navigating away from the page.
  const pushDetailEntry = () => {
    setViewHistory(prev => [...prev, view]);
    window.history.pushState({ view }, '', '');
  };

  const navigateTo = (newView, options = {}) => {
    if (options.agentId != null) setSelectedAgentId(options.agentId);
    if (options.city != null || options.minRating != null || options.trust != null) {
      setInitialAgentFilters({
        city:      options.city      || '',
        minRating: options.minRating || 0,
        trust:     options.trust     || 'all',
      });
    }
    setViewHistory(prev => [...prev, view]);
    setView(newView);
    window.history.pushState({ view: newView }, '', '');
  };

  const navigateBack = () => {
    setViewHistory(prev => {
      const history = [...prev];
      const previous = history.pop() || 'hero';
      setView(previous);
      window.history.pushState({ view: previous }, '', '');
      return history;
    });
  };

  useEffect(() => {
    const handlePopState = () => navigateBack();
    window.addEventListener('popstate', handlePopState);
    window.history.replaceState({ view }, '', '');
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (view === DASHBOARD_VIEWS.admin && !canAccessAdminDashboard()) setView(currentUser ? 'hero' : 'signin');
    if (view === DASHBOARD_VIEWS.agent && !canAccessAgentDashboard())  setView(currentUser ? 'hero' : 'signin');
  }, [view]);

  const showNavbar = !VIEWS_WITHOUT_NAVBAR.includes(view);

  return (
    <ErrorBoundary>
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

      <PanelButtons onNavigate={navigateTo} onBack={navigateBack} currentView={view} />

      <div className="h-full w-full overflow-y-auto">
        <Suspense fallback={<PageLoader />}>

        {view === 'hero' && (
          <RealEstateHero
            onNavigate={navigateTo}
            currentUser={currentUser}
            onSignOut={handleSignOut}
            onSearch={handleHeroSearch}
            onPropertySearch={navigateToPropertiesFiltered}
          />
        )}

        {view === 'properties' && (
          <PublicProperties
            onNavigate={navigateTo}
            onBack={navigateBack}
            onSignOut={handleSignOut}
            onOpenDetail={pushDetailEntry}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            initialPropertyId={initialPropertyId}
            onPropertyOpened={() => setInitialPropertyId(null)}
            initialCityFilter={initialCityFilter}
            onCityFilterConsumed={() => { setInitialCityFilter(''); setInitialHomeType(''); setInitialFilterType(''); }}
            initialHomeType={initialHomeType}
            initialFilterType={initialFilterType}
          />
        )}

        {view === 'neighborhoods' && (
          <PublicNeighborhoods
            onNavigate={navigateTo}
            onSignOut={handleSignOut}
            onViewPropertiesInCity={viewPropertiesInCity}
          />
        )}

        {view === 'agents' && (
          <PublicAgents
            onNavigate={navigateTo}
            onBack={navigateBack}
            onSignOut={handleSignOut}
            onOpenDetail={pushDetailEntry}
            initialFilters={initialAgentFilters}
            onFiltersConsumed={() => setInitialAgentFilters(null)}
          />
        )}

        {view === 'agent-details' && (
          <AgentPages agentId={selectedAgentId} onBack={() => navigateTo('agents')} />
        )}

        {(view === 'user-dashboard' || view === 'user-profile') && (
          <UserDashboard
            onNavigate={navigateTo}
            onBack={navigateBack}
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
            onBack={navigateBack}
            onNavigate={navigateTo}
            currentUser={currentUser}
            onUserChange={updateUser}
          />
        )}

        {view === DASHBOARD_VIEWS.admin && canAccessAdminDashboard() && (
          <AdminDashboard onBack={navigateBack} />
        )}

        {view === 'signin' && <Signin onNavigate={navigateTo} onSignIn={handleSignIn} />}
        {view === 'signup' && <Signup onNavigate={navigateTo} onSignIn={handleSignIn} />}

        </Suspense>
      </div>
    </div>
    </ErrorBoundary>
  );
}

export default App;