import React, { useState } from 'react';
import { Star, Pencil, Trash2, Check, X } from 'lucide-react';
import { getCurrentUser } from '../lib/auth';
import { apiFetch } from '../lib/api';

/* ── Half-star display ─────────────────────────────────────────────────────── */
function StarDisplay({ rating, size = 16 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const half   = !filled && rating >= star - 0.5;
        return (
          <div key={star} className="relative inline-flex" style={{ width: size, height: size }}>
            <Star size={size} className="absolute text-white/15" />
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

/* ── Interactive input ─────────────────────────────────────────────────────── */
function StarInput({ value, onChange, size = 28 }) {
  const [hovered, setHovered] = useState(null);
  const display = hovered !== null ? hovered : value;

  const resolve = (e, star) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return e.clientX - rect.left < rect.width / 2 ? star - 0.5 : star;
  };

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHovered(null)}>
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

/* ── Main component ────────────────────────────────────────────────────────── */
export default function UserRating({ ratings, setRatings }) {
  const [editingId,   setEditingId]   = useState(null);
  const [editRating,  setEditRating]  = useState(0);
  const [editComment, setEditComment] = useState('');
  const [saving,      setSaving]      = useState(false);

  const user = getCurrentUser();

  const startEdit = (r) => {
    setEditingId(r.id);
    setEditRating(Number(r.rating));
    setEditComment(r.comment || '');
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id) => {
    if (!editRating) { alert('Please select a star rating.'); return; }
    setSaving(true);
    try {
      await apiFetch(`/api/ratings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, rating: editRating, comment: editComment }),
      });
      setRatings((prev) =>
        prev.map((r) => r.id === id ? { ...r, rating: editRating, comment: editComment } : r)
      );
      setEditingId(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteRating = async (id) => {
    if (!window.confirm('Delete this rating?')) return;
    try {
      await apiFetch(`/api/ratings/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      setRatings((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  /* Empty state */
  if (!ratings || ratings.length === 0) {
    return (
      <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 border-dashed p-16 rounded-[40px] text-center">
        <Star size={40} className="mx-auto mb-4 text-white/20" />
        <p className="text-lg font-bold text-white/40">No ratings yet.</p>
        <p className="text-sm mt-2 text-white/30">
          Browse our agents and rate them — your reviews will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30 mb-6">
        {ratings.length} {ratings.length === 1 ? 'Rating' : 'Ratings'} submitted
      </p>

      {ratings.map((r) => (
        <div key={r.id} className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6">
          {editingId === r.id ? (
            /* ── Edit mode ── */
            <div className="space-y-4">
              <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/40">
                Editing rating for <span className="text-white">{r.agent_name}</span>
              </p>
              <StarInput value={editRating} onChange={setEditRating} size={28} />
              <textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                rows={3}
                placeholder="Comment (optional)..."
                className="w-full bg-black/50 border border-zinc-700 focus:border-zinc-400 text-white text-sm rounded-xl px-4 py-3 outline-none resize-none transition placeholder:text-white/20"
              />
              <div className="flex gap-3">
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white/60 hover:text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition"
                >
                  <X size={12} /> Cancel
                </button>
                <button
                  onClick={() => saveEdit(r.id)}
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
                >
                  <Check size={12} /> Save
                </button>
              </div>
            </div>
          ) : (
            /* ── View mode ── */
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <p className="font-black text-white tracking-tight">{r.agent_name}</p>
                <div className="flex items-center gap-2">
                  <StarDisplay rating={Number(r.rating)} size={15} />
                  <span className="text-white/50 text-xs font-bold tabular-nums">{Number(r.rating).toFixed(1)}</span>
                </div>
                {r.comment && (
                  <p className="text-white/50 text-sm italic mt-1">"{r.comment}"</p>
                )}
                <p className="text-white/20 text-[10px] font-bold tracking-wider uppercase">
                  {new Date(r.updated_at || r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => startEdit(r)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition"
                  title="Edit rating"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => deleteRating(r.id)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition"
                  title="Delete rating"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
