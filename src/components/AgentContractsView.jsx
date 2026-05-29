import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Building2, User, Loader, RefreshCw,
  PenLine, CheckCircle2, Pencil, X, Check, XCircle,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { getCurrentUser } from '../lib/auth';

const STATUS_STYLE = {
  'Pending Signature': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  'Active':            'bg-blue-500/10   text-blue-400   border-blue-500/30',
  'Finalized':         'bg-green-500/10  text-green-400  border-green-500/30',
  'Cancelled':         'bg-red-500/10    text-red-400    border-red-500/30',
};

const fmt = (n) => `€${Number(n || 0).toLocaleString('en')}`;

const AgentContractsView = () => {
  const [agentId,       setAgentId]       = useState(null);
  const [contracts,     setContracts]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');

  // Per-contract action states
  const [signing,        setSigning]        = useState(null);          // contract id
  const [updatingStatus, setUpdatingStatus] = useState(null);          // contract id
  const [savingNotes,    setSavingNotes]    = useState(null);          // contract id
  const [cancelling,     setCancelling]     = useState(null);          // contract id
  const [editingNotes,   setEditingNotes]   = useState({});            // { [id]: 'text' }

  // ── resolve agent id ────────────────────────────────────────────────────────
  useEffect(() => {
    const user = getCurrentUser();
    if (!user?.id) { setError('Not logged in.'); setLoading(false); return; }
    apiFetch(`/api/agents/by-user/${user.id}`)
      .then((a) => setAgentId(a.id))
      .catch(() => { setError('Could not resolve agent profile.'); setLoading(false); });
  }, []);

  // ── fetch contracts ─────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/api/contracts/agent/${agentId}`);
      setContracts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load contracts.');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => { load(); }, [load]);

  // ── 1. Edit / save notes ────────────────────────────────────────────────────
  const startEditNotes = (c) => {
    setEditingNotes((prev) => ({ ...prev, [c.id]: c.notes || '' }));
  };

  const cancelEditNotes = (id) => {
    setEditingNotes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const saveNotes = async (id) => {
    setSavingNotes(id);
    try {
      await apiFetch(`/api/contracts/${id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: editingNotes[id] || null }),
      });
      cancelEditNotes(id);
      load();
    } catch (err) {
      alert(err.message || 'Failed to save notes.');
    } finally {
      setSavingNotes(null);
    }
  };

  // ── 2. Cancel contract ──────────────────────────────────────────────────────
  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this contract? This action will set its status to Cancelled.')) return;
    setCancelling(id);
    try {
      await apiFetch(`/api/contracts/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' }),
      });
      load();
    } catch (err) {
      alert(err.message || 'Failed to cancel contract.');
    } finally {
      setCancelling(null);
    }
  };

  // ── 3. Update status ────────────────────────────────────────────────────────
  const handleStatus = async (id, status) => {
    setUpdatingStatus(id);
    try {
      await apiFetch(`/api/contracts/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      load();
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // ── Sign ────────────────────────────────────────────────────────────────────
  const handleSign = async (id) => {
    setSigning(id);
    try {
      const res = await apiFetch(`/api/contracts/${id}/sign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ party: 'agent' }),
      });
      if (res.finalized) alert('Both parties have signed — contract is now Finalized!');
      load();
    } catch (err) {
      alert(err.message || 'Failed to record signature.');
    } finally {
      setSigning(null);
    }
  };

  const counts = {
    pending:   contracts.filter((c) => c.status === 'Pending Signature').length,
    active:    contracts.filter((c) => c.status === 'Active').length,
    finalized: contracts.filter((c) => c.status === 'Finalized').length,
    cancelled: contracts.filter((c) => c.status === 'Cancelled').length,
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-10 space-y-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold tracking-tight">CONTRACTS</h1>
          <p className="text-white/40 text-xs font-bold tracking-widest uppercase mt-1">
            Purchase agreements on your properties
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-white/40 hover:text-white transition text-[10px] font-bold uppercase tracking-widest"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4">
        {[
          { label: 'Total',             value: contracts.length,  cls: 'border-white/10 text-white' },
          { label: 'Pending Signature', value: counts.pending,    cls: 'border-yellow-500/30 text-yellow-400' },
          { label: 'Active',            value: counts.active,     cls: 'border-blue-500/30 text-blue-400' },
          { label: 'Finalized',         value: counts.finalized,  cls: 'border-green-500/30 text-green-400' },
          { label: 'Cancelled',         value: counts.cancelled,  cls: 'border-red-500/30 text-red-400' },
        ].map((s) => (
          <div key={s.label} className={`bg-[#111] border rounded-2xl px-6 py-4 ${s.cls}`}>
            <p className="text-[9px] font-black tracking-widest uppercase text-white/30 mb-1">{s.label}</p>
            <p className="text-2xl font-black">{s.value}</p>
          </div>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm font-bold">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center h-48 gap-3 text-white/40">
          <Loader size={18} className="animate-spin" />
          <span className="text-xs font-bold tracking-widest uppercase">Loading…</span>
        </div>
      ) : contracts.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-3xl p-20 text-center space-y-3">
          <FileText size={36} className="mx-auto text-white/15" />
          <p className="text-white/40 text-sm font-bold uppercase tracking-widest">No contracts yet</p>
          <p className="text-white/20 text-xs">Contracts appear when clients initiate a purchase on your properties.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((c) => {
            const deposit    = Number(c.deposit_amount    || Number(c.property_price) * 0.2);
            const remaining  = Number(c.remaining_balance || Number(c.property_price) * 0.8);
            const paid       = Number(c.total_paid);
            const depositMet = paid >= deposit && deposit > 0;
            const isCancelled = c.status === 'Cancelled';
            const isFinalized = c.status === 'Finalized';
            const notesOpen   = id => id in editingNotes;

            return (
              <div
                key={c.id}
                className={`bg-[#111] border rounded-3xl p-6 space-y-5 transition ${
                  isCancelled ? 'border-red-500/20 opacity-70' : 'border-white/10'
                }`}
              >

                {/* ── Top row: contract number + status + actions ── */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-0.5">Contract</p>
                    <p className="text-xl font-black text-white">{c.contract_number || `#${c.id}`}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">
                      {new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Status badge */}
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${STATUS_STYLE[c.status] || ''}`}>
                      {c.status}
                    </span>

                    {/* ── 3. Status dropdown ── */}
                    {!isCancelled && !isFinalized && (
                      <select
                        value={c.status}
                        onChange={(e) => handleStatus(c.id, e.target.value)}
                        disabled={updatingStatus === c.id}
                        className="bg-[#0a0a0a] border border-white/10 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold focus:outline-none focus:border-white/30 disabled:opacity-50"
                      >
                        <option value="Pending Signature">Pending Signature</option>
                        <option value="Active">Active</option>
                        <option value="Finalized">Finalized</option>
                      </select>
                    )}
                    {updatingStatus === c.id && (
                      <Loader size={14} className="animate-spin text-white/40" />
                    )}

                    {/* ── 2. Cancel button ── */}
                    {!isCancelled && !isFinalized && (
                      <button
                        onClick={() => handleCancel(c.id)}
                        disabled={cancelling === c.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-[9px] font-black uppercase tracking-widest transition disabled:opacity-40"
                      >
                        {cancelling === c.id
                          ? <Loader size={10} className="animate-spin" />
                          : <XCircle size={10} />}
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Property + Buyer ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <Building2 size={13} className="text-white/30 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-0.5">Property</p>
                      <p className="text-sm font-semibold text-white">{c.property_title || '—'}</p>
                      <p className="text-[10px] text-white/40">{c.property_location || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <User size={13} className="text-white/30 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-0.5">Buyer</p>
                      <p className="text-sm text-white">{c.client_name || '—'}</p>
                      <p className="text-[10px] text-white/40">{c.client_email || ''}</p>
                    </div>
                  </div>
                </div>

                {/* ── Financials ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#0a0a0a] rounded-2xl p-4">
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
                    <p className="text-sm font-bold text-white/60">{fmt(remaining)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-1">Paid</p>
                    <p className={`text-sm font-bold ${depositMet ? 'text-green-400' : 'text-yellow-400'}`}>
                      {fmt(paid)}{depositMet ? ' ✓' : ''}
                    </p>
                  </div>
                </div>

                {/* ── 1. Notes ── */}
                <div>
                  {notesOpen(c.id) ? (
                    /* Editing mode */
                    <div className="space-y-2">
                      <p className="text-[9px] font-black tracking-widest text-white/30 uppercase">Notes</p>
                      <textarea
                        rows={3}
                        value={editingNotes[c.id]}
                        onChange={(e) =>
                          setEditingNotes((prev) => ({ ...prev, [c.id]: e.target.value }))
                        }
                        placeholder="Add notes about this contract…"
                        className="w-full bg-[#0a0a0a] border border-white/20 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveNotes(c.id)}
                          disabled={savingNotes === c.id}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition disabled:opacity-50"
                        >
                          {savingNotes === c.id
                            ? <Loader size={10} className="animate-spin" />
                            : <Check size={10} />}
                          Save
                        </button>
                        <button
                          onClick={() => cancelEditNotes(c.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-[9px] font-black uppercase tracking-widest transition"
                        >
                          <X size={10} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display mode */
                    <div
                      className="flex items-start justify-between gap-3 group cursor-pointer"
                      onClick={() => !isCancelled && startEditNotes(c)}
                    >
                      <div className="flex-1">
                        {c.notes ? (
                          <p className="text-white/50 text-xs bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 group-hover:border-white/10 transition">
                            {c.notes}
                          </p>
                        ) : (
                          !isCancelled && (
                            <p className="text-white/20 text-xs italic px-1 group-hover:text-white/40 transition">
                              Click to add notes…
                            </p>
                          )
                        )}
                      </div>
                      {!isCancelled && (
                        <Pencil size={12} className="text-white/20 group-hover:text-white/50 mt-1 shrink-0 transition" />
                      )}
                    </div>
                  )}
                </div>

                {/* ── Signatures ── */}
                <div className="flex flex-wrap gap-3 items-center pt-1 border-t border-white/[0.06]">
                  <span className="text-[9px] font-black tracking-widest text-white/25 uppercase">Signatures:</span>
                  {c.signed_by_buyer ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] font-bold">
                      <CheckCircle2 size={10} /> Buyer signed
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-white/5 text-white/30 border border-white/10 text-[9px] font-bold">
                      Awaiting buyer signature
                    </span>
                  )}
                  {c.signed_by_agent ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] font-bold">
                      <CheckCircle2 size={10} /> You signed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSign(c.id)}
                      disabled={signing === c.id || isCancelled}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black hover:bg-gray-200 text-[9px] font-black uppercase tracking-widest transition disabled:opacity-40"
                    >
                      {signing === c.id
                        ? <Loader size={10} className="animate-spin" />
                        : <PenLine size={10} />}
                      Sign Contract
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AgentContractsView;
