import React, { useState, useEffect, useRef } from 'react';
import { User, Menu, MapPin, Globe, Mail, Phone, ChevronRight, Handshake, ShieldCheck, Landmark, Key, Heart, Users, Building2 } from 'lucide-react';

const RealEstateHero = ({ onNavigate }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef(null);

  // Smart Scroll Detector
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        setIsScrolled(scrollRef.current.scrollTop > 50);
      }
    };
    
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const navLinks = [
    { name: 'HOME', view: 'hero' },
    { name: 'BUY', view: 'properties' },
    { name: 'RENT', view: 'properties' },
    { name: 'SELL', view: 'hero' },
    { name: 'MORTGAGE', view: 'hero' },
    { name: 'AGENTS', view: 'hero' }
  ];

  const popularCities = [
    { name: 'Prishtina', homes: '1,240', img: '/photos/hero_Pristina.avif', fallback: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1000' },
    { name: 'Prizren', homes: '850', img: 'https://images.unsplash.com/photo-1610012759972-e1c27e025f18?q=80&w=1000', fallback: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1000' },
    { name: 'Peja', homes: '430', img: 'https://images.unsplash.com/photo-1601004144365-5b487e6514f7?q=80&w=1000', fallback: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1000' }
  ];

  return (
    <div 
      ref={scrollRef}
      className="h-screen w-full bg-black overflow-y-auto scroll-smooth hide-scrollbar text-white"
    >
      
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 w-full flex items-center justify-between px-12 z-[100] transition-all duration-500 ${
        isScrolled 
          ? 'bg-black/80 backdrop-blur-md border-b border-white/10 py-4 shadow-2xl' 
          : 'bg-transparent py-8'
      }`}>
        
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => onNavigate('hero')}
        >
          <Building2 size={32} className="text-white group-hover:opacity-70 transition-opacity" />
          <div className="flex flex-col">
             <span className="text-white font-black text-2xl tracking-tighter uppercase italic leading-none group-hover:opacity-70 transition-opacity">KosovaNest</span>
             <span className="text-white/80 text-[10px] font-bold tracking-[0.3em] uppercase leading-none mt-1">Real Estate Group</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => (
            <button 
              key={item.name} 
              onClick={() => onNavigate(item.view)}
              className="text-white text-[10px] font-bold tracking-widest uppercase opacity-60 hover:opacity-100 transition-all"
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* Right: User Actions with Profile Navigation */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => onNavigate('user-profile')} 
            className="p-2 cursor-pointer hover:bg-white/10 rounded-full transition"
          >
            <User size={20} className="text-white" />
          </button>
          <button 
            onClick={() => onNavigate('signin')}
            className="bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs px-6 py-2.5 rounded-full transition font-bold uppercase"
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="h-screen w-full relative">
        <div className="h-full w-full bg-cover bg-center relative" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1920')" }}>
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute bottom-32 left-16 md:left-24">
            <h1 className="text-white text-[6vw] font-bold tracking-tighter leading-[0.8] mb-8 uppercase">DREAM HOME</h1>
            <p className="text-white/80 text-[10px] max-w-xl font-semibold tracking-[0.3em] uppercase opacity-80 leading-relaxed">
              KosovaNest is the premier real estate agency in the region, connecting clients with architectural excellence and modern living spaces across Kosovo.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="min-h-screen w-full bg-white text-black p-16 md:p-24 flex items-center">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { title: 'Buy', desc: 'Find your dream home with the most experienced local agents.', btn: 'Browse Homes', icon: <Heart className="text-red-500" /> },
            { title: 'Mortgage', desc: 'Partnering with local banks to deliver the best possible rates.', btn: 'Get Pre-approved', icon: <Landmark className="text-blue-600" /> },
            { title: 'Sell', desc: 'We know how to price and market your property across Kosovo.', btn: 'List Property', icon: <Key className="text-amber-500" /> },
            { title: 'Rent', desc: 'Whether searching for apartments or commercial spaces, we make it easy.', btn: 'Explore Rentals', icon: <MapPin className="text-emerald-500" /> }
          ].map((item) => (
            <div key={item.title} className="bg-[#fcfcfc] p-12 rounded-[50px] flex flex-col items-center text-center space-y-8 hover:shadow-2xl transition-all border border-black/[0.03]">
              <div className="w-24 h-24 bg-white rounded-[30px] flex items-center justify-center shadow-md">{item.icon}</div>
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">{item.title}</h3>
              <button onClick={() => onNavigate('properties')} className="px-10 py-4 border-2 border-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">{item.btn}</button>
            </div>
          ))}
        </div>
      </section>

      {/* Cities Section */}
      <section className="min-h-screen w-full bg-[#050505] p-16 md:p-24 flex flex-col justify-center text-white">
        <div className="max-w-7xl mx-auto w-full">
           <h2 className="text-7xl font-black tracking-tighter uppercase italic mb-20">Popular Cities</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {popularCities.map((city) => (
              <div key={city.name} className="group relative h-[500px] rounded-[40px] overflow-hidden border border-white/5 shadow-2xl">
                <img src={city.img} onError={(e) => e.target.src = city.fallback} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110 opacity-70" alt={city.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-12">
                  <h4 className="text-5xl font-black tracking-tight uppercase italic mb-2">{city.name}</h4>
                  <p className="text-[11px] font-bold text-white/40 tracking-[0.5em] uppercase">{city.homes} Properties</p>
                </div>
              </div>
            ))}
           </div>
        </div>
      </section>
      
      {/* Footer */}
      <section className="w-full bg-[#050505] text-white p-16 md:p-24">
        <div className="max-w-7xl mx-auto text-center border-t border-white/10 pt-16">
           <p className="text-[10px] font-black tracking-[0.6em] uppercase opacity-40">© 2026 KosovaNest. All Rights Reserved.</p>
        </div>
      </section>
    </div>
  );
};

export default RealEstateHero;