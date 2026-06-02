import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader, X } from 'lucide-react';

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

// Result types we want to show (area-level, not street/building level)
const AREA_TYPES = new Set([
  'suburb', 'neighbourhood', 'quarter', 'residential',
  'village', 'hamlet', 'town', 'city', 'municipality',
  'district', 'borough', 'county', 'administrative',
]);

/**
 * Autocomplete for neighbourhood / area names using OpenStreetMap Nominatim.
 * Results are restricted to Kosovo and filtered to area-level places only
 * (no street addresses, no individual buildings).
 *
 * Props:
 *   onSelect({ name, city, lat, lon }) — called when the user picks a suggestion
 *   placeholder                        — input placeholder
 */
export default function NeighborhoodAutocomplete({ onSelect, placeholder = 'Search area or neighbourhood…' }) {
  const [query,       setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [open,        setOpen]        = useState(false);
  const debounceRef = useRef(null);
  const wrapRef     = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      clearTimeout(debounceRef.current);
    };
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);

    if (!val.trim() || val.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${NOMINATIM}?format=json&q=${encodeURIComponent(val)}&countrycodes=xk&addressdetails=1&limit=10`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'KosovaNest-RealEstate/1.0' } }
        );
        const data = await res.json();

        // Keep only area-level results, skip streets and buildings
        const filtered = (Array.isArray(data) ? data : []).filter(item =>
          AREA_TYPES.has(item.type) || AREA_TYPES.has(item.class)
        );

        setSuggestions(filtered);
        setOpen(filtered.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleSelect = (item) => {
    const a = item.address || {};

    // Extract neighbourhood name — prefer the most specific area label
    const name =
      a.suburb       ||
      a.neighbourhood ||
      a.quarter       ||
      a.village       ||
      a.hamlet        ||
      a.town          ||
      item.name       ||
      item.display_name.split(',')[0].trim();

    // Extract city
    const city =
      a.city         ||
      a.town         ||
      a.municipality ||
      a.county       ||
      '';

    setQuery(name);
    setSuggestions([]);
    setOpen(false);
    onSelect({ name, city, lat: item.lat, lon: item.lon });
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setOpen(false);
  };

  const baseCls =
    'w-full bg-[#1a1a1a] border border-gray-800 text-white pl-10 pr-9 py-2.5 rounded-xl text-sm ' +
    'focus:outline-none focus:border-gray-500 placeholder:text-white/20 transition';

  return (
    <div ref={wrapRef} className="relative">
      <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />

      <input
        type="text"
        value={query}
        onChange={handleInput}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className={baseCls}
        autoComplete="off"
      />

      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {loading && <Loader size={13} className="text-white/30 animate-spin" />}
        {query && !loading && (
          <button type="button" onClick={handleClear} className="text-white/30 hover:text-white transition">
            <X size={13} />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-[9999] top-full left-0 right-0 mt-1.5 bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          {suggestions.map((item, i) => {
            const a    = item.address || {};
            const name = a.suburb || a.neighbourhood || a.quarter || a.village || a.hamlet || a.town || item.name || '';
            const city = a.city || a.town || a.municipality || '';
            return (
              <li key={item.place_id || i}>
                <button
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full text-left px-4 py-3 hover:bg-white/10 transition flex items-center gap-3 border-b border-white/5 last:border-0"
                >
                  <MapPin size={12} className="text-white/30 shrink-0" />
                  <div>
                    <span className="text-white text-sm font-semibold">{name || item.display_name.split(',')[0]}</span>
                    {city && <span className="text-white/40 text-xs ml-2">{city}</span>}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
