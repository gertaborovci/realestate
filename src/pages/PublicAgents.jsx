import React, { useState, useEffect, useRef } from 'react';
import {
  Search, MapPin, Star, Phone, Mail, Building2, User,
<<<<<<< HEAD
  ArrowLeft, Calendar, Users, Award, ChevronRight, Globe,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import ConsultationModal from '../components/ConsultationModal';

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Turn a raw DB agent row into the shape the UI expects */
function normalizeAgent(a) {
  return {
    id:           a.id,
    name:         a.username  || 'Agent',
    city:         a.zone      || 'Kosovo',
    specialization: a.specialization || 'Real Estate',
    // Use specialization as the grouping category
    category:     a.specialization || 'Our Agents',
    email:        a.email     || null,
    phone:        a.phone     || null,
    bio:          a.bio       || `${a.username || 'This agent'} specializes in ${a.specialization || 'real estate'} across ${a.zone || 'Kosovo'}.`,
    license:      a.license_number  || '—',
    deals:        a.deals_closed    ?? 0,
    happyClients: a.happy_clients   ?? 0,
    joined:       a.joined_year     || '—',
    // rating: not in DB yet — show 5 as default
    rating:       5,
    image:        a.profile_image   || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.username || 'Agent')}&background=1a1a1a&color=ffffff&size=400&bold=true`,
  };
}

// ─── sub-components ───────────────────────────────────────────────────────────

function AgentCardSkeleton() {
  return (
    <div className="bg-[#0a0a0a] rounded-[40px] border border-white/5 overflow-hidden animate-pulse">
      <div className="h-72 bg-white/5" />
      <div className="p-8 space-y-4">
        <div className="h-3 w-16 bg-white/10 rounded-full" />
        <div className="h-8 w-48 bg-white/10 rounded-full" />
        <div className="border-t border-white/5 pt-6 mt-4 flex justify-between items-center">
          <div className="h-3 w-24 bg-white/10 rounded-full" />
          <div className="w-10 h-10 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function AgentCard({ agent, onSelect }) {
  return (
    <div
      onClick={() => onSelect(agent)}
      className="group cursor-pointer relative bg-[#0a0a0a] rounded-[40px] border border-white/5 overflow-hidden
                 hover:shadow-2xl hover:border-white/20 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full"
    >
=======
  ArrowLeft, Calendar, Users, Award, ChevronRight, Globe, Check,
} from 'lucide-react';
import { getCurrentUser } from '../lib/auth';
import { apiFetch } from '../lib/api';

/* ─────────────────────────────────────────────────────────────────────────── */
/* Star display: supports half-stars (e.g. 3.5 → ███▌░)                       */
/* ─────────────────────────────────────────────────────────────────────────── */
function StarDisplay({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const half   = !filled && rating >= star - 0.5;
        return (
          <div key={star} className="relative inline-flex flex-shrink-0" style={{ width: size, height: size }}>
            <Star size={size} className="absolute text-white/20" />
            {(filled || half) && (
              <div className="absolute overflow-hidden" style={{ width: half ? '50%' : '100%' }}>
                <Star size={size} className="text-yellow-400 fill-yellow-400" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Interactive star input: click left half = .5, right half = full star        */
/* ─────────────────────────────────────────────────────────────────────────── */
function StarInput({ value, onChange, size = 34 }) {
  const [hovered, setHovered] = useState(null);
  const display = hovered !== null ? hovered : value;

  const resolve = (e, star) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return e.clientX - rect.left < rect.width / 2 ? star - 0.5 : star;
  };

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = display >= star;
        const half   = !filled && display >= star - 0.5;
        return (
          <div
            key={star}
            className="relative cursor-pointer select-none"
            style={{ width: size, height: size }}
            onMouseMove={(e) => setHovered(resolve(e, star))}
            onClick={(e) => onChange(resolve(e, star))}
          >
            <Star size={size} className="absolute text-white/20" />
            {(filled || half) && (
              <div className="absolute overflow-hidden" style={{ width: half ? '50%' : '100%' }}>
                <Star size={size} className="text-yellow-400 fill-yellow-400" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Main component                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */
const PublicAgents = ({ onNavigate }) => {
  const DEMO_AGENTS = [
    { id: 1, name: 'Genc Berisha',   city: 'Prishtina', rating: 5,   phone: '+383 44 123 456', email: 'genc@kosovanest.com',   deals: 42, joined: '2015', happyClients: 120, category: 'Top Prishtina Agents',   bio: 'Genc specializes in luxury apartments in the heart of Prishtina. With over a decade of experience, he is the go-to expert for premium real estate investments.', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=800' },
    { id: 2, name: 'Ermal Krasniqi', city: 'Prizren',   rating: 4,   phone: '+383 49 987 654', email: 'ermal@kosovanest.com',  deals: 28, joined: '2019', happyClients: 85,  category: 'The Legacy Advisors',     bio: 'Ermal understands the historical value of properties. Based in Prizren, he helps clients find homes with character, history, and legacy.', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800' },
    { id: 3, name: 'Dafina Hoxha',   city: 'Peja',      rating: 5,   phone: '+383 45 333 222', email: 'dafina@kosovanest.com', deals: 55, joined: '2012', happyClients: 200, category: 'The Legacy Advisors',     bio: 'Dafina is a powerhouse in the Dukagjini region. Her extensive network and sharp negotiation skills ensure her clients always get the best possible deal.', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800' },
    { id: 4, name: 'Luan Gashi',     city: 'Prishtina', rating: 5,   phone: '+383 44 111 000', email: 'luan@kosovanest.com',   deals: 89, joined: '2010', happyClients: 310, category: 'Top Prishtina Agents',   bio: 'Luan has been with KosovaNest since the beginning. He handles our most exclusive commercial and residential listings in the capital.', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800' },
    { id: 5, name: 'Teuta Kelmendi', city: 'Gjakova',   rating: 4,   phone: '+383 49 555 444', email: 'teuta@kosovanest.com',  deals: 37, joined: '2021', happyClients: 45,  category: 'Rental Specialists',      bio: 'Looking for the perfect apartment to lease? Teuta moves fast and knows exactly what is hitting the market before anyone else does.', image: 'https://images.unsplash.com/photo-1598550874175-4d0ef436c909?q=80&w=800' },
    { id: 6, name: 'Besnik Thaqi',   city: 'Ferizaj',   rating: 4,   phone: '+383 45 777 888', email: 'besnik@kosovanest.com', deals: 19, joined: '2022', happyClients: 25,  category: 'Rental Specialists',      bio: 'Besnik is our rising star in Ferizaj, specializing in quick, seamless residential rentals for young professionals and families.', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800' },
  ];

  const [searchTerm,     setSearchTerm]     = useState('');
  const [selectedCity,   setSelectedCity]   = useState('All');
  const [minRating,      setMinRating]      = useState(0);
  const [selectedAgent,  setSelectedAgent]  = useState(null);
  const [isScrolled,     setIsScrolled]     = useState(false);

  // Rating form state (detail view)
  const [userRating,    setUserRating]    = useState(0);
  const [userComment,   setUserComment]   = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [existingRatingId, setExistingRatingId] = useState(null);

  const scrollRef  = useRef(null);
  const pageTopRef = useRef(null);

  // Scroll to top when agent detail opens
  useEffect(() => {
    if (selectedAgent && pageTopRef.current) {
      setTimeout(() => pageTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  }, [selectedAgent]);

  // Scroll detection for navbar
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handle = () => setIsScrolled(el.scrollTop > 50);
    el.addEventListener('scroll', handle);
    return () => el.removeEventListener('scroll', handle);
  }, []);

  // Load user's existing rating when an agent is selected
  useEffect(() => {
    if (!selectedAgent) return;
    setUserRating(0);
    setUserComment('');
    setRatingSubmitted(false);
    setExistingRatingId(null);

    const user = getCurrentUser();
    if (!user) return;

    apiFetch(`/api/ratings/user/${user.id}`)
      .then((ratings) => {
        const existing = ratings.find((r) => r.agent_id === selectedAgent.id);
        if (existing) {
          setUserRating(Number(existing.rating));
          setUserComment(existing.comment || '');
          setExistingRatingId(existing.id);
          setRatingSubmitted(true);
        }
      })
      .catch(() => {});
  }, [selectedAgent]);

  const handleSubmitRating = async () => {
    const user = getCurrentUser();
    if (!user) { onNavigate('signin'); return; }
    if (userRating === 0) { alert('Please select a star rating.'); return; }

    setRatingLoading(true);
    try {
      await apiFetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:    user.id,
          agent_id:   selectedAgent.id,
          agent_name: selectedAgent.name,
          rating:     userRating,
          comment:    userComment,
        }),
      });
      setRatingSubmitted(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setRatingLoading(false);
    }
  };

  const kosovoCities = ['All', 'Prishtina', 'Prizren', 'Peja', 'Gjakova', 'Mitrovica', 'Gjilan', 'Ferizaj'];
  const categories   = ['Top Prishtina Agents', 'The Legacy Advisors', 'Rental Specialists'];

  const isFiltering     = searchTerm !== '' || selectedCity !== 'All' || minRating !== 0;
  const filteredAgents  = DEMO_AGENTS.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCity === 'All' || a.city === selectedCity) &&
    a.rating >= minRating
  );

  /* ── Agent card ── */
  const AgentCard = ({ agent }) => (
    <div
      onClick={() => setSelectedAgent(agent)}
      className="group cursor-pointer relative bg-[#0a0a0a] rounded-[40px] border border-white/5 overflow-hidden hover:shadow-2xl hover:border-white/20 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full"
    >
      {/* Image — no star badge any more */}
>>>>>>> origin/main
      <div className="h-72 w-full overflow-hidden relative grayscale group-hover:grayscale-0 transition-all duration-700">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10" />
        <img
          src={agent.image}
          alt={agent.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
<<<<<<< HEAD
        <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 z-20 border border-white/10">
          <Star size={14} className="text-yellow-500 fill-yellow-500" />
          <span className="text-xs font-bold">{agent.rating}.0</span>
        </div>
=======
>>>>>>> origin/main
      </div>

      {/* Content */}
      <div className="p-8 relative z-20 -mt-8 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/40 mb-2">{agent.city}</p>
          <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-4">{agent.name}</h3>
        </div>
<<<<<<< HEAD
        <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-4">
          <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase">
            <span className="text-white text-lg">{agent.deals}</span> deals closed
          </p>
          <div className="bg-white text-black p-3 rounded-full hover:scale-110 transition-transform">
            <ChevronRight size={16} />
=======

        {/* Bottom: deals + stars */}
        <div className="border-t border-white/5 pt-6 mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase">
              <span className="text-white text-lg">{agent.deals}</span> deals closed
            </p>
            <div className="bg-white text-black p-3 rounded-full group-hover:scale-110 transition-transform">
              <ChevronRight size={16} />
            </div>
          </div>
          {/* Star display with rating number */}
          <div className="flex items-center gap-2">
            <StarDisplay rating={agent.rating} size={13} />
            <span className="text-white/40 text-xs font-bold tabular-nums">{agent.rating}.0</span>
>>>>>>> origin/main
          </div>
        </div>
      </div>
    </div>
  );
}

<<<<<<< HEAD
// ─── main component ───────────────────────────────────────────────────────────

const PublicAgents = ({ onNavigate }) => {
  const [agents, setAgents]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [searchTerm, setSearchTerm]       = useState('');
  const [selectedCity, setSelectedCity]   = useState('All');
  const [minRating, setMinRating]         = useState(0);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showModal, setShowModal]         = useState(false);
  const [isScrolled, setIsScrolled]       = useState(false);
  const scrollRef  = useRef(null);
  const pageTopRef = useRef(null);

  // ── fetch agents from DB ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const raw = await apiFetch('/api/agents');
        setAgents(Array.isArray(raw) ? raw.map(normalizeAgent) : []);
      } catch (err) {
        setError('Could not load agents. Please make sure the server is running.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── scroll-to-top when detail opens ──────────────────────────────────────
  useEffect(() => {
    if (selectedAgent && pageTopRef.current) {
      setTimeout(() => pageTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  }, [selectedAgent]);

  // ── shrinking navbar on scroll ────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setIsScrolled(el.scrollTop > 50);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // ── derived data ──────────────────────────────────────────────────────────
  const cities = ['All', ...Array.from(new Set(agents.map((a) => a.city).filter(Boolean))).sort()];
  const categories = [...new Set(agents.map((a) => a.category).filter(Boolean))];

  const isFiltering = searchTerm !== '' || selectedCity !== 'All' || minRating !== 0;

  const filtered = agents.filter((a) => {
    const matchName   = a.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCity   = selectedCity === 'All' || a.city === selectedCity;
    const matchRating = a.rating >= minRating;
    return matchName && matchCity && matchRating;
  });

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={scrollRef}
      className="h-screen w-full bg-black text-white font-sans overflow-y-auto overflow-x-hidden flex flex-col"
    >
      <div ref={pageTopRef} className="absolute top-0 w-full h-1" />

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 w-full flex items-center justify-between px-12 z-[100] transition-all duration-500 ${
        isScrolled
          ? 'bg-black/80 backdrop-blur-md border-b border-white/10 py-4 shadow-2xl'
          : 'bg-transparent py-8'
=======
  /* ── Detail view ── */
  const loggedIn = !!getCurrentUser();

  return (
    <div ref={scrollRef} className="h-screen w-full bg-black text-white font-sans overflow-y-auto overflow-x-hidden flex flex-col">
      <div ref={pageTopRef} className="absolute top-0 w-full h-1" />

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 w-full flex items-center justify-between px-12 z-[100] transition-all duration-500 ${
        isScrolled ? 'bg-black/80 backdrop-blur-md border-b border-white/10 py-4 shadow-2xl' : 'bg-transparent py-8'
>>>>>>> origin/main
      }`}>
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onNavigate('hero')}
        >
          <Building2 size={32} className="text-white group-hover:opacity-70 transition-opacity" />
          <div className="flex flex-col">
