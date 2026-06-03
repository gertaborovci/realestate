import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Building2, Banknote, Plus, X, Check, Loader,
  PenLine, CheckCircle2, XCircle, Trash2, ShieldCheck,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { getCurrentUser } from '../lib/auth';
import { showAlert, showConfirm } from '../lib/modal';

const STATUS_STYLE = {
  'Pending Signature': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  'Active':            'bg-blue-500/10   text-blue-400   border-blue-500/30',
  'Finalized':         'bg-green-500/10  text-green-400  border-green-500/30',
  'Cancelled':         'bg-red-500/10    text-red-400    border-red-500/30',
};

const fmt = (n) => `€${Number(n || 0).toLocaleString('en')}`;

export default function UserContracts() {
  const user = getCurrentUser();

  const [contracts,    setContracts]    = useState([]);
  const [properties,   setProperties]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(false);
  const [selectedProp, setSelectedProp] = useState('');
  const [creating,     setCreating]     = useState(false);
  const [createError,  setCreateError]  = useState('');
  const [signingId,    setSigningId]    = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [deletingId,   setDeletingId]   = useState(null);

  // ── Load contracts ─────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await apiFetch(`/api/contracts/buyer/${user.id}`);
      setContracts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  // ── Load available properties for the create modal ─────────────────────────
  useEffect(() => {
    apiFetch('/api/properties?limit=100')
      .then((d) => setProperties(Array.isArray(d) ? d : (d?.data ?? [])))
      .catch(() => {});
  }, []);

  // ── Create contract ────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedProp) { setCreateError('Please select a property.'); return; }
    setCreating(true);
    setCreateError('');
    try {
      await apiFetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:     user.id,
          property_id: Number(selectedProp),
          type:        'Sale',
        }),
      });
      setModal(false);
      setSelectedProp('');
      load();
    } catch (err) {
      setCreateError(err.message || 'Failed to create contract.');
    } finally {
      setCreating(false);
    }
  };

  // ── Sign as buyer ──────────────────────────────────────────────────────────
  const handleSign = async (id) => {
    setSigningId(id);
    try {
      const res = await apiFetch(`/api/contracts/${id}/sign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ party: 'buyer' }),
      });
      if (res.finalized) await showAlert('Both parties have signed — your contract is now Finalized!', 'success');
      load();
    } catch (err) {
      await showAlert(err.message || 'Failed to sign contract.', 'error');
    } finally {
      setSigningId(null);
    }
  };

  // ── Cancel contract ────────────────────────────────────────────────────────
  const handleCancel = async (id) => {
    if (!await showConfirm('Cancel this purchase contract? This cannot be undone.')) return;
    setCancellingId(id);
    try {
      await apiFetch(`/api/contracts/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' }),
      });
      load();
    } catch (err) {
      await showAlert(err.message || 'Failed to cancel contract.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  // ── Delete cancelled contract ──────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!await showConfirm('Permanently delete this cancelled contract?')) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/contracts/${id}`, { method: 'DELETE' });
      setContracts((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      await showAlert(err.message || 'Failed to delete contract.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const counts = {
    pending:   contracts.filter((c) => c.status === 'Pending Signature').length,
    active:    contracts.filter((c) => c.status === 'Active').length,
    finalized: contracts.filter((c) => c.status === 'Finalized').length,
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <FileText className="text-white/60" size={22} />
          <h2 className="text-2xl font-bold text-white">My Contracts</h2>
        </div>
        <button
          onClick={() => { setModal(true); setSelectedProp(''); setCreateError(''); }}
          className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition"
        >
          <Plus size={14} /> New Purchase
        </button>
      </div>

      {/* Stat pills */}
      {contracts.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            { label: 'Pending Signature', value: counts.pending,   cls: 'border-yellow-500/30 text-yellow-400' },
            { label: 'Active',            value: counts.active,    cls: 'border-blue-500/30   text-blue-400'   },
            { label: 'Finalized',         value: counts.finalized, cls: 'border-green-500/30  text-green-400'  },
          ].map((s) => (
            <div key={s.label} className={`bg-zinc-900/60 border rounded-2xl px-5 py-3 ${s.cls}`}>
              <p className="text-[9px] font-black tracking-widest uppercase text-white/30 mb-0.5">{s.label}</p>
              <p className="text-xl font-black">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center gap-3 text-white/40 justify-center py-20">
          <Loader size={18} className="animate-spin" />
          <span className="text-xs font-bold tracking-widest uppercase">Loading…</span>
        </div>
      ) : contracts.length === 0 ? (
        <div className="bg-white/5 border border-white/10 border-dashed p-16 rounded-[40px] text-center">
          <FileText size={48} className="mx-auto mb-4 text-white/20" />
          <p className="text-lg font-bold text-white/40">No purchase contracts yet.</p>
          <p className="text-sm mt-2 text-white/30">
            Start a purchase from a property page, or click <strong className="text-white/50">New Purchase</strong> above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((c) => {
            const deposit    = Number(c.deposit_amount    || Number(c.property_price) * 0.2);
            const paid       = Number(c.total_paid);
            const depositMet = paid >= deposit && deposit > 0;
            const isCancelled = c.status === 'Cancelled';
            const isFinalized = c.status === 'Finalized';

            return (
              <div
                key={c.id}
                className={`bg-zinc-900/60 border rounded-3xl p-6 space-y-5 transition ${
                  isCancelled ? 'border-red-500/20 opacity-70' : 'border-white/10'
                }`}
              >
                {/* ── Top row ── */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-0.5">Contract</p>
                    <p className="text-xl font-black text-white">{c.contract_number || `#${c.id}`}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">
                      {new Date(c.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status badge */}
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${STATUS_STYLE[c.status] || ''}`}>
                      {c.status}
                    </span>

                    {/* Cancel button — pending / active only */}
                    {!isCancelled && !isFinalized && (
                      <button
                        onClick={() => handleCancel(c.id)}
                        disabled={cancellingId === c.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-[9px] font-black uppercase tracking-widest transition disabled:opacity-40"
                      >
                        {cancellingId === c.id
                          ? <Loader size={10} className="animate-spin" />
                          : <XCircle size={10} />}
                        Cancel
                      </button>
                    )}

                    {/* Delete button — cancelled only */}
                    {isCancelled && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/30 hover:text-red-400 transition disabled:opacity-40"
                        title="Delete contract"
                      >
                        {deletingId === c.id
                          ? <Loader size={12} className="animate-spin" />
                          : <Trash2 size={12} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Property ── */}
                <div className="flex items-start gap-2">
                  <Building2 size={13} className="text-white/30 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-0.5">Property</p>
                    <p className="text-sm font-semibold text-white">{c.property_title || '—'}</p>
                    {c.property_location && (
                      <p className="text-[10px] text-white/40">{c.property_location}</p>
                    )}
                  </div>
                </div>

                {/* ── Financials ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-black/30 rounded-2xl p-4">
                  <div>
                    <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-1">Property Price</p>
                    <p className="text-sm font-bold text-white">{fmt(c.property_price)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-1">Deposit (20%)</p>
                    <p className="text-sm font-bold text-yellow-400">{fmt(deposit)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-1">Remaining</p>
                    <p className="text-sm font-bold text-white/60">{fmt(c.remaining_balance)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-1">Paid</p>
                    <p className={`text-sm font-bold ${depositMet ? 'text-green-400' : 'text-yellow-400'}`}>
                      {fmt(paid)}{depositMet ? ' ✓' : ''}
                    </p>
                  </div>
                </div>

                {/* ── Signatures ── */}
                <div className="flex flex-wrap gap-3 items-center pt-1 border-t border-white/[0.06]">
                  <span className="text-[9px] font-black tracking-widest text-white/25 uppercase">Signatures:</span>

                  {/* Your signature */}
                  {c.signed_by_buyer ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] font-bold">
                      <CheckCircle2 size={10} /> You signed
                    </span>
                  ) : (
                    !isCancelled && (
                      <button
                        onClick={() => handleSign(c.id)}
                        disabled={signingId === c.id}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black hover:bg-gray-200 text-[9px] font-black uppercase tracking-widest transition disabled:opacity-40"
                      >
                        {signingId === c.id
                          ? <Loader size={10} className="animate-spin" />
                          : <PenLine size={10} />}
                        Sign Contract
                      </button>
                    )
                  )}

                  {/* Agent signature */}
                  {c.signed_by_agent ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] font-bold">
                      <CheckCircle2 size={10} /> Agent signed
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-white/5 text-white/30 border border-white/10 text-[9px] font-bold">
                      Awaiting agent signature
                    </span>
                  )}

                  {/* Agent notes */}
                  {c.notes && (
                    <p className="w-full text-white/30 text-xs italic mt-1 px-1">
                      Note from agent: "{c.notes}"
                    </p>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ── Create modal ── */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setModal(false)}
        >
          <div
            className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-md space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tight text-white">Initiate Purchase</h3>
              <button onClick={() => setModal(false)} className="text-white/30 hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black tracking-[0.25em] uppercase text-white/40 mb-2">
                  Select Property
                </label>
                <select
                  value={selectedProp}
                  onChange={(e) => setSelectedProp(e.target.value)}
                  className="w-full bg-black/50 border border-zinc-700 focus:border-zinc-400 text-white text-sm rounded-xl px-4 py-3 outline-none transition"
                >
                  <option value="">— Choose a property —</option>
                  {properties
                    .filter((p) => {
                      const s = (p.status || '').toUpperCase();
                      return !s.includes('SOLD') && !s.includes('RENTED') && !s.includes('SHITUR');
                    })
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} — €{Number(p.price).toLocaleString()} ({p.location})
                      </option>
                    ))}
                </select>
              </div>

              {/* Info note */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-xs text-white/40 leading-relaxed flex items-start gap-2">
                <ShieldCheck size={14} className="text-white/30 shrink-0 mt-0.5" />
                <span>
                  A <strong className="text-white/60">20% deposit</strong> payment will be created automatically as Pending.
                  Your agent will confirm receipt and guide you through signing.
                </span>
              </div>

              {createError && (
                <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                  {createError}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white/60 hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition"
                >
                  <X size={13} /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-1.5 bg-white hover:bg-gray-200 text-black px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
                >
                  {creating
                    ? <Loader size={13} className="animate-spin" />
                    : <Banknote size={13} />}
                  Initiate Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
