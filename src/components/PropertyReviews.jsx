import React, { useState, useEffect } from 'react';
import { Star, X, Pencil, Trash2, Check, Loader, ShieldCheck, MessageSquare } from 'lucide-react';
import { apiFetch, API_BASE } from '../lib/api';
import { getCurrentUser } from '../lib/auth';

// ─── Half-star display ────────────────────────────────────────────────────────
function Stars({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => {
        const filled = rating >= s;
        const half   = !filled && rating >= s - 0.5;
        return (
          <div key={s} className="relative inline-flex" style={{ width: size, height: size }}>
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

// ─── Clickable star input ─────────────────────────────────────────────────────
function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(null)}>
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onMouseEnter={() => setHovered(s)}
          onClick={() => onChange(s)}
          className="transition">
          <Star size={24} className={s <= (hovered ?? value)
            ? 'text-yellow-400 fill-yellow-400'
            : 'text-white/20'} />
        </button>
      ))}
    </div>
  );
}

// ─── User avatar ──────────────────────────────────────────────────────────────
function Avatar({ name, photoUrl, size = 36 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  if (photoUrl) {
    const src = photoUrl.startsWith('http') ? photoUrl : `${API_BASE}${photoUrl}`;
    return <img src={src} alt={name} className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size }} />;
  }
  return (
    <div className="rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-white font-black text-[10px]"
      style={{ width: size, height: size }}>
      {initials}
    </div>
  );
}

