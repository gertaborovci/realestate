import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, User, Mail, MessageSquare,
  CheckCircle, XCircle, Loader, Send, RefreshCw,
  Inbox, Plus, Pencil, Trash2, ChevronDown, ChevronUp, X,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { getCurrentUser } from '../lib/auth';
import { showAlert, showConfirm } from '../lib/modal';

// ── Status styling ─────────────────────────────────────────────────────────
const VISIT_STATUS_STYLES = {
  PENDING:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  APPROVED:  'bg-green-500/10  text-green-400  border-green-500/30',
  CANCELLED: 'bg-red-500/10    text-red-400    border-red-500/30',
};

const INQUIRY_STATUS_STYLES = {
  new:     'bg-blue-500/10  text-blue-400  border-blue-500/30',
  read:    'bg-white/5      text-white/40  border-white/10',
  replied: 'bg-green-500/10 text-green-400 border-green-500/30',
  closed:  'bg-white/5      text-white/20  border-white/5',
};

const EMPTY_FORM = { client_name: '', client_email: '', message: '' };

// ── Small reusable label ───────────────────────────────────────────────────
const Label = ({ children }) => (
  <p className="text-[9px] font-black tracking-widest uppercase text-white/30 mb-1.5">{children}</p>
);

const inputCls =
  'w-full bg-[#0a0a0a] border border-white/10 text-white rounded-xl px-4 py-3 text-sm ' +
  'focus:outline-none focus:border-white/30 placeholder:text-white/20';

