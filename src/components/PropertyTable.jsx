import React, { useState, useMemo } from 'react';
import {
  Edit, Trash2, Search, ChevronDown, ChevronUp,
  Home, Tag, User, Calendar, DoorOpen, Bath, Maximize,
  ShoppingBag, KeyRound, CheckCircle, Clock, X,
  Star, HelpCircle, Info,
} from 'lucide-react';
import { apiFetch, API_BASE } from '../lib/api';
import PropertyReviews from './PropertyReviews';
import PropertyQA from './PropertyQA';

// ─── helpers ──────────────────────────────────────────────────────────────────

const getStatus = (status) => {
  if (!status) return 'AVAILABLE';
  const u = status.toUpperCase();
  if (u.includes('SHITUR') || u === 'SOLD')   return 'SOLD';
  if ((u.includes('QIRA') && u.includes('DHE')) || u === 'RENTED') return 'RENTED';
  return 'AVAILABLE';
};

const isRentType = (type) => {
  const u = (type || '').toUpperCase();
  return u === 'QIRA' || u === 'RENT';
};

const STATUS_CLS = {
  SOLD:      'bg-red-500/10   text-red-400   border-red-500/20',
  RENTED:    'bg-blue-500/10  text-blue-400  border-blue-500/20',
  AVAILABLE: 'bg-green-500/10 text-green-400 border-green-500/20',
};

