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
  
  // 1. State për pronat që vijnë nga Databaza (Nis bosh)
  const [properties, setProperties] = useState([]);

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

  // 2. Funksioni për të marrë të dhënat nga Backend-i (MySQL)
  const fetchProperties = () => {
    fetch('http://localhost:5000/api/properties')
      .then(response => response.json())
      .then(data => setProperties(data))
      .catch(error => console.error("Gabim në marrjen e të dhënave nga backend-i:", error));
  };

  // 3. Thërrasim API-në sapo të hapet aplikacioni
  useEffect(() => {
    fetchProperties();
  }, []);

  // 4. Fshirja e lidhur me MySQL
  const deleteProperty = async (id) => {
    if (window.confirm("⚠️ A jeni të sigurt që doni ta fshini këtë pronë?")) {
      try {
        const response = await fetch(`http://localhost:5000/api/properties/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          // E heqim nga ekrani pa pasur nevojë për refresh të faqes
          setProperties(prev => prev.filter(p => p.id !== id));
        } else {
          console.error("Gabim nga serveri gjatë fshirjes.");
        }
      } catch (error) {
        console.error("Gabim i rrjetit gjatë fshirjes:", error);
      }
    }
  };

  // 5. Rifreskojmë listën kur shtojmë/editojmë nga forma AddProperty
  const saveProperty = () => {
    fetchProperties(); // Rimerr të dhënat e reja nga databaza
    setEditingProperty(null);
    setActiveTab('properties'); // Kthehu automatikisht te tabela
  };

  return (
    <div className="h-screen bg-black overflow-hidden text-white">
      
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

      
      {view === 'hero' && <RealEstateHero onNavigate={navigateTo} />}
      
      {view === 'properties' && (
        <div className="h-full overflow-y-auto">
          {/* Kalojmë funksionin onBack për tu kthyer prapa */}
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
                {/* Numëruesi tani merr numrin real nga databaza */}
                <StatCard title="Total Prona" value={properties.length} icon={<Home size={20} />} />
              </>
            )}
            {activeTab === 'properties' && (
              <>
                <div className="flex justify-between mb-12">
                  <h1 className="text-5xl font-bold">PRONAT</h1>
                  <button onClick={() => { setEditingProperty(null); setActiveTab('add'); }} className="bg-white text-black px-8 py-4 rounded-full text-xs font-bold shadow-lg hover:bg-gray-200 transition-colors">
                    SHTO +
                  </button>
                </div>
                {/* Tabela mbushet me properties nga MySQL */}
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