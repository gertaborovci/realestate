import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Building2, User, Loader, Trash2, RefreshCw,
  PenLine, CheckCircle2, Plus, X, Pencil, AlertTriangle,
} from 'lucide-react';
import { apiFetch } from '../lib/api';

// ─── helpers ────────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  'Pending Signature': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  'Active':            'bg-blue-500/10   text-blue-400   border-blue-500/30',
  'Finalized':         'bg-green-500/10  text-green-400  border-green-500/30',
  'Cancelled':         'bg-red-500/10    text-red-400    border-red-500/30',
};

const fmt = (n) => `€${Number(n || 0).toLocaleString('en')}`;

const EMPTY_CREATE = {
  property_id: '', user_id: '', agent_id: '',
  type: 'Sale', property_price: '', notes: '',
};

const inputCls =
  'w-full bg-[#0a0a0a] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 disabled:opacity-50';
const labelCls = 'block text-[9px] font-black tracking-widest uppercase text-white/40 mb-1.5';

// ─── Modal shell ─────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-2xl bg-[#111] border border-white/10 rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black uppercase tracking-tight">{title}</h2>
        <button onClick={onClose} className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition">
          <X size={18} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const ContractsPage = () => {
  const [contracts,   setContracts]   = useState([]);
  const [properties,  setProperties]  = useState([]);
  const [users,       setUsers]       = useState([]);
  const [agents,      setAgents]      = useState([]);

  const [loading,     setLoading]     = useState(true);
  const [updating,    setUpdating]    = useState(null);
  const [signing,     setSigning]     = useState(null);
  const [deleting,    setDeleting]    = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  // Modal state
  const [showCreate,      setShowCreate]      = useState(false);
  const [editingContract, setEditingContract] = useState(null); // contract object

  // Forms
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [editForm,   setEditForm]   = useState({});

  // ── loaders ────────────────────────────────────────────────────────────────
  const loadContracts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/contracts');
      setContracts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSupport = useCallback(async () => {
    try {
      const [propsData, usersData, agentsData] = await Promise.all([
        apiFetch('/api/properties'),
        apiFetch('/api/users'),
        apiFetch('/api/agents'),
      ]);
      setProperties(Array.isArray(propsData)  ? propsData  : []);
      setUsers(Array.isArray(usersData)        ? usersData.filter((u) => u.role === 'user') : []);
      setAgents(Array.isArray(agentsData)      ? agentsData : []);
    } catch (err) {
      console.error('Failed to load support data:', err);
    }
  }, []);

  useEffect(() => { loadContracts(); loadSupport(); }, [loadContracts, loadSupport]);

  // Auto-fill price when property is selected in create form
  const handlePropertySelect = (propertyId) => {
    const prop = properties.find((p) => String(p.id) === String(propertyId));
    setCreateForm((prev) => ({
      ...prev,
      property_id:    propertyId,
      property_price: prop ? String(prop.price) : '',
      // Auto-set agent if property has one
      agent_id: prop?.agent_id ? String(prop.agent_id) : prev.agent_id,
    }));
  };

  // ── CREATE ─────────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.property_id || !createForm.user_id) {
      setError('Property and buyer are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id:    Number(createForm.property_id),
          user_id:        Number(createForm.user_id),
          agent_id:       createForm.agent_id ? Number(createForm.agent_id) : null,
          type:           createForm.type,
          property_price: createForm.property_price ? Number(createForm.property_price) : undefined,
          notes:          createForm.notes || null,
        }),
      });
      setShowCreate(false);
      setCreateForm(EMPTY_CREATE);
      loadContracts();
    } catch (err) {
      setError(err.message || 'Failed to create contract.');
    } finally {
      setSaving(false);
    }
  };

  // ── EDIT (open modal) ──────────────────────────────────────────────────────
  const openEdit = (c) => {
    setEditingContract(c);
    setEditForm({
      type:           c.type || 'Sale',
      property_price: String(c.property_price || ''),
      agent_id:       c.agent_id ? String(c.agent_id) : '',
      notes:          c.notes || '',
    });
    setError('');
  };

  // ── UPDATE ─────────────────────────────────────────────────────────────────
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/api/contracts/${editingContract.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:           editForm.type,
          property_price: editForm.property_price ? Number(editForm.property_price) : undefined,
          agent_id:       editForm.agent_id ? Number(editForm.agent_id) : null,
          notes:          editForm.notes || null,
        }),
      });
      setEditingContract(null);
      loadContracts();
    } catch (err) {
      setError(err.message || 'Failed to update contract.');
    } finally {
      setSaving(false);
    }
  };

  // ── STATUS ─────────────────────────────────────────────────────────────────
  const handleStatus = async (id, status) => {
    setUpdating(id);
    try {
      await apiFetch(`/api/contracts/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      loadContracts();
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  // ── SIGN ───────────────────────────────────────────────────────────────────
  const handleSign = async (id, party) => {
    setSigning(`${id}-${party}`);
    try {
      const res = await apiFetch(`/api/contracts/${id}/sign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ party }),
      });
      if (res.finalized) alert('Both parties signed — contract is now Finalized!');
      loadContracts();
    } catch (err) {
      alert(err.message || 'Failed to record signature.');
    } finally {
      setSigning(null);
    }
  };

  // ── DELETE ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contract and all its linked payments?')) return;
    setDeleting(id);
    try {
      await apiFetch(`/api/contracts/${id}`, { method: 'DELETE' });
      loadContracts();
    } catch (err) {
      alert(err.message || 'Failed to delete.');
    } finally {
      setDeleting(null);
    }
  };

  const counts = {
    pending:   contracts.filter((c) => c.status === 'Pending Signature').length,
    active:    contracts.filter((c) => c.status === 'Active').length,
    finalized: contracts.filter((c) => c.status === 'Finalized').length,
    cancelled: contracts.filter((c) => c.status === 'Cancelled').length,
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold tracking-tight">CONTRACTS</h1>
          <p className="text-white/40 text-xs font-bold tracking-widest uppercase mt-1">
            Purchase &amp; rental agreements
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={loadContracts} className="flex items-center gap-2 text-white/40 hover:text-white transition text-[10px] font-bold uppercase tracking-widest">
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => { setShowCreate(true); setError(''); setCreateForm(EMPTY_CREATE); }}
            className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition"
          >
            <Plus size={14} /> New Contract
          </button>
        </div>
      </div>

      {/* Stat pills */}
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

      {/* Contract list */}
      {loading ? (
        <div className="flex items-center justify-center h-48 gap-3 text-white/40">
          <Loader size={18} className="animate-spin" />
          <span className="text-xs font-bold tracking-widest uppercase">Loading…</span>
        </div>
      ) : contracts.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-3xl p-20 text-center space-y-4">
          <FileText size={36} className="mx-auto text-white/15" />
          <p className="text-white/40 text-sm font-bold uppercase tracking-widest">No contracts yet</p>
          <p className="text-white/20 text-xs">Contracts are created when a user clicks "Initiate Purchase" or via the New Contract button above.</p>
          <button
            onClick={() => { setShowCreate(true); setError(''); setCreateForm(EMPTY_CREATE); }}
            className="mx-auto flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition"
          >
            <Plus size={14} /> Create First Contract
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((c) => {
            const deposit    = Number(c.deposit_amount    || Number(c.property_price) * 0.2);
            const remaining  = Number(c.remaining_balance || Number(c.property_price) * 0.8);
            const paid       = Number(c.total_paid);
            const depositMet = paid >= deposit && deposit > 0;

            return (
              <div key={c.id} className="bg-[#111] border border-white/10 rounded-3xl p-6 space-y-5">

                {/* Top row */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-0.5">Contract</p>
                    <p className="text-xl font-black text-white">{c.contract_number || `#${c.id}`}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">
                      Created {new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Status badge + dropdown */}
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${STATUS_STYLE[c.status] || ''}`}>
                      {c.status}
                    </span>
                    <select
                      value={c.status}
                      onChange={(e) => handleStatus(c.id, e.target.value)}
                      disabled={updating === c.id}
                      className="bg-[#0a0a0a] border border-white/10 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold focus:outline-none disabled:opacity-50"
                    >
                      <option value="Pending Signature">Pending Signature</option>
                      <option value="Active">Active</option>
                      <option value="Finalized">Finalized</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>

                    {/* Edit */}
                    <button
                      onClick={() => openEdit(c)}
                      className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition"
                      title="Edit contract"
                    >
                      <Pencil size={14} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deleting === c.id}
                      className="p-2 rounded-xl text-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-40"
                      title="Delete contract"
                    >
                      {deleting === c.id ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>

                {/* Property + Buyer + Agent */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div>
                    <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-0.5">Agent / Type</p>
                    <p className="text-sm text-white">{c.agent_name || '—'}</p>
                    <p className="text-[10px] text-white/40 uppercase">{c.type}</p>
                  </div>
                </div>

                {/* Financials */}
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
                    <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-1">Remaining (80%)</p>
                    <p className="text-sm font-bold text-white/60">{fmt(remaining)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-1">Total Paid</p>
                    <p className={`text-sm font-bold ${depositMet ? 'text-green-400' : 'text-yellow-400'}`}>
                      {fmt(paid)}{depositMet ? ' ✓' : ''}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {c.notes && (
                  <p className="text-white/40 text-xs bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3">
                    {c.notes}
                  </p>
                )}

                {/* Signatures */}
                <div className="flex flex-wrap gap-3 items-center pt-1">
                  <span className="text-[9px] font-black tracking-widest text-white/25 uppercase">Signatures:</span>
                  {c.signed_by_buyer ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] font-bold">
                      <CheckCircle2 size={10} /> Buyer signed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSign(c.id, 'buyer')}
                      disabled={signing === `${c.id}-buyer`}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/10 text-[9px] font-bold transition disabled:opacity-40"
                    >
                      <PenLine size={10} /> Mark buyer signed
                    </button>
                  )}
                  {c.signed_by_agent ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] font-bold">
                      <CheckCircle2 size={10} /> Agent signed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSign(c.id, 'agent')}
                      disabled={signing === `${c.id}-agent`}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/10 text-[9px] font-bold transition disabled:opacity-40"
                    >
                      <PenLine size={10} /> Mark agent signed
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE MODAL ─────────────────────────────────────────────────── */}
      {showCreate && (
        <Modal title="New Contract" onClose={() => setShowCreate(false)}>
          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 text-red-400 text-sm">
              <AlertTriangle size={15} /> {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-5">

            {/* Property */}
            <div>
              <label className={labelCls}>Property *</label>
              <select
                required
                value={createForm.property_id}
                onChange={(e) => handlePropertySelect(e.target.value)}
                className={inputCls}
              >
                <option value="">— Select a property —</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {p.location} (€{Number(p.price).toLocaleString('en')})
                  </option>
                ))}
              </select>
            </div>

            {/* Buyer */}
            <div>
              <label className={labelCls}>Buyer (User) *</label>
              <select
                required
                value={createForm.user_id}
                onChange={(e) => setCreateForm((p) => ({ ...p, user_id: e.target.value }))}
                className={inputCls}
              >
                <option value="">— Select a buyer —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username} — {u.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Agent */}
            <div>
              <label className={labelCls}>Agent (optional)</label>
              <select
                value={createForm.agent_id}
                onChange={(e) => setCreateForm((p) => ({ ...p, agent_id: e.target.value }))}
                className={inputCls}
              >
                <option value="">— No agent —</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.username} — {a.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Type + Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Contract Type</label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm((p) => ({ ...p, type: e.target.value }))}
                  className={inputCls}
                >
                  <option value="Sale">Sale</option>
                  <option value="Rent">Rent</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Property Price (€)</label>
                <input
                  type="number" min="1" step="0.01"
                  value={createForm.property_price}
                  onChange={(e) => setCreateForm((p) => ({ ...p, property_price: e.target.value }))}
                  placeholder="Auto-filled from property"
                  className={`${inputCls} [appearance:textfield]`}
                />
              </div>
            </div>

            {/* Deposit preview */}
            {createForm.property_price && (
              <div className="grid grid-cols-2 gap-4 bg-[#0a0a0a] rounded-2xl p-4">
                <div>
                  <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-1">Deposit (20%)</p>
                  <p className="text-sm font-bold text-yellow-400">
                    {fmt(Number(createForm.property_price) * 0.2)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-1">Remaining (80%)</p>
                  <p className="text-sm font-bold text-white/60">
                    {fmt(Number(createForm.property_price) * 0.8)}
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className={labelCls}>Notes (optional)</label>
              <textarea
                rows={3}
                value={createForm.notes}
                onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Any additional details…"
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex-1 py-3.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-[10px] font-black uppercase tracking-widest transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3.5 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader size={13} className="animate-spin" /> : <Plus size={13} />}
                Create Contract
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── EDIT MODAL ───────────────────────────────────────────────────── */}
      {editingContract && (
        <Modal title={`Edit — ${editingContract.contract_number || `#${editingContract.id}`}`} onClose={() => setEditingContract(null)}>
          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 text-red-400 text-sm">
              <AlertTriangle size={15} /> {error}
            </div>
          )}

          {/* Read-only info */}
          <div className="grid grid-cols-2 gap-4 bg-[#0a0a0a] rounded-2xl p-4 mb-6">
            <div>
              <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-1">Property</p>
              <p className="text-sm text-white">{editingContract.property_title || '—'}</p>
            </div>
            <div>
              <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-1">Buyer</p>
              <p className="text-sm text-white">{editingContract.client_name || '—'}</p>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-5">

            {/* Type */}
            <div>
              <label className={labelCls}>Contract Type</label>
              <select
                value={editForm.type}
                onChange={(e) => setEditForm((p) => ({ ...p, type: e.target.value }))}
                className={inputCls}
              >
                <option value="Sale">Sale</option>
                <option value="Rent">Rent</option>
              </select>
            </div>

            {/* Price */}
            <div>
              <label className={labelCls}>Property Price (€) — deposit &amp; remaining auto-recalculate</label>
              <input
                type="number" min="1" step="0.01"
                value={editForm.property_price}
                onChange={(e) => setEditForm((p) => ({ ...p, property_price: e.target.value }))}
                className={`${inputCls} [appearance:textfield]`}
              />
            </div>

            {/* Deposit preview */}
            {editForm.property_price && (
              <div className="grid grid-cols-2 gap-4 bg-[#0a0a0a] rounded-2xl p-4">
                <div>
                  <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-1">New Deposit (20%)</p>
                  <p className="text-sm font-bold text-yellow-400">
                    {fmt(Number(editForm.property_price) * 0.2)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-1">New Remaining (80%)</p>
                  <p className="text-sm font-bold text-white/60">
                    {fmt(Number(editForm.property_price) * 0.8)}
                  </p>
                </div>
              </div>
            )}

            {/* Agent */}
            <div>
              <label className={labelCls}>Re-assign Agent</label>
              <select
                value={editForm.agent_id}
                onChange={(e) => setEditForm((p) => ({ ...p, agent_id: e.target.value }))}
                className={inputCls}
              >
                <option value="">— No agent —</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.username} — {a.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className={labelCls}>Notes</label>
              <textarea
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Add notes or instructions…"
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingContract(null)}
                className="flex-1 py-3.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-[10px] font-black uppercase tracking-widest transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3.5 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader size={13} className="animate-spin" /> : <Pencil size={13} />}
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default ContractsPage;
