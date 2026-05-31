import React, { useState, useEffect, useRef } from 'react';
import { User, Menu, MapPin, Globe, Mail, Phone, ChevronRight, Handshake, ShieldCheck, Landmark, Key, Heart, Users, Building2 } from 'lucide-react';
// E pasaktë (po kërkon te src/pages/pages/...)
// E saktë (po kërkon te src/pages/...)
const RealEstateHero = ({ onNavigate }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef(null);

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
    { name: 'AGENTS', view: 'agent-details' }
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
      
      <section className="min-h-screen w-full bg-white text-black p-16 md:p-24 flex flex-col items-center justify-center">
        <div className="max-w-3xl text-center space-y-8 mb-24">
          <h2 className="text-6xl font-black tracking-tighter uppercase italic leading-[0.9]">Let us narrow the field for you</h2>
          <p className="text-xl font-medium opacity-50 tracking-tight max-w-2xl mx-auto">We connect you with a dedicated team that understands your vision and the unique dynamics of the Kosovar real estate market.</p>
        </div>
        <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-3 gap-20 text-center">
          {[
            { title: 'Dedicated Team', desc: 'Tell us about your needs and a coordinator will help you find the right local agent.', icon: <Users size={40} /> },
            { title: 'Local Expertise', desc: 'Tap into the expertise of top agents from brokerages across Kosovo.', icon: <Handshake size={40} /> },
            { title: 'No Hidden Fees', desc: 'Get connected to an agent in minutes for free. No commitment required.', icon: <ShieldCheck size={40} /> }
          ].map((feature) => (
            <div key={feature.title} className="space-y-8 group">
              <div className="flex justify-center text-black/20 group-hover:text-black transition-colors duration-500">{feature.icon}</div>
               <h4 className="text-2xl font-black uppercase tracking-tight">{feature.title}</h4>
              <p className="text-sm font-medium leading-relaxed opacity-50">{feature.desc}</p>
            </div>
          ))}
        </div>
        <button onClick={() => onNavigate('agent-details')} className="mt-24 bg-black text-white px-14 py-6 rounded-full text-xs font-black tracking-[0.4em] uppercase flex items-center gap-4 hover:scale-105 transition-all shadow-xl">
          Connect with an agent <ChevronRight size={18} />
        </button>
      </section>

      <section className="w-full bg-[#050505] text-white p-16 md:p-24 flex flex-col justify-between">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-20 py-10">
          <div className="space-y-10">
            <h2 className="text-6xl font-black tracking-tighter uppercase leading-[0.8]">About Us</h2>
            <p className="text-2xl font-medium tracking-tight leading-relaxed max-w-lg opacity-60">
              KosovaNest is the leading premium real estate network in Kosovo. We specialize in identifying architectural legacies and providing elite, transparent service to buyers, sellers, and investors across the region.
            </p>
            <div className="flex gap-10 pt-4">
               <Globe className="text-white/40 hover:text-white transition-colors cursor-pointer" size={24} />
               <Mail className="text-white/40 hover:text-white transition-colors cursor-pointer" size={24} />
               <Phone className="text-white/40 hover:text-white transition-colors cursor-pointer" size={24} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-12 pt-4">
            <div className="space-y-8">
              <h4 className="text-[11px] font-black tracking-[0.4em] uppercase text-white/40">Operations</h4>
              <ul className="space-y-4 text-[13px] font-bold uppercase tracking-widest opacity-80">
                <li className="hover:opacity-100 hover:text-white cursor-pointer transition-all">Local Market</li>
                <li className="hover:opacity-100 hover:text-white cursor-pointer transition-all">Portfolio</li>
                <li className="hover:opacity-100 hover:text-white cursor-pointer transition-all">Press Room</li>
              </ul>
            </div>
            <div className="space-y-8">
              <h4 className="text-[11px] font-black tracking-[0.4em] uppercase text-white/40">Legal</h4>
              <ul className="space-y-4 text-[13px] font-bold uppercase tracking-widest opacity-80">
                <li className="hover:opacity-100 hover:text-white cursor-pointer transition-all">Privacy Policy</li>
                <li className="hover:opacity-100 hover:text-white cursor-pointer transition-all">Terms of Service</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto w-full pt-16 mt-16 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black tracking-[0.6em] uppercase opacity-40">
          <span>© 2026 KosovaNest. All Rights Reserved.</span>
          <div className="flex gap-8">
            <span>Premium Properties</span>
            <span>•</span>
            <span>Elite Service</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RealEstateHero;