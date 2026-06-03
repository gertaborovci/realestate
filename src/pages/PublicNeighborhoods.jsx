import React, { useState, useEffect, useRef } from 'react';
import {
  Building2, User, MapPin, ShieldCheck, GraduationCap,
  Bus, Search, ChevronRight, Globe, Mail, Phone,
  Home, DoorOpen, Bath,
} from 'lucide-react';
import { apiFetch, API_BASE } from '../lib/api';
import { getCurrentUser, setCurrentUser } from '../lib/auth';
import OfficeLocations from '../components/OfficeLocations';
import NotificationBell from '../components/NotificationBell';

// ─── Fuzzy helpers (mirrored from PublicProperties) ──────────────────────────
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length: m+1}, (_, i) =>
    Array.from({length: n+1}, (_, j) => i===0?j:j===0?i:0)
  );
  for (let i=1;i<=m;i++) for (let j=1;j<=n;j++)
    dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[m][n];
}

function cityMatch(location, target) {
  if (!location || !target) return false;
  const loc = (location.split(',')[0] || location).toLowerCase().trim();
  const tgt = target.toLowerCase().trim();
  if (loc.includes(tgt) || tgt.includes(loc)) return true;
  return levenshtein(loc, tgt) <= 2;
}

// ─── Inline score bar ────────────────────────────────────────────────────────
function ScoreBar({ label, value, icon }) {
  const n = Number(value);
  if (!n) return null;
  const pct   = (n / 10) * 100;
  const color = n >= 8 ? 'bg-green-400' : n >= 5 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/30 shrink-0">{icon}</span>
      <div className="flex-1 min-w-[60px]">
        <div className="flex justify-between mb-0.5">
          <span className="text-[9px] font-black tracking-widest uppercase text-white/30">{label}</span>
          <span className="text-[10px] font-black text-white tabular-nums">{n}</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div className={`${color} h-full rounded-full`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

// ─── Property mini-card (inside neighbourhood row) ───────────────────────────
const HERO_IMG = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1920';

function PropertyMiniCard({ property, mainImages, onClick }) {
  const img = mainImages[property.id] || HERO_IMG;
  return (
    <div
      onClick={() => onClick(property)}
      className="flex-shrink-0 w-48 cursor-pointer group rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition bg-[#0a0a0a]"
    >
      <div className="h-24 overflow-hidden">
        <img
          src={img}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
        />
      </div>
      <div className="p-3">
        <p className="text-white font-bold text-[11px] truncate">{property.title}</p>
        <p className="text-white/40 text-[10px] font-bold mt-0.5">€{Number(property.price).toLocaleString()}</p>
        <div className="flex items-center gap-2 mt-1 text-white/30 text-[9px]">
          <span className="flex items-center gap-0.5"><DoorOpen size={9}/> {property.rooms}</span>
          <span className="flex items-center gap-0.5"><Bath size={9}/> {property.bathrooms}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function PublicNeighborhoods({ onNavigate, onSignOut, onViewPropertiesInCity }) {
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [properties,    setProperties]    = useState([]);
  const [mainImages,    setMainImages]    = useState({});
  const [loading,       setLoading]       = useState(true);
  const [searchTerm,    setSearchTerm]    = useState('');
  const [selectedCity,  setSelectedCity]  = useState('All');
  const [isScrolled,    setIsScrolled]    = useState(false);

  const scrollRef  = useRef(null);

  // Fetch neighbourhoods + properties + images
  useEffect(() => {
    Promise.all([
      apiFetch('/api/neighborhoods'),
      apiFetch('/api/properties?limit=100'),
    ]).then(async ([nbs, props]) => {
      setNeighborhoods(Array.isArray(nbs) ? nbs : []);
      // API now returns { data, total, page, pages } — extract the array
      const validProps = Array.isArray(props) ? props : (Array.isArray(props?.data) ? props.data : []);
      setProperties(validProps);

      // Fetch main images for all properties
      const imgMap = {};
      await Promise.all(validProps.map(async p => {
        try {
          const imgs = await apiFetch(`/api/properties/${p.id}/images`);
          if (imgs?.length) {
            const main = imgs.find(i => i.eshte_kryesore) || imgs[0];
            imgMap[p.id] = main.image_url.startsWith('http')
              ? main.image_url
              : `${API_BASE}${main.image_url}`;
          }
        } catch {}
      }));
      setMainImages(imgMap);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handle = () => setIsScrolled(el.scrollTop > 50);
    el.addEventListener('scroll', handle);
    return () => el.removeEventListener('scroll', handle);
  }, []);

  // Simple fuzzy search for this page
  const fuzzySearch = (text, q) => {
    if (!q) return true;
    if ((text||'').toLowerCase().includes(q.toLowerCase())) return true;
    const words = (text||'').toLowerCase().split(/[\s,]+/);
    const qLow = q.toLowerCase(), maxD = Math.max(1, Math.floor(qLow.length/4));
    return words.some(w => levenshtein(w, qLow) <= maxD);
  };

  const cities   = ['All', ...Array.from(new Set(neighborhoods.map(n => n.city).filter(Boolean))).sort()];
  const filtered = neighborhoods.filter(n => {
    const ok = !searchTerm || fuzzySearch(n.name, searchTerm) || fuzzySearch(n.city, searchTerm);
    const okCity = selectedCity === 'All' || n.city === selectedCity;
    return ok && okCity;
  });

  // Get properties that match a neighbourhood:
  // 1. Exact: property.neighborhood_id === nb.id  (set when adding the property)
  // 2. Fallback: location text mentions the neighbourhood NAME specifically
  //    (NOT the city - too broad; "Prishtina" would match every property in the city)
  const getNeighbourhoodProperties = (nb) =>
    properties.filter(p =>
      (p.neighborhood_id && Number(p.neighborhood_id) === Number(nb.id)) ||
      (!p.neighborhood_id && cityMatch(p.location, nb.name))
    );

  const user = getCurrentUser();
  const handleUserClick = () => {
    if (!user) { onNavigate('signin'); return; }
    onNavigate('user-dashboard');
  };

  return (
    <div ref={scrollRef} className="h-screen w-full bg-black text-white font-sans overflow-y-auto overflow-x-hidden flex flex-col">

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 w-full flex items-center justify-between px-12 z-[100] transition-all duration-500 ${
        isScrolled ? 'bg-black/80 backdrop-blur-md border-b border-white/10 py-4 shadow-2xl' : 'bg-transparent py-8'
      }`}>
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('hero')}>
          <Building2 size={32} className="text-white group-hover:opacity-70 transition-opacity" />
          <div className="flex flex-col">
            <span className="text-white font-black text-2xl tracking-tighter uppercase italic leading-none group-hover:opacity-70 transition-opacity">KosovaNest</span>
            <span className="text-white/80 text-[10px] font-bold tracking-[0.3em] uppercase leading-none mt-1">Real Estate Group</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {[['HOME','hero'],['BUY','properties'],['RENT','properties'],['AGENTS','agents'],['NEIGHBOURHOODS','neighborhoods']].map(([label, view]) => (
            <button key={label} onClick={() => onNavigate(view)}
              className={`text-[10px] font-bold tracking-widest uppercase transition-all ${view==='neighborhoods'?'text-white opacity-100 border-b border-white pb-1':'text-white opacity-60 hover:opacity-100'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {getCurrentUser() && <NotificationBell userId={getCurrentUser().id} onNavigate={onNavigate} />}
          <div className="p-2 cursor-pointer hover:bg-white/10 rounded-full transition" onClick={handleUserClick}>
            <User size={20} className="text-white" />
          </div>
          {getCurrentUser() ? (
            <button onClick={() => onSignOut ? onSignOut() : setCurrentUser(null)}
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs px-6 py-2.5 rounded-full transition font-bold uppercase">
              Sign Out
            </button>
          ) : (
            <button onClick={() => onNavigate('signin')}
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs px-6 py-2.5 rounded-full transition font-bold uppercase">
              Login
            </button>
          )}
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 pt-48 pb-32">

        {/* Hero */}
        <section className="px-12 md:px-24 max-w-7xl mx-auto mb-16">
          <h1 className="text-7xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.8] mb-6">
            Explore <br /><span className="text-white/40">Neighbourhoods</span>
          </h1>
          <p className="text-[11px] font-bold tracking-[0.4em] uppercase text-white/60 max-w-xl leading-loose">
            Discover Kosovo's most sought-after areas — compare safety, schools and transport, and browse available properties.
          </p>
        </section>

        {/* Search + filter */}
        <section className="px-12 md:px-24 max-w-7xl mx-auto mb-12">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-[28px] flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center bg-black/50 px-5 py-3.5 rounded-full flex-1 w-full border border-white/5 focus-within:border-white/20 transition-colors">
              <Search size={16} className="text-white/40 mr-3 shrink-0" />
              <input type="text" placeholder="Search neighbourhoods…" value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-white/30" />
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-white/40 shrink-0" />
              <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}
                className="bg-black border border-white/10 text-white text-xs font-bold uppercase tracking-widest px-5 py-3.5 rounded-full outline-none focus:border-white/30 cursor-pointer">
                {cities.map(c => <option key={c} value={c}>{c==='All'?'All Cities':c}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Neighbourhood rows */}
        <section className="px-12 md:px-24 max-w-7xl mx-auto space-y-5">
          {loading ? (
            <div className="text-center py-20 text-white/30 animate-pulse text-sm font-bold tracking-widest uppercase">Loading neighbourhoods…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-white/20 italic text-xl">No neighbourhoods found.</div>
          ) : (
            filtered.map(nb => {
              const nbProps = getNeighbourhoodProperties(nb);
              return (
                <div key={nb.id} className="bg-[#0a0a0a] border border-white/5 hover:border-white/15 rounded-[32px] p-8 transition-all duration-300">

                  {/* Top row: name + city + view button */}
                  <div className="flex items-start justify-between gap-6 mb-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin size={11} className="text-white/30 shrink-0" />
                        <span className="text-[10px] font-black tracking-[0.3em] uppercase text-white/40">{nb.city}</span>
                      </div>
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter truncate">{nb.name}</h3>
                      {nb.description && (
                        <p className="text-white/40 text-sm mt-1.5 leading-relaxed line-clamp-1">{nb.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {nb.avg_price && (
                        <div className="text-right">
                          <p className="text-[9px] font-black tracking-widest uppercase text-white/30">Avg. Price</p>
                          <p className="text-lg font-black text-white">€{Number(nb.avg_price).toLocaleString()}</p>
                        </div>
                      )}
                      <button
                        onClick={() => onViewPropertiesInCity(nb.name)}
                        className="flex items-center gap-1.5 bg-white text-black px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition whitespace-nowrap"
                      >
                        View All <ChevronRight size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Scores row */}
                  {(nb.safety_score || nb.schools_score || nb.transport_score) && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 pb-6 border-b border-white/5">
                      <ScoreBar label="Safety"    value={nb.safety_score}    icon={<ShieldCheck   size={12}/>} />
                      <ScoreBar label="Schools"   value={nb.schools_score}   icon={<GraduationCap size={12}/>} />
                      <ScoreBar label="Transport" value={nb.transport_score} icon={<Bus           size={12}/>} />
                    </div>
                  )}

                  {/* Properties panel */}
                  {nbProps.length > 0 ? (
                    <div>
                      <p className="text-[9px] font-black tracking-[0.3em] uppercase text-white/30 mb-3">
                        {nbProps.length} Propert{nbProps.length === 1 ? 'y' : 'ies'} in this area
                      </p>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                        {nbProps.map(p => (
                          <PropertyMiniCard
                            key={p.id}
                            property={p}
                            mainImages={mainImages}
                            onClick={() => onViewPropertiesInCity(nb.name)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-white/[0.03] rounded-2xl px-5 py-4 border border-white/5">
                      <p className="text-white/25 text-xs font-bold uppercase tracking-widest">No listed properties in this area yet</p>
                      <button
                        onClick={() => onViewPropertiesInCity(nb.name)}
                        className="flex items-center gap-1.5 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition"
                      >
                        Browse All <ChevronRight size={11} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      </div>

      <OfficeLocations />

      {/* Footer */}
      <section className="w-full bg-[#050505] text-white p-16 md:p-24 flex flex-col justify-between mt-auto">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-20 py-10">
          <div className="space-y-10">
            <h2 className="text-6xl font-black tracking-tighter uppercase leading-[0.8]">About Us</h2>
            <p className="text-2xl font-medium tracking-tight leading-relaxed max-w-lg opacity-60">KosovaNest is the leading premium real estate network in Kosovo. We specialize in identifying architectural legacies and providing elite, transparent service.</p>
            <div className="flex gap-10 pt-4">
              <Globe className="text-white/40 hover:text-white transition-colors cursor-pointer" size={24} />
              <Mail  className="text-white/40 hover:text-white transition-colors cursor-pointer" size={24} />
              <Phone className="text-white/40 hover:text-white transition-colors cursor-pointer" size={24} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-12 pt-4">
            <div className="space-y-8">
              <h4 className="text-[11px] font-black tracking-[0.4em] uppercase text-white/40">Operations</h4>
              <ul className="space-y-4 text-[13px] font-bold uppercase tracking-widest opacity-80">
                <li className="hover:opacity-100 cursor-pointer transition-all">Local Market</li>
                <li className="hover:opacity-100 cursor-pointer transition-all">Portfolio</li>
                <li className="hover:opacity-100 cursor-pointer transition-all">Press Room</li>
              </ul>
            </div>
            <div className="space-y-8">
              <h4 className="text-[11px] font-black tracking-[0.4em] uppercase text-white/40">Legal</h4>
              <ul className="space-y-4 text-[13px] font-bold uppercase tracking-widest opacity-80">
                <li className="hover:opacity-100 cursor-pointer transition-all">Privacy Policy</li>
                <li className="hover:opacity-100 cursor-pointer transition-all">Terms of Service</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto w-full pt-16 mt-16 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black tracking-[0.6em] uppercase opacity-40">
          <span>© 2026 KosovaNest. All Rights Reserved.</span>
          <div className="flex gap-8"><span>Premium Properties</span><span>•</span><span>Elite Service</span></div>
        </div>
      </section>
    </div>
  );
}