<<<<<<< HEAD
            <span className="text-white font-black text-2xl tracking-tighter uppercase italic leading-none group-hover:opacity-70 transition-opacity">
              KosovaNest
            </span>
            <span className="text-white/80 text-[10px] font-bold tracking-[0.3em] uppercase leading-none mt-1">
              Real Estate Group
            </span>
=======
            <span className="text-white font-black text-2xl tracking-tighter uppercase italic leading-none group-hover:opacity-70 transition-opacity">KosovaNest</span>
            <span className="text-white/80 text-[10px] font-bold tracking-[0.3em] uppercase leading-none mt-1">Real Estate Group</span>
>>>>>>> origin/main
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
<<<<<<< HEAD
          {['HOME', 'BUY', 'RENT', 'SELL', 'AGENTS'].map((item) => (
            <button
              key={item}
              onClick={() => onNavigate(
                item === 'AGENTS' ? 'agents'
                : (item === 'BUY' || item === 'RENT') ? 'properties'
                : 'hero'
              )}
              className={`text-[10px] font-bold tracking-widest uppercase transition-all ${
                item === 'AGENTS'
                  ? 'text-white opacity-100 border-b border-white pb-1'
                  : 'text-white opacity-60 hover:opacity-100'
              }`}
=======
          {['HOME', 'BUY', 'RENT', 'SELL', 'MORTGAGE', 'AGENTS'].map((item) => (
            <button
              key={item}
              onClick={() => onNavigate(item === 'AGENTS' ? 'agents' : (item === 'BUY' || item === 'RENT' ? 'properties' : 'hero'))}
              className={`text-[10px] font-bold tracking-widest uppercase transition-all ${item === 'AGENTS' ? 'text-white opacity-100 border-b border-white pb-1' : 'text-white opacity-60 hover:opacity-100'}`}
>>>>>>> origin/main
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <div
            className="p-2 cursor-pointer hover:bg-white/10 rounded-full transition"
            onClick={() => onNavigate('user-profile')}
          >
            <User size={20} className="text-white" />
          </div>
          <button
            onClick={() => onNavigate('signin')}
            className="bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs px-6 py-2.5 rounded-full transition font-bold uppercase"
          >
            Login
          </button>
        </div>
      </nav>

      {/* ── Content ── */}
      <div className="flex-1 pt-48 pb-32">

        {/* Agent detail view */}
        {selectedAgent ? (
          /* ─────────── AGENT DETAIL VIEW ─────────── */
          <div className="max-w-6xl mx-auto px-12 animate-in fade-in slide-in-from-bottom-10 duration-500">
            <button
              onClick={() => setSelectedAgent(null)}
              className="flex items-center gap-3 text-[10px] font-black tracking-[0.3em] uppercase text-white/50 hover:text-white transition-colors mb-12"
            >
              <ArrowLeft size={16} /> Back to Directory
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
<<<<<<< HEAD
              {/* Photo */}
=======
              {/* Left: photo */}
>>>>>>> origin/main
              <div className="h-[600px] w-full rounded-[50px] overflow-hidden border border-white/10 relative shadow-2xl">
                <img
                  src={selectedAgent.image}
                  alt={selectedAgent.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-10 left-10">
                  <p className="text-[12px] font-black tracking-[0.4em] uppercase text-white/60 mb-2">
                    {selectedAgent.specialization}
                  </p>
                  <h1 className="text-5xl font-black uppercase italic tracking-tighter">
                    {selectedAgent.name}
                  </h1>
                </div>
              </div>

<<<<<<< HEAD
              {/* Info */}
              <div className="flex flex-col justify-center space-y-10">
                <p className="text-lg text-white/60 leading-relaxed font-medium">
                  {selectedAgent.bio}
                </p>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 p-7 rounded-[28px]">
                    <Building2 size={22} className="text-white/40 mb-4" />
                    <h4 className="text-4xl font-black">{selectedAgent.deals}</h4>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mt-1">Properties Sold</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-7 rounded-[28px]">
                    <Calendar size={22} className="text-white/40 mb-4" />
                    <h4 className="text-4xl font-black">{selectedAgent.joined}</h4>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mt-1">Joined KosovaNest</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-7 rounded-[28px]">
                    <Users size={22} className="text-white/40 mb-4" />
                    <h4 className="text-4xl font-black">{selectedAgent.happyClients > 0 ? `${selectedAgent.happyClients}+` : '—'}</h4>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mt-1">Happy Clients</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-7 rounded-[28px]">
                    <Award size={22} className="text-white/40 mb-4" />
                    <h4 className="text-4xl font-black">{selectedAgent.rating}.0</h4>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mt-1">Client Rating</p>
                  </div>
                </div>

                {/* Contact details */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-4 text-white/70">
                    <MapPin size={18} className="text-white/40 shrink-0" />
                    <span className="font-bold tracking-wide">{selectedAgent.city}, Kosovo</span>
                  </div>
                  {selectedAgent.phone && (
                    <div className="flex items-center gap-4 text-white/70">
                      <Phone size={18} className="text-white/40 shrink-0" />
                      <span className="font-bold tracking-wide">{selectedAgent.phone}</span>
                    </div>
                  )}
                  {selectedAgent.email && (
                    <div className="flex items-center gap-4 text-white/70">
                      <Mail size={18} className="text-white/40 shrink-0" />
                      <span className="font-bold tracking-wide">{selectedAgent.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-white/70">
                    <Award size={18} className="text-white/40 shrink-0" />
                    <span className="font-bold tracking-wide font-mono text-sm">
                      License: {selectedAgent.license}
                    </span>
                  </div>
                </div>

                {/* Schedule button */}
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-white text-black py-5 rounded-full font-black text-[12px] tracking-[0.3em]
                             uppercase hover:bg-gray-200 transition-colors"
                >
=======
              {/* Right: info + rating form */}
              <div className="flex flex-col justify-start space-y-10">
                <p className="text-xl text-white/60 leading-relaxed font-medium">{selectedAgent.bio}</p>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { icon: <Building2 size={22} className="text-white/40 mb-3" />, value: selectedAgent.deals, label: 'Properties Sold' },
                    { icon: <Calendar size={22} className="text-white/40 mb-3" />,  value: selectedAgent.joined, label: 'Joined KosovaNest' },
                    { icon: <Users size={22} className="text-white/40 mb-3" />,     value: `${selectedAgent.happyClients}+`, label: 'Happy Clients' },
                    { icon: <Award size={22} className="text-white/40 mb-3" />,     value: `${selectedAgent.rating}.0`, label: 'Avg. Rating' },
                  ].map(({ icon, value, label }) => (
                    <div key={label} className="bg-white/5 border border-white/10 p-6 rounded-[28px]">
                      {icon}
                      <h4 className="text-3xl font-black">{value}</h4>
                      <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mt-1">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Contact info */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-4 text-white/70"><MapPin size={18} className="text-white/40 flex-shrink-0" /> <span className="font-bold">{selectedAgent.city}, Kosovo</span></div>
                  <div className="flex items-center gap-4 text-white/70"><Phone size={18} className="text-white/40 flex-shrink-0" /> <span className="font-bold">{selectedAgent.phone}</span></div>
                  <div className="flex items-center gap-4 text-white/70"><Mail size={18} className="text-white/40 flex-shrink-0" /> <span className="font-bold">{selectedAgent.email}</span></div>
                </div>

                {/* ── Rate this Agent ── */}
                <div className="bg-white/5 border border-white/10 rounded-[28px] p-8 space-y-5">
                  <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/40">Rate this Agent</p>

                  {!loggedIn ? (
                    <div className="text-center py-4">
                      <p className="text-white/40 text-sm mb-4">Sign in to leave a rating</p>
                      <button
                        onClick={() => onNavigate('signin')}
                        className="bg-white text-black px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 transition"
                      >
                        Sign In
                      </button>
                    </div>
                  ) : ratingSubmitted ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <StarDisplay rating={userRating} size={20} />
                        <span className="text-white font-black text-lg">{userRating}</span>
                        <span className="text-white/40 text-xs uppercase tracking-widest font-bold">Your rating</span>
                      </div>
                      {userComment && (
                        <p className="text-white/60 text-sm italic">"{userComment}"</p>
                      )}
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                        <Check size={14} /> Rating saved — view &amp; edit in your{' '}
                        <button
                          onClick={() => onNavigate('user-dashboard')}
                          className="underline hover:text-emerald-300 transition"
                        >
                          profile
                        </button>
                      </div>
                      {/* Allow re-editing inline */}
                      <button
                        onClick={() => setRatingSubmitted(false)}
                        className="text-white/30 hover:text-white text-xs font-bold transition"
                      >
                        Edit rating
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <StarInput value={userRating} onChange={setUserRating} size={34} />
                      {userRating > 0 && (
                        <p className="text-yellow-400/60 text-xs font-bold">
                          {userRating === 5 ? 'Excellent!' : userRating >= 4 ? 'Great!' : userRating >= 3 ? 'Good' : userRating >= 2 ? 'Fair' : 'Poor'}
                          {' '}— {userRating} / 5
                        </p>
                      )}
                      <textarea
                        value={userComment}
                        onChange={(e) => setUserComment(e.target.value)}
                        rows={3}
                        placeholder="Leave a comment (optional)..."
                        className="w-full bg-black/50 border border-white/10 focus:border-white/30 text-white text-sm rounded-xl px-4 py-3 outline-none resize-none transition placeholder:text-white/20"
                      />
                      <button
                        onClick={handleSubmitRating}
                        disabled={ratingLoading || userRating === 0}
                        className="bg-white text-black px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 transition disabled:opacity-40"
                      >
                        {ratingLoading ? 'Saving…' : existingRatingId ? 'Update Rating' : 'Submit Rating'}
                      </button>
                    </div>
                  )}
                </div>

                <button className="bg-white text-black py-5 rounded-full font-black text-[12px] tracking-[0.3em] uppercase hover:bg-gray-200 transition-colors">
>>>>>>> origin/main
                  Schedule a Consultation
                </button>
              </div>
            </div>
          </div>

        ) : (
<<<<<<< HEAD
          /* ── Agent directory / listing ── */
=======
          /* ─────────── AGENT LISTING VIEW ─────────── */
>>>>>>> origin/main
          <div className="animate-in fade-in duration-500">

            {/* Hero heading */}
            <section className="px-12 md:px-24 max-w-7xl mx-auto mb-16">
              <h1 className="text-7xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.8] mb-6">
                Meet Our <br /><span className="text-white/40">Elite Agents</span>
              </h1>
              <p className="text-[11px] font-bold tracking-[0.4em] uppercase text-white/60 max-w-xl leading-loose">
<<<<<<< HEAD
                The most trusted real estate professionals in Kosovo.
                Every profile is pulled live from our database.
              </p>
            </section>

            {/* Search / filter bar */}
=======
                The most trusted real estate professionals in Kosovo. Curated for architectural excellence and premium service.
              </p>
            </section>

            {/* Filters */}
>>>>>>> origin/main
            <section className="px-12 md:px-24 max-w-7xl mx-auto mb-20">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[30px] flex flex-col md:flex-row gap-6 items-center justify-between">
                {/* Name search */}
                <div className="flex items-center bg-black/50 px-6 py-4 rounded-full flex-1 w-full border border-white/5 focus-within:border-white/20 transition-colors">
<<<<<<< HEAD
                  <Search size={18} className="text-white/40 mr-3 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search agent by name…"
=======
                  <Search size={18} className="text-white/40 mr-3" />
                  <input
                    type="text"
                    placeholder="Search agent by name..."
>>>>>>> origin/main
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-white/30 tracking-wide"
                  />
                </div>

                {/* City filter — built from live DB data */}
                <div className="flex items-center gap-3 w-full md:w-auto">
<<<<<<< HEAD
                  <MapPin size={18} className="text-white/40 shrink-0" />
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="bg-black border border-white/10 text-white text-xs font-bold uppercase tracking-widest
                               px-6 py-4 rounded-full outline-none focus:border-white/30 cursor-pointer"
                  >
                    {cities.map((c) => (
                      <option key={c} value={c}>{c === 'All' ? 'All Cities' : c}</option>
                    ))}
=======
                  <MapPin size={18} className="text-white/40" />
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="bg-black border border-white/10 text-white text-xs font-bold uppercase tracking-widest px-6 py-4 rounded-full outline-none focus:border-white/30 cursor-pointer"
                  >
                    {kosovoCities.map((city) => <option key={city} value={city}>{city === 'All' ? 'All Cities' : city}</option>)}
>>>>>>> origin/main
                  </select>
                </div>

                {/* Rating filter */}
                <div className="flex items-center gap-2 bg-black/50 p-2 rounded-full border border-white/5">
                  <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase px-3 hidden md:block">Rating:</span>
                  {[0, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => setMinRating(r)}
<<<<<<< HEAD
                      className={`flex items-center gap-1 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                        minRating === r ? 'bg-white text-black' : 'hover:bg-white/10 text-white/60'
                      }`}
=======
                      className={`flex items-center gap-1 px-4 py-2 rounded-full text-xs font-bold transition-all ${minRating === r ? 'bg-white text-black' : 'hover:bg-white/10 text-white/60'}`}
>>>>>>> origin/main
                    >
                      {r === 0 ? 'All' : <>{r}+ <Star size={12} className={minRating === r ? 'fill-black' : 'fill-white/40'} /></>}
                    </button>
                  ))}
                </div>
              </div>
            </section>

<<<<<<< HEAD
            {/* Grid / categories */}
            <section className="px-12 md:px-24 max-w-7xl mx-auto">

              {/* Loading skeletons */}
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                  {[1, 2, 3].map((n) => <AgentCardSkeleton key={n} />)}
                </div>
              )}

              {/* Error state */}
              {!loading && error && (
                <div className="text-center py-20 space-y-4">
                  <p className="text-red-400 font-bold text-lg">{error}</p>
                  <p className="text-white/40 text-sm">Start the backend with <code className="bg-white/10 px-2 py-1 rounded">cd backend && npm run dev</code></p>
                </div>
              )}

              {/* No results */}
              {!loading && !error && filtered.length === 0 && (
                <div className="text-center py-20 opacity-50 italic text-xl">
                  No agents found matching your criteria.
                </div>
              )}

              {/* Active filter — flat grid */}
              {!loading && !error && filtered.length > 0 && isFiltering && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                  {filtered.map((a) => (
                    <AgentCard key={a.id} agent={a} onSelect={setSelectedAgent} />
                  ))}
                </div>
              )}

              {/* No filter — grouped by specialization */}
              {!loading && !error && agents.length > 0 && !isFiltering && (
                <div className="space-y-24">
                  {categories.map((cat) => {
                    const group = agents.filter((a) => a.category === cat);
                    if (!group.length) return null;
=======
            {/* Grid */}
            <section className="px-12 md:px-24 max-w-7xl mx-auto">
              {isFiltering ? (
                filteredAgents.length === 0
                  ? <div className="text-center py-20 opacity-50 italic text-xl">No agents found matching your criteria.</div>
                  : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">{filteredAgents.map((a) => <AgentCard key={a.id} agent={a} />)}</div>
              ) : (
                <div className="space-y-24">
                  {categories.map((category) => {
                    const list = DEMO_AGENTS.filter((a) => a.category === category);
                    if (!list.length) return null;
>>>>>>> origin/main
                    return (
                      <div key={cat}>
                        <div className="flex items-end justify-between mb-10 border-b border-white/10 pb-6">
<<<<<<< HEAD
                          <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">{cat}</h2>
                          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40">
                            {group.length} {group.length === 1 ? 'Agent' : 'Agents'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                          {group.map((a) => (
                            <AgentCard key={a.id} agent={a} onSelect={setSelectedAgent} />
                          ))}
=======
                          <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">{category}</h2>
                          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40">{list.length} Agents</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                          {list.map((a) => <AgentCard key={a.id} agent={a} />)}
>>>>>>> origin/main
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

<<<<<<< HEAD
      {/* ── Footer ── */}
=======
      {/* Footer */}
>>>>>>> origin/main
      <section className="w-full bg-[#050505] text-white p-16 md:p-24 flex flex-col justify-between mt-auto">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-20 py-10">
          <div className="space-y-10">
            <h2 className="text-6xl font-black tracking-tighter uppercase leading-[0.8]">About Us</h2>
<<<<<<< HEAD
            <p className="text-2xl font-medium tracking-tight leading-relaxed max-w-lg opacity-60">
              KosovaNest is the leading premium real estate network in Kosovo. We specialize in
              identifying architectural legacies and providing elite, transparent service to buyers,
              sellers, and investors across the region.
            </p>
=======
            <p className="text-2xl font-medium tracking-tight leading-relaxed max-w-lg opacity-60">KosovaNest is the leading premium real estate network in Kosovo. We specialize in identifying architectural legacies and providing elite, transparent service to buyers, sellers, and investors across the region.</p>
>>>>>>> origin/main
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
<<<<<<< HEAD
          </div>
        </div>
        <div className="max-w-7xl mx-auto w-full pt-16 mt-16 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black tracking-[0.6em] uppercase opacity-40">
          <span>© 2026 KosovaNest. All Rights Reserved.</span>
          <div className="flex gap-8">
            <span>Premium Properties</span>
            <span>•</span>
            <span>Elite Service</span>
          </div>
        </div>
=======
          </div>
        </div>
        <div className="max-w-7xl mx-auto w-full pt-16 mt-16 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black tracking-[0.6em] uppercase opacity-40">
          <span>© 2026 KosovaNest. All Rights Reserved.</span>
          <div className="flex gap-8"><span>Premium Properties</span><span>•</span><span>Elite Service</span></div>
        </div>
>>>>>>> origin/main
      </section>

      {/* ── Consultation modal ── */}
      {showModal && selectedAgent && (
        <ConsultationModal
          agentId={selectedAgent.id}
          agentName={selectedAgent.name}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default PublicAgents;
