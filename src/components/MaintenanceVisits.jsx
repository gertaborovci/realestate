import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, ShieldX, Clock, Eye, Trash2, Loader,
  RefreshCw, X, CheckCircle, XCircle, User, Calendar,
  FileCheck, AlertCircle, FileText,
} from 'lucide-react';
import { API_BASE, apiFetch } from '../lib/api';
import { showAlert, showConfirm } from '../lib/modal';

// â"€â"€ Status style map (matches AgentCertifications.jsx exactly) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const STATUS_STYLE = {
  Pending:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  Verified: 'bg-green-500/10  text-green-400  border-green-500/30',
  Rejected: 'bg-red-500/10    text-red-400    border-red-500/30',
};

const STATUS_ICON = {
  Pending:  <Clock       size={11} />,
  Verified: <ShieldCheck size={11} />,
  Rejected: <ShieldX     size={11} />,
};

const Label = ({ children }) => (
  <p className="text-[9px] font-black tracking-widest uppercase text-white/30 mb-1.5">{children}</p>
);

const inputCls =
  'w-full bg-[#0a0a0a] border border-white/10 text-white rounded-xl px-4 py-3 text-sm ' +
  'focus:outline-none focus:border-white/30 placeholder:text-white/20';

// â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
function CertThumb({ url }) {
  const [failed, setFailed] = React.useState(false);
  if (!url || failed) {
    return (
      <a
        href={url || '#'}
        target="_blank"
        rel="noreferrer"
        className="shrink-0 w-16 h-16 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center hover:border-white/30 transition"
      >
        <FileText size={24} className="text-white/20" />
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="shrink-0">
      <img
        src={url}
        alt="document"
        className="w-16 h-16 object-cover rounded-xl border border-white/10 hover:border-white/30 transition"
        onError={() => setFailed(true)}
      />
    </a>
  );
}

export default function MaintenanceVisits() {
  const [certs,      setCerts]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [loadError,  setLoadError]  = useState('');
  const [filter,     setFilter]     = useState('Pending');

  // View modal
  const [viewModal,  setViewModal]  = useState(null);

  // Action modal: { cert, action: 'verify' | 'reject' }
  const [actionModal,  setActionModal]  = useState(null);
  const [expiresAt,    setExpiresAt]    = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [actionError,  setActionError]  = useState('');

  const [deletingId, setDeletingId] = useState(null);

  // â"€â"€ Load all certifications â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await apiFetch('/api/certifications');
      setCerts(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError(err.message || 'Failed to load certifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // â"€â"€ Filtered list & counts â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const filtered = filter === 'All' ? certs : certs.filter((c) => c.status === filter);
  const counts = {
    Pending:  certs.filter((c) => c.status === 'Pending').length,
    Verified: certs.filter((c) => c.status === 'Verified').length,
    Rejected: certs.filter((c) => c.status === 'Rejected').length,
  };

  // â"€â"€ Open action modal â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const openVerify = (cert) => {
    setExpiresAt(cert.expires_at ? cert.expires_at.split('T')[0] : '');
    setRejectReason('');
    setActionError('');
    setActionModal({ cert, action: 'verify' });
  };

  const openReject = (cert) => {
    setRejectReason(cert.rejection_reason || '');
    setExpiresAt('');
    setActionError('');
    setActionModal({ cert, action: 'reject' });
  };

  const closeAction = () => {
    setActionModal(null);
    setExpiresAt('');
    setRejectReason('');
    setActionError('');
  };

  // â"€â"€ Submit verify / reject â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleAction = async () => {
    const { cert, action } = actionModal;

    if (action === 'reject' && !rejectReason.trim()) {
      setActionError('Please provide a rejection reason so the agent knows what to fix.');
      return;
    }

    const body = action === 'verify'
      ? { status: 'Verified', expires_at: expiresAt || null, rejection_reason: null }
      : { status: 'Rejected', rejection_reason: rejectReason.trim(), expires_at: null };

    setSubmitting(true);
    try {
      await apiFetch(`/api/certifications/${cert.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body:    JSON.stringify(body),
      });
      closeAction();
      load();
    } catch (err) {
      setActionError(err.message || 'Failed to update certification.');
    } finally {
      setSubmitting(false);
    }
  };

  // â"€â"€ Delete â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleDelete = async (id) => {
    if (!await showConfirm('Delete this certification? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/certifications/${id}`, {
        method:  'DELETE',
        headers: { 'x-user-role': 'admin' },
      });
      setCerts((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      await showAlert(err.message || 'Failed to delete.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // â"€â"€ Render â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  return (
    <div className="space-y-8">

      {/* â"€â"€ Header â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold">DOCUMENT REVIEW</h1>
          <p className="text-white/30 text-xs font-bold tracking-widest uppercase mt-2">
            Agent certification &amp; document verification
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-white/30 hover:text-white transition text-[10px] font-bold uppercase tracking-widest"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* â"€â"€ Stats pills â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      <div className="flex flex-wrap gap-3">
        <span className="px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase border bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
          {counts.Pending} Pending
        </span>
        <span className="px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase border bg-green-500/10 text-green-400 border-green-500/30">
          {counts.Verified} Verified
        </span>
        <span className="px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase border bg-red-500/10 text-red-400 border-red-500/30">
          {counts.Rejected} Rejected
        </span>
      </div>

      {/* â"€â"€ Filter tabs â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      <div className="flex gap-2 flex-wrap border-b border-white/5 pb-4">
        {['Pending', 'Verified', 'Rejected', 'All'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition ${
              filter === tab
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab}{tab !== 'All' && counts[tab] !== undefined ? ` (${counts[tab]})` : ''}
          </button>
        ))}
      </div>

      {/* â"€â"€ Error â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      {loadError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 text-red-400 text-sm">
          {loadError}
        </div>
      )}

      {/* â"€â"€ Loading â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      {loading ? (
        <div className="flex items-center justify-center h-48 gap-3 text-white/30">
          <Loader size={18} className="animate-spin" />
          <span className="text-xs font-bold tracking-widest uppercase">Loading documents…</span>
        </div>

      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-3xl p-16 text-center">
          <FileCheck size={36} className="mx-auto text-white/10 mb-4" />
          <p className="text-white/30 text-sm font-bold uppercase tracking-widest">
            No {filter === 'All' ? '' : filter.toLowerCase()} documents
          </p>
        </div>

      ) : (
        <div className="space-y-4">
          {filtered.map((cert) => (
            <div
              key={cert.id}
              className="bg-[#111] border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-5 hover:border-white/20 transition"
            >
              {/* â"€â"€ Thumbnail â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
              <CertThumb url={cert.document_url ? `${API_BASE}${cert.document_url}` : null} />

              {/* â"€â"€ Info â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
              <div className="flex-1 space-y-2 min-w-0">

                {/* Status + type badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${STATUS_STYLE[cert.status] || STATUS_STYLE.Pending}`}>
                    {STATUS_ICON[cert.status]} {cert.status}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase border bg-white/5 text-white/40 border-white/10">
                    {cert.type}
                  </span>
                </div>

                {/* Agent info row */}
                <div className="flex flex-wrap gap-4 text-xs text-white/40">
                  <span className="flex items-center gap-1.5">
                    <User size={11} />
                    <span className="font-semibold text-white/70">
                      {cert.agent_name || `Agent #${cert.agent_id}`}
                    </span>
                    {cert.agent_email && ` -  ${cert.agent_email}`}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={11} />
                    {cert.created_at
                      ? new Date(cert.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })
                      : ' - '}
                  </span>
                  {cert.expires_at && (
                    <span className="flex items-center gap-1.5 text-green-400/60">
                      <ShieldCheck size={11} />
                      Expires {new Date(cert.expires_at).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </span>
                  )}
                </div>

                {/* Rejection reason bubble */}
                {cert.status === 'Rejected' && cert.rejection_reason && (
                  <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/15 rounded-xl px-3 py-2 mt-1">
                    <AlertCircle size={12} className="text-red-400/70 mt-0.5 shrink-0" />
                    <div>
                      <Label>Rejection Reason</Label>
                      <p className="text-xs text-red-300/70 italic">"{cert.rejection_reason}"</p>
                    </div>
                  </div>
                )}
              </div>

              {/* â"€â"€ Actions â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
              <div className="flex items-center gap-2 shrink-0">

                {/* View document */}
                <button
                  onClick={() => setViewModal(cert)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition"
                  title="Preview document"
                >
                  <Eye size={15} />
                </button>

                {/* Verify  -  show for Pending and Rejected */}
                {cert.status !== 'Verified' && (
                  <button
                    onClick={() => openVerify(cert)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition"
                  >
                    <CheckCircle size={11} /> Verify
                  </button>
                )}

                {/* Reject  -  show for Pending and Verified */}
                {cert.status !== 'Rejected' && (
                  <button
                    onClick={() => openReject(cert)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition"
                  >
                    <XCircle size={11} /> Reject
                  </button>
                )}

                {/* Delete */}
                <button
                  onClick={() => handleDelete(cert.id)}
                  disabled={deletingId === cert.id}
                  className="p-2 rounded-xl bg-red-500/5 hover:bg-red-500/15 text-red-500/40 hover:text-red-400 transition disabled:opacity-40"
                  title="Delete"
                >
                  {deletingId === cert.id
                    ? <Loader size={14} className="animate-spin" />
                    : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          DOCUMENT PREVIEW MODAL
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {viewModal && (
        <div
          className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4"
          onClick={() => setViewModal(null)}
        >
          <div
            className="bg-[#111] border border-white/10 rounded-3xl p-8 w-full max-w-lg space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <Label>Document Preview</Label>
                <h3 className="text-lg font-black text-white">{viewModal.type}</h3>
                <p className="text-xs text-white/40 mt-0.5">
                  {viewModal.agent_name || `Agent #${viewModal.agent_id}`}
                  {viewModal.agent_email && `  -  ${viewModal.agent_email}`}
                </p>
              </div>
              <button onClick={() => setViewModal(null)} className="text-white/30 hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            {/* Status badge */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border ${STATUS_STYLE[viewModal.status] || STATUS_STYLE.Pending}`}>
              {STATUS_ICON[viewModal.status]} {viewModal.status}
            </span>

            {/* Document image */}
            <a
              href={`${API_BASE}${viewModal.document_url}`}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <img
                src={`${API_BASE}${viewModal.document_url}`}
                alt={viewModal.type}
                className="w-full rounded-2xl border border-white/10 object-contain max-h-72 hover:border-white/30 transition"
              />
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mt-2 text-center">
                Click image to open full size →'
              </p>
            </a>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Uploaded</Label>
                <p className="text-sm text-white">
                  {viewModal.created_at
                    ? new Date(viewModal.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'long', year: 'numeric',
                      })
                    : ' - '}
                </p>
              </div>
              {viewModal.expires_at && (
                <div>
                  <Label>Expiry Date</Label>
                  <p className="text-sm text-green-400">
                    {new Date(viewModal.expires_at).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Rejection reason (if any) */}
            {viewModal.rejection_reason && (
              <div>
                <Label>Rejection Reason</Label>
                <div className="bg-red-500/5 border border-red-500/15 rounded-xl px-4 py-3 text-sm text-red-300/70 italic">
                  "{viewModal.rejection_reason}"
                </div>
              </div>
            )}

            {/* Action shortcuts */}
            <div className="flex gap-3 pt-2 border-t border-white/5">
              {viewModal.status !== 'Verified' && (
                <button
                  onClick={() => { setViewModal(null); openVerify(viewModal); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition"
                >
                  <CheckCircle size={12} /> Verify
                </button>
              )}
              {viewModal.status !== 'Rejected' && (
                <button
                  onClick={() => { setViewModal(null); openReject(viewModal); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition"
                >
                  <XCircle size={12} /> Reject
                </button>
              )}
              <button
                onClick={() => setViewModal(null)}
                className="px-5 py-3 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/30 text-[10px] font-black uppercase tracking-widest transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          ACTION MODAL  -  Verify / Reject
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 w-full max-w-md space-y-5">

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-black tracking-widest uppercase text-white/30 mb-1">
                  {actionModal.cert.agent_name || `Agent #${actionModal.cert.agent_id}`}  -  {actionModal.cert.type}
                </p>
                <h3 className={`text-lg font-black ${actionModal.action === 'verify' ? 'text-green-400' : 'text-red-400'}`}>
                  {actionModal.action === 'verify' ? 'Verify Document' : 'Reject Document'}
                </h3>
                <p className="text-xs text-white/30 mt-1">
                  {actionModal.action === 'verify'
                    ? 'Mark this document as verified. Optionally set an expiry date.'
                    : 'Provide a reason  -  the agent will see this on their dashboard.'}
                </p>
              </div>
              <button onClick={closeAction} className="text-white/30 hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            {/* Expiry date  -  verify only */}
            {actionModal.action === 'verify' && (
              <div>
                <Label>Expiry Date <span className="text-white/20 normal-case font-normal tracking-normal">(optional)</span></Label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className={`${inputCls} [color-scheme:dark]`}
                />
              </div>
            )}

            {/* Rejection reason  -  reject only */}
            {actionModal.action === 'reject' && (
              <div>
                <Label>Rejection Reason *</Label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Document is blurry, please re-upload a clearer image…"
                  className={`${inputCls} resize-none`}
                />
              </div>
            )}

            {actionError && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                {actionError}
              </p>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleAction}
                disabled={submitting}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition disabled:opacity-50 ${
                  actionModal.action === 'verify'
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-red-500 text-white hover:bg-red-400'
                }`}
              >
                {submitting
                  ? <Loader size={13} className="animate-spin" />
                  : actionModal.action === 'verify'
                    ? <CheckCircle size={13} />
                    : <XCircle size={13} />}
                {submitting
                  ? 'Saving…'
                  : actionModal.action === 'verify'
                    ? 'Confirm Verification'
                    : 'Confirm Rejection'}
              </button>
              <button
                onClick={closeAction}
                className="px-5 py-3.5 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/30 text-[10px] font-black uppercase tracking-widest transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

