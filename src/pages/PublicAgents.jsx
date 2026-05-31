import React, { useState, useEffect, useRef } from 'react';
import {
  Search, MapPin, Star, Phone, Mail, Building2, User,
  ArrowLeft, Calendar, Users, Award, ChevronRight, Globe, Check,
} from 'lucide-react';
import { getCurrentUser } from '../lib/auth';
import { apiFetch, API_BASE } from '../lib/api';
import ConsultationModal from '../components/ConsultationModal';

// ─── helpers ──────────────────────────────────────────────────────────────────

function normalizeAgent(a) {
  return {
    id:             a.id,
    name:           a.username         || 'Agent',
    city:           a.zone             || 'Kosovo',
    specialization: a.specialization   || 'Real Estate',
    category:       a.specialization   || 'Our Agents',
    email:          a.email            || null,
    phone:          a.phone            || null,
    bio:            a.bio              || `${a.username || 'This agent'} specializes in ${a.specialization || 'real estate'} across ${a.zone || 'Kosovo'}.`,
    license:        a.license_number   || '—',
    deals:          a.deals_closed     ?? 0,
    happyClients:   a.happy_clients    ?? 0,
    joined:         a.joined_year      || '—',
    rating:         5,
    image:          a.photo_url
                      ? (a.photo_url.startsWith('http') ? a.photo_url : `${API_BASE}${a.photo_url}`)
                      : a.profile_image
                      || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.username || 'Agent')}&background=1a1a1a&color=ffffff&size=400&bold=true`,
  };
}

// ─── sub-components ───────────────────────────────────────────────────────────

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
      <div className="h-72 w-full overflow-hidden relative grayscale group-hover:grayscale-0 transition-all duration-700">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10" />
        <img
          src={agent.image}
          alt={agent.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      </div>

      <div className="p-8 relative z-20 -mt-8 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/40 mb-2">{agent.city}</p>
          <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-4">{agent.name}</h3>
        </div>

        <div className="border-t border-white/5 pt-6 mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase">
              <span className="text-white text-lg">{agent.deals}</span> deals closed
            </p>
            <div className="bg-white text-black p-3 rounded-full group-hover:scale-110 transition-transform">
              <ChevronRight size={16} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StarDisplay rating={agent.rating} size={13} />
            <span className="text-white/40 text-xs font-bold tabular-nums">{agent.rating}.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

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

  const [userRating,       setUserRating]       = useState(0);
  const [userComment,      setUserComment]      = useState('');
  const [ratingLoading,    setRatingLoading]    = useState(false);
  const [ratingSubmitted,  setRatingSubmitted]  = useState(false);
  const [existingRatingId, setExistingRatingId] = useState(null);

  const scrollRef  = useRef(null);
  const pageTopRef = useRef(null);

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

  useEffect(() => {
    if (selectedAgent && pageTopRef.current) {
      setTimeout(() => pageTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  }, [selectedAgent]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setIsScrolled(el.scrollTop > 50);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

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

  const cities      = ['All', ...Array.from(new Set(agents.map((a) => a.city).filter(Boolean))).sort()];
  const categories  = [...new Set(agents.map((a) => a.category).filter(Boolean))];
  const isFiltering = searchTerm !== '' || selectedCity !== 'All' || minRating !== 0;
  const filtered    = agents.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCity === 'All' || a.city === selectedCity) &&
    a.rating >= minRating
  );

  const loggedIn = !!getCurrentUser();

  return (
    <div
      ref={scrollRef}
      className="h-screen w-full bg-black text-white font-sans overflow-y-auto overflow-x-hidden flex flex-col"
    >
      <div ref={pageTopRef} className="absolute top-0 w-full h-1" />

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 w-full flex items-center justify-between px-12 z-[100] transition-all duration-500 ${
        isScrolled
          ? 'bg-black/80 backdrop-blur-md border-b border-white/10 py-4 shadow-2xl'
          : 'bg-transparent py-8'
      }`}>
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onNavigate('hero')}
        >
          <Building2 size={32} className="text-white group-hover:opacity-70 transition-opacity" />
          <div className="flex flex-col">
            <span className="text-white font-black text-2xl tracking-tighter uppercase italic leading-none group-hover:opacity-70 transition-opacity">
              KosovaNest
            </span>
            <span className="text-white/80 text-[10px] font-bold tracking-[0.3em] uppercase leading-none mt-1">
              Real Estate Group
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['HOME', 'BUY', 'RENT', 'SELL', 'AGENTS', 'NEIGHBOURHOODS'].map((item) => (
            <button
              key={item}
              onClick={() => onNavigate(
                item === 'AGENTS'         ? 'agents'
                : item === 'NEIGHBOURHOODS' ? 'neighborhoods'
                : (item === 'BUY' || item === 'RENT') ? 'properties'
                : 'hero'
              )}
              className={`text-[10px] font-bold tracking-widest uppercase transition-all ${
                item === 'AGENTS'
                  ? 'text-white opacity-100 border-b border-white pb-1'
                  : 'text-white opacity-60 hover:opacity-100'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <div
            className="p-2 cursor-pointer hover:bg-white/10 rounded-full transition"
            onClick={() => {
              const u = getCurrentUser();
              if (!u) { onNavigate('signin'); return; }
              if (u.role === 'admin') onNavigate('dashboard');
              else if (u.role === 'agent') onNavigate('agent-dashboard');
              else onNavigate('user-profile');
            }}
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

      {/* Content */}
      <div className="flex-1 pt-48 pb-32">

        {selectedAgent ? (
          /* ── Agent detail view ── */
          <div className="max-w-6xl mx-auto px-12 animate-in fade-in slide-in-from-bottom-10 duration-500">
            <button
              onClick={() => setSelectedAgent(null)}
              className="flex items-center gap-3 text-[10px] font-black tracking-[0.3em] uppercase text-white/50 hover:text-white transition-colors mb-12"
            >
              <ArrowLeft size={16} /> Back to Directory
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              {/* Left: photo */}
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

              {/* Right: info + rating form */}
              <div className="flex flex-col justify-start space-y-10">
                <p className="text-lg text-white/60 leading-relaxed font-medium">
                  {selectedAgent.bio}
                </p>

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

                {/* Rate this Agent */}
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

                <button
                  onClick={() => setShowModal(true)}
                  className="bg-white text-black py-5 rounded-full font-black text-[12px] tracking-[0.3em] uppercase hover:bg-gray-200 transition-colors"
                >
                  Schedule a Consultation
                </button>
              </div>
            </div>
          </div>

        ) : (
          /* ── Agent listing view ── */
          <div className="animate-in fade-in duration-500">

            <section className="px-12 md:px-24 max-w-7xl mx-auto mb-16">
              <h1 className="text-7xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.8] mb-6">
                Meet Our <br /><span className="text-white/40">Elite Agents</span>
              </h1>
              <p className="text-[11px] font-bold tracking-[0.4em] uppercase text-white/60 max-w-xl leading-loose">
                The most trusted real estate professionals in Kosovo.
                Every profile is pulled live from our database.
              </p>
            </section>

            <section className="px-12 md:px-24 max-w-7xl mx-auto mb-20">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[30px] flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="flex items-center bg-black/50 px-6 py-4 rounded-full flex-1 w-full border border-white/5 focus-within:border-white/20 transition-colors">
                  <Search size={18} className="text-white/40 mr-3 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search agent by name…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-white/30 tracking-wide"
                  />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
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
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-black/50 p-2 rounded-full border border-white/5">
                  <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase px-3 hidden md:block">Rating:</span>
                  {[0, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => setMinRating(r)}
                      className={`flex items-center gap-1 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                        minRating === r ? 'bg-white text-black' : 'hover:bg-white/10 text-white/60'
                      }`}
                    >
                      {r === 0 ? 'All' : <>{r}+ <Star size={12} className={minRating === r ? 'fill-black' : 'fill-white/40'} /></>}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="px-12 md:px-24 max-w-7xl mx-auto">

              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                  {[1, 2, 3].map((n) => <AgentCardSkeleton key={n} />)}
                </div>
              )}

              {!loading && error && (
                <div className="text-center py-20 space-y-4">
                  <p className="text-red-400 font-bold text-lg">{error}</p>
                  <p className="text-white/40 text-sm">Start the backend with <code className="bg-white/10 px-2 py-1 rounded">cd backend && npm run dev</code></p>
                </div>
              )}

              {!loading && !error && filtered.length === 0 && (
                <div className="text-center py-20 opacity-50 italic text-xl">
                  No agents found matching your criteria.
                </div>
              )}

              {!loading && !error && filtered.length > 0 && isFiltering && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                  {filtered.map((a) => (
                    <AgentCard key={a.id} agent={a} onSelect={setSelectedAgent} />
                  ))}
                </div>
              )}

              {!loading && !error && agents.length > 0 && !isFiltering && (
                <div className="space-y-24">
                  {categories.map((cat) => {
                    const group = agents.filter((a) => a.category === cat);
                    if (!group.length) return null;
                    return (
                      <div key={cat}>
                        <div className="flex items-end justify-between mb-10 border-b border-white/10 pb-6">
                          <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">{cat}</h2>
                          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40">
                            {group.length} {group.length === 1 ? 'Agent' : 'Agents'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                          {group.map((a) => (
                            <AgentCard key={a.id} agent={a} onSelect={setSelectedAgent} />
                          ))}
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

      {/* Footer */}
      <section className="w-full bg-[#050505] text-white p-16 md:p-24 flex flex-col justify-between mt-auto">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-20 py-10">
          <div className="space-y-10">
            <h2 className="text-6xl font-black tracking-tighter uppercase leading-[0.8]">About Us</h2>
            <p className="text-2xl font-medium tracking-tight leading-relaxed max-w-lg opacity-60">
              KosovaNest is the leading premium real estate network in Kosovo. We specialize in
              identifying architectural legacies and providing elite, transparent service to buyers,
              sellers, and investors across the region.
            </p>
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
          <div className="flex gap-8">
            <span>Premium Properties</span>
            <span>•</span>
            <span>Elite Service</span>
          </div>
        </div>
      </section>

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
