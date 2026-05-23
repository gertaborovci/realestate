import React from 'react';
import { Search, User, Menu, MapPin, ChevronRight, Handshake, ShieldCheck, Landmark, Key, Heart, Users } from 'lucide-react';

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
      
      {/* Navigation */}
      <nav className="fixed top-10 left-1/2 -translate-x-1/2 w-[95%] flex items-center justify-between z-[100] pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-full px-4 shadow-5xl">
          <div onClick={() => onNavigate('user-dashboard')} className="p-2 bg-white/20 rounded-full cursor-pointer hover:bg-white/30 transition">
            <User size={18} className="text-white" />
          </div>
          {navLinks.map((item) => (
            <button key={item.name} onClick={() => onNavigate(item.view)} className="text-white text-[10px] font-bold tracking-widest px-3 transition-all uppercase opacity-60 hover:opacity-100">
              {item.name}
            </button>
          ))}
        </div>

        <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 cursor-pointer group" onClick={() => onNavigate('hero')}>
            <span className="text-white font-black text-2xl tracking-tighter uppercase italic leading-none group-hover:opacity-70 transition-opacity drop-shadow-lg">Find Home</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-full pl-6 pr-2 shadow-2xl">
          <input type="text" placeholder="Search by Address or City" className="bg-transparent border-none outline-none text-white text-xs w-64 placeholder:text-white/40 font-medium" />
          <Search size={16} className="text-white opacity-70" />
          <button onClick={() => onNavigate('signin')} className="bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs px-5 py-2 rounded-full transition font-bold uppercase">
            Login
          </button>
          <div className="p-2 cursor-pointer text-white"><Menu size={20} /></div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="h-screen w-full snap-start relative p-4 pt-0">
        <div className="h-full w-full rounded-[56px] bg-cover bg-center overflow-hidden relative shadow-2xl" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1920')" }}>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute bottom-20 left-16">
            <h1 className="text-white text-[6vw] font-bold tracking-tighter leading-[0.8] mb-8 uppercase">DREAM HOME</h1>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="min-h-screen w-full snap-start bg-white text-black p-24 flex items-center">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { title: 'Buy', btn: 'Find an agent', icon: <Heart className="text-red-500" /> },
            { title: 'Mortgage', btn: 'Get prequalified', icon: <Landmark className="text-blue-600" /> },
            { title: 'Sell', btn: 'Learn more', icon: <Key className="text-amber-500" /> },
            { title: 'Rent', btn: 'Explore rentals', icon: <MapPin className="text-emerald-500" /> }
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
      <section className="min-h-screen w-full snap-start bg-[#050505] p-24 flex flex-col justify-center text-white">
        <div className="max-w-7xl mx-auto w-full">
           <h2 className="text-7xl font-black tracking-tighter uppercase italic mb-20">Popular Cities</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {popularCities.map((city) => (
              <div key={city.name} className="group relative h-[550px] rounded-[64px] overflow-hidden border border-white/5 shadow-2xl">
                <img src={city.img} onError={(e) => e.target.src = city.fallback} className="w-full h-full object-cover opacity-60" alt="" />
                <div className="absolute inset-0 p-14 flex flex-col justify-end">
                  <h4 className="text-5xl font-black uppercase italic">{city.name}</h4>
                </div>
              </div>
            ))}
           </div>
        </div>
      </section>

      {/* Let Us Narrow The Field Section */}
      <section className="min-h-screen w-full snap-start bg-white text-black p-24 flex flex-col items-center justify-center">
        <div className="max-w-3xl text-center space-y-8 mb-24">
          <h2 className="text-6xl font-black tracking-tighter uppercase italic">Let us narrow the field for you</h2>
        </div>
        <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-3 gap-20 text-center">
          {[
            { title: 'Dedicated Team', desc: 'Coordinator to help you.', icon: <Users size={40} /> },
            { title: 'Local Expertise', desc: 'Expertise of thousands of agents.', icon: <Handshake size={40} /> },
            { title: 'No Hidden Fees', desc: 'Connect for free.', icon: <ShieldCheck size={40} /> }
          ].map((feature) => (
            <div key={feature.title} className="space-y-8 group">
              <div className="flex justify-center">{feature.icon}</div>
              <h4 className="text-2xl font-black uppercase">{feature.title}</h4>
              <p className="text-sm opacity-50">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <section className="min-h-screen w-full snap-end bg-[#050505] text-white p-24 rounded-t-[80px]">
        <p className="text-center opacity-40">© 2026 Find Home. All rights reserved.</p>
      </section>
    </div>
  );
};

export default RealEstateHero;