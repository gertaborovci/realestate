import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, User, ArrowLeft, MapPin, DoorOpen, Bath, Maximize, SlidersHorizontal, ChevronDown, Building2, ChevronLeft, ChevronRight, X, Phone, Mail, Globe, Bed, Square, Heart, CalendarCheck, CheckCircle, Loader, Banknote, ShieldCheck, ShoppingBag } from 'lucide-react';
import { API_BASE, apiFetch } from '../lib/api';
import { getCurrentUser } from '../lib/auth';

const TIME_SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];

const PublicProperties = ({ onNavigate, onBack, favorites = [], onToggleFavorite, initialPropertyId, onPropertyOpened }) => {
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

  // Derive current user & role once per render for conditional UI
  const currentUser = getCurrentUser();
  const role = currentUser?.role || null;

  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState('newest');
  const [filterType, setFilterType] = useState('ALL'); 
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
      items = items.filter(p => (p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase())) || (p.location && p.location.toLowerCase().includes(searchQuery.toLowerCase())));
    }
    if (filterType !== 'ALL') {
      items = items.filter(p => {
        const typeMatch = (p.type || '').toUpperCase();
        if (filterType === 'BUY') return typeMatch === 'SHITJE' || typeMatch === 'BUY';
        if (filterType === 'RENT') return typeMatch === 'QIRA' || typeMatch === 'RENT';
        return false;
      });
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
    // Reset visit form for fresh property
    setVisitDate(''); setVisitTime(''); setVisitSuccess(false); setVisitError('');
    setPurchaseSuccess(false); setPurchaseError(''); setContractData(null);
    try {
      const [imagesRes, featuresRes] = await Promise.all([
        fetch(`${API_BASE}/api/properties/${property.id}/images`),
        fetch(`${API_BASE}/api/properties/${property.id}/features`)
      ]);
      const images = await imagesRes.json();
      const features = await featuresRes.json();
      setGallery(images);
      setPropertyFeatures(features); 
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

  const isActivelyFiltering = searchQuery !== "" || filterType !== "ALL" || minPrice > 0 || maxPrice < MAX_SLIDER_PRICE;

  // ── Schedule a Visit submit ─────────────────────────────────────────────
  const handleVisitSubmit = async (e) => {
    e.preventDefault();
    if (!visitDate || !visitTime) {
      setVisitError('Please select both a date and a time slot.');
      return;
    }
    const user = getCurrentUser();
    if (!user?.id) {
      setVisitError('Please sign in to schedule a visit.');
      return;
    }
    setVisitSubmitting(true);
    setVisitError('');
    try {
      await apiFetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: selectedProperty.id,
          agent_id:    selectedProperty.agent_id || null,
          user_id:     user.id,
          visit_date:  visitDate,
          visit_time:  visitTime,
        }),
      });
      setVisitSuccess(true);
    } catch (err) {
      setVisitError(err.message || 'Failed to schedule visit. Please try again.');
    } finally {
      setVisitSubmitting(false);
    }
  };

  // ── Initiate purchase handler ────────────────────────────────────────────
  const handleInitiatePurchase = async () => {
    const user = getCurrentUser();
    if (!user?.id) {
      setPurchaseError('Please sign in to initiate a purchase.');
      return;
    }
    setPurchaseLoading(true);
    setPurchaseError('');
    try {
      const result = await apiFetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:     user.id,
          property_id: selectedProperty.id,
          agent_id:    selectedProperty.agent_id || null,
          type:        'Sale',
        }),
      });
      setContractData(result);
      setPurchaseSuccess(true);
    } catch (err) {
      // If a contract already exists, surface it gracefully
      if (err.message?.includes('already exists')) {
        setPurchaseError('You already have an active purchase contract for this property. Contact your agent for next steps.');
      } else {
        setPurchaseError(err.message || 'Failed to initiate purchase. Please try again.');
      }
    } finally {
      setPurchaseLoading(false);
    }
  };

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
            <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/40 mb-2 flex items-center gap-2"><MapPin size={12} /> {property.location}</p>
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
          {['HOME', 'BUY', 'RENT', 'SELL', 'MORTGAGE', 'AGENTS'].map((item) => {
            const isActive = (item === 'BUY' && filterType === 'BUY') || (item === 'RENT' && filterType === 'RENT');
            return (
              <button key={item} 
                onClick={() => {
                  if (item === 'HOME') handleNavigation('hero');
                  else if (item === 'AGENTS') handleNavigation('agents');
                  else handleFilterToggle(item);
                }}
                className={`text-[10px] font-bold tracking-widest uppercase transition-all ${isActive ? 'text-white opacity-100 border-b border-white pb-1' : 'text-white opacity-60 hover:opacity-100'}`}>
                {item}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-6">
          <div className="p-2 cursor-pointer hover:bg-white/10 rounded-full transition" onClick={() => handleNavigation('user-profile')}><User size={20} className="text-white" /></div>
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
                  <p className="text-[12px] font-black tracking-[0.4em] uppercase text-white/40 mb-3 flex items-center gap-2"><MapPin size={16} /> {selectedProperty.location}, Kosovo</p>
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

                {/* ── Buy This Property — shown for signed-in users only ── */}
                {role === 'user' &&
                 getTypeDisplay(selectedProperty.type) === 'SALE' &&
                 getStatusDisplay(selectedProperty.status) === 'AVAILABLE' && (
                  <div className="border-t border-white/10 pt-10">
                    <h3 className="text-[11px] font-black tracking-[0.4em] uppercase text-white/40 mb-6 flex items-center gap-2">
                      <Banknote size={14} /> Purchase This Property
                    </h3>

                    {purchaseSuccess ? (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-3xl p-8 flex items-center gap-6">
                        <ShieldCheck size={40} className="text-green-400 shrink-0" />
                        <div>
                          <p className="font-black text-white text-xl mb-1">Purchase Initiated!</p>
                          {contractData?.contract_number && (
                            <p className="text-[10px] text-green-400/70 font-bold uppercase tracking-widest mb-2">
                              {contractData.contract_number}
                            </p>
                          )}
                          {contractData?.deposit_amount && (
                            <p className="text-[10px] text-white/40 font-bold mb-2">
                              Deposit due: €{Number(contractData.deposit_amount).toLocaleString('en')}
                            </p>
                          )}
                          <p className="text-white/50 text-sm leading-relaxed">
                            Your contract is <span className="text-yellow-400 font-bold">Pending Signature</span>. A deposit payment has been logged — your agent will confirm receipt and guide you through signing.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">

                          {/* Price breakdown */}
                          <div className="flex-1 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-white/50">Full Property Price</span>
                              <span className="font-bold text-white">€{Number(selectedProperty.price).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center bg-white/10 border border-white/10 rounded-2xl px-5 py-4">
                              <div>
                                <p className="text-[9px] font-black tracking-widest uppercase text-white/50 mb-0.5">Required Deposit</p>
                                <p className="text-[10px] font-bold text-white/40">20% of purchase price</p>
                              </div>
                              <span className="font-black text-white text-3xl tracking-tight">
                                €{(Number(selectedProperty.price) * 0.2).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-white/40">Remaining balance</span>
                              <span className="font-bold text-white/60">€{(Number(selectedProperty.price) * 0.8).toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Action */}
                          <div className="shrink-0 flex flex-col items-center gap-3">
                            {purchaseError && (
                              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 mb-1 max-w-[220px] text-center">
                                {purchaseError}
                              </p>
                            )}
                            <button
                              onClick={handleInitiatePurchase}
                              disabled={purchaseLoading}
                              className="bg-white text-black px-10 py-4 rounded-full font-black text-[11px] tracking-[0.3em] uppercase hover:bg-gray-200 transition disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                            >
                              {purchaseLoading
                                ? <><Loader size={14} className="animate-spin" /> Processing…</>
                                : <><ShieldCheck size={14} /> Initiate Purchase</>}
                            </button>
                            <p className="text-[9px] text-white/25 font-bold tracking-widest uppercase text-center">
                              No commitment until deposit is confirmed
                            </p>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                {role === 'user' ? (
                  /* ── Visit booking form — signed-in users only ── */
                  <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] sticky top-32">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-1">
                      Schedule a Visit
                    </h3>
                    <p className="text-sm text-white/50 font-medium mb-7">
                      Pick a date and time — the agent will confirm your booking.
                    </p>

                    {visitSuccess ? (
                      /* ── Success state ── */
                      <div className="flex flex-col items-center gap-4 py-6 text-center">
                        <CheckCircle size={48} className="text-green-400" />
                        <p className="font-bold text-white">Visit Requested!</p>
                        <p className="text-white/50 text-sm">
                          The agent will confirm your appointment shortly.
                        </p>
                        <button
                          onClick={() => { setVisitSuccess(false); setVisitDate(''); setVisitTime(''); }}
                          className="text-[10px] font-bold tracking-widest uppercase text-white/40 hover:text-white transition mt-2"
                        >
                          Book another date
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleVisitSubmit} className="space-y-5">
                        {/* Date */}
                        <div>
                          <label className="text-[10px] font-bold tracking-widest uppercase text-white/40 block mb-2">
                            Select Date
                          </label>
                          <input
                            type="date"
                            min={today}
                            value={visitDate}
                            onChange={(e) => setVisitDate(e.target.value)}
                            required
                            className="w-full bg-black/40 border border-white/10 text-white rounded-2xl px-4 py-3 text-sm
                                       focus:outline-none focus:border-white/30 transition [color-scheme:dark]"
                          />
                        </div>

                        {/* Time slots */}
                        <div>
                          <label className="text-[10px] font-bold tracking-widest uppercase text-white/40 block mb-2">
                            Select Time
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {TIME_SLOTS.map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setVisitTime(slot)}
                                className={`py-2 rounded-xl text-[10px] font-black tracking-wider transition border ${
                                  visitTime === slot
                                    ? 'bg-white text-black border-white'
                                    : 'bg-black/40 text-white/40 border-white/10 hover:border-white/30 hover:text-white'
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>

                        {visitError && (
                          <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                            {visitError}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={visitSubmitting}
                          className="w-full bg-white text-black py-4 rounded-full font-black text-[11px] tracking-[0.3em]
                                     uppercase hover:bg-gray-200 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {visitSubmitting
                            ? <><Loader size={14} className="animate-spin" /> Submitting…</>
                            : <><CalendarCheck size={14} /> Confirm Visit</>}
                        </button>
                      </form>
                    )}
                  </div>
                ) : (
                  /* ── Interested? panel — guests & agents ── */
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
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <section className="px-12 md:px-24 max-w-7xl mx-auto mb-16">
              <h1 className="text-7xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.8] mb-6">Find A Place <br/><span className="text-white/40">To Call Home</span></h1>
              <p className="text-[11px] font-bold tracking-[0.4em] uppercase text-white/60 max-w-xl leading-loose mb-12">Browse Kosovo's most exclusive real estate listings, from modern penthouses to historic villas.</p>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-[40px] flex flex-col gap-8 shadow-2xl">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex items-center bg-black/50 px-6 py-4 rounded-full flex-1 border border-white/5 focus-within:border-white/20 transition-colors">
                    <Search size={18} className="text-white/40 mr-3" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name, city, location..." className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-white/30 tracking-wide" />
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