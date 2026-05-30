import React, { useState, useEffect } from 'react';
import { Trash2, CalendarCheck, Home, Clock } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { getCurrentUser } from '../lib/auth';

/** Parse rental notes: "Rental request — Check-in: YYYY-MM-DD, Check-out: YYYY-MM-DD | Note: ..." */
function parseRental(notes) {
  if (!notes?.startsWith('Rental request')) return null;
  const cin  = notes.match(/Check-in:\s*(\d{4}-\d{2}-\d{2})/);
  const cout = notes.match(/Check-out:\s*(\d{4}-\d{2}-\d{2})/);
  return { checkIn: cin?.[1] || null, checkOut: cout?.[1] || null };
}

const STATUS = {
  PENDING:   { label: 'Pending',  cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  APPROVED:  { label: 'Approved', cls: 'bg-green-500/10  text-green-400  border-green-500/20'  },
  CANCELLED: { label: 'Rejected', cls: 'bg-red-500/10    text-red-400    border-red-500/20'    },
};

export default function UserRequests() {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [deleting, setDeleting] = useState(null);

  const user = getCurrentUser();

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/api/visits/user/${user.id}`);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load your requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this request?')) return;
    setDeleting(id);
    try {
      await apiFetch(`/api/visits/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': user.role,
          'x-user-id':   String(user.id),
        },
      });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete request.');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-white/30 text-sm font-bold tracking-widest uppercase animate-pulse">
      Loading your requests…
    </div>
  );

  if (error) return (
    <div className="py-10 text-center text-red-400 text-sm">{error}</div>
  );

  if (requests.length === 0) return (
    <div className="py-20 text-center space-y-3">
      <CalendarCheck size={36} className="mx-auto text-white/15" />
      <p className="text-white/30 text-sm font-bold uppercase tracking-widest">No requests yet</p>
      <p className="text-white/20 text-xs">Visit a property or request a rental to see it here.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {requests.map((req) => {
        const rental   = parseRental(req.notes);
        const isRental = !!rental;
        const status   = STATUS[req.status] || STATUS.PENDING;

        return (
          <div
            key={req.id}
            className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6"
          >
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
              {isRental
                ? <Home size={20} className="text-white/40" />
                : <CalendarCheck size={20} className="text-white/40" />}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-1">
              {/* Type badge + property */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase border ${
                  isRental
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                }`}>
                  {isRental ? 'Rental Request' : 'Visit Request'}
                </span>
              </div>

              <p className="text-white font-bold text-sm truncate">
                {req.property_title || (req.agent_name ? `Consultation with ${req.agent_name}` : `Request #${req.id}`)}
              </p>

              {/* Dates */}
              <div className="flex items-center gap-1.5 text-white/40 text-xs font-medium">
                <Clock size={11} />
                {isRental ? (
                  <span>Check-in: <span className="text-white/60">{rental.checkIn}</span> — Check-out: <span className="text-white/60">{rental.checkOut}</span></span>
                ) : (
                  <span>
                    {req.visit_date
                      ? new Date(req.visit_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                    {req.visit_time ? ` at ${req.visit_time}` : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Status */}
            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border whitespace-nowrap ${status.cls}`}>
              {status.label}
            </span>

            {/* Delete */}
            <button
              onClick={() => handleDelete(req.id)}
              disabled={deleting === req.id}
              title="Remove request"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-wider transition disabled:opacity-40 flex-shrink-0"
            >
              <Trash2 size={13} />
              {deleting === req.id ? 'Removing…' : 'Remove'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
