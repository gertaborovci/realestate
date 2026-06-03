import React, { useState, useEffect, useMemo } from 'react';
import { Star, Trash2, Loader, Search, ShieldCheck, RefreshCw } from 'lucide-react';
import { apiFetch, API_BASE } from '../lib/api';
import { showAlert, showConfirm } from '../lib/modal';

function Stars({ rating, size = 12 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={size}
          className={s <= Math.round(Number(rating))
            ? 'text-yellow-400 fill-yellow-400'
            : 'text-white/15'} />
      ))}
    </div>
  );
}

function Avatar({ name, photoUrl, size = 32 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  if (photoUrl) {
    const src = photoUrl.startsWith('http') ? photoUrl : `${API_BASE}${photoUrl}`;
    return <img src={src} alt={name} className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }} />;
  }
  return (
    <div className="rounded-full bg-white/10 flex items-center justify-center shrink-0 text-white font-black text-[9px]"
      style={{ width: size, height: size }}>
      {initials}
    </div>
  );
}

export default function AdminPropertyReviews() {
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [search,     setSearch]     = useState('');
  const [minRating,  setMinRating]  = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/property-reviews');
      setReviews(Array.isArray(data) ? data : []);
    } catch { setReviews([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!await showConfirm('Delete this review? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/property-reviews/${id}`, { method: 'DELETE' });
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err) { await showAlert(err.message, 'error'); }
    finally { setDeletingId(null); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return reviews.filter(r =>
      (!q || (r.username||'').toLowerCase().includes(q) || (r.property_title||'').toLowerCase().includes(q) || (r.comment||'').toLowerCase().includes(q)) &&
      Number(r.rating) >= minRating
    );
  }, [reviews, search, minRating]);

  // Stats
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length).toFixed(1)
    : '—';
  const dist = [5,4,3,2,1].map(s => ({
    star: s,
    count: reviews.filter(r => Math.round(Number(r.rating)) === s).length,
  }));

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-5xl font-bold">PROPERTY REVIEWS</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
            Moderate reviews left on property listings
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-white/40 hover:text-white text-[10px] font-bold uppercase tracking-widest transition">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#121212] border border-gray-800 rounded-2xl p-5">
          <p className="text-[9px] font-black tracking-widest uppercase text-gray-500 mb-1">Total Reviews</p>
          <p className="text-2xl font-black text-white">{reviews.length}</p>
        </div>
        <div className="bg-[#121212] border border-gray-800 rounded-2xl p-5">
          <p className="text-[9px] font-black tracking-widest uppercase text-gray-500 mb-1">Avg Rating</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-black text-white">{avg}</p>
            {avg !== '—' && <Stars rating={avg} size={13} />}
          </div>
        </div>
        <div className="bg-[#121212] border border-gray-800 rounded-2xl p-5 col-span-2">
          <p className="text-[9px] font-black tracking-widest uppercase text-gray-500 mb-3">Distribution</p>
          <div className="space-y-1.5">
            {dist.map(d => (
              <div key={d.star} className="flex items-center gap-2">
                <span className="text-[9px] text-white/40 w-2 font-bold">{d.star}</span>
                <Star size={9} className="text-yellow-400/60 fill-yellow-400/60 shrink-0" />
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400/60 rounded-full"
                    style={{ width: reviews.length ? `${(d.count/reviews.length)*100}%` : '0%' }} />
                </div>
                <span className="text-[9px] text-white/30 font-bold w-4">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center bg-[#121212] border border-gray-800 rounded-xl px-4 py-3 gap-3 flex-1 max-w-sm focus-within:border-gray-600 transition">
          <Search size={14} className="text-white/30 shrink-0" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by reviewer, property, comment…"
            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-white/20" />
        </div>
        <div className="flex items-center gap-2 bg-[#121212] border border-gray-800 rounded-xl p-1.5">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/30 px-2">Min:</span>
          {[0,1,2,3,4,5].map(r => (
            <button key={r} onClick={() => setMinRating(r)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition ${
                minRating === r ? 'bg-white text-black' : 'text-white/40 hover:text-white'
              }`}>
              {r === 0 ? 'All' : `${r}★`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-32 gap-3 text-white/30">
          <Loader size={16} className="animate-spin" />
          <span className="text-xs font-bold tracking-widest uppercase">Loading…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#121212] border border-dashed border-gray-800 rounded-2xl p-12 text-center">
          <Star size={28} className="mx-auto text-white/15 mb-3" />
          <p className="text-white/30 text-sm font-bold uppercase tracking-widest">No reviews yet</p>
        </div>
      ) : (
        <div className="bg-[#121212] border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <th className="p-5">Reviewer</th>
                <th className="p-5">Property</th>
                <th className="p-5">Rating</th>
                <th className="p-5">Comment</th>
                <th className="p-5">Date</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition">
                  <td className="p-5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.username} photoUrl={r.photo_url} size={30} />
                      <div>
                        <p className="text-white font-semibold text-sm">{r.username}</p>
                        {r.is_verified === 1 && (
                          <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
                            <ShieldCheck size={9} /> Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-5 text-gray-400 text-sm max-w-[150px]">
                    <p className="truncate font-semibold text-white">{r.property_title || `#${r.property_id}`}</p>
                  </td>
                  <td className="p-5">
                    <Stars rating={r.rating} size={13} />
                    <span className="text-white/50 text-[10px] font-bold mt-0.5 block">{Number(r.rating).toFixed(1)}</span>
                  </td>
                  <td className="p-5 text-gray-400 text-xs max-w-[200px]">
                    <span className="line-clamp-2">{r.comment || <span className="italic text-white/20">No comment</span>}</span>
                  </td>
                  <td className="p-5 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                  </td>
                  <td className="p-5 text-right">
                    <button onClick={() => handleDelete(r.id)} disabled={deletingId === r.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[9px] font-black uppercase tracking-widest transition disabled:opacity-40 ml-auto">
                      {deletingId === r.id ? <Loader size={10} className="animate-spin" /> : <Trash2 size={10} />}
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
