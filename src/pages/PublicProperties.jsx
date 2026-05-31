import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, User, ArrowLeft, MapPin, DoorOpen, Bath, Maximize, SlidersHorizontal, ChevronDown, Building2, ChevronLeft, ChevronRight, X, Phone, Mail, Globe, Bed, Square, Heart, CalendarCheck, CheckCircle, Loader, Banknote, ShieldCheck, ShoppingBag } from 'lucide-react';
import { API_BASE, apiFetch } from '../lib/api';
import { getCurrentUser } from '../lib/auth';
import RentalCalendar   from '../components/RentalCalendar';
import PropertyMap      from '../components/PropertyMap';
import PropertyReviews  from '../components/PropertyReviews';
import PropertyQA       from '../components/PropertyQA';

// ─── Fuzzy search helpers ─────────────────────────────────────────────────────

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function fuzzyMatch(text, query) {
  if (!text || !query) return false;
  const t = text.toLowerCase().trim();
  const q = query.toLowerCase().trim();
  if (!q) return true;
  if (t.includes(q)) return true;
  const textWords  = t.split(/[\s,.-]+/).filter(Boolean);
  const queryWords = q.split(/\s+/).filter(Boolean);
  return queryWords.every(qw => {
    const maxDist = Math.max(1, Math.floor(qw.length / 4));
    return textWords.some(tw => levenshtein(tw, qw) <= maxDist) || t.includes(qw);
  });
}

function cityMatch(location, nbCity) {
  if (!location || !nbCity) return false;
  const locCity = (location.split(',')[0] || location).toLowerCase().trim();
  const nb      = nbCity.toLowerCase().trim();
  if (locCity.includes(nb) || nb.includes(locCity)) return true;
  return levenshtein(locCity, nb) <= 2;
}

const TIME_SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];

