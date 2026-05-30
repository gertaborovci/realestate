import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck, Clock, MapPin, Pencil, Trash2,
  Plus, X, Check, Loader, MessageSquare,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { getCurrentUser } from '../lib/auth';

const TIME_SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];

const STATUS_STYLE = {
  PENDING:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  APPROVED:  'bg-green-500/10  text-green-400  border-green-500/30',
  CANCELLED: 'bg-red-500/10    text-red-400    border-red-500/30',
};

const today = new Date().toISOString().split('T')[0];
const EMPTY  = { property_id: '', visit_date: '', visit_time: '', notes: '' };

export default function UserVisits() {
  const user = getCurrentUser();

  const [visits,      setVisits]      = useState([]);
  const [properties,  setProperties]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState(null);   // null | 'create' | 'edit'
  const [editTarget,  setEditTarget]  = useState(null);
  const [form,        setForm]        = useState(EMPTY);
  const [formError,   setFormError]   = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [deletingId,  setDeletingId]  = useState(null);
  const [loadError,   setLoadError]   = useState('');

  // ── Fetch user's visits ────────────────────────────────────────────────────
  const loadVisits = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setLoadError('');
      const data = await apiFetch(`/api/visits/user/${user.id}`);
      setVisits(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setLoadError(err.message || 'Could not load visits. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadVisits(); }, [loadVisits]);

  // ── Fetch properties for create form dropdown ──────────────────────────────
  useEffect(() => {
    apiFetch('/api/properties')
      .then((d) => setProperties(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(EMPTY);
    setFormError('');
    setModal('create');
  };

  const openEdit = (v) => {
    setForm({
      property_id: v.property_id,
      visit_date:  v.visit_date ? v.visit_date.split('T')[0] : '',
      visit_time:  v.visit_time  || '',
      notes:       v.notes       || '',
    });
    setEditTarget(v);
    setFormError('');
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setEditTarget(null); };

  // ── Create / Update ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (modal === 'create' && !form.property_id) { setFormError('Please select a property.'); return; }
    if (!form.visit_date) { setFormError('Please select a date.'); return; }
    if (!form.visit_time) { setFormError('Please select a time slot.'); return; }

    setSubmitting(true);
    setFormError('');
    const headers = {
      'Content-Type': 'application/json',
      'x-user-role': 'user',
      'x-user-id': String(user.id),
    };

    try {
      if (modal === 'create') {
        await apiFetch('/api/visits', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            property_id: Number(form.property_id),
            user_id:     user.id,
            visit_date:  form.visit_date,
            visit_time:  form.visit_time,
            notes:       form.notes || null,
          }),
        });
      } else {
        await apiFetch(`/api/visits/${editTarget.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            visit_date: form.visit_date,
            visit_time: form.visit_time,
            notes:      form.notes || null,
          }),
        });
      }
      closeModal();
      loadVisits();
    } catch (err) {
      setFormError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Cancel visit (status → CANCELLED) ─────────────────────────────────────
  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this visit?')) return;
    setCancellingId(id);
    try {
      await apiFetch(`/api/visits/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'user',
          'x-user-id': String(user.id),
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      loadVisits();
    } catch (err) {
      alert(err.message || 'Failed to cancel visit.');
    } finally {
      setCancellingId(null);
    }
  };

  // ── Delete visit ───────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this visit?')) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/visits/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-role': 'user', 'x-user-id': String(user.id) },
      });
      setVisits((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete visit.');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <CalendarCheck className="text-white/60" size={22} />
          <h2 className="text-2xl font-bold text-white">My Visits</h2>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition"
        >
          <Plus size={14} /> Book Visit
        </button>
      </div>

      {/* Load error */}
      {loadError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 text-red-400 text-sm mb-6">
          {loadError}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center gap-3 text-white/40 justify-center py-20">
          <Loader size={18} className="animate-spin" />
          <span className="text-xs font-bold tracking-widest uppercase">Loading…</span>
        </div>
      ) : visits.length === 0 ? (
        <div className="bg-white/5 border border-white/10 border-dashed p-16 rounded-[40px] text-center">
          <CalendarCheck size={48} className="mx-auto mb-4 text-white/20" />
          <p className="text-lg font-bold text-white/40">No visits scheduled yet.</p>
          <p className="text-sm mt-2 text-white/30">
            Book a visit to see a property in person — your agent will confirm the appointment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visits.map((v) => {
            const isPending   = v.status === 'PENDING';
            const isCancelled = v.status === 'CANCELLED';
            return (
              <div
                key={v.id}
                className={`bg-zinc-900/60 border rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6 transition ${
                  isCancelled ? 'border-white/5 opacity-60' : 'border-white/10'
                }`}
              >
                {/* Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${STATUS_STYLE[v.status] || ''}`}>
                      {v.status}
                    </span>
                    <span className="text-white/20 text-[9px] font-bold uppercase tracking-widest">#{v.id}</span>
                  </div>

                  <p className="font-black text-white text-lg leading-tight">
                    {v.property_title || `Property #${v.property_id}`}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-white/40 text-sm">
                    <span className="flex items-center gap-1.5">
                      <CalendarCheck size={13} />
                      {v.visit_date
                        ? new Date(v.visit_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} /> {v.visit_time || '—'}
                    </span>
                    {v.property_location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} /> {v.property_location}
                      </span>
                    )}
                  </div>

                  {/* User's own booking note */}
                  {v.notes && (
                    <p className="text-white/40 text-xs italic">Your note: "{v.notes}"</p>
                  )}

                  {/* Agent's reply note */}
                  {v.agent_notes && (
                    <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/20 rounded-xl px-3 py-2 mt-1">
                      <MessageSquare size={12} className="text-blue-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[9px] font-black tracking-widest uppercase text-blue-400/60 mb-0.5">
                          Note from your agent
                        </p>
                        <p className="text-xs text-blue-300/80 italic">"{v.agent_notes}"</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isPending && (
                    <>
                      {/* Reschedule */}
                      <button
                        onClick={() => openEdit(v)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition"
                        title="Reschedule"
                      >
                        <Pencil size={14} />
                      </button>
                      {/* Cancel */}
                      <button
                        onClick={() => handleCancel(v.id)}
                        disabled={cancellingId === v.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider transition disabled:opacity-50"
                      >
                        {cancellingId === v.id
                          ? <Loader size={12} className="animate-spin" />
                          : <X size={12} />}
                        Cancel
                      </button>
                    </>
                  )}

                  {/* Delete — only for cancelled visits */}
                  {isCancelled && (
                    <button
                      onClick={() => handleDelete(v.id)}
                      disabled={deletingId === v.id}
                      className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/30 hover:text-red-400 transition"
                      title="Delete visit"
                    >
                      {deletingId === v.id
                        ? <Loader size={14} className="animate-spin" />
                        : <Trash2 size={14} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal (create / edit) ── */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-lg space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tight text-white">
                {modal === 'create' ? 'Book a Visit' : 'Reschedule Visit'}
              </h3>
              <button onClick={closeModal} className="text-white/30 hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Property — only for create */}
              {modal === 'create' && (
                <div>
                  <label className="block text-[10px] font-black tracking-[0.25em] uppercase text-white/40 mb-2">
                    Property
                  </label>
                  <select
                    value={form.property_id}
                    onChange={(e) => setForm({ ...form, property_id: e.target.value })}
                    className="w-full bg-black/50 border border-zinc-700 focus:border-zinc-400 text-white text-sm rounded-xl px-4 py-3 outline-none transition"
                  >
                    <option value="">— Select a property —</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} — {p.location}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-[10px] font-black tracking-[0.25em] uppercase text-white/40 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  min={today}
                  value={form.visit_date}
                  onChange={(e) => setForm({ ...form, visit_date: e.target.value })}
                  className="w-full bg-black/50 border border-zinc-700 focus:border-zinc-400 text-white text-sm rounded-xl px-4 py-3 outline-none transition [color-scheme:dark]"
                />
              </div>

              {/* Time slots */}
              <div>
                <label className="block text-[10px] font-black tracking-[0.25em] uppercase text-white/40 mb-2">
                  Time
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setForm({ ...form, visit_time: slot })}
                      className={`py-2 rounded-xl text-[10px] font-black tracking-wider transition border ${
                        form.visit_time === slot
                          ? 'bg-white text-black border-white'
                          : 'bg-black/40 text-white/40 border-white/10 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-black tracking-[0.25em] uppercase text-white/40 mb-2">
                  Notes{' '}
                  <span className="text-white/20 normal-case font-normal tracking-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any special requests or questions…"
                  className="w-full bg-black/50 border border-zinc-700 focus:border-zinc-400 text-white text-sm rounded-xl px-4 py-3 outline-none resize-none transition placeholder:text-white/20"
                />
              </div>

              {formError && (
                <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white/60 hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition"
                >
                  <X size={13} /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 bg-white hover:bg-gray-200 text-black px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
                >
                  {submitting
                    ? <Loader size={13} className="animate-spin" />
                    : <Check size={13} />}
                  {modal === 'create' ? 'Confirm Visit' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
