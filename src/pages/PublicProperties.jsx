import React, { useState, useEffect, useMemo } from 'react';
import { Search, User, Menu, ArrowLeft, MapPin, DoorOpen, Bath, Maximize, SlidersHorizontal, ChevronDown } from 'lucide-react';

const PublicProperties = ({ onBack }) => {
 
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState('newest');

  const navLinks = [
    { name: 'BUY', active: true },
    { name: 'RENT', active: false },
    { name: 'SELL', active: false },
    { name: 'MORTGAGE', active: false },
    { name: 'AGENTS', active: false }
  ];

  
  useEffect(() => {
    fetch('http://localhost:5000/api/properties')
      .then(response => response.json())
      .then(data => {
        setProperties(data); 
        setLoading(false);  
      })
      .catch(error => {
        console.error("Gabim gjatë marrjes së shtëpive:", error);
        setLoading(false);
      });
  }, []);

  const filteredAndSorted = useMemo(() => {
    if (!Array.isArray(properties)) return [];

    let items = [...properties];
    
    if (searchQuery) {
      items = items.filter(p => 
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortConfig === 'price-low') items.sort((a, b) => Number(a.price) - Number(b.price));
    if (sortConfig === 'price-high') items.sort((a, b) => Number(b.price) - Number(a.price));
    if (sortConfig === 'newest') items.sort((a, b) => b.id - a.id);

    return items;
  }, [properties, sortConfig, searchQuery]);

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Sold': return 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]';
      case 'Rented': return 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]';
      default: return 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]';
    }
  };

 
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center text-white text-2xl font-black tracking-widest uppercase">
        Duke ngarkuar pronat...
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#050505] font-sans overflow-x-hidden pb-20 text-white">
      
      <nav className="fixed top-10 left-1/2 -translate-x-1/2 w-[95%] flex items-center justify-between z-[100]">
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-full px-4 shadow-2xl">
          <div className="p-2 bg-white/20 rounded-full cursor-pointer hover:bg-white/30 transition">
            <User size={18} className="text-white" />
          </div>
          {navLinks.map((item) => (
            <button key={item.name} className={`text-white text-[10px] font-bold tracking-widest px-3 transition-all uppercase ${item.active ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}>
              {item.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-full pl-6 pr-2 shadow-2xl">
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Address or City" 
              className="bg-transparent border-none outline-none text-white text-xs w-64 placeholder:text-white/40 font-medium"
            />
            <Search size={16} className="text-white opacity-70" />
          </div>
          <button className="bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs px-5 py-2 rounded-full transition font-bold uppercase">Login</button>
          <div className="p-2 cursor-pointer text-white"><Menu size={20} /></div>
        </div>
      </nav>

    
      <main className="pt-48 px-12 max-w-[1600px] mx-auto text-left">
        <header className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="space-y-4">
            <button onClick={onBack} className="flex items-center gap-3 text-white/50 hover:text-white transition-all group">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase">Go Back Home</span>
            </button>
            <h1 className="text-6xl font-black tracking-tighter uppercase leading-[0.85]">Featured Properties</h1>
          </div>
          <div className="bg-white/5 border border-white/10 p-5 rounded-[24px] flex items-center gap-4 min-w-[240px]">
            <SlidersHorizontal size={18} className="text-white/40" />
            <div className="flex-1">
              <p className="text-[9px] font-bold text-white/40 tracking-widest uppercase mb-1">Sort results by</p>
              <select value={sortConfig} onChange={(e) => setSortConfig(e.target.value)} className="bg-transparent border-none outline-none text-[11px] font-black tracking-[0.1em] text-white uppercase w-full cursor-pointer appearance-none">
                <option value="newest" className="bg-black">Newest Listed</option>
                <option value="price-low" className="bg-black">Lowest Price</option>
                <option value="price-high" className="bg-black">Highest Price</option>
              </select>
            </div>
            <ChevronDown size={14} className="text-white/20" />
          </div>
        </header>

        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredAndSorted.map((property) => (
            <div key={property.id} className="group relative aspect-[4/5] rounded-[50px] overflow-hidden border border-white/5 transition-all duration-700 hover:border-white/20 shadow-2xl">
              <div className={`absolute top-8 right-8 z-30 px-6 py-2.5 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase ${getStatusBadgeStyle(property.status)}`}>
                {property.status === 'Available' ? 'For Sale' : property.status}
              </div>
              <img src={property.image} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end">
                <div className="p-10 backdrop-blur-3xl bg-black/40 border-t border-white/10">
                  <div className="flex justify-between items-end mb-8">
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black tracking-tight uppercase leading-none">{property.title}</h3>
                      <div className="flex items-center gap-2 text-white/50 text-[11px] font-bold tracking-widest uppercase"><MapPin size={14} className="text-emerald-500" /> {property.location}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black tracking-tighter">${Number(property.price).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
                    <div className="space-y-2 text-center">
                      <p className="text-[9px] font-bold text-white/20 tracking-[0.3em] uppercase">Rooms</p>
                      <div className="flex items-center justify-center gap-2 text-md font-bold"><DoorOpen size={16} className="text-white/40" /> {property.rooms || 0}</div>
                    </div>
                    <div className="space-y-2 text-center border-x border-white/10 px-4">
                      <p className="text-[9px] font-bold text-white/20 tracking-[0.3em] uppercase">Baths</p>
                      <div className="flex items-center justify-center gap-2 text-md font-bold"><Bath size={16} className="text-white/40" /> {property.bathrooms || 0}</div>
                    </div>
                    <div className="space-y-2 text-center">
                      <p className="text-[9px] font-bold text-white/20 tracking-[0.3em] uppercase">Area</p>
                      <div className="flex items-center justify-center gap-2 text-md font-bold italic"><Maximize size={16} className="text-white/40" /> {property.area} <span className="text-[9px] font-normal opacity-40 uppercase">m²</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default PublicProperties;