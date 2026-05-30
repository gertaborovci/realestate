import React, { useState, useEffect } from 'react';
import { Search, MapPin, Home } from 'lucide-react';

/**
 * Airbnb-style hero search bar.
 *
 * Props:
 *   onSearch(city, keyword) – called when the user submits
 */
export default function HeroSearch({ onSearch }) {
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [city,          setCity]          = useState('');
  const [keyword,       setKeyword]       = useState('');

  // Load neighbourhood options from backend
  useEffect(() => {
    fetch('http://localhost:5000/api/neighborhoods')
      .then(r => r.json())
      .then(data => setNeighborhoods(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(city, keyword);
  };

  const inputBase =
    'w-full bg-transparent outline-none text-white placeholder:text-white/40 text-sm font-medium';

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-0
                 bg-black/60 backdrop-blur-xl border border-white/15 rounded-[20px]
                 overflow-hidden shadow-2xl max-w-2xl"
    >
      {/* ── WHERE input ── */}
      <div className="flex items-center gap-3 px-5 py-4 flex-1 border-b sm:border-b-0 sm:border-r border-white/10">
        <MapPin size={16} className="text-white/40 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black tracking-[0.25em] uppercase text-white/40 mb-0.5">Where</p>
          <select
            value={city}
            onChange={e => setCity(e.target.value)}
            className="w-full bg-transparent outline-none text-white text-sm font-medium cursor-pointer appearance-none"
            style={{ color: city ? 'white' : 'rgba(255,255,255,0.4)' }}
          >
            <option value="" style={{ background: '#111', color: 'white' }}>Anywhere in Kosovo</option>
            {/* Unique cities */}
            {[...new Set(neighborhoods.map(n => n.city).filter(Boolean))].sort().map(c => (
              <option key={c} value={c} style={{ background: '#111', color: 'white' }}>{c}</option>
            ))}
            {/* Individual neighbourhoods */}
            {neighborhoods.length > 0 && (
              <optgroup label="── Neighbourhoods ──" style={{ background: '#111', color: '#888' }}>
                {neighborhoods.map(n => (
                  <option key={n.id} value={n.name} style={{ background: '#111', color: 'white' }}>
                    {n.name} — {n.city}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {/* ── WHAT input ── */}
      <div className="flex items-center gap-3 px-5 py-4 flex-1">
        <Home size={16} className="text-white/40 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black tracking-[0.25em] uppercase text-white/40 mb-0.5">What</p>
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Villa, apartment, pool…"
            className={inputBase}
          />
        </div>
      </div>

      {/* ── Search button ── */}
      <button
        type="submit"
        className="flex items-center justify-center gap-2 bg-white text-black
                   px-7 py-4 sm:py-0 font-black text-[11px] uppercase tracking-widest
                   hover:bg-zinc-200 transition-colors shrink-0"
      >
        <Search size={16} />
        <span className="hidden sm:inline">Search</span>
      </button>
    </form>
  );
}
