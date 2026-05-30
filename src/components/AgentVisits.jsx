import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, User, Mail, MessageSquare,
  CheckCircle, XCircle, Loader, Plus, Pencil,
  Trash2, RefreshCw, X, Building2,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { getCurrentUser } from '../lib/auth';

const STATUS_STYLES = {
  PENDING:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  APPROVED:  'bg-green-500/10  text-green-400  border-green-500/30',
  CANCELLED: 'bg-red-500/10    text-red-400    border-red-500/30',
};

const inputCls =
  'w-full bg-[#0a0a0a] border border-white/10 text-white rounded-xl px-4 py-3 text-sm ' +
  'focus:outline-none focus:border-white/30 placeholder:text-white/20';

const Label = ({ children }) => (
  <p className="text-[9px] font-black tracking-widest uppercase text-white/30 mb-1.5">{children}</p>
);

const EMPTY_FORM = {
  property_id: '',
  user_id:     '',
  visit_date:  '',
  visit_time:  '',
  notes:       '',
  agent_notes: '',
  status:      'PENDING',
};

// ─────────────────────────────────────────────────────────────────────────────
const AgentVisits = () => {
  const [agentId,     setAgentId]     = useState(null);
  const [initError,   setInitError]   = useState('');

  const [visits,      setVisits]      = useState([]);
  const [loading,     setLoading]     = useState(true);

  // Dropdown data for create/edit
  const [properties,  setProperties]  = useState([]);
  const [users,       setUsers]       = useState([]);

  // Modal
  const [modal,       setModal]       = useState(null); // null | { mode:'create' } | { mode:'edit', visit }
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [submitting,  setSubmitting]  = useState(false);
  const [formError,   setFormError]   = useState('');

  // Inline quick-actions
  const [updatingId,  setUpdatingId]  = useState(null);
  const [deletingId,  setDeletingId]  = useState(null);

  // ── 1. Resolve agent id ───────────────────────────────────────────────────
  useEffect(() => {
    const user = getCurrentUser();
    if (!user?.id) { setInitError('You must be logged in.'); setLoading(false); return; }
    apiFetch(`/api/agents/by-user/${user.id}`)
      .then((a) => setAgentId(a.id))
      .catch(() => { setInitError('Your account is not linked to an agent profile.'); setLoading(false); });
  }, []);

  // ── 2. Load visits ────────────────────────────────────────────────────────
  const loadVisits = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/api/visits/agent/${agentId}`);
      // Exclude rental requests — those live in the Rental Requests section
      const nonRentals = (Array.isArray(data) ? data : []).filter(
        (v) => !v.notes?.startsWith('Rental request')
      );
      setVisits(nonRentals);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  // ── 3. Load dropdown data ─────────────────────────────────────────────────
  const loadDropdowns = useCallback(async () => {
    if (!agentId) return;
    try {
      const [props, usrs] = await Promise.all([
        apiFetch('/api/properties'),
        apiFetch('/api/users'),
      ]);
      // Filter properties belonging to this agent
      const myProps = Array.isArray(props)
        ? props.filter((p) => p.agent_id === agentId)
        : [];
      setProperties(myProps);
      setUsers(Array.isArray(usrs) ? usrs.filter((u) => u.role === 'user') : []);
    } catch (err) {
      console.error('Failed to load dropdowns:', err);
    }
  }, [agentId]);

  useEffect(() => {
    if (agentId) { loadVisits(); loadDropdowns(); }
  }, [agentId, loadVisits, loadDropdowns]);

  // ── Open modals ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setModal({ mode: 'create' });
  };

  const openEdit = (visit) => {
    setForm({
      property_id: visit.property_id ?? '',
      user_id:     visit.user_id     ?? '',
      visit_date:  visit.visit_date
        ? new Date(visit.visit_date).toISOString().split('T')[0]
        : '',
      visit_time:  visit.visit_time  || '',
      notes:       visit.notes       || '',   // user's note — shown read-only in modal
      agent_notes: visit.agent_notes || '',   // agent's reply — editable
      status:      visit.status      || 'PENDING',
    });
    setFormError('');
    setModal({ mode: 'edit', visit });
  };

  const closeModal = () => { setModal(null); setForm(EMPTY_FORM); setFormError(''); };

  // ── CREATE ────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.visit_date || !form.visit_time) {
      setFormError('Date and time are required.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const currentUser = getCurrentUser();
      await apiFetch('/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'agent',
          'x-user-id':   String(currentUser?.id || ''),
        },
        body: JSON.stringify({
          agent_id:    agentId,
          property_id: form.property_id || null,
          user_id:     form.user_id     || null,
          visit_date:  form.visit_date,
          visit_time:  form.visit_time,
          notes:       form.notes       || null,
          status:      form.status,
        }),
      });
      closeModal();
      loadVisits();
    } catch (err) {
      setFormError(err.message || 'Failed to create visit.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── UPDATE (from modal) ───────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!form.visit_date || !form.visit_time) {
      setFormError('Date and time are required.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const currentUser = getCurrentUser();
      await apiFetch(`/api/visits/${modal.visit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'agent',
          'x-user-id':   String(currentUser?.id || ''),
        },
        body: JSON.stringify({
          visit_date:  form.visit_date,
          visit_time:  form.visit_time,
          agent_notes: form.agent_notes || null,  // agent reply — user's notes field is never overwritten
          status:      form.status,
        }),
      });
      closeModal();
      loadVisits();
    } catch (err) {
      setFormError(err.message || 'Failed to save.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Quick status toggle (Approve / Decline buttons) ───────────────────────
  const handleQuickStatus = async (visitId, newStatus) => {
    setUpdatingId(visitId);
    try {
      const currentUser = getCurrentUser();
      await apiFetch(`/api/visits/${visitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'agent',
          'x-user-id':   String(currentUser?.id || ''),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      setVisits((prev) =>
        prev.map((v) => (v.id === visitId ? { ...v, status: newStatus } : v))
      );
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── DELETE ────────────────────────────────────────────────────────────────
  const handleDelete = async (visitId) => {
    if (!window.confirm('Delete this visit? This cannot be undone.')) return;
    setDeletingId(visitId);
    try {
      const currentUser = getCurrentUser();
      await apiFetch(`/api/visits/${visitId}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': currentUser?.role || 'agent',
          'x-user-id':   String(currentUser?.id || ''),
        },
      });
      setVisits((prev) => prev.filter((v) => v.id !== visitId));
    } catch (err) {
      alert(err.message || 'Failed to delete visit.');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (initError) {
    return (
      <div className="p-10">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400 text-sm">
          {initError}
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-10 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-extrabold uppercase tracking-tight">MY VISITS</h2>
          <p className="text-white/40 text-xs font-bold tracking-widest uppercase mt-1">
            Property visit requests from clients
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 text-[10px] font-black tracking-widest uppercase">
            {visits.filter((v) => v.status === 'PENDING').length} Pending
          </span>
          <span className="px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/30 text-[10px] font-black tracking-widest uppercase">
            {visits.filter((v) => v.status === 'APPROVED').length} Approved
          </span>
          <button
            onClick={loadVisits}
            className="flex items-center gap-2 text-white/40 hover:text-white transition text-[10px] font-bold uppercase tracking-widest"
          >
            <RefreshCw size={13} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition"
          >
            <Plus size={13} /> New Visit
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-48 gap-3 text-white/40">
          <Loader size={18} className="animate-spin" />
          <span className="text-xs font-bold tracking-widest uppercase">Loading visits…</span>
        </div>
      ) : visits.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-3xl p-16 text-center space-y-3">
          <Calendar size={32} className="mx-auto text-white/20" />
          <p className="text-white/40 text-sm font-bold uppercase tracking-widest">No visits scheduled yet</p>
          <p className="text-white/20 text-xs">Create one manually or wait for clients to book.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visits.map((visit) => (
            <div
              key={visit.id}
              className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6 hover:border-white/20 transition"
            >
              {/* Status badge */}
              <div className="shrink-0">
                <span className={`px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border ${STATUS_STYLES[visit.status] || ''}`}>
                  {visit.status}
                </span>
              </div>

              {/* Property pill */}
              {visit.property_title && (
                <div className="shrink-0 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold tracking-widest uppercase text-white/50">
                  {visit.property_title}
                </div>
              )}

              {/* Info grid */}
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-2">
                    <User size={13} className="text-white/30 mt-0.5 shrink-0" />
                    <div>
                      <Label>Client</Label>
                      <p className="text-sm font-semibold text-white">
                        {visit.user_name || (visit.user_id ? `User #${visit.user_id}` : '—')}
                      </p>
                      <p className="text-xs text-white/40">{visit.user_email || ''}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar size={13} className="text-white/30 mt-0.5 shrink-0" />
                    <div>
                      <Label>Date &amp; Time</Label>
                      <p className="text-sm font-semibold text-white">
                        {visit.visit_date
                          ? new Date(visit.visit_date).toLocaleDateString('en-GB', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })
                          : '—'}
                      </p>
                      <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                        <Clock size={11} /> {visit.visit_time || ''}
                      </p>
                    </div>
                  </div>

                  {/* Client's booking note */}
                  {visit.notes && (
                    <div className="flex items-start gap-2">
                      <MessageSquare size={13} className="text-white/30 mt-0.5 shrink-0" />
                      <div>
                        <Label>Client's Note</Label>
                        <p className="text-xs text-white/60 italic line-clamp-2">"{visit.notes}"</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Agent's note to client */}
                {visit.agent_notes && (
                  <div className="flex items-start gap-2 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2">
                    <MessageSquare size={12} className="text-blue-400/60 mt-0.5 shrink-0" />
                    <div>
                      <Label>My Note to Client</Label>
                      <p className="text-xs text-blue-300/70 italic">"{visit.agent_notes}"</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action area */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Approve / Decline — only for PENDING */}
                {visit.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleQuickStatus(visit.id, 'APPROVED')}
                      disabled={updatingId === visit.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-500/10 hover:bg-green-500/20
                                 text-green-400 border border-green-500/30 rounded-xl text-[10px] font-black
                                 uppercase tracking-widest transition disabled:opacity-50"
                    >
                      {updatingId === visit.id
                        ? <Loader size={12} className="animate-spin" />
                        : <CheckCircle size={12} />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleQuickStatus(visit.id, 'CANCELLED')}
                      disabled={updatingId === visit.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20
                                 text-red-400 border border-red-500/30 rounded-xl text-[10px] font-black
                                 uppercase tracking-widest transition disabled:opacity-50"
                    >
                      <XCircle size={12} /> Decline
                    </button>
                  </>
                )}

                {visit.status === 'APPROVED' && (
                  <CheckCircle size={18} className="text-green-400" />
                )}
                {visit.status === 'CANCELLED' && (
                  <XCircle size={18} className="text-red-400" />
                )}

                {/* Edit */}
                <button
                  onClick={() => openEdit(visit)}
                  className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/5 transition"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(visit.id)}
                  disabled={deletingId === visit.id}
                  className="p-2 rounded-xl text-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-40"
                  title="Delete"
                >
                  {deletingId === visit.id
                    ? <Loader size={14} className="animate-spin" />
                    : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL — Create / Edit
      ══════════════════════════════════════════════════════════════════ */}
      {modal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
          <div className="bg-[#111] border border-white/10 p-8 rounded-3xl w-full max-w-lg relative">

            <button
              onClick={closeModal}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition"
            >
              <X size={18} />
            </button>

            <h3 className="text-sm font-black uppercase tracking-widest mb-6">
              {modal.mode === 'create' ? 'Schedule New Visit' : 'Edit Visit'}
            </h3>

            {formError && (
              <p className="text-red-400 text-xs font-bold mb-5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {formError}
              </p>
            )}

            <div className="space-y-4">

              {/* Property — only for create (can't move a visit to another property) */}
              {modal.mode === 'create' && (
                <div>
                  <Label>Property (optional)</Label>
                  <select
                    value={form.property_id}
                    onChange={(e) => setForm((p) => ({ ...p, property_id: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">— No specific property —</option>
                    {properties.map((prop) => (
                      <option key={prop.id} value={prop.id}>
                        {prop.title} — {prop.location}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Client (user) — only for create */}
              {modal.mode === 'create' && (
                <div>
                  <Label>Client (optional)</Label>
                  <select
                    value={form.user_id}
                    onChange={(e) => setForm((p) => ({ ...p, user_id: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">— Select a registered client —</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.username} — {u.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <input
                    type="date"
                    value={form.visit_date}
                    onChange={(e) => setForm((p) => ({ ...p, visit_date: e.target.value }))}
                    className={`${inputCls} [color-scheme:dark]`}
                    required
                  />
                </div>
                <div>
                  <Label>Time *</Label>
                  <input
                    type="time"
                    value={form.visit_time}
                    onChange={(e) => setForm((p) => ({ ...p, visit_time: e.target.value }))}
                    className={`${inputCls} [color-scheme:dark]`}
                    required
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <Label>Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                  className={inputCls}
                >
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Client's note — read-only, only in edit mode */}
              {modal.mode === 'edit' && form.notes && (
                <div>
                  <Label>Client's Note</Label>
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-xs text-white/50 italic">
                    "{form.notes}"
                  </div>
                </div>
              )}

              {/* Create mode: general note (stored as notes) */}
              {modal.mode === 'create' && (
                <div>
                  <Label>Note (optional)</Label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Any additional details…"
                    className={`${inputCls} resize-none`}
                  />
                </div>
              )}

              {/* Agent's reply — shown in edit mode; appears on user's dashboard */}
              {modal.mode === 'edit' && (
                <div>
                  <Label>Note to Client <span className="text-white/20 normal-case font-normal tracking-normal">(visible on client's dashboard)</span></Label>
                  <textarea
                    rows={3}
                    value={form.agent_notes}
                    onChange={(e) => setForm((p) => ({ ...p, agent_notes: e.target.value }))}
                    placeholder="Leave a message for the client — e.g. parking info, entry code, reminders…"
                    className={`${inputCls} resize-none`}
                  />
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={modal.mode === 'create' ? handleCreate : handleUpdate}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-white text-black py-3.5
                           rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200
                           transition disabled:opacity-50"
              >
                {submitting
                  ? <><Loader size={13} className="animate-spin" /> Saving…</>
                  : modal.mode === 'create' ? 'Create Visit' : 'Save Changes'}
              </button>
              <button
                onClick={closeModal}
                className="px-6 py-3.5 rounded-xl border border-white/10 text-white/40
                           hover:text-white hover:border-white/30 text-[10px] font-black
                           uppercase tracking-widest transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentVisits;