const PublicProperties = ({ onNavigate, onBack, favorites = [], onToggleFavorite, initialPropertyId, onPropertyOpened, initialCityFilter = '', onCityFilterConsumed, initialHomeType = '', initialFilterType = '' }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mainImages, setMainImages] = useState({});
  const [propertyFeatures, setPropertyFeatures] = useState([]);

  // ── Schedule a Visit state ──────────────────────────────────────────────
  const [visitDate,       setVisitDate]       = useState('');
  const [visitTime,       setVisitTime]       = useState('');
  const [visitSubmitting, setVisitSubmitting] = useState(false);
  const [visitSuccess,    setVisitSuccess]    = useState(false);
  const [visitError,      setVisitError]      = useState('');
  const today = new Date().toISOString().split('T')[0];

  // ── Initiate Purchase (20% deposit) state ───────────────────────────────
  const [purchaseLoading,  setPurchaseLoading]  = useState(false);
  const [purchaseSuccess,  setPurchaseSuccess]  = useState(false);
  const [purchaseError,    setPurchaseError]    = useState('');
  const [contractData,     setContractData]     = useState(null);

  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef(null);
  const pageTopRef = useRef(null);

  // Resolve current user once so the whole component reacts to it
  const [currentUser] = useState(() => getCurrentUser());
  const role = currentUser ? 'user' : null;

  // Rental date state
  const [checkInDate,        setCheckInDate]        = useState('');
  const [checkOutDate,       setCheckOutDate]        = useState('');
  const [userNote,           setUserNote]            = useState('');
  const [blockedRanges,      setBlockedRanges]       = useState([]);
  const [visitResult,        setVisitResult]         = useState(null);
  const [purchaseSubmitting, setPurchaseSubmitting]  = useState(false);
  const [purchaseResult,     setPurchaseResult]      = useState(null);
  const [rentalError,        setRentalError]         = useState('');

  const [searchQuery,    setSearchQuery]    = useState(initialCityFilter  || '');
  const [sortConfig,     setSortConfig]     = useState('newest');
  const [filterType,     setFilterType]     = useState(initialFilterType  || 'ALL');
  const [filterHomeType, setFilterHomeType] = useState(initialHomeType    || 'ALL');
  const [agentInfo,          setAgentInfo]          = useState(null);
  const [neighborhoods,      setNeighborhoods]      = useState([]);
  const [showSuggestions,    setShowSuggestions]    = useState(false);
  const searchWrapRef = useRef(null);

  // Consume the city filter once (so navigating away and back doesn't re-apply it)
  useEffect(() => {
    if (initialCityFilter && onCityFilterConsumed) onCityFilterConsumed();
  }, []);

  // Fetch neighborhoods once for the property detail section + suggestions
  useEffect(() => {
    apiFetch('/api/neighborhoods')
      .then(data => setNeighborhoods(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const MAX_SLIDER_PRICE = 2500000;
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(MAX_SLIDER_PRICE);

  useEffect(() => {
    if (selectedProperty && pageTopRef.current) {
      setTimeout(() => pageTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  }, [selectedProperty]);

  const handleNavigation = (destination) => {
    if (onNavigate) {
      onNavigate(destination);
    } else {
      window.history.pushState({ view: destination }, "", "");
      window.dispatchEvent(new PopStateEvent('popstate'));
      if (onBack && destination === 'hero') onBack();
    }
  };

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/properties`);
        const data = await response.json();
        setProperties(data);

        const imageMap = {};
        await Promise.all(
          data.map(async (property) => {
            try {
              const imgRes = await fetch(`${API_BASE}/api/properties/${property.id}/images`);
              const imgs = await imgRes.json();
              if (imgs && imgs.length > 0) {
                const mainImg = imgs.find((img) => img.eshte_kryesore) || imgs[0];
                imageMap[property.id] = `${API_BASE}${mainImg.image_url}`;
              }
            } catch (err) {}
          })
        );
        setMainImages(imageMap);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch properties:", error);
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  useEffect(() => {
    const handleScroll = () => { if (scrollRef.current) setIsScrolled(scrollRef.current.scrollTop > 50); };
    const scrollContainer = scrollRef.current;
    if (scrollContainer) scrollContainer.addEventListener('scroll', handleScroll);
    return () => { if (scrollContainer) scrollContainer.removeEventListener('scroll', handleScroll); };
  }, []);

  const handleFilterToggle = (typeToToggle) => {
    setFilterType(prevType => prevType === typeToToggle ? 'ALL' : typeToToggle);
  };

  const filteredAndSorted = useMemo(() => {
    if (!Array.isArray(properties)) return [];
    let items = [...properties];
    if (searchQuery) {
      items = items.filter(p => {
        if (fuzzyMatch(p.title      || '', searchQuery)) return true;
        if (fuzzyMatch(p.location   || '', searchQuery)) return true;
        if (fuzzyMatch(p.home_type  || '', searchQuery)) return true;
        if (fuzzyMatch(p.agent_name || '', searchQuery)) return true;
        // Also match via the linked neighbourhood name / city
        if (p.neighborhood_id) {
          const nb = neighborhoods.find(n => n.id === Number(p.neighborhood_id));
          if (nb && (fuzzyMatch(nb.name || '', searchQuery) || fuzzyMatch(nb.city || '', searchQuery))) return true;
        }
        return false;
      });
    }
    if (filterType !== 'ALL') {
      items = items.filter(p => {
        const typeMatch = (p.type || '').toUpperCase();
        if (filterType === 'BUY') return typeMatch === 'SHITJE' || typeMatch === 'BUY';
        if (filterType === 'RENT') return typeMatch === 'QIRA' || typeMatch === 'RENT';
        return false;
      });
    }
    if (filterHomeType !== 'ALL') {
      items = items.filter(p =>
        (p.home_type || '').toLowerCase() === filterHomeType.toLowerCase()
      );
    }
    items = items.filter(p => {
      const price = Number(p.price);
      return price >= minPrice && price <= maxPrice;
    });
    if (sortConfig === 'price-low') items.sort((a, b) => Number(a.price) - Number(b.price));
    if (sortConfig === 'price-high') items.sort((a, b) => Number(b.price) - Number(a.price));
    if (sortConfig === 'newest') items.sort((a, b) => b.id - a.id);
    return items;
  }, [properties, sortConfig, searchQuery, filterType, minPrice, maxPrice]);

  // Trim a Nominatim full address down to "Neighbourhood, City"
  const shortLocation = (loc) => {
    if (!loc) return '';
    const parts = loc.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length <= 2) return parts.join(', ');
    // Skip POI / street (index 0-1), take neighbourhood + city (index 2-3)
    return parts.slice(2, 4).join(', ');
  };

  const getStatusDisplay = (status) => {
    if (!status) return 'AVAILABLE';
    const upper = status.toUpperCase();
    if (upper.includes('SHITUR') || upper === 'SOLD') return 'SOLD';
    if (upper.includes('QIRA') && upper.includes('DHËNË') || upper === 'RENTED') return 'RENTED';
    return 'AVAILABLE';
  };

  const getTypeDisplay = (type) => {
    if (!type) return 'SALE';
    const upper = type.toUpperCase();
    if (upper === 'QIRA' || upper === 'RENT') return 'RENT';
    return 'SALE';
  };

  const getStatusBadgeStyle = (status) => {
    const display = getStatusDisplay(status);
    switch (display) {
      case 'SOLD': return 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]';
      case 'RENTED': return 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]';
      default: return 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]';
    }
  };

  const openPropertyDetails = async (property) => {
    setSelectedProperty(property);
    setCurrentImageIndex(0);
    // Reset per-property form/result state
    setVisitDate(''); setVisitTime('');
    setCheckInDate(''); setCheckOutDate('');
    setUserNote(''); setBlockedRanges([]); setAgentInfo(null);
    setVisitResult(null); setVisitSubmitting(false); setRentalError('');
    setPurchaseResult(null); setPurchaseSubmitting(false); setPurchaseError('');
    try {
      const fetches = [
        fetch(`${API_BASE}/api/properties/${property.id}/images`),
        fetch(`${API_BASE}/api/properties/${property.id}/features`),
        fetch(`${API_BASE}/api/visits/property/${property.id}`),
      ];
      if (property.agent_id) {
        fetches.push(fetch(`${API_BASE}/api/agents/${property.agent_id}`));
      }
      const [imagesRes, featuresRes, visitsRes, agentRes] = await Promise.all(fetches);
      const images   = await imagesRes.json();
      const features = await featuresRes.json();
      const visitsData = await visitsRes.json();
      setGallery(images);
      setPropertyFeatures(features);
      if (agentRes) {
        const agentData = await agentRes.json().catch(() => null);
        if (agentData && !agentData.error) setAgentInfo(agentData);
      }
      // Extract blocked ranges from APPROVED rental visits
      const blocked = (Array.isArray(visitsData) ? visitsData : [])
        .filter(v => v.status === 'APPROVED' && v.notes?.startsWith('Rental request'))
        .map(v => {
          const cin  = v.notes.match(/Check-in:\s*(\d{4}-\d{2}-\d{2})/);
          const cout = v.notes.match(/Check-out:\s*(\d{4}-\d{2}-\d{2})/);
          return cin && cout ? { start: cin[1], end: cout[1] } : null;
        })
        .filter(Boolean);
      setBlockedRanges(blocked);
    } catch (error) {
      console.error("Failed to load property details", error);
    }
  };

  // Auto-open a specific property when arriving from the favorites page
  useEffect(() => {
    if (initialPropertyId && properties.length > 0) {
      const prop = properties.find((p) => p.id === Number(initialPropertyId));
      if (prop) {
        openPropertyDetails(prop);
        if (onPropertyOpened) onPropertyOpened();
      }
    }
  }, [initialPropertyId, properties]);

  const isActivelyFiltering = searchQuery !== "" || filterType !== "ALL" || filterHomeType !== "ALL" || minPrice > 0 || maxPrice < MAX_SLIDER_PRICE;

  // Location-aware suggestions shown under the search bar while typing
  const locationSuggestions = useMemo(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) return [];
    const seen = new Set();
    const results = [];

    const add = (label, type, sub) => {
      if (!seen.has(label.toLowerCase())) {
        seen.add(label.toLowerCase());
        results.push({ label, type, sub });
      }
    };

    // Neighbourhood names + cities from DB
    neighborhoods.forEach(n => {
      if (fuzzyMatch(n.name || '', q)) add(n.name, 'neighbourhood', n.city);
      if (fuzzyMatch(n.city || '', q)) add(n.city, 'city');
    });

    // Unique short locations from loaded properties
    properties.forEach(p => {
      const loc = shortLocation(p.location);
      if (loc && fuzzyMatch(loc, q)) add(loc, 'area');
      // Also check city portion alone
      const city = (p.location || '').split(',').at(-2)?.trim() ||
                   (p.location || '').split(',')[0]?.trim();
      if (city && city.length > 2 && fuzzyMatch(city, q)) add(city, 'city');
    });

    return results.slice(0, 6);
  }, [searchQuery, neighborhoods, properties]);

  const renderDynamicCategories = () => {
    if (!Array.isArray(properties) || properties.length === 0) return null;

    const newlyAdded = [...properties].sort((a, b) => b.id - a.id).slice(0, 3);
    const premiumPicks = [...properties].sort((a, b) => Number(b.price) - Number(a.price)).slice(0, 3);
    const spaciousHomes = [...properties].filter(p => Number(p.rooms || 0) >= 3).slice(0, 3);
    const fallbackCategory = spaciousHomes.length > 0 ? spaciousHomes : properties.slice(0, 3);

    const categories = [
      { title: "Newly Listed Properties", data: newlyAdded },
      { title: "Premium Picks", data: premiumPicks },
      { title: "Spacious Homes", data: fallbackCategory }
    ];

    return (
      <div className="space-y-24">
        {categories.map((cat, idx) => {
          if (cat.data.length === 0) return null; 
          return (
            <div key={idx}>
              <div className="flex items-end justify-between mb-10 border-b border-white/10 pb-6">
                <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">{cat.title}</h2>
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40 cursor-pointer hover:text-white transition-colors">View All →</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {cat.data.map(prop => <PropertyCard key={prop.id} property={prop} />)}
              </div>
            </div>
          )
        })}
      </div>
    );
  };

  const handleInitiatePurchase = async (property) => {
    // Always read a fresh copy so stale component state can't cause null errors
    const user = getCurrentUser();
    if (!user?.id) {
      setPurchaseError('You must be signed in to initiate a purchase.');
      setPurchaseResult('error');
      return;
    }

    setPurchaseResult(null);
    setPurchaseError('');
    setPurchaseSubmitting(true);
    try {
      await apiFetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id':   String(user.id),
        },
        body: JSON.stringify({
          user_id:    user.id,
          property_id: property.id,
          agent_id:   property.agent_id || null,
          type: (property.type || '').toUpperCase() === 'QIRA' || (property.type || '').toUpperCase() === 'RENT' ? 'Rent' : 'Sale',
        }),
      });
      setPurchaseResult('ok');
    } catch (err) {
      console.error(err);
      setPurchaseError(err.message || 'Something went wrong. Please try again.');
      setPurchaseResult('error');
    } finally {
      setPurchaseSubmitting(false);
    }
  };

  const handleScheduleVisit = async (property) => {
    if (!visitDate || !visitTime) return;
    setVisitResult(null);
    setVisitSubmitting(true);
    try {
      await apiFetch('/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-id': String(currentUser.id),
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          property_id: property.id,
          agent_id: property.agent_id || null,
          visit_date: visitDate,
          visit_time: visitTime,
          status: 'PENDING',
        }),
      });
      setVisitResult('ok');
      setVisitDate('');
      setVisitTime('');
    } catch (err) {
      console.error(err);
      setVisitResult('error');
    } finally {
      setVisitSubmitting(false);
    }
  };

  const handleRequestRental = async (property) => {
    if (!checkInDate || !checkOutDate) return;

    // Check for overlap with already-booked dates
    const cin  = new Date(checkInDate  + 'T00:00:00');
    const cout = new Date(checkOutDate + 'T00:00:00');
    const overlap = blockedRanges.some(r => {
      const s = new Date(r.start + 'T00:00:00');
      const e = new Date(r.end   + 'T00:00:00');
      return cin <= e && cout >= s;
    });
    if (overlap) {
      alert('Your selected dates overlap with an existing booking. Please choose different dates — the blocked ones are shown in red on the calendar.');
      return;
    }

    const noteLine = userNote.trim() ? `\n\nNote: "${userNote.trim()}"` : '';
    const confirmed = window.confirm(
      `Are you sure you want to request a rental for "${property.title}"?\n\nCheck-in:  ${checkInDate}\nCheck-out: ${checkOutDate}${noteLine}\n\nThe agent will review and confirm your request.`
    );
    if (!confirmed) return;
    setVisitResult(null);
    setRentalError('');
    setVisitSubmitting(true);
    try {
      const rentalNotes = `Rental request — Check-in: ${checkInDate}, Check-out: ${checkOutDate}${userNote.trim() ? ` | Note: ${userNote.trim()}` : ''}`;

      // 1. Create visit (shows in agent's Rental Requests panel)
      await apiFetch('/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-id':   String(currentUser.id),
        },
        body: JSON.stringify({
          user_id:     currentUser.id,
          property_id: property.id,
          agent_id:    property.agent_id || null,
          visit_date:  checkInDate,
          visit_time:  '09:00',
          notes:       rentalNotes,
          status:      'PENDING',
        }),
      });

      // 2. Create contract (shows in Contracts + Payments sections)
      await apiFetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-id':   String(currentUser.id),
        },
        body: JSON.stringify({
          user_id:    currentUser.id,
          property_id: property.id,
          agent_id:   property.agent_id || null,
          type:       'Rent',
          notes:      rentalNotes,
        }),
      });

      setVisitResult('ok');
      setCheckInDate('');
      setCheckOutDate('');
      setUserNote('');
    } catch (err) {
      console.error(err);
      setRentalError(err.message || 'Something went wrong. Please try again.');
      setVisitResult('error');
    } finally {
      setVisitSubmitting(false);
    }
  };

  const PropertyCard = ({ property }) => {
    const isFavorited = favorites.some((f) => f.id === property.id);
    const handleFavoriteToggle = (e) => {
      e.stopPropagation();
      if (onToggleFavorite) onToggleFavorite({ ...property, mainImage: mainImages[property.id] });
    };
    return (
      <div onClick={() => openPropertyDetails(property)} className="group cursor-pointer relative bg-[#0a0a0a] rounded-[40px] border border-white/5 overflow-hidden hover:shadow-2xl hover:border-white/20 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full">
        <div className="h-72 w-full overflow-hidden relative transition-all duration-700">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent z-10" />
          <img src={mainImages[property.id] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1920'} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
          <div className="absolute top-6 left-6 bg-white text-black px-4 py-2 rounded-full font-black tracking-tighter text-sm z-20 shadow-xl">€{Number(property.price).toLocaleString()}</div>
          <div className={`absolute top-6 right-6 px-4 py-2 rounded-full text-[9px] font-black tracking-widest uppercase z-20 border border-white/10 ${getStatusBadgeStyle(property.status)}`}>{getStatusDisplay(property.status)}</div>
        </div>
        <div className="p-8 relative z-20 -mt-10 flex-1 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/40 mb-2 flex items-center gap-2"><MapPin size={12} /> {shortLocation(property.location)}</p>
            <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-6 line-clamp-1">{property.title}</h3>
            <div className="flex gap-6 text-white/60 text-sm font-medium mb-6">
              <div className="flex items-center gap-2"><DoorOpen size={16} /> {property.rooms || 0}</div>
              <div className="flex items-center gap-2"><Bath size={16} /> {property.bathrooms || 0}</div>
              <div className="flex items-center gap-2"><Maximize size={16} /> {property.area}m²</div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-4 group-hover:border-white/20 transition-colors">
            <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase">View Details</p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleFavoriteToggle}
                className={`p-2.5 rounded-full transition-all hover:scale-110 border ${isFavorited ? 'bg-red-500/20 border-red-500/30' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
              >
                <Heart size={16} className={isFavorited ? 'text-red-500 fill-red-500' : 'text-white/40'} />
              </button>
              <div className="bg-white text-black p-3 rounded-full group-hover:scale-110 transition-transform"><ChevronRight size={16} /></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center text-white text-2xl font-black tracking-widest uppercase">Loading properties...</div>;

  return (
    <div ref={scrollRef} className="h-screen w-full bg-black text-white font-sans overflow-y-auto overflow-x-hidden flex flex-col">
      <div ref={pageTopRef} className="absolute top-0 w-full h-1" />
      
      {/* PERFECTLY MATCHED SHRINKING NAVBAR */}
      <nav className={`fixed top-0 left-0 w-full flex items-center justify-between px-12 z-[100] transition-all duration-500 ${
        isScrolled 
          ? 'bg-black/80 backdrop-blur-md border-b border-white/10 py-4 shadow-2xl' 
          : 'bg-transparent py-8'
      }`}>
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNavigation('hero')}>
          <Building2 size={32} className="text-white group-hover:opacity-70 transition-opacity" />
          <div className="flex flex-col">
              <span className="text-white font-black text-2xl tracking-tighter uppercase italic leading-none group-hover:opacity-70 transition-opacity">KosovaNest</span>
              <span className="text-white/80 text-[10px] font-bold tracking-[0.3em] uppercase leading-none mt-1">Real Estate Group</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {['HOME', 'BUY', 'RENT', 'AGENTS', 'NEIGHBOURHOODS'].map((item) => {
            const isActive = (item === 'BUY' && filterType === 'BUY') || (item === 'RENT' && filterType === 'RENT');
            return (
              <button key={item} 
                onClick={() => {
                  if (item === 'HOME')           handleNavigation('hero');
                  else if (item === 'AGENTS')   handleNavigation('agents');
                  else if (item === 'NEIGHBOURHOODS') handleNavigation('neighborhoods');
                  else if (item === 'BUY')      handleFilterToggle('BUY');
                  else if (item === 'RENT')     handleFilterToggle('RENT');
                }}
                className={`text-[10px] font-bold tracking-widest uppercase transition-all ${isActive ? 'text-white opacity-100 border-b border-white pb-1' : 'text-white opacity-60 hover:opacity-100'}`}>
                {item}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-6">
          <div className="p-2 cursor-pointer hover:bg-white/10 rounded-full transition" onClick={() => {
            if (!currentUser) { handleNavigation('signin'); return; }
            if (currentUser.role === 'admin') handleNavigation('dashboard');
            else if (currentUser.role === 'agent') handleNavigation('agent-dashboard');
            else handleNavigation('user-profile');
          }}><User size={20} className="text-white" /></div>
          <button onClick={() => handleNavigation('signin')} className="bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs px-6 py-2.5 rounded-full transition font-bold uppercase">Login</button>
        </div>
      </nav>

      <div className="flex-1 pt-48 pb-32">
        {selectedProperty ? (
          <div className="max-w-6xl mx-auto px-12 animate-in fade-in slide-in-from-bottom-10 duration-500">
            <button onClick={() => setSelectedProperty(null)} className="flex items-center gap-3 text-[10px] font-black tracking-[0.3em] uppercase text-white/50 hover:text-white transition-colors mb-8"><ArrowLeft size={16} /> Back to Listings</button>
            
            <div className="h-[500px] w-full rounded-[50px] overflow-hidden border border-white/10 relative shadow-2xl mb-12 bg-black group">
              <img src={gallery.length > 0 ? `${API_BASE}${gallery[currentImageIndex].image_url}` : (mainImages[selectedProperty.id] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1920')} alt={selectedProperty.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80" />
              {gallery.length > 1 && (
                <>
                  <button onClick={() => setCurrentImageIndex((prev) => prev === 0 ? gallery.length - 1 : prev - 1)} className="absolute left-8 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-md p-4 rounded-full hover:bg-black text-white z-30 transition-all hover:scale-110"><ChevronLeft size={24} /></button>
                  <button onClick={() => setCurrentImageIndex((prev) => prev === gallery.length - 1 ? 0 : prev + 1)} className="absolute right-8 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-md p-4 rounded-full hover:bg-black text-white z-30 transition-all hover:scale-110"><ChevronRight size={24} /></button>
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-2 rounded-full text-[10px] text-white tracking-widest font-bold z-30 border border-white/10">PHOTO {currentImageIndex + 1} OF {gallery.length}</div>
                </>
              )}
              <div className="absolute top-8 left-8 bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-full font-black tracking-tighter text-2xl z-20 border border-white/10">€{Number(selectedProperty.price).toLocaleString()}</div>
              <div className={`absolute top-8 right-8 px-6 py-3 rounded-full font-black text-[10px] tracking-widest uppercase z-20 border border-white/20 ${getStatusBadgeStyle(selectedProperty.status)}`}>{getStatusDisplay(selectedProperty.status)}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              <div className="md:col-span-2 space-y-10">
                <div>
                  <p className="text-[12px] font-black tracking-[0.4em] uppercase text-white/40 mb-3 flex items-center gap-2"><MapPin size={16} /> {shortLocation(selectedProperty.location)}, Kosovo</p>
                  <h1 className="text-6xl font-black uppercase italic tracking-tighter leading-[0.9]">{selectedProperty.title}</h1>
                </div>
                <div className="flex gap-10 text-white/80 pb-10 border-b border-white/10">
                  <div className="flex items-center gap-3"><DoorOpen size={24} className="text-white/40"/> <span className="text-xl font-bold">{selectedProperty.rooms || 0} Rooms</span></div>
                  <div className="flex items-center gap-3"><Bath size={24} className="text-white/40"/> <span className="text-xl font-bold">{selectedProperty.bathrooms || 0} Baths</span></div>
                  <div className="flex items-center gap-3"><Maximize size={24} className="text-white/40"/> <span className="text-xl font-bold">{selectedProperty.area} m²</span></div>
                </div>
                {propertyFeatures.length > 0 ? (
                  <div>
                    <h3 className="text-[11px] font-black tracking-[0.4em] uppercase text-white/40 mb-6">Property Features</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {propertyFeatures.map(feat => (
                        <div key={feat.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4">
                          <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold">{feat.emertimi}</span>
                          <span className="text-sm text-white font-black">{feat.vlera}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-[11px] font-black tracking-[0.4em] uppercase text-white/40 mb-6">About this property</h3>
                    <p className="text-xl text-white/70 leading-relaxed font-medium">{selectedProperty.description ? selectedProperty.description : `A beautiful property located in the heart of ${selectedProperty.location}. Contact our elite agents to schedule a viewing and learn more about this exclusive listing.`}</p>
                  </div>
                )}

                {/* Purchase / Rent section — only for logged-in users on available properties */}
                {role === 'user' && (() => {
                  const propertyAvailable = getStatusDisplay(selectedProperty.status) === 'AVAILABLE';
                  const isRental = getTypeDisplay(selectedProperty.type) === 'RENT';

                  if (!propertyAvailable) {
                    return (
                      <div className="bg-white/5 border border-white/10 rounded-[30px] p-8 text-center space-y-3">
                        <p className="text-[11px] font-black tracking-[0.3em] uppercase text-white/40">
                          {getStatusDisplay(selectedProperty.status) === 'SOLD' ? 'Property Sold' : 'Property Rented'}
                        </p>
                        <p className="text-white/50 text-sm font-medium">
                          This property is no longer available for {isRental ? 'rent' : 'purchase'}.
                        </p>
                      </div>
                    );
                  }
                  return isRental ? (
                    <div>
                      <h3 className="text-[11px] font-black tracking-[0.4em] uppercase text-white/40 mb-6 flex items-center gap-2">
                        <ShoppingBag size={14} /> Rent This House
                      </h3>
                      <div className="bg-white/5 border border-white/10 rounded-[30px] p-8 space-y-5">
                        {/* Monthly rent */}
                        <div className="flex items-center justify-between text-white/70 text-sm font-medium">
                          <span>Monthly Rent</span>
                          <span className="text-white font-black text-lg">€{Number(selectedProperty.price).toLocaleString()}</span>
                        </div>

                        {/* Security deposit */}
                        <div className="bg-black/60 rounded-2xl p-5 flex items-center justify-between">
                          <div>
                            <p className="text-[9px] font-black tracking-widest uppercase text-white/40 mb-1">Security Deposit</p>
                            <p className="text-[10px] text-white/30 font-bold">1 month's rent, refundable</p>
                          </div>
                          <span className="text-3xl font-black text-white">€{Number(selectedProperty.price).toLocaleString()}</span>
                        </div>

                        {/* Total on move-in */}
                        <div className="flex items-center justify-between text-white/50 text-sm font-medium">
                          <span>Total due on move-in</span>
                          <span className="font-bold text-white/80">€{(Number(selectedProperty.price) * 2).toLocaleString()}</span>
                        </div>

                        {/* Optional note */}
                        <div>
                          <label className="block text-[9px] font-black tracking-widest uppercase text-white/30 mb-2">
                            Note for the agent <span className="text-white/20 normal-case tracking-normal font-normal">(optional)</span>
                          </label>
                          <textarea
                            value={userNote}
                            onChange={(e) => setUserNote(e.target.value)}
                            rows={3}
                            placeholder="Any special requests or questions for the agent…"
                            className="w-full bg-black/60 border border-white/10 focus:border-white/30 text-white text-sm rounded-xl px-4 py-3 outline-none resize-none transition placeholder:text-white/20"
                          />
                        </div>

                        {visitResult === 'ok' && (
                          <p className="text-green-400 text-xs font-bold bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                            Rental request submitted! The agent will be in touch.
                          </p>
                        )}
                        {visitResult === 'error' && (
                          <p className="text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                            {rentalError || 'Something went wrong. Please try again.'}
                          </p>
                        )}

                        <div>
                          <button
                            onClick={() => handleRequestRental(selectedProperty)}
                            disabled={visitSubmitting || !checkInDate || !checkOutDate || visitResult === 'ok'}
                            className="w-full bg-white text-black py-4 rounded-full font-black text-[12px] tracking-[0.3em] uppercase hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 disabled:opacity-40"
                          >
                            <ShoppingBag size={16} />
                            {visitSubmitting ? 'Submitting…' : visitResult === 'ok' ? 'Request Sent' : 'Rent This House'}
                          </button>
                          <p className="text-center text-[9px] font-bold tracking-widest uppercase text-white/20 mt-3">
                            Select dates on the right before confirming
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-[11px] font-black tracking-[0.4em] uppercase text-white/40 mb-6 flex items-center gap-2">
                        <ShoppingBag size={14} /> Purchase This Property
                      </h3>
                      <div className="bg-white/5 border border-white/10 rounded-[30px] p-8 space-y-5">
                        <div className="flex items-center justify-between text-white/70 text-sm font-medium">
                          <span>Full Property Price</span>
                          <span className="text-white font-black text-lg">€{Number(selectedProperty.price).toLocaleString()}</span>
                        </div>
                        <div className="bg-black/60 rounded-2xl p-5 flex items-center justify-between">
                          <div>
                            <p className="text-[9px] font-black tracking-widest uppercase text-white/40 mb-1">Required Deposit</p>
                            <p className="text-[10px] text-white/30 font-bold">20% of purchase price</p>
                          </div>
                          <span className="text-3xl font-black text-white">€{Math.round(Number(selectedProperty.price) * 0.2).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-white/50 text-sm font-medium">
                          <span>Remaining balance</span>
                          <span className="font-bold text-white/80">€{Math.round(Number(selectedProperty.price) * 0.8).toLocaleString()}</span>
                        </div>

                        {purchaseResult === 'ok' && (
                          <p className="text-green-400 text-xs font-bold bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                            Purchase request submitted! The agent will be in touch.
                          </p>
                        )}
                        {purchaseResult === 'error' && (
                          <p className="text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                            {purchaseError || 'Something went wrong. Please try again.'}
                          </p>
                        )}

                        <div>
                          <button
                            onClick={() => handleInitiatePurchase(selectedProperty)}
                            disabled={purchaseSubmitting || purchaseResult === 'ok'}
                            className="w-full bg-white text-black py-4 rounded-full font-black text-[12px] tracking-[0.3em] uppercase hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                          >
                            <ShoppingBag size={16} />
                            {purchaseSubmitting ? 'Submitting…' : purchaseResult === 'ok' ? 'Request Sent' : 'Initiate Purchase'}
                          </button>
                          <p className="text-center text-[9px] font-bold tracking-widest uppercase text-white/20 mt-3">
                            No commitment until deposit is confirmed
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ── RIGHT: Map + Schedule Visit / Select Dates / Contact Agent ── */}
              <div className="space-y-5">
                {/* Property location map */}
                {(selectedProperty.latitude || selectedProperty.longitude) && (
                  <PropertyMap
                    latitude={selectedProperty.latitude}
                    longitude={selectedProperty.longitude}
                    title={selectedProperty.title}
                    height="240px"
                  />
                )}

                {role === 'user' ? (() => {
                  const isRental = getTypeDisplay(selectedProperty.type) === 'RENT';
                  return isRental ? (
                    <div className="bg-[#111] border border-white/10 p-8 rounded-[30px] sticky top-32">
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-tight mb-2">Select Dates</h3>
                      <p className="text-sm text-white/40 font-medium mb-6">Choose your check-in and check-out — then confirm using the button on the left.</p>

                      {/* Availability calendar — interactive date picker */}
                      <div className="mb-6">
                        <p className="text-[9px] font-black tracking-widest uppercase text-white/30 mb-3">Availability</p>
                        <RentalCalendar
                          blockedRanges={blockedRanges}
                          checkIn={checkInDate}
                          checkOut={checkOutDate}
                          onCheckIn={setCheckInDate}
                          onCheckOut={setCheckOutDate}
                        />
                      </div>

                      <p className="text-[9px] font-black tracking-widest uppercase text-white/30 mb-2">Check-in</p>
                      <input
                        type="date"
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 mb-5 [color-scheme:dark]"
                      />

                      <p className="text-[9px] font-black tracking-widest uppercase text-white/30 mb-2">Check-out</p>
                      <input
                        type="date"
                        value={checkOutDate}
                        min={checkInDate || undefined}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 [color-scheme:dark]"
                      />
                    </div>
                  ) : (
                    <div className="bg-[#111] border border-white/10 p-8 rounded-[30px] sticky top-32">
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-tight mb-2">Schedule a Visit</h3>
                      <p className="text-sm text-white/40 font-medium mb-8">Pick a date and time — the agent will confirm your booking.</p>

                      {visitResult === 'ok' && (
                        <p className="text-green-400 text-xs font-bold mb-5 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                          Visit request submitted! The agent will confirm shortly.
                        </p>
                      )}
                      {visitResult === 'error' && (
                        <p className="text-red-400 text-xs font-bold mb-5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                          Something went wrong. Please try again.
                        </p>
                      )}

                      <p className="text-[9px] font-black tracking-widest uppercase text-white/30 mb-2">Select Date</p>
                      <input
                        type="date"
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 mb-6 [color-scheme:dark]"
                      />

                      <p className="text-[9px] font-black tracking-widest uppercase text-white/30 mb-3">Select Time</p>
                      <div className="grid grid-cols-3 gap-2 mb-7">
                        {TIME_SLOTS.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setVisitTime(slot)}
                            className={`py-2.5 rounded-xl text-[11px] font-black tracking-widest transition-all border ${
                              visitTime === slot
                                ? 'bg-white text-black border-white'
                                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => handleScheduleVisit(selectedProperty)}
                        disabled={visitSubmitting || !visitDate || !visitTime}
                        className="w-full bg-white text-black py-4 rounded-full font-black text-[12px] tracking-[0.3em] uppercase hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 disabled:opacity-40"
                      >
                        <CalendarCheck size={16} />
                        {visitSubmitting ? 'Submitting…' : 'Confirm Visit'}
                      </button>
                    </div>
                  );
                })() : (
                  <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] sticky top-32">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-1">
                      Interested?
                    </h3>
                    <p className="text-sm text-white/50 font-medium mb-7">
                      Sign in or reach out directly to schedule a viewing or learn more.
                    </p>
                    <div className="space-y-4">
                      <a
                        href="tel:+38344000000"
                        className="w-full bg-white text-black py-4 rounded-full font-black text-[11px] tracking-[0.3em] uppercase hover:bg-gray-200 transition flex items-center justify-center gap-2"
                      >
                        <Phone size={14} /> Call Now
                      </a>
                      <button
                        onClick={() => handleNavigation('signin')}
                        className="w-full bg-white/10 border border-white/20 text-white py-4 rounded-full font-black text-[11px] tracking-[0.3em] uppercase hover:bg-white/20 transition flex items-center justify-center gap-2"
                      >
                        <User size={14} /> Sign In to Book a Visit
                      </button>
                      <button
                        onClick={() => handleNavigation('agents')}
                        className="w-full border border-white/10 text-white/60 py-4 rounded-full font-black text-[11px] tracking-[0.3em] uppercase hover:text-white hover:border-white/30 transition flex items-center justify-center gap-2"
                      >
                        <ShoppingBag size={14} /> Browse Our Agents
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Neighbourhood info ── */}
            {(() => {
              // 1. Exact match via neighborhood_id (set when adding the property)
              // 2. Fallback: fuzzy text match on name or city
              const nb = neighborhoods.find(n =>
                (selectedProperty.neighborhood_id && n.id === Number(selectedProperty.neighborhood_id)) ||
                cityMatch(selectedProperty.location, n.name) ||
                cityMatch(selectedProperty.location, n.city)
              );
              if (!nb) return null;
              return (
                <div className="mt-16 border-t border-white/10 pt-12">
                  <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30 mb-6">About this neighbourhood</p>
                  <div className="bg-white/5 border border-white/10 rounded-[30px] p-8 space-y-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin size={12} className="text-white/30" />
                        <span className="text-[10px] font-black tracking-widest uppercase text-white/40">{nb.city}</span>
                      </div>
                      <h3 className="text-2xl font-black uppercase italic tracking-tighter">{nb.name}</h3>
                      {nb.description && <p className="text-white/50 text-sm mt-2 leading-relaxed">{nb.description}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {nb.safety_score && (
                        <div className="bg-black/40 rounded-2xl p-4 space-y-2">
                          <p className="text-[9px] font-black tracking-widest uppercase text-white/30">Safety</p>
                          <p className="text-2xl font-black text-white">{nb.safety_score}<span className="text-white/30 text-sm"> / 10</span></p>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${Number(nb.safety_score) >= 8 ? 'bg-green-400' : Number(nb.safety_score) >= 5 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${(nb.safety_score / 10) * 100}%` }} />
                          </div>
                        </div>
                      )}
                      {nb.schools_score && (
                        <div className="bg-black/40 rounded-2xl p-4 space-y-2">
                          <p className="text-[9px] font-black tracking-widest uppercase text-white/30">Schools</p>
                          <p className="text-2xl font-black text-white">{nb.schools_score}<span className="text-white/30 text-sm"> / 10</span></p>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${Number(nb.schools_score) >= 8 ? 'bg-green-400' : Number(nb.schools_score) >= 5 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${(nb.schools_score / 10) * 100}%` }} />
                          </div>
                        </div>
                      )}
                      {nb.transport_score && (
                        <div className="bg-black/40 rounded-2xl p-4 space-y-2">
                          <p className="text-[9px] font-black tracking-widest uppercase text-white/30">Transport</p>
                          <p className="text-2xl font-black text-white">{nb.transport_score}<span className="text-white/30 text-sm"> / 10</span></p>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${Number(nb.transport_score) >= 8 ? 'bg-green-400' : Number(nb.transport_score) >= 5 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${(nb.transport_score / 10) * 100}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                    {nb.avg_price && (
                      <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                        <span className="text-[9px] font-black tracking-widest uppercase text-white/30">Avg. property price in this area:</span>
                        <span className="text-white font-black">€{Number(nb.avg_price).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ── Agent info ── */}
            {agentInfo && (
              <div className="mt-16 border-t border-white/10 pt-12">
                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30 mb-6">Listed by</p>
                <div className="flex items-center gap-6 bg-white/5 border border-white/10 rounded-[30px] p-6">
                  {/* Photo */}
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-white/20 bg-white/10 flex-shrink-0">
                    {agentInfo.profile_image ? (
                      <img
                        src={agentInfo.profile_image.startsWith('http') ? agentInfo.profile_image : `${API_BASE}${agentInfo.profile_image}`}
                        alt={agentInfo.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={24} className="text-white/30" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-lg">{agentInfo.username}</p>
                    {agentInfo.specialization && (
                      <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-0.5">{agentInfo.specialization}</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-3">
                      {agentInfo.email && (
                        <a href={`mailto:${agentInfo.email}`} className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-medium transition">
                          <Mail size={13} /> {agentInfo.email}
                        </a>
                      )}
                      {agentInfo.phone && (
                        <a href={`tel:${agentInfo.phone}`} className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-medium transition">
                          <Phone size={13} /> {agentInfo.phone}
                        </a>
                      )}
                      {agentInfo.zone && (
                        <span className="flex items-center gap-1.5 text-white/40 text-xs font-medium">
                          <MapPin size={13} /> {agentInfo.zone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Reviews button + full section ── */}
            <div className="mt-10">
              <PropertyReviews
                propertyId={selectedProperty.id}
                propertyTitle={selectedProperty.title}
              />
            </div>

            {/* ── Q&A accordion ── */}
            <PropertyQA propertyId={selectedProperty.id} />

          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <section className="px-12 md:px-24 max-w-7xl mx-auto mb-16">
              <h1 className="text-7xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.8] mb-6">Find A Place <br/><span className="text-white/40">To Call Home</span></h1>
              <p className="text-[11px] font-bold tracking-[0.4em] uppercase text-white/60 max-w-xl leading-loose mb-12">Browse Kosovo's most exclusive real estate listings, from modern penthouses to historic villas.</p>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-[40px] flex flex-col gap-8 shadow-2xl">
                <div className="flex flex-col md:flex-row gap-6">
                  <div ref={searchWrapRef} className="relative flex-1">
                    <div className="flex items-center bg-black/50 px-6 py-4 rounded-full border border-white/5 focus-within:border-white/20 transition-colors">
                      <Search size={18} className="text-white/40 mr-3 shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Search by name, area, neighbourhood…"
                        className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-white/30 tracking-wide"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}
                          className="text-white/30 hover:text-white ml-2 transition shrink-0"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Location suggestions dropdown */}
                    {showSuggestions && locationSuggestions.length > 0 && (
                      <div className="absolute z-[999] top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                        <p className="px-4 pt-3 pb-1 text-[9px] font-black tracking-widest uppercase text-white/25">
                          Location suggestions
                        </p>
                        {locationSuggestions.map((s, i) => {
                          const icons = { neighbourhood: '🏘', city: '🏙', area: '📍' };
                          return (
                            <button
                              key={i}
                              type="button"
                              onMouseDown={e => {
                                e.preventDefault(); // prevent blur before click
                                setSearchQuery(s.label);
                                setShowSuggestions(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition text-left border-b border-white/5 last:border-0"
                            >
                              <span className="text-base">{icons[s.type] || '📍'}</span>
                              <div>
                                <span className="text-white text-sm font-semibold">{s.label}</span>
                                {s.sub && <span className="text-white/40 text-xs ml-2">{s.sub}</span>}
                                <span className="ml-2 text-[9px] font-black uppercase tracking-widest text-white/25">
                                  {s.type}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center bg-black/50 rounded-full p-2 border border-white/5">
                    {['ALL', 'BUY', 'RENT'].map((type) => (
                      <button key={type} onClick={() => handleFilterToggle(type)} className={`px-8 py-3 rounded-full text-[10px] font-black tracking-[0.2em] uppercase transition-all ${filterType === type ? 'bg-white text-black shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>{type}</button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  <div className="flex-1 w-full bg-black/50 rounded-[30px] p-6 border border-white/5 flex flex-col justify-center">
                    <div className="flex justify-between items-end mb-6">
                      <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Price Range</span>
                      <span className="text-lg font-black tracking-widest text-white">€{minPrice.toLocaleString()} — €{maxPrice.toLocaleString()}{maxPrice >= MAX_SLIDER_PRICE ? '+' : ''}</span>
                    </div>
                    <div className="relative h-1.5 bg-white/10 rounded-full w-full flex items-center">
                      <div className="absolute h-full bg-white rounded-full pointer-events-none" style={{ left: `${(minPrice / MAX_SLIDER_PRICE) * 100}%`, right: `${100 - (maxPrice / MAX_SLIDER_PRICE) * 100}%` }}></div>
                      <input type="range" min="0" max={MAX_SLIDER_PRICE} step="10000" value={minPrice} onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - 50000))} className="absolute w-full -top-2 h-6 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white cursor-grab active:cursor-grabbing" />
                      <input type="range" min="0" max={MAX_SLIDER_PRICE} step="10000" value={maxPrice} onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + 50000))} className="absolute w-full -top-2 h-6 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white cursor-grab active:cursor-grabbing" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-black/50 rounded-full p-6 border border-white/5 w-full lg:w-auto cursor-pointer">
                    <SlidersHorizontal size={18} className="text-white/40" />
                    <select value={sortConfig} onChange={(e) => setSortConfig(e.target.value)} className="bg-transparent border-none outline-none text-[11px] font-black tracking-[0.2em] text-white uppercase cursor-pointer appearance-none pr-4">
                      <option value="newest" className="bg-black">Newest</option>
                      <option value="price-low" className="bg-black">Lowest Price</option>
                      <option value="price-high" className="bg-black">Highest Price</option>
                    </select>
                    <ChevronDown size={16} className="text-white/40" />
                  </div>
                </div>

                {/* Home type filter chips */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                  {['ALL','House','Apartment','Villa','Townhouse','Mansion','Penthouse','Duplex','Studio','Cabin','Condo'].map((ht) => (
                    <button
                      key={ht}
                      onClick={() => setFilterHomeType(ht)}
                      className={`px-4 py-2 rounded-full text-[10px] font-black tracking-[0.15em] uppercase transition-all border ${
                        filterHomeType === ht
                          ? 'bg-white text-black border-white'
                          : 'bg-transparent text-white/50 border-white/10 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {ht === 'ALL' ? 'All Types' : ht}
                    </button>
                  ))}
                </div>
              </div>
            </section>
            <section className="px-12 md:px-24 max-w-7xl mx-auto">
              {isActivelyFiltering ? (
                <>
                  <div className="mb-10 text-white/50 text-[10px] font-black tracking-[0.3em] uppercase border-b border-white/10 pb-6">Showing {filteredAndSorted.length} Results</div>
                  {filteredAndSorted.length === 0 ? <div className="text-center py-20 opacity-50 italic text-xl">No properties found matching your criteria.</div> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                      {filteredAndSorted.map(prop => <PropertyCard key={prop.id} property={prop} />)}
                    </div>
                  )}
                </>
              ) : renderDynamicCategories()}
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

export default PublicProperties;