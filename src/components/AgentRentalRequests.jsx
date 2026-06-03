import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, User, Mail, MessageSquare,
  CheckCircle, XCircle, Loader, RefreshCw, Home, Clock,
  TrendingUp,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { getCurrentUser } from '../lib/auth';
import RentalCalendar from './RentalCalendar';
import { showAlert, showConfirm } from '../lib/modal';

const STATUS_STYLES = {
  PENDING:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  APPROVED:  'bg-green-500/10  text-green-400  border-green-500/30',
  CANCELLED: 'bg-red-500/10    text-red-400    border-red-500/30',
};

const Label = ({ children }) => (
  <p className="text-[9px] font-black tracking-widest uppercase text-white/30 mb-1.5">{children}</p>
);

function parseRentalNotes(notes) {
  if (!notes?.startsWith('Rental request')) return null;
  const cin  = notes.match(/Check-in:\s*(\d{4}-\d{2}-\d{2})/);
  const cout = notes.match(/Check-out:\s*(\d{4}-\d{2}-\d{2})/);
  const note = notes.match(/\|\s*Note:\s*([\s\S]*)/);
  return {
    checkIn:  cin?.[1]  || null,
    checkOut: cout?.[1] || null,
    userNote: note?.[1]?.trim() || null,
  };
}

