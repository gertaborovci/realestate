import React from 'react';
import { Search, User, Menu, MapPin, Globe, Mail, Phone, ChevronRight, Handshake, ShieldCheck, Landmark, Key, Heart, Users } from 'lucide-react';

const RealEstateHero = ({ onNavigate }) => {
  const navLinks = [
    { name: 'BUY', view: 'properties' },
    { name: 'RENT', view: 'properties' },
    { name: 'SELL', view: 'hero' },
    { name: 'MORTGAGE', view: 'hero' },
    { name: 'AGENTS', view: 'hero' }
  ];

  const popularCities = [
    { name: 'London', homes: '1,240', img: '/photos/hero_London.jpg', fallback: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1000' },
    { name: 'Dubai', homes: '850', img: '/photos/hero_Dubai.jpg', fallback: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1000' },
    { name: 'Prishtina', homes: '430', img: '/photos/hero_Pristina.avif' }
  ];

  return (
    <div className="h-screen w-full bg-black overflow-y-scroll snap-y snap-mandatory scroll-smooth hide-scrollbar text-white">
      
      {/* --- STICKY DOUBLE BUBBLE NAVIGATION --- */}
      <nav className="fixed top-10 left-1/2 -translate-x-1/2 w-[95%] flex items-center justify-between z-[100] pointer-events-none">
        
        {/* Left Side Bubble: Nav Links */}
        <div className="pointer-events-auto flex items-center gap-2 bg-white/10 backdrop-blur-x4 border border-white/20 p-2 rounded-full px-4 shadow-5xl">
          <div className="p-2 bg-white/20 rounded-full cursor-pointer hover:bg-white/50 transition">
            <User size={18} className="text-white" />
          </div>
          {navLinks.map((item) => (
            <button 
              key={item.name} 
              onClick={() => onNavigate(item.view)}
              className="text-white text-[10px] font-bold tracking-widest px-3 transition-all uppercase opacity-60 hover:opacity-100"
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* Center Logo */}
        <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 cursor-pointer group" onClick={() => onNavigate('hero')}>
            <span className="text-white font-black text-2xl tracking-tighter uppercase italic leading-none group-hover:opacity-70 transition-opacity drop-shadow-lg">Find Home</span>
        </div>

        {/* Right Side Bubble: Search & Login */}
        <div className="pointer-events-auto flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-full pl-6 pr-2 shadow-2xl">
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Search by Address or City" 
              className="bg-transparent border-none outline-none text-white text-xs w-64 placeholder:text-white/40 font-medium"
            />
            <Search size={16} className="text-white opacity-70" />
          </div>
          <button className="bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs px-5 py-2 rounded-full transition font-bold uppercase">
            Login
          </button>
          <div className="p-2 cursor-pointer text-white">
            <Menu size={20} />
          </div>
        </div>
      </nav>

      {/* --- SECTION 1: HERO --- */}
      <section className="h-screen w-full snap-start relative p-4 pt-0">
        <div className="h-full w-full rounded-[56px] bg-cover bg-center overflow-hidden relative shadow-2xl" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1920')" }}>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute bottom-20 left-16">
            <h1 className="text-white text-[6vw] font-bold tracking-tighter leading-[0.8] mb-8 uppercase">DREAM HOME</h1>
            <p className="text-white/80 text-[10px] max-w-xl font-semibold tracking-[0.3em] uppercase opacity-60">Constant is a global branding agency and venture studio specialised in
designing and growing modern consumer brands. We call that platforms for growth</p>
          </div>
        </div>
      </section>

      {/* --- SECTION 2: SERVICES --- */}
      <section className="min-h-screen w-full snap-start bg-white text-black p-24 flex items-center">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { title: 'Buy', desc: 'Find your dream home with the most experienced agents.', btn: 'Find an agent', icon: <Heart className="text-red-500" /> },
            { title: 'Mortgage', desc: 'Rocket Mortgage delivers award-winning service and rates.', btn: 'Get prequalified', icon: <Landmark className="text-blue-600" /> },
            { title: 'Sell', desc: 'We know how to price and market your home for top dollar.', btn: 'Learn more', icon: <Key className="text-amber-500" /> },
            { title: 'Rent', desc: 'Whether searching for apartments or condos, we make it easy.', btn: 'Explore rentals', icon: <MapPin className="text-emerald-500" /> }
          ].map((item) => (
            <div key={item.title} className="bg-[#fcfcfc] p-12 rounded-[50px] flex flex-col items-center text-center space-y-8 hover:shadow-2xl transition-all border border-black/[0.03]">
              <div className="w-24 h-24 bg-white rounded-[30px] flex items-center justify-center shadow-md">{item.icon}</div>
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">{item.title}</h3>
              <p className="text-sm font-medium leading-relaxed opacity-50 px-2">{item.desc}</p>
              <button onClick={() => onNavigate('properties')} className="px-10 py-4 border-2 border-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">{item.btn}</button>
            </div>
          ))}
        </div>
      </section>

      {/* --- SECTION 3: CITIES --- */}
      <section className="min-h-screen w-full snap-start bg-[#050505] p-24 flex flex-col justify-center text-white">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-end mb-20">
            <h2 className="text-7xl font-black tracking-tighter uppercase italic leading-none">Popular<br/>Cities</h2>
            <button onClick={() => onNavigate('properties')} className="text-[10px] font-black tracking-[0.4em] text-white/60 hover:text-white border-b border-white/20 pb-2 uppercase transition-all">Browse All</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {popularCities.map((city) => (
              <div key={city.name} className="group relative h-[550px] rounded-[64px] overflow-hidden border border-white/5 shadow-2xl">
                <img src={city.img} onError={(e) => e.target.src = city.fallback} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110 opacity-60" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent flex flex-col justify-end p-14">
                  <h4 className="text-5xl font-black tracking-tight uppercase italic mb-2">{city.name}</h4>
                  <p className="text-[11px] font-bold text-white/40 tracking-[0.5em] uppercase">{city.homes} Properties</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 4: AGENTS --- */}
      <section className="min-h-screen w-full snap-start bg-white text-black p-24 flex flex-col items-center justify-center">
        <div className="max-w-3xl text-center space-y-8 mb-24">
          <h2 className="text-6xl font-black tracking-tighter uppercase italic leading-[0.9]">Let us narrow the field for you</h2>
          <p className="text-xl font-medium opacity-50 tracking-tight max-w-2xl mx-auto">We connect you with a dedicated team that understands your vision and your market.</p>
        </div>
        <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-3 gap-20 text-center">
          {[
            { title: 'Dedicated Team', desc: 'Tell us about your needs and a coordinator will help you find the right local agent.', icon: <Users size={40} /> },
            { title: 'Local Expertise', desc: 'Tap into the expertise of tens of thousands of agents from brokerages large and small.', icon: <Handshake size={40} /> },
            { title: 'No Hidden Fees', desc: 'Get connected to an agent in minutes for free. No commitment required.', icon: <ShieldCheck size={40} /> }
          ].map((feature) => (
            <div key={feature.title} className="space-y-8 group">
              <div className="flex justify-center text-black/10 group-hover:text-black/100 transition-colors duration-500">{feature.icon}</div>
              <h4 className="text-2xl font-black uppercase tracking-tight">{feature.title}</h4>
              <p className="text-sm font-medium leading-relaxed opacity-50">{feature.desc}</p>
            </div>
          ))}
        </div>
        <button className="mt-24 bg-black text-white px-14 py-6 rounded-full text-xs font-black tracking-[0.4em] uppercase flex items-center gap-4 hover:scale-105 transition-all shadow-black/20 shadow-2xl">
          Connect with an agent <ChevronRight size={18} />
        </button>
      </section>

      {/* --- SECTION 5: FOOTER --- */}
      <section className="min-h-screen w-full snap-end bg-[#050505] text-white p-24 flex flex-col justify-between rounded-t-[80px]">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-40 py-10">
          <div className="space-y-12">
            <h2 className="text-6xl font-black tracking-tighter uppercase leading-[0.8]">About Us</h2>
            <p className="text-2xl font-medium tracking-tight leading-relaxed max-w-lg opacity-40">
              Find Home International is an elite venture studio specialized in identifying architectural legacies.
            </p>
            <div className="flex gap-12 pt-4">
               <Globe className="text-white/20 hover:text-white transition-colors cursor-pointer" size={24} />
               <Mail className="text-white/20 hover:text-white transition-colors cursor-pointer" size={24} />
               <Phone className="text-white/20 hover:text-white transition-colors cursor-pointer" size={24} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-16">
            <div className="space-y-8">
              <h4 className="text-[11px] font-black tracking-[0.4em] uppercase text-white/20">Operations</h4>
              <ul className="space-y-4 text-[13px] font-bold uppercase tracking-widest">
                <li className="hover:opacity-40 cursor-pointer transition-opacity">Global Market</li>
                <li className="hover:opacity-40 cursor-pointer transition-opacity">Portfolio</li>
                <li className="hover:opacity-40 cursor-pointer transition-opacity">Press Room</li>
              </ul>
            </div>
            <div className="space-y-8">
              <h4 className="text-[11px] font-black tracking-[0.4em] uppercase text-white/20">Legal</h4>
              <ul className="space-y-4 text-[13px] font-bold uppercase tracking-widest">
                <li className="hover:opacity-40 cursor-pointer transition-opacity">Privacy</li>
                <li className="hover:opacity-40 cursor-pointer transition-opacity">Terms</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto w-full pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black tracking-[0.6em] uppercase opacity-20">
          <span>© 2026 Find Home Intl. All Rights Reserved.</span>
          <div className="flex gap-12"><span>Architectural Legacy</span><span>Elite Service</span></div>
        </div>
      </section>
    </div>
  );
};

export default RealEstateHero;