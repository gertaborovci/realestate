import React, { useState } from 'react';
import { X, ChevronRight, Home, Users, ArrowRight, Star } from 'lucide-react';

const HOME_TYPES = [
  'Apartment', 'House', 'Villa', 'Townhouse',
  'Penthouse', 'Duplex', 'Studio', 'Cabin', 'Condo', 'Mansion',
];

const btnBase =
  'w-full flex items-center justify-center gap-3 font-black text-[12px] uppercase tracking-[0.25em] rounded-full py-4 transition-all duration-300';

export default function NextChapterModal({ onClose, onPropertySearch, onNavigate }) {
  // 'choose' | 'property' | 'agent'
  const [step, setStep] = useState('choose');

  // Property path
  const [homeType,     setHomeType]     = useState('');
  const [buyRent,      setBuyRent]      = useState('');   // 'BUY' | 'RENT'

  // Agent/professional path
  const [agentCity,    setAgentCity]    = useState('');
  const [agentMinRating, setAgentMinRating] = useState(0); // 0 = any
  const [agentTrust,   setAgentTrust]   = useState('all'); // 'all' | 'verified' | 'building' | 'none'

  const goToProperties = () => {
    onPropertySearch({
      homeType:    homeType    || 'ALL',
      filterType:  buyRent     || 'ALL',
      searchQuery: '',
    });
    onClose();
  };

  const goToAgents = () => {
    // Navigate to agents — filters will be handled by initialAgentFilters in App
    onNavigate('agents', {
      city:      agentCity      || '',
      minRating: agentMinRating || 0,
      trust:     agentTrust     || 'all',
    });
    onClose();
  };

  const inputCls =
    'w-full bg-white/5 border border-white/10 focus:border-white/30 text-white text-sm ' +
    'rounded-2xl px-5 py-3.5 outline-none transition placeholder:text-white/25';

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#0a0a0a] border border-white/10 rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-10 pt-10 pb-6">
          {step !== 'choose' && (
            <button onClick={() => setStep('choose')}
              className="text-white/30 hover:text-white text-xs font-bold uppercase tracking-widest transition flex items-center gap-1">
              ← Back
            </button>
          )}
          {step === 'choose' && <div />}
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition text-white/40 hover:text-white ml-auto">
            <X size={18} />
          </button>
        </div>

        <div className="px-10 pb-12">

          {/* ── STEP 0: Choose path ── */}
          {step === 'choose' && (
            <div>
              <h2 className="text-4xl font-black tracking-tighter uppercase italic mb-2">
                What are you<br /><span className="text-white/50">looking for?</span>
              </h2>
              <p className="text-white/40 text-sm mb-10">
                Tell us what you need and we'll point you in the right direction.
              </p>

              <div className="space-y-4">
                {/* Option A */}
                <button
                  onClick={() => setStep('property')}
                  className="w-full group flex items-center gap-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-[28px] p-6 text-left transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center shrink-0 transition">
                    <Home size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-black text-lg">A Place to Call Home</p>
                    <p className="text-white/40 text-sm mt-0.5">Browse our listings and find the perfect property</p>
                  </div>
                  <ChevronRight size={20} className="text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>

                {/* Option B */}
                <button
                  onClick={() => setStep('agent')}
                  className="w-full group flex items-center gap-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-[28px] p-6 text-left transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center shrink-0 transition">
                    <Users size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-black text-lg">Speak to a Professional</p>
                    <p className="text-white/40 text-sm mt-0.5">Our agents are ready to guide you every step of the way</p>
                  </div>
                  <ChevronRight size={20} className="text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 1A: Property path ── */}
          {step === 'property' && (
            <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-1">
                What kind of place?
              </h2>
              <p className="text-white/40 text-sm mb-8">Select the type of property you have in mind.</p>

              {/* Home type grid */}
              <div className="flex flex-wrap gap-2 mb-8">
                {HOME_TYPES.map(ht => (
                  <button key={ht} type="button" onClick={() => setHomeType(ht === homeType ? '' : ht)}
                    className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider border transition-all ${
                      homeType === ht
                        ? 'bg-white text-black border-white'
                        : 'bg-transparent text-white/50 border-white/15 hover:border-white/40 hover:text-white'
                    }`}>
                    {ht}
                  </button>
                ))}
              </div>

              {/* Buy or Rent */}
              <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-3">Are you looking to…</p>
              <div className="flex gap-3 mb-10">
                {['BUY', 'RENT'].map(t => (
                  <button key={t} onClick={() => setBuyRent(t === buyRent ? '' : t)}
                    className={`flex-1 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest border transition-all ${
                      buyRent === t
                        ? 'bg-white text-black border-white'
                        : 'bg-transparent text-white/50 border-white/15 hover:text-white hover:border-white/30'
                    }`}>
                    {t === 'BUY' ? 'Buy' : 'Rent'}
                  </button>
                ))}
              </div>

              {/* CTA */}
              <p className="text-center text-white/40 text-sm font-medium mb-4">
                Ready to find your dream home
              </p>
              <button onClick={goToProperties}
                className={`${btnBase} bg-white text-black hover:bg-zinc-100 shadow-xl hover:shadow-white/10`}>
                Go <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── STEP 1B: Agent/professional path ── */}
          {step === 'agent' && (
            <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-1">
                Find your<br /><span className="text-white/50">perfect agent</span>
              </h2>
              <p className="text-white/40 text-sm mb-8">Tell us what matters to you and we'll connect you with the right professional.</p>

              <div className="space-y-6 mb-8">

                {/* City */}
                <div>
                  <label className="block text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">City / Area</label>
                  <input type="text" value={agentCity} onChange={e => setAgentCity(e.target.value)}
                    placeholder="e.g. Prishtina, Prizren…" className={inputCls} />
                </div>

                {/* Min rating — star picker */}
                <div>
                  <label className="block text-white/40 text-[10px] font-black uppercase tracking-widest mb-3">Minimum Agent Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} type="button"
                        onClick={() => setAgentMinRating(star === agentMinRating ? 0 : star)}>
                        <Star size={28}
                          className={star <= agentMinRating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-white/20 hover:text-white/40 transition'} />
                      </button>
                    ))}
                    {agentMinRating > 0 && (
                      <span className="text-white/40 text-xs font-bold ml-2">{agentMinRating}+ stars</span>
                    )}
                  </div>
                </div>

                {/* Trust / Certification level */}
                <div>
                  <label className="block text-white/40 text-[10px] font-black uppercase tracking-widest mb-3">Certification Level</label>
                  <div className="flex flex-col gap-2">
                    {[
                      { value: 'all',      label: 'Any level',        sub: 'Show all agents' },
                      { value: 'verified', label: '✓ Fully Verified', sub: 'Has approved certification documents' },
                      { value: 'building', label: '⏳ Building Trust', sub: 'Submitted docs, currently under review' },
                    ].map(opt => (
                      <button key={opt.value} type="button" onClick={() => setAgentTrust(opt.value)}
                        className={`flex items-start gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${
                          agentTrust === opt.value
                            ? 'bg-white/10 border-white/30 text-white'
                            : 'bg-transparent border-white/8 text-white/50 hover:border-white/20 hover:text-white/70'
                        }`}>
                        <div className="flex-1">
                          <p className="text-sm font-bold">{opt.label}</p>
                          <p className="text-[10px] text-white/30 mt-0.5">{opt.sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <p className="text-center text-white/40 text-sm font-medium mb-4">
                Let's plan your future together
              </p>
              <button onClick={goToAgents}
                className={`${btnBase} bg-white text-black hover:bg-zinc-100 shadow-xl hover:shadow-white/10`}>
                Find an Agent <ArrowRight size={16} />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