const SORT_OPTIONS = [
  { value: 'newest',   label: 'Newest'   },
  { value: 'oldest',   label: 'Oldest'   },
  { value: 'pending',  label: 'Pending'  },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function AgentRentalRequests() {
  const [agentId,       setAgentId]       = useState(null);
  const [initError,     setInitError]     = useState('');
  const [requests,      setRequests]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [updatingId,    setUpdatingId]    = useState(null);

  // Filters
  const [selectedPropId, setSelectedPropId] = useState('all');
  const [sortOrder,      setSortOrder]      = useState('newest');

  // â"€â"€ Resolve agent id â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  useEffect(() => {
    const user = getCurrentUser();
    if (!user?.id) { setInitError('You must be logged in.'); setLoading(false); return; }
    apiFetch(`/api/agents/by-user/${user.id}`)
      .then((a) => setAgentId(a.id))
      .catch(() => { setInitError('Your account is not linked to an agent profile.'); setLoading(false); });
  }, []);

  // â"€â"€ Load rental requests â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const load = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/api/visits/agent/${agentId}`);
      setRequests(
        (Array.isArray(data) ? data : []).filter(v => v.notes?.startsWith('Rental request'))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => { if (agentId) load(); }, [agentId, load]);

  // â"€â"€ Approve / Reject â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const user = getCurrentUser();
      await apiFetch(`/api/visits/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || 'agent',
          'x-user-id':   String(user?.id || ''),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (err) {
      await showAlert(err.message || 'Failed to update status.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  if (initError) return (
    <div className="p-10">
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400 text-sm">{initError}</div>
    </div>
  );

  // â"€â"€ Derived data â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

  // Unique rental properties (from requests)
  const rentalProperties = [
    ...new Map(
      requests.filter(r => r.property_id)
        .map(r => [r.property_id, { id: r.property_id, title: r.property_title || `Property #${r.property_id}` }])
    ).values(),
  ];

  // Blocked ranges for calendar  -  filtered by selected property
  const approvedRangesAll = requests
    .filter(r => r.status === 'APPROVED')
    .map(r => {
      const p = parseRentalNotes(r.notes);
      return p?.checkIn && p?.checkOut
        ? { start: p.checkIn, end: p.checkOut, property_id: r.property_id }
        : null;
    })
    .filter(Boolean);

  const calendarRanges = selectedPropId === 'all'
    ? approvedRangesAll
    : approvedRangesAll.filter(r => String(r.property_id) === String(selectedPropId));

  // Apply property + sort/status filter to cards
  let displayed = [...requests];
  if (selectedPropId !== 'all') {
    displayed = displayed.filter(r => String(r.property_id) === String(selectedPropId));
  }
  if (sortOrder === 'approved')  displayed = displayed.filter(r => r.status === 'APPROVED');
  else if (sortOrder === 'rejected') displayed = displayed.filter(r => r.status === 'CANCELLED');
  else if (sortOrder === 'pending')  displayed = displayed.filter(r => r.status === 'PENDING');
  else if (sortOrder === 'newest')   displayed.sort((a, b) => b.id - a.id);
  else if (sortOrder === 'oldest')   displayed.sort((a, b) => a.id - b.id);

  // Per-property performance stats
  const perfStats = rentalProperties.map(prop => {
    const propReqs = requests.filter(r => String(r.property_id) === String(prop.id));
    const total    = propReqs.length;
    const approved = propReqs.filter(r => r.status === 'APPROVED').length;
    const pending  = propReqs.filter(r => r.status === 'PENDING').length;
    const rate     = total > 0 ? Math.round((approved / total) * 100) : 0;
    return { ...prop, total, approved, pending, rate };
  }).sort((a, b) => b.rate - a.rate);

  const totalPending  = requests.filter(r => r.status === 'PENDING').length;
  const totalApproved = requests.filter(r => r.status === 'APPROVED').length;
  const totalRejected = requests.filter(r => r.status === 'CANCELLED').length;

  // â"€â"€ Render â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  return (
    <div className="p-10 space-y-8">

      {/* â"€â"€ Header â"€â"€ */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-extrabold uppercase tracking-tight">RENTAL REQUESTS</h2>
          <p className="text-white/40 text-xs font-bold tracking-widest uppercase mt-1">
            Rental requests from clients on your properties
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-white/40 hover:text-white transition text-[10px] font-bold uppercase tracking-widest"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* â"€â"€ Stats summary â"€â"€ */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 text-[10px] font-black tracking-widest uppercase">
          {totalPending} Pending
        </span>
        <span className="px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/30 text-[10px] font-black tracking-widest uppercase">
          {totalApproved} Approved
        </span>
        <span className="px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-black tracking-widest uppercase">
          {totalRejected} Rejected
        </span>
      </div>

      {/* â"€â"€ Two-column: Calendar (left) + Controls (right) â"€â"€ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">

        {/* Left: Calendar */}
        <div>
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30 mb-3">
            {selectedPropId === 'all' ? 'All Booked Periods' : `Booked  -  ${rentalProperties.find(p => String(p.id) === String(selectedPropId))?.title || ''}`}
          </p>
          <RentalCalendar blockedRanges={calendarRanges} />
        </div>

        {/* Right: Property filter + Sort/status + Performance */}
        <div className="space-y-6">

          {/* Property filter */}
          <div>
            <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30 mb-3">Filter by Property</p>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedPropId('all')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition ${
                  selectedPropId === 'all'
                    ? 'bg-white text-black border-white'
                    : 'text-white/50 border-white/10 hover:bg-white/5 hover:text-white'
                }`}
              >
                All Properties
              </button>
              {rentalProperties.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPropId(String(p.id))}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition truncate ${
                    String(selectedPropId) === String(p.id)
                      ? 'bg-white text-black border-white'
                      : 'text-white/50 border-white/10 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Sort / status filter */}
          <div>
            <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30 mb-3">Sort & Filter</p>
            <div className="space-y-2">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSortOrder(opt.value)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition ${
                    sortOrder === opt.value
                      ? 'bg-white/10 text-white border-white/30'
                      : 'text-white/40 border-white/10 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Property performance stats */}
          {perfStats.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={12} className="text-white/30" />
                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30">Performance</p>
              </div>
              <div className="space-y-3">
                {perfStats.map(stat => (
                  <div key={stat.id} className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                    <p className="text-[11px] font-bold text-white truncate">{stat.title}</p>
                    <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest">
                      <span className="text-green-400">{stat.approved} approved</span>
                      <span className="text-yellow-400">{stat.pending} pending</span>
                      <span className="text-white/30">{stat.total} total</span>
                    </div>
                    {/* Booking rate bar */}
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          stat.rate >= 70 ? 'bg-green-400' : stat.rate >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${stat.rate}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-white/30 font-bold">{stat.rate}% approval rate</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* â"€â"€ Cards â"€â"€ */}
      <div>
        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30 mb-4">
          {displayed.length} {displayed.length === 1 ? 'Request' : 'Requests'}{selectedPropId !== 'all' ? ' for this property' : ''}
        </p>

        {loading ? (
          <div className="flex items-center justify-center h-48 gap-3 text-white/40">
            <Loader size={18} className="animate-spin" />
            <span className="text-xs font-bold tracking-widest uppercase">Loading…</span>
          </div>
        ) : displayed.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-3xl p-16 text-center space-y-3">
            <Home size={32} className="mx-auto text-white/20" />
            <p className="text-white/40 text-sm font-bold uppercase tracking-widest">No requests match this filter</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map((req) => {
              const parsed = parseRentalNotes(req.notes);
              return (
                <div
                  key={req.id}
                  className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6 hover:border-white/20 transition"
                >
                  {/* Status badge */}
                  <div className="shrink-0">
                    <span className={`px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border ${STATUS_STYLES[req.status] || ''}`}>
                      {req.status}
                    </span>
                  </div>

                  {/* Property name  -  prominent pill */}
                  {req.property_title && (
                    <div className="shrink-0 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold tracking-widest uppercase text-white/60 flex items-center gap-1.5">
                      <Home size={10} className="text-white/30" />
                      {req.property_title}
                    </div>
                  )}

                  {/* Info grid */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-start gap-2">
                      <User size={13} className="text-white/30 mt-0.5 shrink-0" />
                      <div>
                        <Label>Client</Label>
                        <p className="text-sm font-semibold text-white">
                          {req.user_name || (req.user_id ? `User #${req.user_id}` : ' - ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Mail size={13} className="text-white/30 mt-0.5 shrink-0" />
                      <div>
                        <Label>Email</Label>
                        <p className="text-sm text-white/60">{req.user_email || ' - '}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Calendar size={13} className="text-white/30 mt-0.5 shrink-0" />
                      <div>
                        <Label>Check-in / Check-out</Label>
                        <p className="text-sm font-semibold text-white">{parsed?.checkIn || ' - '}</p>
                        <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                          <Clock size={11} /> {parsed?.checkOut || ' - '}
                        </p>
                      </div>
                    </div>

                    {parsed?.userNote && (
                      <div className="flex items-start gap-2">
                        <MessageSquare size={13} className="text-white/30 mt-0.5 shrink-0" />
                        <div>
                          <Label>Client Note</Label>
                          <p className="text-xs text-white/60 line-clamp-2 italic">"{parsed.userNote}"</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {req.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleStatus(req.id, 'APPROVED')}
                          disabled={updatingId === req.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-500/10 hover:bg-green-500/20
                                     text-green-400 border border-green-500/30 rounded-xl text-[10px] font-black
                                     uppercase tracking-widest transition disabled:opacity-50"
                        >
                          {updatingId === req.id ? <Loader size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatus(req.id, 'CANCELLED')}
                          disabled={updatingId === req.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20
                                     text-red-400 border border-red-500/30 rounded-xl text-[10px] font-black
                                     uppercase tracking-widest transition disabled:opacity-50"
                        >
                          <XCircle size={12} /> Reject
                        </button>
                      </>
                    )}
                    {req.status === 'APPROVED'  && <CheckCircle size={18} className="text-green-400" />}
                    {req.status === 'CANCELLED' && <XCircle     size={18} className="text-red-400"   />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