// ═══════════════════════════════════════════════════════════════════════════
const ContactInquiries = () => {
  const [agentId,       setAgentId]       = useState(null);
  const [initError,     setInitError]     = useState('');

  // ── Messages state ──────────────────────────────────────────────────────
  const [inquiries,     setInquiries]     = useState([]);
  const [loadingInq,    setLoadingInq]    = useState(true);

  // ── Consultations state ─────────────────────────────────────────────────
  const [consultations, setConsultations] = useState([]);
  const [loadingCons,   setLoadingCons]   = useState(true);

  // ── Create form ─────────────────────────────────────────────────────────
  const [showCreate,    setShowCreate]    = useState(false);
  const [createForm,    setCreateForm]    = useState(EMPTY_FORM);
  const [creating,      setCreating]      = useState(false);
  const [createError,   setCreateError]   = useState('');

  // ── Edit state: { [id]: formValues } ───────────────────────────────────
  const [editingId,     setEditingId]     = useState(null);
  const [editForm,      setEditForm]      = useState({});
  const [saving,        setSaving]        = useState(false);

  // ── Reply state ─────────────────────────────────────────────────────────
  const [openReply,     setOpenReply]     = useState(null);
  const [replyText,     setReplyText]     = useState({});
  const [sendingReply,  setSendingReply]  = useState(null);

  // ── Delete state ────────────────────────────────────────────────────────
  const [deletingId,    setDeletingId]    = useState(null);

  // ── Visit approve/decline ───────────────────────────────────────────────
  const [updatingVisit, setUpdatingVisit] = useState(null);

  // ── Resolve agent ───────────────────────────────────────────────────────
  useEffect(() => {
    const user = getCurrentUser();
    if (!user?.id) {
      setInitError('You must be logged in.');
      setLoadingInq(false);
      setLoadingCons(false);
      return;
    }
    apiFetch(`/api/agents/by-user/${user.id}`)
      .then((a) => setAgentId(a.id))
      .catch(() => {
        setInitError('Your account is not linked to an agent profile.');
        setLoadingInq(false);
        setLoadingCons(false);
      });
  }, []);

  // ── Loaders ─────────────────────────────────────────────────────────────
  const loadInquiries = useCallback(async () => {
    if (!agentId) return;
    setLoadingInq(true);
    try {
      const data = await apiFetch(`/api/inquiries/agent/${agentId}`);
      setInquiries(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoadingInq(false); }
  }, [agentId]);

  const loadConsultations = useCallback(async () => {
    if (!agentId) return;
    setLoadingCons(true);
    try {
      const data = await apiFetch(`/api/visits/consultations/${agentId}`);
      setConsultations(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoadingCons(false); }
  }, [agentId]);

  useEffect(() => {
    if (agentId) { loadInquiries(); loadConsultations(); }
  }, [agentId, loadInquiries, loadConsultations]);

  const refresh = () => { loadInquiries(); loadConsultations(); };

  // ── CREATE inquiry ──────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.client_name.trim() || !createForm.message.trim()) {
      setCreateError('Client name and message are required.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      await apiFetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...createForm, agent_id: agentId }),
      });
      setCreateForm(EMPTY_FORM);
      setShowCreate(false);
      loadInquiries();
    } catch (err) {
      setCreateError(err.message || 'Failed to create inquiry.');
    } finally {
      setCreating(false);
    }
  };

  // ── EDIT inquiry ────────────────────────────────────────────────────────
  const openEdit = (inq) => {
    setEditingId(inq.id);
    setEditForm({
      client_name:  inq.client_name  || '',
      client_email: inq.client_email || '',
      message:      inq.message      || '',
      status:       inq.status       || 'new',
    });
    setOpenReply(null);
  };

  const handleSaveEdit = async (id) => {
    setSaving(true);
    try {
      await apiFetch(`/api/inquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === id ? { ...inq, ...editForm } : inq))
      );
      setEditingId(null);
    } catch (err) {
      await showAlert(err.message || 'Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── REPLY ───────────────────────────────────────────────────────────────
  const handleReply = async (id) => {
    const text = (replyText[id] || '').trim();
    if (!text) return;
    setSendingReply(id);
    try {
      await apiFetch(`/api/inquiries/${id}/reply`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: text }),
      });
      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === id ? { ...inq, reply: text, status: 'replied' } : inq
        )
      );
      setOpenReply(null);
      setReplyText((p) => ({ ...p, [id]: '' }));
    } catch (err) {
      await showAlert(err.message || 'Failed to send reply.', 'error');
    } finally {
      setSendingReply(null);
    }
  };

  // ── DELETE inquiry ──────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!await showConfirm('Delete this inquiry? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/inquiries/${id}`, { method: 'DELETE' });
      setInquiries((prev) => prev.filter((inq) => inq.id !== id));
    } catch (err) {
      await showAlert(err.message || 'Failed to delete.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Visit approve / decline ─────────────────────────────────────────────
  const handleVisitStatus = async (visitId, newStatus) => {
    setUpdatingVisit(visitId);
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
      setConsultations((prev) =>
        prev.map((c) => (c.id === visitId ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      await showAlert(err.message || 'Failed to update status.', 'error');
    } finally {
      setUpdatingVisit(null);
    }
  };

  // ── Guards ──────────────────────────────────────────────────────────────
  if (initError) {
    return (
      <div className="p-10">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400 text-sm">
          {initError}
        </div>
      </div>
    );
  }

  const newCount     = inquiries.filter((i) => i.status === 'new').length;
  const pendingCount = consultations.filter((c) => c.status === 'PENDING').length;

  return (
    <div className="p-10 max-w-4xl mx-auto space-y-14">

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold uppercase tracking-tight">CONTACT INQUIRIES</h1>
          <p className="text-white/40 text-xs font-bold tracking-widest uppercase mt-1">
            Messages &amp; consultation requests from clients
          </p>
        </div>
        <div className="flex items-center gap-3">
          {newCount > 0 && (
            <span className="px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-black tracking-widest uppercase">
              {newCount} New
            </span>
          )}
          {pendingCount > 0 && (
            <span className="px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 text-[10px] font-black tracking-widest uppercase">
              {pendingCount} Pending
            </span>
          )}
          <button
            onClick={refresh}
            className="flex items-center gap-2 text-white/40 hover:text-white transition text-[10px] font-bold uppercase tracking-widest"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — MESSAGES (contact_inquiries) — full CRUD
      ══════════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-black tracking-[0.25em] uppercase text-white/30 flex items-center gap-2">
            <MessageSquare size={13} /> Messages
          </h2>
          <button
            onClick={() => { setShowCreate((v) => !v); setCreateError(''); setCreateForm(EMPTY_FORM); }}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl
                       font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition"
          >
            <Plus size={12} /> New Message
          </button>
        </div>

        {/* ── Create form ── */}
        {showCreate && (
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 mb-5 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black uppercase tracking-widest text-white/60">New Inquiry</p>
              <button onClick={() => setShowCreate(false)} className="text-white/30 hover:text-white transition">
                <X size={14} />
              </button>
            </div>

            {createError && (
              <p className="text-red-400 text-xs font-bold">{createError}</p>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Client Name *</Label>
                  <input
                    type="text"
                    value={createForm.client_name}
                    onChange={(e) => setCreateForm((p) => ({ ...p, client_name: e.target.value }))}
                    placeholder="John Doe"
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <Label>Client Email</Label>
                  <input
                    type="email"
                    value={createForm.client_email}
                    onChange={(e) => setCreateForm((p) => ({ ...p, client_email: e.target.value }))}
                    placeholder="john@example.com"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <Label>Message *</Label>
                <textarea
                  rows={3}
                  value={createForm.message}
                  onChange={(e) => setCreateForm((p) => ({ ...p, message: e.target.value }))}
                  placeholder="Client's message…"
                  className={`${inputCls} resize-none`}
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl
                             font-black text-[10px] uppercase tracking-widest hover:bg-gray-200
                             transition disabled:opacity-50"
                >
                  {creating ? <Loader size={12} className="animate-spin" /> : <Plus size={12} />}
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-6 py-2.5 rounded-xl border border-white/10 text-white/40
                             hover:text-white hover:border-white/30 text-[10px] font-black
                             uppercase tracking-widest transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Inquiry list ── */}
        {loadingInq ? (
          <div className="flex items-center justify-center h-32 gap-3 text-white/40">
            <Loader size={16} className="animate-spin" />
            <span className="text-xs font-bold tracking-widest uppercase">Loading…</span>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-3xl p-12 text-center space-y-3">
            <Inbox size={28} className="mx-auto text-white/15" />
            <p className="text-white/40 text-sm font-bold uppercase tracking-widest">No messages yet</p>
            <p className="text-white/20 text-xs">When clients contact you, their messages will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inq) => {
              const isEditing = editingId === inq.id;
              const isReplying = openReply === inq.id;

              return (
                <div
                  key={inq.id}
                  className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-4 hover:border-white/20 transition"
                >
                  {/* ── View mode ── */}
                  {!isEditing ? (
                    <>
                      {/* Top row */}
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex flex-wrap gap-6">
                          <div className="flex items-start gap-2">
                            <User size={13} className="text-white/30 mt-0.5 shrink-0" />
                            <div>
                              <Label>From</Label>
                              <p className="text-sm font-semibold text-white">{inq.client_name}</p>
                            </div>
                          </div>
                          {inq.client_email && (
                            <div className="flex items-start gap-2">
                              <Mail size={13} className="text-white/30 mt-0.5 shrink-0" />
                              <div>
                                <Label>Email</Label>
                                <p className="text-sm text-white/60">{inq.client_email}</p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-start gap-2">
                            <Clock size={13} className="text-white/30 mt-0.5 shrink-0" />
                            <div>
                              <Label>Received</Label>
                              <p className="text-sm text-white/60">
                                {new Date(inq.created_at).toLocaleDateString('en-GB', {
                                  day: '2-digit', month: 'short', year: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Status + action buttons */}
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${INQUIRY_STATUS_STYLES[inq.status] || 'bg-white/5 text-white/40 border-white/10'}`}>
                            {inq.status}
                          </span>
                          <button
                            onClick={() => openEdit(inq)}
                            className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/5 transition"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(inq.id)}
                            disabled={deletingId === inq.id}
                            className="p-2 rounded-xl text-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-40"
                            title="Delete"
                          >
                            {deletingId === inq.id
                              ? <Loader size={13} className="animate-spin" />
                              : <Trash2 size={13} />}
                          </button>
                        </div>
                      </div>

                      {/* Message bubble */}
                      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-5 py-4">
                        <Label>Message</Label>
                        <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{inq.message}</p>
                      </div>

                      {/* Existing reply */}
                      {inq.reply && (
                        <div className="bg-green-500/5 border border-green-500/20 rounded-xl px-5 py-4">
                          <p className="text-[9px] font-black tracking-widest uppercase text-green-400/60 mb-2 flex items-center gap-1.5">
                            <Send size={10} /> Your Reply
                          </p>
                          <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{inq.reply}</p>
                        </div>
                      )}

                      {/* Reply toggle */}
                      <div className="pt-1">
                        <button
                          onClick={() => setOpenReply(isReplying ? null : inq.id)}
                          className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-white/40 hover:text-white transition"
                        >
                          {isReplying ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          {inq.reply ? 'Edit Reply' : 'Reply'}
                        </button>
                      </div>

                      {/* Reply composer */}
                      {isReplying && (
                        <div className="space-y-3">
                          <textarea
                            rows={4}
                            value={replyText[inq.id] ?? inq.reply ?? ''}
                            onChange={(e) =>
                              setReplyText((p) => ({ ...p, [inq.id]: e.target.value }))
                            }
                            placeholder="Type your reply to the client…"
                            className={`${inputCls} resize-none`}
                          />
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleReply(inq.id)}
                              disabled={sendingReply === inq.id || !(replyText[inq.id] ?? inq.reply ?? '').trim()}
                              className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl
                                         font-black text-[10px] uppercase tracking-widest hover:bg-gray-200
                                         transition disabled:opacity-40"
                            >
                              {sendingReply === inq.id
                                ? <Loader size={12} className="animate-spin" />
                                : <Send size={12} />}
                              Send Reply
                            </button>
                            <button
                              onClick={() => { setOpenReply(null); setReplyText((p) => ({ ...p, [inq.id]: '' })); }}
                              className="px-6 py-2.5 rounded-xl border border-white/10 text-white/40
                                         hover:text-white hover:border-white/30 text-[10px] font-black
                                         uppercase tracking-widest transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* ── Edit mode ── */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black uppercase tracking-widest text-white/60">Edit Inquiry</p>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-white/30 hover:text-white transition"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Client Name *</Label>
                          <input
                            type="text"
                            value={editForm.client_name}
                            onChange={(e) => setEditForm((p) => ({ ...p, client_name: e.target.value }))}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <Label>Client Email</Label>
                          <input
                            type="email"
                            value={editForm.client_email}
                            onChange={(e) => setEditForm((p) => ({ ...p, client_email: e.target.value }))}
                            className={inputCls}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Message *</Label>
                        <textarea
                          rows={3}
                          value={editForm.message}
                          onChange={(e) => setEditForm((p) => ({ ...p, message: e.target.value }))}
                          className={`${inputCls} resize-none`}
                        />
                      </div>

                      <div>
                        <Label>Status</Label>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                          className={inputCls}
                        >
                          <option value="new">New</option>
                          <option value="read">Read</option>
                          <option value="replied">Replied</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleSaveEdit(inq.id)}
                          disabled={saving}
                          className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl
                                     font-black text-[10px] uppercase tracking-widest hover:bg-gray-200
                                     transition disabled:opacity-50"
                        >
                          {saving ? <Loader size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-6 py-2.5 rounded-xl border border-white/10 text-white/40
                                     hover:text-white hover:border-white/30 text-[10px] font-black
                                     uppercase tracking-widest transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — CONSULTATION REQUESTS (visits)
      ══════════════════════════════════════════════════════════════════ */}
      <section>
        <h2 className="text-[11px] font-black tracking-[0.25em] uppercase text-white/30 mb-4 flex items-center gap-2">
          <Calendar size={13} /> Consultation Requests
        </h2>

        {loadingCons ? (
          <div className="flex items-center justify-center h-32 gap-3 text-white/40">
            <Loader size={16} className="animate-spin" />
            <span className="text-xs font-bold tracking-widest uppercase">Loading…</span>
          </div>
        ) : consultations.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-3xl p-12 text-center space-y-3">
            <Calendar size={28} className="mx-auto text-white/15" />
            <p className="text-white/40 text-sm font-bold uppercase tracking-widest">No consultation requests yet</p>
            <p className="text-white/20 text-xs">Scheduled consultations from clients will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {consultations.map((consultation) => (
              <div
                key={consultation.id}
                className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6 hover:border-white/20 transition"
              >
                <div className="shrink-0">
                  <span className={`px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border ${VISIT_STATUS_STYLES[consultation.status] || 'bg-white/5 text-white/40 border-white/10'}`}>
                    {consultation.status}
                  </span>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-start gap-2">
                    <User size={13} className="text-white/30 mt-0.5 shrink-0" />
                    <div>
                      <Label>Client</Label>
                      <p className="text-sm font-semibold text-white">
                        {consultation.user_name || `User #${consultation.user_id}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Mail size={13} className="text-white/30 mt-0.5 shrink-0" />
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm text-white/60">{consultation.user_email || '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar size={13} className="text-white/30 mt-0.5 shrink-0" />
                    <div>
                      <Label>Requested For</Label>
                      <p className="text-sm font-semibold text-white">
                        {consultation.visit_date
                          ? new Date(consultation.visit_date).toLocaleDateString('en-GB', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })
                          : '—'}
                      </p>
                      <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                        <Clock size={11} /> {consultation.visit_time || ''}
                      </p>
                    </div>
                  </div>

                  {consultation.notes && (
                    <div className="flex items-start gap-2">
                      <MessageSquare size={13} className="text-white/30 mt-0.5 shrink-0" />
                      <div>
                        <Label>Notes</Label>
                        <p className="text-xs text-white/60 line-clamp-2">{consultation.notes}</p>
                      </div>
                    </div>
                  )}
                </div>

                {consultation.status === 'PENDING' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleVisitStatus(consultation.id, 'APPROVED')}
                      disabled={updatingVisit === consultation.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-500/10 hover:bg-green-500/20
                                 text-green-400 border border-green-500/30 rounded-xl text-[10px] font-black
                                 uppercase tracking-widest transition disabled:opacity-50"
                    >
                      {updatingVisit === consultation.id
                        ? <Loader size={12} className="animate-spin" />
                        : <CheckCircle size={12} />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleVisitStatus(consultation.id, 'CANCELLED')}
                      disabled={updatingVisit === consultation.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20
                                 text-red-400 border border-red-500/30 rounded-xl text-[10px] font-black
                                 uppercase tracking-widest transition disabled:opacity-50"
                    >
                      <XCircle size={12} /> Decline
                    </button>
                  </div>
                )}

                {consultation.status === 'APPROVED' && (
                  <CheckCircle size={20} className="text-green-400 shrink-0" />
                )}
                {(consultation.status === 'CANCELLED' || consultation.status === 'DECLINED') && (
                  <XCircle size={20} className="text-red-400 shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ContactInquiries;