const TYPE_CLS = {
  rent: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  sale: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const fmt = (n) => `€${Number(n || 0).toLocaleString()}`;
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

// ─── expanded detail panel ────────────────────────────────────────────────────

function PropertyDetail({ property, onClose }) {
  const [contracts, setContracts] = useState(null);
  const [loading,   setLoading]   = useState(false);

  // Fetch contracts the first time panel opens
  React.useEffect(() => {
    if (contracts !== null) return;
    setLoading(true);
    apiFetch(`/api/contracts/property/${property.id}`)
      .then(setContracts)
      .catch(() => setContracts([]))
      .finally(() => setLoading(false));
  }, [property.id]);

  const status   = getStatus(property.status);
  const rental   = isRentType(property.type);

  // Find the most relevant contract (sold/rented = finalized/active)
  const mainContract = contracts?.find(
    c => ['Finalized', 'Active'].includes(c.status)
  ) || contracts?.[0] || null;

  return (
    <div className="mt-2 mb-4 mx-2 bg-[#111] border border-white/10 rounded-2xl p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">

      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-black text-white">{property.title}</h3>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-0.5">{property.location}</p>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white transition p-1">
          <X size={16} />
        </button>
      </div>

      {/* Main info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Price',        value: fmt(property.price) },
          { label: 'Status',       value: status },
          { label: 'Type',         value: rental ? 'For Rent' : 'For Sale' },
          { label: 'Category',     value: property.home_type || '—' },
          { label: 'Rooms',        value: property.rooms ?? '—' },
          { label: 'Bathrooms',    value: property.bathrooms ?? '—' },
          { label: 'Area',         value: property.area ? `${property.area} m²` : '—' },
          { label: 'Listed on',    value: fmtDate(property.created_at) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white/5 rounded-xl p-3">
            <p className="text-[9px] font-black tracking-widest uppercase text-white/30 mb-1">{label}</p>
            <p className="text-sm font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Agent */}
      {property.agent_name && (
        <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
          <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {property.agent_photo ? (
              <img
                src={property.agent_photo.startsWith('http') ? property.agent_photo : `${API_BASE}${property.agent_photo}`}
                alt={property.agent_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={16} className="text-white/30" />
            )}
          </div>
          <div>
            <p className="text-[9px] font-black tracking-widest uppercase text-white/30">Listed by</p>
            <p className="text-sm font-bold text-white">{property.agent_name}</p>
            {property.agent_email && <p className="text-xs text-white/40">{property.agent_email}</p>}
          </div>
        </div>
      )}

      {/* Contract history */}
      <div>
        <p className="text-[9px] font-black tracking-widest uppercase text-white/30 mb-3">
          {rental ? 'Rental History' : 'Purchase History'}
        </p>

        {loading && (
          <p className="text-white/30 text-xs animate-pulse">Loading contract data…</p>
        )}

        {!loading && (!contracts || contracts.length === 0) && (
          <p className="text-white/20 text-xs italic">No contracts yet.</p>
        )}

        {!loading && contracts && contracts.length > 0 && (
          <div className="space-y-3">
            {contracts.map((c) => {
              const rentalDates = rental && c.notes
                ? c.notes.match(/Check-in:\s*(\d{4}-\d{2}-\d{2}).*Check-out:\s*(\d{4}-\d{2}-\d{2})/)
                : null;
              return (
                <div key={c.id} className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-black text-white">{c.contract_number || `#${c.id}`}</span>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${
                      c.status === 'Finalized' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      c.status === 'Active'    ? 'bg-blue-500/10  text-blue-400  border-blue-500/20'  :
                      c.status === 'Cancelled' ? 'bg-red-500/10   text-red-400   border-red-500/20'   :
                                                 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>{c.status}</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-white/30 font-bold uppercase tracking-widest text-[9px] mb-0.5">
                        {rental ? 'Rented by' : 'Bought by'}
                      </p>
                      <p className="text-white font-semibold">{c.client_name || `User #${c.user_id}`}</p>
                      {c.client_email && <p className="text-white/40 text-[10px]">{c.client_email}</p>}
                    </div>

                    <div>
                      <p className="text-white/30 font-bold uppercase tracking-widest text-[9px] mb-0.5">
                        {rental ? 'Monthly Rent' : 'Sale Price'}
                      </p>
                      <p className="text-white font-semibold">{fmt(c.property_price)}</p>
                    </div>

                    <div>
                      <p className="text-white/30 font-bold uppercase tracking-widest text-[9px] mb-0.5">Deposit Paid</p>
                      <p className="text-white font-semibold">{fmt(c.deposit_amount)}</p>
                    </div>

                    <div>
                      <p className="text-white/30 font-bold uppercase tracking-widest text-[9px] mb-0.5">Date</p>
                      <p className="text-white font-semibold">{fmtDate(c.created_at)}</p>
                    </div>
                  </div>

                  {/* Rental dates if available */}
                  {rentalDates && (
                    <div className="flex items-center gap-4 text-xs text-white/50 border-t border-white/5 pt-3">
                      <span className="flex items-center gap-1"><Calendar size={11} /> Check-in: <span className="text-white/80 font-bold">{rentalDates[1]}</span></span>
                      <span className="flex items-center gap-1"><Calendar size={11} /> Check-out: <span className="text-white/80 font-bold">{rentalDates[2]}</span></span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

const PropertyTable = ({ properties, onDelete, onEdit }) => {
  const [search,      setSearch]      = useState('');
  const [typeFilter,  setTypeFilter]  = useState('ALL');
  // { id: propertyId, type: 'details' | 'reviews' | 'qa' } — null when nothing open
  const [activePanel, setActivePanel] = useState(null);

  const filtered = useMemo(() => {
    let items = [...(properties || [])];
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(p =>
        (p.title      || '').toLowerCase().includes(q) ||
        (p.location   || '').toLowerCase().includes(q) ||
        (p.agent_name || '').toLowerCase().includes(q)
      );
    }
    if (typeFilter === 'SALE') items = items.filter(p => !isRentType(p.type));
    if (typeFilter === 'RENT') items = items.filter(p =>  isRentType(p.type));
    return items;
  }, [properties, search, typeFilter]);

  const togglePanel = (id, type) =>
    setActivePanel(prev =>
      prev?.id === id && prev?.type === type ? null : { id, type }
    );

  return (
    <div className="space-y-6">

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="flex items-center bg-[#111] border border-white/10 rounded-xl px-4 py-3 gap-3 flex-1 max-w-sm focus-within:border-white/30 transition">
          <Search size={15} className="text-white/30 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, location or agent…"
            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-white/20"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-white/30 hover:text-white transition">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Type filter */}
        <div className="flex items-center bg-[#111] border border-white/10 rounded-xl p-1.5 gap-1">
          {[
            { value: 'ALL',  label: 'All' },
            { value: 'SALE', label: 'For Sale' },
            { value: 'RENT', label: 'For Rent' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${
                typeFilter === opt.value ? 'bg-white text-black' : 'text-white/40 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">
          {filtered.length} / {properties?.length || 0}
        </p>
      </div>

      {/* ── Property list ── */}
      <div className="space-y-1">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-white/20 italic">No properties match your search.</div>
        )}

        {filtered.map((property) => {
          const status       = getStatus(property.status);
          const rental       = isRentType(property.type);
          const openType     = activePanel?.id === property.id ? activePanel.type : null;

          const panelBtn = (type, icon, label) => (
            <button
              onClick={() => togglePanel(property.id, type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition ${
                openType === type
                  ? 'bg-white text-black border-white'
                  : 'text-white/40 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {icon}
              {label}
              {openType === type
                ? <ChevronUp size={10} />
                : <ChevronDown size={10} />}
            </button>
          );

          return (
            <div key={property.id} className={`rounded-2xl overflow-hidden border transition ${
              openType ? 'border-white/15' : 'border-white/5 hover:border-white/10'
            }`}>

              {/* Row — no longer click-to-expand, buttons handle it */}
              <div className="flex items-center gap-4 p-4 bg-[#0a0a0a] hover:bg-white/[0.02] transition select-none">
                {/* Type badge */}
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${
                  rental ? TYPE_CLS.rent : TYPE_CLS.sale
                }`}>
                  {rental ? 'Rent' : 'Sale'}
                </span>

                {/* Title + location + category */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-bold text-sm truncate">{property.title}</span>
                    {property.home_type && (
                      <span className="text-[9px] font-black tracking-widest uppercase text-white/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                        {property.home_type}
                      </span>
                    )}
                  </div>
                  <p className="text-white/30 text-[10px] font-medium tracking-widest uppercase truncate">{property.location}</p>
                </div>

                {/* Price */}
                <span className="text-white font-mono text-sm font-semibold shrink-0 hidden sm:block">
                  {fmt(property.price)}{rental ? '/mo' : ''}
                </span>

                {/* Status */}
                <span className={`shrink-0 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${STATUS_CLS[status]}`}>
                  {status}
                </span>

                {/* Agent */}
                <div className="shrink-0 hidden md:flex items-center gap-2 max-w-[140px]">
                  <User size={12} className="text-white/20 shrink-0" />
                  <span className="text-white/50 text-[10px] font-bold truncate">
                    {property.agent_name || '—'}
                  </span>
                </div>

                {/* Date */}
                <span className="text-white/30 text-[10px] font-medium shrink-0 hidden lg:block">
                  {fmtDate(property.created_at)}
                </span>

                {/* ── Panel buttons + Edit + Delete ── */}
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  {panelBtn('details',  <Info     size={10} />, 'Details')}
                  {panelBtn('reviews',  <Star     size={10} />, 'Reviews')}
                  {panelBtn('qa',       <HelpCircle size={10} />, 'Q&A')}
                  <button onClick={() => onEdit(property)}
                    className="p-2 text-white/20 hover:text-white hover:bg-white/10 rounded-xl transition" title="Edit">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => onDelete(property.id)}
                    className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* ── Dropdown panels ── */}
              {openType === 'details' && (
                <PropertyDetail property={property} onClose={() => setActivePanel(null)} />
              )}

              {openType === 'reviews' && (
                <div className="bg-[#0a0a0a] border-t border-white/5 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/40 flex items-center gap-2">
                      <Star size={12} /> Reviews — {property.title}
                    </p>
                    <button onClick={() => setActivePanel(null)} className="text-white/30 hover:text-white transition">
                      <X size={14} />
                    </button>
                  </div>
                  <PropertyReviews
                    propertyId={property.id}
                    propertyTitle={property.title}
                    showModal={false}
                    defaultOpen
                    isAdmin
                  />
                </div>
              )}

              {openType === 'qa' && (
                <div className="bg-[#0a0a0a] border-t border-white/5 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/40 flex items-center gap-2">
                      <HelpCircle size={12} /> Q&A — {property.title}
                    </p>
                    <button onClick={() => setActivePanel(null)} className="text-white/30 hover:text-white transition">
                      <X size={14} />
                    </button>
                  </div>
                  <PropertyQA propertyId={property.id} isAdmin />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PropertyTable;
