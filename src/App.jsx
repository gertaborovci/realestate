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

const VIEWS_WITHOUT_NAVBAR = [DASHBOARD_VIEWS.admin, DASHBOARD_VIEWS.agent];

function App() {
  const [view, setView] = useState('hero');
  const [selectedAgentId, setSelectedAgentId] = useState(null);

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
          <PublicProperties onNavigate={navigateTo} onBack={() => navigateTo('hero')} />
        )}

        {/* Public Agents Gallery (Shtuar nga shoku i skuadrës) */}
        {view === 'agents' && (
          <PublicAgents onNavigate={navigateTo} onBack={() => navigateTo('hero')} />
        )}

        {view === 'agent-details' && (
          <AgentPages agentId={selectedAgentId} onBack={() => navigateTo('agents')} />
        )}

        {(view === 'user-dashboard' || view === 'user-profile') && (
          <UserDashboard onBack={() => navigateTo('hero')} />
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