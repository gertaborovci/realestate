import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, User, Menu, ArrowLeft, MapPin, DoorOpen, Bath, Maximize, SlidersHorizontal, ChevronDown, Building2, ChevronLeft, ChevronRight, X } from 'lucide-react';

const PublicProperties = ({ onBack }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for the Detail Viewer (FIXED: Nuk ka më duplikime!)
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mainImages, setMainImages] = useState({});
  const [propertyFeatures, setPropertyFeatures] = useState([]); // Shtuar për veçoritë

  // Navbar & Filter States
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState('newest');
  const [filterType, setFilterType] = useState('ALL'); 
  const MAX_SLIDER_PRICE = 2500000;
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(MAX_SLIDER_PRICE);

  // Fetch All Properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/properties');
        const data = await response.json();

        setProperties(data);

        const imageMap = {};
        await Promise.all(
          data.map(async (property) => {
            try {
              const imgRes = await fetch(`http://localhost:5000/api/properties/${property.id}/images`);
              const imgs = await imgRes.json();

              if (imgs && imgs.length > 0) {
                const mainImg = imgs.find((img) => img.eshte_kryesore) || imgs[0];
                imageMap[property.id] = `http://localhost:5000${mainImg.image_url}`;
              }
            } catch (err) {
              console.error('Image fetch failed', err);
            }
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

  // Scroll Detector
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) setIsScrolled(scrollRef.current.scrollTop > 50);
    };
    const scrollContainer = scrollRef.current;
    if (scrollContainer) scrollContainer.addEventListener('scroll', handleScroll);
    return () => { if (scrollContainer) scrollContainer.removeEventListener('scroll', handleScroll); };
  }, []);

  // TOGGLE FILTER LOGIC (Clicking twice resets to ALL)
  const handleFilterToggle = (typeToToggle) => {
    setFilterType(prevType => prevType === typeToToggle ? 'ALL' : typeToToggle);
  };

  const handleNavClick = (item) => {
    if (item === 'HOME') {
      onBack();
      return;
    }
    if (item === 'BUY') handleFilterToggle('BUY');
    if (item === 'RENT') handleFilterToggle('RENT');
  };

  // ROBUST FILTERING (Catches both English and Albanian DB entries)
  const filteredAndSorted = useMemo(() => {
    if (!Array.isArray(properties)) return [];
    let items = [...properties];
    
    if (searchQuery) {
      items = items.filter(p => 
        (p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (p.location && p.location.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (filterType !== 'ALL') {
      items = items.filter(p => {
        const typeMatch = (p.type || '').toUpperCase();
        
        if (filterType === 'BUY') {
          // Catch both DB variations for Sale
          return typeMatch === 'SHITJE' || typeMatch === 'BUY';
        }
        if (filterType === 'RENT') {
          // Catch both DB variations for Rent
          return typeMatch === 'QIRA' || typeMatch === 'RENT';
        }
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

  // TRANSLATE DB STATUS TO ENGLISH UI
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
    
    try {
      // Fetchojmë fotot DHE veçoritë në të njëjtën kohë
      const [imagesRes, featuresRes] = await Promise.all([
        fetch(`http://localhost:5000/api/properties/${property.id}/images`),
        fetch(`http://localhost:5000/api/properties/${property.id}/features`)
      ]);
      
      const images = await imagesRes.json();
      const features = await featuresRes.json();
      
      setGallery(images);
      setPropertyFeatures(features); // Ruajmë veçoritë në state
    } catch (error) {
      console.error("Failed to load property details", error);
      setGallery([]);
      setPropertyFeatures([]);
    }
  };

  const navLinks = ['HOME', 'BUY', 'RENT', 'SELL', 'MORTGAGE', 'AGENTS'];

  if (loading) {
    return <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center text-white text-2xl font-black tracking-widest uppercase">Loading properties...</div>;
  }

  return (
    <div ref={scrollRef} className="h-screen w-full bg-black overflow-y-auto scroll-smooth font-sans pb-20 text-white">
      
      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 w-full flex items-center justify-between px-12 z-[100] transition-all duration-500 ${isScrolled ? 'bg-black/80 backdrop-blur-md border-b border-white/10 py-4 shadow-2xl' : 'bg-transparent py-8'}`}>
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onBack}>
          <Building2 size={32} className="text-white group-hover:opacity-70 transition-opacity" />
          <div className="flex flex-col">
             <span className="text-white font-black text-2xl tracking-tighter uppercase italic leading-none group-hover:opacity-70 transition-opacity">KosovaNest</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => {
            const isActive = (item === 'BUY' && filterType === 'BUY') || (item === 'RENT' && filterType === 'RENT');
            return (
              <button 
                key={item} 
                onClick={() => handleNavClick(item)} 
                className={`text-white text-[10px] font-bold tracking-widest uppercase transition-all ${isActive ? 'opacity-100 border-b border-white pb-1' : 'opacity-60 hover:opacity-100'}`}
              >
                {item}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-6">
          <div className="p-2 cursor-pointer hover:bg-white/10 rounded-full transition"><User size={20} className="text-white" /></div>
          <button className="bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs px-6 py-2.5 rounded-full transition font-bold uppercase">Login</button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="pt-48 px-8 md:px-12 max-w-[1600px] mx-auto text-left">
        <header className="mb-12 space-y-8">
          <div className="flex flex-col space-y-4">
            <button onClick={onBack} className="flex items-center gap-3 text-white/50 hover:text-white transition-all group w-max">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase">Go Back Home</span>
            </button>
            <h1 className="text-6xl font-black tracking-tighter uppercase leading-[0.85]">Find Your Property</h1>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 md:rounded-[40px] rounded-3xl flex flex-col gap-6 shadow-xl">
            <div className="flex items-center gap-4 bg-black/40 rounded-full p-4 px-8 border border-white/5">
              <Search size={22} className="text-white/40" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by Address, City, or Property Name..." className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/30 font-medium" />
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="flex items-center bg-black/40 rounded-full p-1.5 border border-white/5 w-full lg:w-auto">
                {/* Secondary filters mapped to English state */}
                {['ALL', 'BUY', 'RENT'].map((type) => (
                  <button key={type} onClick={() => handleFilterToggle(type)} className={`flex-1 md:flex-none px-8 py-3 rounded-full text-[10px] font-black tracking-[0.2em] uppercase transition-all ${filterType === type ? 'bg-white text-black shadow-lg' : 'text-white/50 hover:text-white'}`}>
                    {type}
                  </button>
                ))}
              </div>

              <div className="flex-1 w-full bg-black/40 rounded-[30px] p-4 px-8 border border-white/5 flex flex-col justify-center">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Price Range</span>
                  <span className="text-sm font-black tracking-widest text-white">€{minPrice.toLocaleString()} — €{maxPrice.toLocaleString()}{maxPrice >= MAX_SLIDER_PRICE ? '+' : ''}</span>
                </div>
                <div className="relative h-1.5 bg-white/10 rounded-full w-full flex items-center">
                  <div className="absolute h-full bg-white rounded-full pointer-events-none" style={{ left: `${(minPrice / MAX_SLIDER_PRICE) * 100}%`, right: `${100 - (maxPrice / MAX_SLIDER_PRICE) * 100}%` }}></div>
                  <input type="range" min="0" max={MAX_SLIDER_PRICE} step="10000" value={minPrice} onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - 50000))} className="absolute w-full -top-2 h-6 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white cursor-grab active:cursor-grabbing" />
                  <input type="range" min="0" max={MAX_SLIDER_PRICE} step="10000" value={maxPrice} onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + 50000))} className="absolute w-full -top-2 h-6 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white cursor-grab active:cursor-grabbing" />
                </div>
              </div>

              <div className="flex items-center gap-4 bg-black/40 rounded-full p-4 px-8 border border-white/5 w-full lg:w-auto cursor-pointer">
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
        </header>

        <div className="mb-8 text-white/50 text-xs font-bold tracking-widest uppercase">
          Showing {filteredAndSorted.length} Results
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredAndSorted.map((property) => (
            <div 
              key={property.id} 
              onClick={() => openPropertyDetails(property)}
              className="group relative aspect-[4/5] rounded-[50px] overflow-hidden border border-white/5 transition-all duration-700 hover:border-white/20 shadow-2xl cursor-pointer"
            >
              <div className={`absolute top-8 right-8 z-30 px-6 py-2.5 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase ${getStatusBadgeStyle(property.status)}`}>
                {getStatusDisplay(property.status)}
              </div>
              <img src={mainImages[property.id] ||'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000'} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end">
                <div className="p-10 backdrop-blur-3xl bg-black/40 border-t border-white/10 group-hover:bg-black/60 transition-colors">
                  <div className="flex justify-between items-end mb-8">
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black tracking-tight uppercase leading-none">{property.title}</h3>
                      <div className="flex items-center gap-2 text-white/50 text-[11px] font-bold tracking-widest uppercase"><MapPin size={14} className="text-emerald-500" /> {property.location}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black tracking-tighter">€{Number(property.price).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
                    <div className="space-y-2 text-center"><p className="text-[9px] font-bold text-white/20 tracking-[0.3em] uppercase">Rooms</p><div className="flex items-center justify-center gap-2 text-md font-bold"><DoorOpen size={16} className="text-white/40" /> {property.rooms || 0}</div></div>
                    <div className="space-y-2 text-center border-x border-white/10 px-4"><p className="text-[9px] font-bold text-white/20 tracking-[0.3em] uppercase">Baths</p><div className="flex items-center justify-center gap-2 text-md font-bold"><Bath size={16} className="text-white/40" /> {property.bathrooms || 0}</div></div>
                    <div className="space-y-2 text-center"><p className="text-[9px] font-bold text-white/20 tracking-[0.3em] uppercase">Area</p><div className="flex items-center justify-center gap-2 text-md font-bold italic"><Maximize size={16} className="text-white/40" /> {property.area}</div></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* COMPACT DETAIL VIEWER OVERLAY */}
        {selectedProperty && (
          <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
            
            <div className="relative w-full max-w-5xl max-h-[85vh] bg-[#0A0A0A] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col md:flex-row">
              
              <button
                onClick={() => setSelectedProperty(null)}
                className="absolute top-4 right-4 z-50 bg-black/50 backdrop-blur-md p-3 rounded-full hover:bg-black transition border border-white/10 text-white"
              >
                <X size={20} />
              </button>

              {/* Left Side: Images */}
              <div className="relative w-full md:w-1/2 h-64 md:h-auto bg-black">
                <img
                  src={gallery.length > 0 ? `http://localhost:5000${gallery[currentImageIndex].image_url}` : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1920'}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {gallery.length > 1 && (
                  <>
                    <button onClick={() => setCurrentImageIndex((prev) => prev === 0 ? gallery.length - 1 : prev - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-md p-2 rounded-full hover:bg-black text-white">
                      <ChevronLeft size={20} />
                    </button>
                    <button onClick={() => setCurrentImageIndex((prev) => prev === gallery.length - 1 ? 0 : prev + 1)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-md p-2 rounded-full hover:bg-black text-white">
                      <ChevronRight size={20} />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white tracking-widest font-bold">
                      {currentImageIndex + 1} / {gallery.length}
                    </div>
                  </>
                )}
              </div>

              {/* Right Side: Information */}
              <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto flex flex-col justify-center">
                
                <div className="mb-6 flex flex-wrap gap-2">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-[0.2em] uppercase ${getStatusBadgeStyle(selectedProperty.status)}`}>
                    {getStatusDisplay(selectedProperty.status)}
                  </span>
                  <span className="px-4 py-1.5 rounded-full text-[9px] font-black tracking-[0.2em] uppercase bg-white/10 text-white">
                    FOR {getTypeDisplay(selectedProperty.type)}
                  </span>
                </div>

                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-[0.9] mb-4 text-white">
                  {selectedProperty.title}
                </h1>

                <p className="flex items-center gap-2 text-white/50 uppercase tracking-widest text-xs font-bold mb-10">
                  <MapPin size={14} className="text-emerald-500" />
                  {selectedProperty.location}
                </p>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-10">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold mb-1">
                    Total Price
                  </p>
                  <h2 className="text-4xl font-black tracking-tighter text-white">
                    €{Number(selectedProperty.price).toLocaleString()}
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-4 py-6 border-y border-white/10 mb-10">
                  <div className="space-y-1 text-center">
                    <DoorOpen size={20} className="text-white/30 mx-auto mb-2" />
                    <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Rooms</p>
                    <p className="text-xl font-black text-white">{selectedProperty.rooms || 0}</p>
                  </div>
                  <div className="space-y-1 text-center border-x border-white/10">
                    <Bath size={20} className="text-white/30 mx-auto mb-2" />
                    <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Baths</p>
                    <p className="text-xl font-black text-white">{selectedProperty.bathrooms || 0}</p>
                  </div>
                  <div className="space-y-1 text-center">
                    <Maximize size={20} className="text-white/30 mx-auto mb-2" />
                    <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Area</p>
                    <p className="text-xl font-black text-white">{selectedProperty.area || 0} <span className="text-sm">m²</span></p>
                  </div>
                </div>

                {/* VEÇORITË E PRONËS (Features) */}
                {propertyFeatures.length > 0 && (
                  <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold mb-4">
                      Property Features
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {propertyFeatures.map(feat => (
                        <div key={feat.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors">
                          <span className="text-[9px] text-white/50 uppercase tracking-widest font-bold">{feat.emertimi}</span>
                          <span className="text-xs text-white font-black">{feat.vlera}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button className="w-full bg-white text-black py-4 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-neutral-200 transition shadow-lg">
                  Book a Viewing
                </button>

              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicProperties;