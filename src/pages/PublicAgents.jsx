import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Star, Phone, Mail, Building2, User, ArrowLeft, Calendar, Users, Award, ChevronRight, Globe } from 'lucide-react';

const PublicAgents = ({ onNavigate }) => {
  const DEMO_AGENTS = [
    { id: 1, name: "Genc Berisha", city: "Prishtina", rating: 5, phone: "+383 44 123 456", email: "genc@kosovanest.com", deals: 42, joined: "2015", happyClients: 120, category: "Top Prishtina Agents", bio: "Genc specializes in luxury apartments in the heart of Prishtina. With over a decade of experience, he is the go-to expert for premium real estate investments.", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=800" },
    { id: 2, name: "Ermal Krasniqi", city: "Prizren", rating: 4, phone: "+383 49 987 654", email: "ermal@kosovanest.com", deals: 28, joined: "2019", happyClients: 85, category: "The Legacy Advisors", bio: "Ermal understands the historical value of properties. Based in Prizren, he helps clients find homes with character, history, and legacy.", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800" },
    { id: 3, name: "Dafina Hoxha", city: "Peja", rating: 5, phone: "+383 45 333 222", email: "dafina@kosovanest.com", deals: 55, joined: "2012", happyClients: 200, category: "The Legacy Advisors", bio: "Dafina is a powerhouse in the Dukagjini region. Her extensive network and sharp negotiation skills ensure her clients always get the best possible deal.", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800" },
    { id: 4, name: "Luan Gashi", city: "Prishtina", rating: 5, phone: "+383 44 111 000", email: "luan@kosovanest.com", deals: 89, joined: "2010", happyClients: 310, category: "Top Prishtina Agents", bio: "Luan has been with KosovaNest since the beginning. He handles our most exclusive commercial and residential listings in the capital.", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800" },
    { id: 5, name: "Teuta Kelmendi", city: "Gjakova", rating: 4, phone: "+383 49 555 444", email: "teuta@kosovanest.com", deals: 37, joined: "2021", happyClients: 45, category: "Rental Specialists", bio: "Looking for the perfect apartment to lease? Teuta moves fast and knows exactly what is hitting the market before anyone else does.", image: "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?q=80&w=800" },
    { id: 6, name: "Besnik Thaqi", city: "Ferizaj", rating: 4, phone: "+383 45 777 888", email: "besnik@kosovanest.com", deals: 19, joined: "2022", happyClients: 25, category: "Rental Specialists", bio: "Besnik is our rising star in Ferizaj, specializing in quick, seamless residential rentals for young professionals and families.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800" }
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("All");
  const [minRating, setMinRating] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState(null);

  // --- SCROLLING LOGIC ADDED HERE ---
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef(null);
  const pageTopRef = useRef(null);

  useEffect(() => {
    if (selectedAgent && pageTopRef.current) {
      setTimeout(() => pageTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  }, [selectedAgent]);

  useEffect(() => {
    const handleScroll = () => { if (scrollRef.current) setIsScrolled(scrollRef.current.scrollTop > 50); };
    const scrollContainer = scrollRef.current;
    if (scrollContainer) scrollContainer.addEventListener('scroll', handleScroll);
    return () => { if (scrollContainer) scrollContainer.removeEventListener('scroll', handleScroll); };
  }, []);

  const kosovoCities = ["All", "Prishtina", "Prizren", "Peja", "Gjakova", "Mitrovica", "Gjilan", "Ferizaj"];
  const categories = ["Top Prishtina Agents", "The Legacy Advisors", "Rental Specialists"];

  const isActivelyFiltering = searchTerm !== "" || selectedCity !== "All" || minRating !== 0;

  const filteredAgents = DEMO_AGENTS.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = selectedCity === "All" || agent.city === selectedCity;
    const matchesRating = agent.rating >= minRating;
    return matchesSearch && matchesCity && matchesRating;
  });

  const AgentCard = ({ agent }) => (
    <div onClick={() => setSelectedAgent(agent)} className="group cursor-pointer relative bg-[#0a0a0a] rounded-[40px] border border-white/5 overflow-hidden hover:shadow-2xl hover:border-white/20 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full">
      <div className="h-72 w-full overflow-hidden relative grayscale group-hover:grayscale-0 transition-all duration-700">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10" />
        <img src={agent.image} alt={agent.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 z-20 border border-white/10">
          <Star size={14} className="text-yellow-500 fill-yellow-500" />
          <span className="text-xs font-bold">{agent.rating}.0</span>
        </div>
      </div>
      <div className="p-8 relative z-20 -mt-8 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/40 mb-2">{agent.city}</p>
          <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-4">{agent.name}</h3>
        </div>
        <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-4">
          <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase"><span className="text-white text-lg">{agent.deals}</span> deals closed</p>
          <div className="bg-white text-black p-3 rounded-full hover:scale-110 transition-transform">
             <ChevronRight size={16} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    // Changed to h-screen and overflow-y-auto to activate the scroll listener properly
    <div ref={scrollRef} className="h-screen w-full bg-black text-white font-sans overflow-y-auto overflow-x-hidden flex flex-col">
      <div ref={pageTopRef} className="absolute top-0 w-full h-1" />
      
      {/* PERFECTLY MATCHED SHRINKING NAVBAR */}
      <nav className={`fixed top-0 left-0 w-full flex items-center justify-between px-12 z-[100] transition-all duration-500 ${
        isScrolled 
          ? 'bg-black/80 backdrop-blur-md border-b border-white/10 py-4 shadow-2xl' 
          : 'bg-transparent py-8'
      }`}>
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('hero')}>
          <Building2 size={32} className="text-white group-hover:opacity-70 transition-opacity" />
          <div className="flex flex-col">
              <span className="text-white font-black text-2xl tracking-tighter uppercase italic leading-none group-hover:opacity-70 transition-opacity">KosovaNest</span>
              <span className="text-white/80 text-[10px] font-bold tracking-[0.3em] uppercase leading-none mt-1">Real Estate Group</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {['HOME', 'BUY', 'RENT', 'SELL', 'MORTGAGE', 'AGENTS'].map((item) => (
            <button key={item} onClick={() => onNavigate(item === 'AGENTS' ? 'agents' : (item === 'BUY' || item === 'RENT' ? 'properties' : 'hero'))}
              className={`text-[10px] font-bold tracking-widest uppercase transition-all ${item === 'AGENTS' ? 'text-white opacity-100 border-b border-white pb-1' : 'text-white opacity-60 hover:opacity-100'}`}>
              {item}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-6">
          <div className="p-2 cursor-pointer hover:bg-white/10 rounded-full transition" onClick={() => onNavigate('user-profile')}>
            <User size={20} className="text-white" />
          </div>
          <button onClick={() => onNavigate('signin')} className="bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs px-6 py-2.5 rounded-full transition font-bold uppercase">
            Login
          </button>
        </div>
      </nav>

      <div className="flex-1 pt-48 pb-32">
        {selectedAgent ? (
          <div className="max-w-6xl mx-auto px-12 animate-in fade-in slide-in-from-bottom-10 duration-500">
            <button onClick={() => setSelectedAgent(null)} className="flex items-center gap-3 text-[10px] font-black tracking-[0.3em] uppercase text-white/50 hover:text-white transition-colors mb-12">
              <ArrowLeft size={16} /> Back to Directory
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="h-[600px] w-full rounded-[50px] overflow-hidden border border-white/10 relative shadow-2xl">
                <img src={selectedAgent.image} alt={selectedAgent.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-10 left-10">
                  <p className="text-[12px] font-black tracking-[0.4em] uppercase text-white/60 mb-2">{selectedAgent.category}</p>
                  <h1 className="text-6xl font-black uppercase italic tracking-tighter">{selectedAgent.name}</h1>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-12">
                <p className="text-xl text-white/60 leading-relaxed font-medium">{selectedAgent.bio}</p>
                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-white/5 border border-white/10 p-8 rounded-[30px]">
                    <Building2 size={24} className="text-white/40 mb-4" />
                    <h4 className="text-4xl font-black">{selectedAgent.deals}</h4>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mt-1">Properties Sold</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-8 rounded-[30px]">
                    <Calendar size={24} className="text-white/40 mb-4" />
                    <h4 className="text-4xl font-black">{selectedAgent.joined}</h4>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mt-1">Joined KosovaNest</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-8 rounded-[30px]">
                    <Users size={24} className="text-white/40 mb-4" />
                    <h4 className="text-4xl font-black">{selectedAgent.happyClients}+</h4>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mt-1">Happy Clients</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-8 rounded-[30px]">
                    <Award size={24} className="text-white/40 mb-4" />
                    <h4 className="text-4xl font-black">{selectedAgent.rating}.0</h4>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mt-1">Client Rating</p>
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-4 text-white/70"><MapPin size={20} className="text-white/40" /> <span className="font-bold tracking-wide">{selectedAgent.city}, Kosovo</span></div>
                  <div className="flex items-center gap-4 text-white/70"><Phone size={20} className="text-white/40" /> <span className="font-bold tracking-wide">{selectedAgent.phone}</span></div>
                  <div className="flex items-center gap-4 text-white/70"><Mail size={20} className="text-white/40" /> <span className="font-bold tracking-wide">{selectedAgent.email}</span></div>
                </div>
                <button className="bg-white text-black py-6 rounded-full font-black text-[12px] tracking-[0.3em] uppercase hover:bg-gray-200 transition-colors mt-8">
                  Schedule a Consultation
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <section className="px-12 md:px-24 max-w-7xl mx-auto mb-16">
              <h1 className="text-7xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.8] mb-6">Meet Our <br/><span className="text-white/40">Elite Agents</span></h1>
              <p className="text-[11px] font-bold tracking-[0.4em] uppercase text-white/60 max-w-xl leading-loose">The most trusted real estate professionals in Kosovo. Curated for architectural excellence and premium service.</p>
            </section>
            <section className="px-12 md:px-24 max-w-7xl mx-auto mb-20">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[30px] flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="flex items-center bg-black/50 px-6 py-4 rounded-full flex-1 w-full border border-white/5 focus-within:border-white/20 transition-colors">
                  <Search size={18} className="text-white/40 mr-3" />
                  <input type="text" placeholder="Search agent by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-white/30 tracking-wide" />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <MapPin size={18} className="text-white/40" />
                  <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="bg-black border border-white/10 text-white text-xs font-bold uppercase tracking-widest px-6 py-4 rounded-full outline-none focus:border-white/30 cursor-pointer">
                    {kosovoCities.map(city => <option key={city} value={city}>{city === "All" ? "All Cities" : city}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 bg-black/50 p-2 rounded-full border border-white/5">
                  <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase px-3 hidden md:block">Rating:</span>
                  {[0, 3, 4, 5].map(rating => (
                    <button key={rating} onClick={() => setMinRating(rating)} className={`flex items-center gap-1 px-4 py-2 rounded-full text-xs font-bold transition-all ${minRating === rating ? 'bg-white text-black' : 'hover:bg-white/10 text-white/60'}`}>
                      {rating === 0 ? "All" : <>{rating}+ <Star size={12} className={minRating === rating ? "fill-black" : "fill-white/40"} /></>}
                    </button>
                  ))}
                </div>
              </div>
            </section>
            <section className="px-12 md:px-24 max-w-7xl mx-auto">
              {isActivelyFiltering ? (
                filteredAgents.length === 0 ? <div className="text-center py-20 opacity-50 italic text-xl">No agents found matching your criteria.</div> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {filteredAgents.map(agent => <AgentCard key={agent.id} agent={agent} />)}
                  </div>
                )
              ) : (
                <div className="space-y-24">
                  {categories.map(category => {
                    const categoryAgents = DEMO_AGENTS.filter(a => a.category === category);
                    if (categoryAgents.length === 0) return null;
                    return (
                      <div key={category}>
                        <div className="flex items-end justify-between mb-10 border-b border-white/10 pb-6">
                          <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">{category}</h2>
                          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40">{categoryAgents.length} Agents</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                          {categoryAgents.map(agent => <AgentCard key={agent.id} agent={agent} />)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <section className="w-full bg-[#050505] text-white p-16 md:p-24 flex flex-col justify-between mt-auto">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-20 py-10">
          <div className="space-y-10">
            <h2 className="text-6xl font-black tracking-tighter uppercase leading-[0.8]">About Us</h2>
            <p className="text-2xl font-medium tracking-tight leading-relaxed max-w-lg opacity-60">KosovaNest is the leading premium real estate network in Kosovo. We specialize in identifying architectural legacies and providing elite, transparent service to buyers, sellers, and investors across the region.</p>
            <div className="flex gap-10 pt-4"><Globe className="text-white/40 hover:text-white transition-colors cursor-pointer" size={24} /><Mail className="text-white/40 hover:text-white transition-colors cursor-pointer" size={24} /><Phone className="text-white/40 hover:text-white transition-colors cursor-pointer" size={24} /></div>
          </div>
          <div className="grid grid-cols-2 gap-12 pt-4">
            <div className="space-y-8"><h4 className="text-[11px] font-black tracking-[0.4em] uppercase text-white/40">Operations</h4><ul className="space-y-4 text-[13px] font-bold uppercase tracking-widest opacity-80"><li className="hover:opacity-100 hover:text-white cursor-pointer transition-all">Local Market</li><li className="hover:opacity-100 hover:text-white cursor-pointer transition-all">Portfolio</li><li className="hover:opacity-100 hover:text-white cursor-pointer transition-all">Press Room</li></ul></div>
            <div className="space-y-8"><h4 className="text-[11px] font-black tracking-[0.4em] uppercase text-white/40">Legal</h4><ul className="space-y-4 text-[13px] font-bold uppercase tracking-widest opacity-80"><li className="hover:opacity-100 hover:text-white cursor-pointer transition-all">Privacy Policy</li><li className="hover:opacity-100 hover:text-white cursor-pointer transition-all">Terms of Service</li></ul></div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto w-full pt-16 mt-16 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black tracking-[0.6em] uppercase opacity-40"><span>© 2026 KosovaNest. All Rights Reserved.</span><div className="flex gap-8"><span>Premium Properties</span><span>•</span><span>Elite Service</span></div></div>
      </section>
    </div>
  );
};

export default PublicAgents;