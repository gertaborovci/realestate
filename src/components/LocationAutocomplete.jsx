import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader, X } from 'lucide-react';

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

/**
 * Address autocomplete backed by the free OpenStreetMap Nominatim API.
 *
 * Props:
 *   value       – current address string
 *   onChange    – (address, lat, lon) => void   called when a suggestion is selected
 *   placeholder – input placeholder text
 *   inputClass  – extra Tailwind classes for the input
 */
export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Start typing an address…',
  inputClass = '',
}) {
  const [query,       setQuery]       = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [open,        setOpen]        = useState(false);
  const debounceRef = useRef(null);
  const wrapRef     = useRef(null);

  // Keep internal query in sync when value prop changes externally
  useEffect(() => { setQuery(value || ''); }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      clearTimeout(debounceRef.current); // cancel any pending fetch on unmount
    };
  }, []);

  // Fetch suggestions with 400 ms debounce
  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);

    if (!val.trim() || val.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${NOMINATIM}?format=json&q=${encodeURIComponent(val)}&limit=6&addressdetails=1&countrycodes=xk`,
          {
            headers: {
              'Accept-Language': 'en',
              'User-Agent': 'KosovaNest-RealEstate/1.0',
            },
          }
        );
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleSelect = (item) => {
    // Build a short "Neighbourhood, City" string from the structured address object
    // instead of the full display_name which includes postcodes, districts etc.
    const a = item.address || {};
    const neighbourhood =
      a.suburb || a.neighbourhood || a.quarter || a.village || a.hamlet || a.road || '';
    const city =
      a.city || a.town || a.municipality || a.county || '';

    const shortParts = [neighbourhood, city].filter(Boolean);
    const address = shortParts.length > 0
      ? shortParts.join(', ')
      : item.display_name.split(',').slice(0, 2).map(s => s.trim()).join(', ');

    setQuery(address);
    setSuggestions([]);
    setOpen(false);
    onChange(address, item.lat, item.lon);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setOpen(false);
    onChange('', '', '');
  };

  const baseCls =
    'w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-10 text-white ' +
    'focus:border-white/30 outline-none transition-all placeholder:text-white/30 text-sm';

  return (
    <div ref={wrapRef} className="relative">
      {/* Pin icon */}
      <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none z-10" />

      <input
        type="text"
        value={query}
        onChange={handleInput}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className={`${baseCls} ${inputClass}`}
        autoComplete="off"
      />

      {/* Spinner / clear button */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {loading && <Loader size={15} className="text-white/30 animate-spin" />}
        {query && !loading && (
          <button type="button" onClick={handleClear} className="text-white/30 hover:text-white transition">
            <X size={15} />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-[9999] top-full left-0 right-0 mt-2 bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {suggestions.map((item, i) => (
            <li key={item.place_id || i}>
              <button
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left px-5 py-3.5 hover:bg-white/10 transition flex items-start gap-3 border-b border-white/5 last:border-0"
              >
                <MapPin size={13} className="text-white/30 shrink-0 mt-0.5" />
                <span className="text-white/80 text-sm leading-snug line-clamp-2">
                  {item.display_name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
