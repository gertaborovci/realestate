import React, { useState, useEffect } from 'react';
import RealEstateHero from './pages/RealEstateHero';
import PublicProperties from './pages/PublicProperties';
import Sidebar from './components/Sidebar';
import StatCard from './components/StatCard';
import PropertyTable from './components/PropertyTable';
import AddProperty from './pages/AddProperty';
import { Home, Users, DollarSign, Clock, Shield, X } from 'lucide-react';

function App() {
  const [view, setView] = useState('hero');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingProperty, setEditingProperty] = useState(null);

  // --- 1. LOGJIKA PËR HISTORINË E BROWSER-IT ---
  
  // Ky funksion bën dy gjëra: ndryshon faqen dhe i thotë browser-it ta mbajë mend
  const navigateTo = (newView) => {
    setView(newView);
    window.history.pushState({ view: newView }, "", "");
  };

  // Ky useEffect dëgjon kur ti klikon butonin "Back" të browser-it
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.view) {
        setView(event.state.view);
      } else {
        setView('hero'); // Kthehu në fillim nëse nuk ka histori
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Regjistrojmë faqen e parë (Hero) në histori sapo hapet faqja
    if (!window.history.state) {
      window.history.replaceState({ view: 'hero' }, "", "");
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // --- FUNDI I LOGJIKËS SË NAVIGIMIT ---

  const [properties, setProperties] = useState(() => {
    try {
      const saved = localStorage.getItem('my_properties');
      return saved ? JSON.parse(saved) : [
        { id: 1, title: "Modern Villa", price: "450000", status: "Available", type: "BUY", location: "Prishtinë", image: "/photos/property1.jpg", beds: 5, baths: 3, area: 350 }
      ];
    } catch (e) {
      console.error("LocalStorage error:", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('my_properties', JSON.stringify(properties));
  }, [properties]);

  const deleteProperty = (id) => {
    if (window.confirm("⚠️ A jeni të sigurt?")) {
      setProperties(prev => prev.filter(p => p.id !== id));
    }
  };

  const saveProperty = (formData) => {
    if (editingProperty) {
      setProperties(prev => prev.map(p => p.id === editingProperty.id ? { ...formData, id: p.id } : p));
    } else {
      setProperties(prev => [{ ...formData, id: Date.now(), status: "Available" }, ...prev]);
    }
    setEditingProperty(null);
    setActiveTab('properties'); 
  };

  return (
    <div className="h-screen bg-black overflow-hidden text-white">
      {/* Admin Button - TANI PËRDOR navigateTo */}
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

      {/* Faqet kryesore - TANI PËRDORIN navigateTo */}
      {view === 'hero' && <RealEstateHero onNavigate={navigateTo} />}
      
      {view === 'properties' && (
        <div className="h-full overflow-y-auto">
          <PublicProperties properties={properties} onBack={() => navigateTo('hero')} />
        </div>
      )}

      {view === 'dashboard' && (
        <div className="flex h-full bg-[#050505]">
          <Sidebar onTabChange={setActiveTab} activeTab={activeTab} />
          <main className="flex-1 p-12 overflow-y-auto">
            {activeTab === 'dashboard' && (
              <>
                <h1 className="text-5xl font-bold mb-12">DASHBOARD</h1>
                <StatCard title="Total" value={properties.length} icon={<Home size={20} />} />
              </>
            )}
            {activeTab === 'properties' && (
              <>
                <div className="flex justify-between mb-12">
                  <h1 className="text-5xl font-bold">PRONAT</h1>
                  <button onClick={() => { setEditingProperty(null); setActiveTab('add'); }} className="bg-white text-black px-8 py-4 rounded-full text-xs font-bold">SHTO +</button>
                </div>
                <PropertyTable properties={properties} onDelete={deleteProperty} onEdit={(p) => { setEditingProperty(p); setActiveTab('add'); }} />
              </>
            )}
            {activeTab === 'add' && (
              <AddProperty onBack={() => setActiveTab('properties')} onAdd={saveProperty} editData={editingProperty} />
            )}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;