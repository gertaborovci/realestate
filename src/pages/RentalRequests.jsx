import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import RentalCalendar from '../components/RentalCalendar';
import { showAlert, showConfirm } from '../lib/modal';

/** Parse notes like:
 *  "Rental request — Check-in: 2026-06-01, Check-out: 2026-06-07 | Note: text here"
 */
function parseRentalNotes(notes) {
  if (!notes || !notes.startsWith('Rental request')) return null;
  const cin  = notes.match(/Check-in:\s*(\d{4}-\d{2}-\d{2})/);
  const cout = notes.match(/Check-out:\s*(\d{4}-\d{2}-\d{2})/);
  const note = notes.match(/\|\s*Note:\s*([\s\S]*)/);
  return {
    checkIn:  cin?.[1]  || null,
    checkOut: cout?.[1] || null,
    userNote: note?.[1]?.trim() || null,
  };
}

const STATUS_CLS = {
  PENDING:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  APPROVED:  'bg-green-500/10  text-green-400  border-green-500/20',
  CANCELLED: 'bg-red-500/10    text-red-400    border-red-500/20',
};

export default function RentalRequests() {
  const [visits,          setVisits]          = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [filterProperty,  setFilterProperty]  = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/visits');
      const rentals = (Array.isArray(data) ? data : []).filter(
        v => v.notes && v.notes.startsWith('Rental request')
      );
      setVisits(rentals);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStatus = async (id, status) => {
    try {
      await apiFetch(`/api/visits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({ status }),
      });
      load();
    } catch (err) {
      await showAlert(err.message || 'Failed to update request.', 'error');
    }
  };

  /* Unique properties that have rental requests */
  const properties = [
    ...new Map(
      visits
        .filter(v => v.property_id)
        .map(v => [v.property_id, { id: v.property_id, title: v.property_title }])
    ).values(),
  ];

  const displayed = filterProperty === 'all'
    ? visits
    : visits.filter(v => String(v.property_id) === String(filterProperty));

  /* APPROVED ranges → show as blocked on calendar */
  const approvedRanges = displayed
    .filter(v => v.status === 'APPROVED')
    .map(v => {
      const p = parseRentalNotes(v.notes);
      return p?.checkIn && p?.checkOut ? { start: p.checkIn, end: p.checkOut } : null;
    })
    .filter(Boolean);

  const pending = visits.filter(v => v.status === 'PENDING').length;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-5xl font-bold">RENTAL REQUESTS</h1>
        <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">
          {pending} pending
        </span>
      </div>

      {/* Property filter chips */}
      {properties.length > 1 && (
        <div className="flex items-center gap-3 flex-wrap mb-8">
          <span className="text-[10px] font-black tracking-widest uppercase text-white/30">Property:</span>
          <button
            onClick={() => setFilterProperty('all')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition ${
              filterProperty === 'all' ? 'bg-white text-black border-white' : 'text-white/50 border-white/10 hover:bg-white/5'
            }`}
          >
            All
          </button>
          {properties.map(p => (
            <button
              key={p.id}
              onClick={() => setFilterProperty(String(p.id))}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition ${
                String(filterProperty) === String(p.id)
                  ? 'bg-white text-black border-white'
                  : 'text-white/50 border-white/10 hover:bg-white/5'
              }`}
            >
              {p.title || `Property #${p.id}`}
            </button>
          ))}
        </div>
      )}

      {/* Calendar — shows approved (blocked) periods */}
      <div className="mb-10 max-w-sm">
        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30 mb-3">
          Booked Periods — Approved Rentals
        </p>
        <RentalCalendar blockedRanges={approvedRanges} />
      </div>

      {/* Requests table */}
      {loading ? (
        <p className="text-gray-400 animate-pulse">Loading rental requests…</p>
      ) : displayed.length === 0 ? (
        <p className="text-gray-500 italic">No rental requests yet.</p>
      ) : (
        <div className="bg-[#121212] border border-gray-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="p-5">Property</th>
                <th className="p-5">Client</th>
                <th className="p-5">Check-in</th>
                <th className="p-5">Check-out</th>
                <th className="p-5">Note from client</th>
                <th className="p-5">Status</th>
                <th className="p-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900">
              {displayed.map(visit => {
                const parsed = parseRentalNotes(visit.notes);
                return (
                  <tr key={visit.id} className="hover:bg-[#1a1a1a]/50 transition">

                    <td className="p-5">
                      <div className="font-semibold text-white">{visit.property_title || '—'}</div>
                      {visit.property_location && (
                        <div className="text-gray-500 text-xs mt-0.5">{visit.property_location}</div>
                      )}
                    </td>

                    <td className="p-5">
                      <div className="text-gray-200 font-medium">
                        {visit.user_name || `User #${visit.user_id}`}
                      </div>
                      {visit.user_email && (
                        <div className="text-gray-500 text-xs mt-0.5">{visit.user_email}</div>
                      )}
                    </td>

                    <td className="p-5 text-gray-300 font-mono text-sm">{parsed?.checkIn  || '—'}</td>
                    <td className="p-5 text-gray-300 font-mono text-sm">{parsed?.checkOut || '—'}</td>

                    <td className="p-5 max-w-[200px]">
                      {parsed?.userNote
                        ? <span className="text-gray-400 text-xs italic line-clamp-2">"{parsed.userNote}"</span>
                        : <span className="text-white/20 text-xs">—</span>
                      }
                    </td>

                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase border ${STATUS_CLS[visit.status] || ''}`}>
                        {visit.status}
                      </span>
                    </td>

                    <td className="p-5">
                      {visit.status === 'PENDING' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatus(visit.id, 'APPROVED')}
                            className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl text-[10px] font-bold uppercase tracking-wider transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatus(visit.id, 'CANCELLED')}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-bold uppercase tracking-wider transition"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-white/20 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