// ─── Star distribution bar ────────────────────────────────────────────────────
function RatingBreakdown({ reviews }) {
  const total = reviews.length;
  if (!total) return null;
  const avg = reviews.reduce((s, r) => s + Number(r.rating), 0) / total;
  return (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <p className="text-5xl font-black text-white">{avg.toFixed(1)}</p>
        <Stars rating={avg} size={14} />
        <p className="text-white/30 text-[10px] font-bold mt-1">{total} review{total !== 1 ? 's' : ''}</p>
      </div>
      <div className="flex-1 space-y-1.5">
        {[5,4,3,2,1].map(star => {
          const count = reviews.filter(r => Math.round(Number(r.rating)) === star).length;
          const pct   = total ? (count / total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 w-3 font-bold">{star}</span>
              <Star size={10} className="text-yellow-400/60 fill-yellow-400/60 shrink-0" />
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400/70 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[9px] text-white/30 w-4 font-bold">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Inline edit form for a review ───────────────────────────────────────────
function InlineEditReview({ review, onSave, onCancel }) {
  const [rating,  setRating]  = useState(Number(review.rating));
  const [comment, setComment] = useState(review.comment || '');
  const [saving,  setSaving]  = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(review.id, { rating, comment });
    setSaving(false);
  };

  return (
    <div className="space-y-3 mt-3 p-3 bg-black/30 rounded-xl border border-white/8">
      <StarInput value={rating} onChange={setRating} />
      <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2}
        className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl px-3 py-2 outline-none resize-none placeholder:text-white/20" />
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1 bg-white text-black px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition disabled:opacity-50">
          {saving ? <Loader size={11} className="animate-spin" /> : <Check size={11} />} Save
        </button>
        <button onClick={onCancel}
          className="px-4 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-wider transition">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Single review card ───────────────────────────────────────────────────────
function ReviewCard({ review, currentUserId, onEdit, onDelete, isAdmin, onAdminEdit, onAdminDelete }) {
  const isOwn = review.user_id === currentUserId;
  const [adminEditing, setAdminEditing] = useState(false);
  const date  = new Date(review.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });

  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <Avatar name={review.username} photoUrl={review.photo_url} size={38} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-white font-bold text-sm">{review.username}</span>
            {review.is_verified === 1 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-wider">
                <ShieldCheck size={9} /> Verified
              </span>
            )}
            <span className="text-white/20 text-[10px]">{date}</span>
          </div>
          <Stars rating={Number(review.rating)} size={13} />
          {!adminEditing && review.comment && (
            <p className="text-white/60 text-sm mt-2 leading-relaxed">{review.comment}</p>
          )}
          {/* Admin inline edit */}
          {adminEditing && (
            <InlineEditReview
              review={review}
              onSave={async (id, data) => { await onAdminEdit(id, data); setAdminEditing(false); }}
              onCancel={() => setAdminEditing(false)}
            />
          )}
        </div>

        {/* Own user actions */}
        {!isAdmin && isOwn && (
          <div className="flex gap-1 shrink-0">
            <button onClick={() => onEdit(review)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/30 hover:text-white transition">
              <Pencil size={13} />
            </button>
            <button onClick={() => onDelete(review.id)}
              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 transition">
              <Trash2 size={13} />
            </button>
          </div>
        )}

        {/* Admin actions */}
        {isAdmin && !adminEditing && (
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setAdminEditing(true)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/30 hover:text-white transition" title="Edit">
              <Pencil size={13} />
            </button>
            <button onClick={() => onAdminDelete(review.id)}
              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 transition" title="Delete">
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PropertyReviews({ propertyId, propertyTitle, showModal = false, onClose, defaultOpen = false, isAdmin = false }) {
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [myRating,   setMyRating]   = useState(0);
  const [myComment,  setMyComment]  = useState('');
  const [editingId,  setEditingId]  = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [showAll,    setShowAll]    = useState(showModal || defaultOpen);

  const user = getCurrentUser();

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/property-reviews/property/${propertyId}`);
      setReviews(Array.isArray(data) ? data : []);
    } catch { setReviews([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (propertyId) load(); }, [propertyId]);

  // Pre-fill form if user already has a review
  useEffect(() => {
    if (!user?.id || !reviews.length) return;
    const mine = reviews.find(r => r.user_id === user.id);
    if (mine && !editingId) {
      setMyRating(Number(mine.rating));
      setMyComment(mine.comment || '');
    }
  }, [reviews, user?.id]);

  const myExistingReview = reviews.find(r => r.user_id === user?.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!myRating) { setError('Please pick a star rating.'); return; }
    if (!user?.id) { setError('Please sign in to leave a review.'); return; }
    setSubmitting(true); setError('');
    try {
      if (editingId) {
        await apiFetch(`/api/property-reviews/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating: myRating, comment: myComment }),
        });
        setEditingId(null);
      } else {
        await apiFetch('/api/property-reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, property_id: propertyId, rating: myRating, comment: myComment }),
        });
      }
      load();
    } catch (err) { setError(err.message || 'Failed to submit.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove your review?')) return;
    await apiFetch(`/api/property-reviews/${id}`, { method: 'DELETE' });
    setMyRating(0); setMyComment('');
    load();
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setMyRating(Number(r.rating));
    setMyComment(r.comment || '');
    setShowAll(true);
  };

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length).toFixed(1)
    : null;

  // ── Inline summary (shown on property page, click to expand) ──
  if (!showAll) {
    return (
      <button
        onClick={() => setShowAll(true)}
        className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl px-5 py-3 transition w-full text-left group"
      >
        <MessageSquare size={16} className="text-white/40 shrink-0" />
        <div className="flex-1">
          <span className="text-white/60 text-sm font-bold">
            {reviews.length === 0 ? 'No reviews yet — be the first' : `${reviews.length} review${reviews.length !== 1 ? 's' : ''}`}
          </span>
          {avg && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Stars rating={Number(avg)} size={11} />
              <span className="text-white/40 text-[10px] font-bold">{avg}</span>
            </div>
          )}
        </div>
        <span className="text-white/30 text-xs font-bold group-hover:text-white transition">View all →</span>
      </button>
    );
  }

  // ── Full panel ──
  const panel = (
    <div className={showModal ? 'w-full' : 'space-y-6'}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Reviews</h3>
          {propertyTitle && <p className="text-white/40 text-xs mt-0.5">{propertyTitle}</p>}
        </div>
        {showModal
          ? <button onClick={onClose} className="text-white/30 hover:text-white transition p-1"><X size={18} /></button>
          : <button onClick={() => setShowAll(false)} className="text-white/30 hover:text-white text-xs font-bold transition">← Back</button>
        }
      </div>

      {/* Rating breakdown */}
      {reviews.length > 0 && <RatingBreakdown reviews={reviews} />}

      {/* Write / edit review — hidden for admin */}
      {!isAdmin && user ? (
        <form onSubmit={handleSubmit} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
            {editingId ? 'Edit your review' : myExistingReview ? 'Your review' : 'Leave a review'}
          </p>
          <StarInput value={myRating} onChange={setMyRating} />
          <textarea value={myComment} onChange={e => setMyComment(e.target.value)} rows={3}
            placeholder="Share your experience (optional)…"
            className="w-full bg-black/40 border border-white/10 focus:border-white/30 text-white text-sm rounded-xl px-4 py-3 outline-none resize-none transition placeholder:text-white/20" />
          {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={submitting}
              className="flex items-center gap-1.5 bg-white hover:bg-zinc-200 text-black px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition disabled:opacity-50">
              {submitting ? <><Loader size={12} className="animate-spin" /> Saving…</> : <><Check size={12} /> {editingId ? 'Save' : 'Submit'}</>}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); const m = reviews.find(r => r.user_id === user.id); if(m){ setMyRating(Number(m.rating)); setMyComment(m.comment||''); }}}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-white/40 hover:text-white text-xs font-black uppercase tracking-wider transition">
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : !isAdmin ? (
        <p className="text-white/30 text-sm bg-white/[0.03] border border-white/8 rounded-2xl px-5 py-4">
          <span className="text-white font-bold">Sign in</span> to leave a review.
        </p>
      ) : null}

      {/* Reviews list */}
      {loading ? (
        <div className="flex items-center gap-2 text-white/30 py-4"><Loader size={15} className="animate-spin" /><span className="text-xs">Loading…</span></div>
      ) : reviews.length === 0 ? (
        <p className="text-white/20 text-sm italic">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <ReviewCard key={r.id} review={r} currentUserId={user?.id}
              onEdit={startEdit} onDelete={handleDelete}
              isAdmin={isAdmin}
              onAdminEdit={async (id, data) => {
                await apiFetch(`/api/property-reviews/${id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                });
                load();
              }}
              onAdminDelete={async (id) => {
                if (!window.confirm('Delete this review?')) return;
                await apiFetch(`/api/property-reviews/${id}`, { method: 'DELETE' });
                load();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (showModal) {
    return (
      <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose?.()}>
        <div className="bg-[#0a0a0a] border border-white/10 rounded-[32px] w-full max-w-lg max-h-[85vh] overflow-y-auto p-8">
          {panel}
        </div>
      </div>
    );
  }
  return <div>{panel}</div>;
}
