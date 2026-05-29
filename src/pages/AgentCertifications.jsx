import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, X, Pencil, Trash2, Loader, FileCheck, ShieldCheck } from 'lucide-react';
import { API_BASE, apiFetch } from '../lib/api';
import { getCurrentUser } from '../lib/auth';

const DOC_TYPES = ['Passport / ID', 'Real Estate License', 'Sales Training Certificate'];

const STATUS_STYLE = {
  Pending:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  Verified: 'bg-green-500/10  text-green-400  border-green-500/30',
  Rejected: 'bg-red-500/10    text-red-400    border-red-500/30',
};

const EMPTY_MODAL = { type: DOC_TYPES[0], file: null, preview: null };

// ─────────────────────────────────────────────────────────────────────────────
const AgentCertifications = () => {
  const [agentId,       setAgentId]       = useState(null);
  const [initError,     setInitError]     = useState('');

  const [certifications, setCertifications] = useState([]);
  const [loading,        setLoading]        = useState(true);

  // Modal state
  const [modal,         setModal]         = useState(null); // null | { mode:'create' } | { mode:'edit', cert }
  const [form,          setForm]          = useState(EMPTY_MODAL);
  const [submitting,    setSubmitting]    = useState(false);
  const [modalError,    setModalError]    = useState('');

  // Delete
  const [deletingId,    setDeletingId]    = useState(null);

  const fileInputRef = useRef(null);

  // ── Resolve agent id ────────────────────────────────────────────────────────
  useEffect(() => {
    const user = getCurrentUser();
    if (!user?.id) { setInitError('Not logged in.'); setLoading(false); return; }
    apiFetch(`/api/agents/by-user/${user.id}`)
      .then((a) => setAgentId(a.id))
      .catch(() => { setInitError('Agent profile not found.'); setLoading(false); });
  }, []);

  // ── Load certs ──────────────────────────────────────────────────────────────
  const loadCertifications = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/api/certifications/agent/${agentId}`);
      setCertifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load certifications:', err);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => { if (agentId) loadCertifications(); }, [agentId, loadCertifications]);

  // ── Open modal ──────────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(EMPTY_MODAL);
    setModalError('');
    setModal({ mode: 'create' });
  };

  const openEdit = (cert) => {
    setForm({ type: cert.type, file: null, preview: null });
    setModalError('');
    setModal({ mode: 'edit', cert });
  };

  const closeModal = () => {
    setModal(null);
    setForm(EMPTY_MODAL);
    setModalError('');
  };

  // ── File pick ───────────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((p) => ({ ...p, file, preview: URL.createObjectURL(file) }));
  };

  // ── CREATE ──────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.file) { setModalError('Please select a file to upload.'); return; }
    setSubmitting(true);
    setModalError('');
    try {
      const fd = new FormData();
      fd.append('image',    form.file);
      fd.append('type',     form.type);
      fd.append('agent_id', agentId);

      const res = await fetch(`${API_BASE}/api/certifications`, { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }
      closeModal();
      loadCertifications();
    } catch (err) {
      setModalError(err.message || 'Upload failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── UPDATE ──────────────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    setSubmitting(true);
    setModalError('');
    try {
      const fd = new FormData();
      fd.append('type', form.type);
      if (form.file) fd.append('image', form.file);

      const res = await fetch(`${API_BASE}/api/certifications/${modal.cert.id}`, {
        method: 'PUT',
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }
      closeModal();
      loadCertifications();
    } catch (err) {
      setModalError(err.message || 'Update failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── DELETE ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this certification? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/certifications/${id}`, { method: 'DELETE' });
      setCertifications((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete.');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Trust score ─────────────────────────────────────────────────────────────
  const verifiedTypes = new Set(
    certifications.filter((c) => c.status === 'Verified').map((c) => c.type)
  );
  const trustScore = Math.round((verifiedTypes.size / DOC_TYPES.length) * 100);

  // ── Guards ──────────────────────────────────────────────────────────────────
  if (initError) {
    return (
      <div className="p-10">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400 text-sm">
          {initError}
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-4xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-extrabold uppercase tracking-tight">AGENT CERTIFICATIONS</h2>
        <button
          onClick={openCreate}
          className="bg-white text-black px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition"
        >
          + Upload New
        </button>
      </div>

      {/* ── Certifications list ── */}
      <div className="bg-[#111] border border-white/10 rounded-3xl p-8">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6">Your Certificates</h4>

        {loading ? (
          <div className="flex items-center gap-3 text-white/40 py-8 justify-center">
            <Loader size={16} className="animate-spin" />
            <span className="text-xs font-bold tracking-widest uppercase">Loading…</span>
          </div>
        ) : certifications.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center space-y-3">
            <FileCheck size={28} className="mx-auto text-white/15" />
            <p className="text-white/40 text-sm font-bold uppercase tracking-widest">No certifications yet</p>
            <p className="text-white/20 text-xs">Upload your documents to build trust with clients.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center gap-4 p-5 border border-white/10 rounded-2xl bg-[#0a0a0a] hover:border-white/20 transition"
              >
                {/* Document thumbnail */}
                <a
                  href={`${API_BASE}${cert.document_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0"
                >
                  <img
                    src={`${API_BASE}${cert.document_url}`}
                    alt={cert.type}
                    className="w-14 h-14 object-cover rounded-xl border border-white/10 hover:border-white/30 transition"
                  />
                </a>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{cert.type}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    Uploaded {new Date(cert.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>

                {/* Status badge */}
                <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${STATUS_STYLE[cert.status] || STATUS_STYLE.Pending}`}>
                  {cert.status}
                </span>

                {/* Expires */}
                <span className="text-xs text-white/30 w-24 text-right shrink-0">
                  {cert.expires_at
                    ? new Date(cert.expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—'}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(cert)}
                    className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/5 transition"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(cert.id)}
                    disabled={deletingId === cert.id}
                    className="p-2 rounded-xl text-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-40"
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
      </div>

      {/* ── Trust score ── */}
      <div className="p-6 border border-dashed border-white/10 rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck size={20} className={trustScore === 100 ? 'text-green-400' : 'text-white/30'} />
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest">Agent Trust Score</h4>
            <p className="text-[10px] text-white/40 mt-0.5">
              {trustScore === 100
                ? 'All documents verified — you have the Verified Badge!'
                : `Upload & get all ${DOC_TYPES.length} document types verified to reach 100%.`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-3xl font-black ${trustScore === 100 ? 'text-green-400' : 'text-white'}`}>
            {trustScore}%
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL — Create / Edit
      ══════════════════════════════════════════════════════════════════ */}
      {modal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
          <div className="bg-[#111] border border-white/10 p-8 rounded-3xl w-full max-w-md relative">

            {/* Close */}
            <button
              onClick={closeModal}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition"
            >
              <X size={18} />
            </button>

            <h3 className="text-sm font-black uppercase tracking-widest mb-6">
              {modal.mode === 'create' ? 'Upload Document' : 'Edit Certification'}
            </h3>

            {modalError && (
              <p className="text-red-400 text-xs font-bold mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {modalError}
              </p>
            )}

            {/* Type selector */}
            <div className="mb-5">
              <label className="block text-[9px] font-black tracking-widest uppercase text-white/40 mb-2">
                Document Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30"
              >
                {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            {/* File drop zone */}
            <div className="mb-6">
              <label className="block text-[9px] font-black tracking-widest uppercase text-white/40 mb-2">
                {modal.mode === 'edit' ? 'Replace File (optional)' : 'Upload File *'}
              </label>
              <div
                onClick={() => fileInputRef.current.click()}
                className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center
                           justify-center cursor-pointer hover:border-white/30 transition bg-white/[0.02]"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf"
                />

                {/* Show new preview if picked, else show existing thumbnail in edit mode */}
                {form.preview ? (
                  <div className="text-center space-y-2">
                    <img src={form.preview} alt="preview" className="h-20 mx-auto rounded-xl object-cover border border-white/10" />
                    <p className="text-[10px] font-bold text-white/70">{form.file?.name}</p>
                  </div>
                ) : modal.mode === 'edit' && modal.cert.document_url ? (
                  <div className="text-center space-y-2">
                    <img
                      src={`${API_BASE}${modal.cert.document_url}`}
                      alt="current"
                      className="h-20 mx-auto rounded-xl object-cover border border-white/10"
                    />
                    <p className="text-[9px] text-white/30 uppercase tracking-widest">Current file — click to replace</p>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <Upload size={24} className="mx-auto text-white/30" />
                    <p className="text-[10px] font-bold uppercase text-white/40">Click to upload</p>
                    <p className="text-[9px] text-white/20">JPG, PNG or PDF</p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={modal.mode === 'create' ? handleCreate : handleUpdate}
              disabled={submitting}
              className="w-full bg-white text-black py-4 rounded-xl font-black text-[10px] uppercase
                         tracking-widest hover:bg-gray-200 transition disabled:opacity-50 flex items-center
                         justify-center gap-2"
            >
              {submitting
                ? <><Loader size={13} className="animate-spin" /> Uploading…</>
                : modal.mode === 'create' ? 'Submit' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentCertifications;
