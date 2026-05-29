import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, Plus, Loader, CheckCircle, AlertTriangle,
  Trash2, RefreshCw,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { getCurrentUser } from '../lib/auth';

const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Credit Card', 'Crypto', 'Other'];
const PAYMENT_TYPES   = ['Deposit', 'Installment', 'Final Payment', 'Other'];

const TX_STATUS_STYLE = {
  Pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  Confirmed: 'bg-green-500/10  text-green-400  border-green-500/30',
  Refunded:  'bg-red-500/10    text-red-400    border-red-500/30',
};

const fmt = (n) => `€${Number(n || 0).toLocaleString('en')}`;

const AgentTransactionsView = () => {
  const [agentId,      setAgentId]      = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [contracts,    setContracts]    = useState([]);
  const [loadingTx,    setLoadingTx]    = useState(true);
  const [loadingC,     setLoadingC]     = useState(true);
  const [initError,    setInitError]    = useState('');

  const [form, setForm] = useState({
    contract_id:  '',
    payment_type: 'Deposit',
    amount:       '',
    payment_date: new Date().toISOString().split('T')[0],
    method:       'Bank Transfer',
    status:       'Confirmed',
    notes:        '',
  });
  const [submitting,  setSubmitting]  = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError,   setFormError]   = useState('');
  const [updatingTx,  setUpdatingTx]  = useState(null);
  const [deletingTx,  setDeletingTx]  = useState(null);

  // Resolve agent id from logged-in user
  useEffect(() => {
    const user = getCurrentUser();
    if (!user?.id) { setInitError('Not logged in.'); setLoadingTx(false); setLoadingC(false); return; }
    apiFetch(`/api/agents/by-user/${user.id}`)
      .then((a) => setAgentId(a.id))
      .catch(() => { setInitError('Could not resolve agent profile.'); setLoadingTx(false); setLoadingC(false); });
  }, []);

  const loadTransactions = useCallback(async () => {
    if (!agentId) return;
    setLoadingTx(true);
    try {
      const data = await apiFetch(`/api/transactions/agent/${agentId}`);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoadingTx(false); }
  }, [agentId]);

  const loadContracts = useCallback(async () => {
    if (!agentId) return;
    setLoadingC(true);
    try {
      const data = await apiFetch(`/api/contracts/agent/${agentId}`);
      setContracts(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoadingC(false); }
  }, [agentId]);

  const refresh = useCallback(() => {
    loadTransactions();
    loadContracts();
  }, [loadTransactions, loadContracts]);

  useEffect(() => { if (agentId) refresh(); }, [agentId, refresh]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.contract_id || !form.amount || !form.payment_date) {
      setFormError('Contract, amount and date are required.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await apiFetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          contract_id: Number(form.contract_id),
          amount: Number(form.amount),
          notes: form.notes || null,
        }),
      });
      setForm((p) => ({ ...p, contract_id: '', amount: '', notes: '' }));
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 4000);
      refresh();
    } catch (err) {
      setFormError(err.message || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTxStatus = async (id, status) => {
    setUpdatingTx(id);
    try {
      await apiFetch(`/api/transactions/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      refresh();
    } catch (err) {
      alert(err.message || 'Failed to update.');
    } finally {
      setUpdatingTx(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment record?')) return;
    setDeletingTx(id);
    try {
      await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' });
      loadTransactions();
    } catch (err) {
      alert(err.message || 'Failed to delete.');
    } finally {
      setDeletingTx(null);
    }
  };

  const totalConfirmed = transactions
    .filter((t) => t.status === 'Confirmed')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const pending = transactions.filter((t) => t.status === 'Pending').length;

  if (initError) {
    return (
      <div className="p-10">
        <p className="text-red-400 font-bold text-sm">{initError}</p>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold tracking-tight">PAYMENTS</h1>
          <p className="text-white/40 text-xs font-bold tracking-widest uppercase mt-1">
            Payment records linked to your contracts
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 text-white/40 hover:text-white transition text-[10px] font-bold uppercase tracking-widest"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stat pills */}
      <div className="flex flex-wrap gap-4">
        {[
          { label: 'Total Payments',  value: transactions.length,  cls: 'border-white/10 text-white' },
          { label: 'Pending',         value: pending,              cls: 'border-yellow-500/30 text-yellow-400' },
          { label: 'Total Confirmed', value: fmt(totalConfirmed),  cls: 'border-green-500/30 text-green-400' },
        ].map((s) => (
          <div key={s.label} className={`bg-[#111] border rounded-2xl px-6 py-4 ${s.cls}`}>
            <p className="text-[9px] font-black tracking-widest uppercase text-white/30 mb-1">{s.label}</p>
            <p className="text-2xl font-black">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Record a Payment Form */}
      <div className="bg-[#111] border border-white/10 rounded-3xl p-8">
        <h2 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-3">
          <Plus size={18} className="text-white/40" /> Record a Payment
        </h2>

        {formSuccess && (
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-6 text-green-400 text-sm">
            <CheckCircle size={16} />
            Payment recorded! If status is "Confirmed", the contract is now Active.
          </div>
        )}
        {formError && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 text-red-400 text-sm">
            <AlertTriangle size={16} /> {formError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Contract */}
          <div className="mb-4">
            <label className="block text-[9px] font-black tracking-widest uppercase text-white/40 mb-1.5">Contract *</label>
            <select
              value={form.contract_id}
              onChange={(e) => setForm((p) => ({ ...p, contract_id: e.target.value }))}
              required
              disabled={loadingC}
              className="w-full bg-[#0a0a0a] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 disabled:opacity-50"
            >
              <option value="">— Select a contract —</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.contract_number || `#${c.id}`} · {c.property_title} — {c.client_name} ({c.status})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Payment type */}
            <div>
              <label className="block text-[9px] font-black tracking-widest uppercase text-white/40 mb-1.5">Payment Type</label>
              <select
                value={form.payment_type}
                onChange={(e) => setForm((p) => ({ ...p, payment_type: e.target.value }))}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30"
              >
                {PAYMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-[9px] font-black tracking-widest uppercase text-white/40 mb-1.5">Amount (€) *</label>
              <input
                type="number" min="1" step="0.01"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                required placeholder="e.g. 40000"
                className="w-full bg-[#0a0a0a] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 [appearance:textfield]"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-[9px] font-black tracking-widest uppercase text-white/40 mb-1.5">Payment Date *</label>
              <input
                type="date"
                value={form.payment_date}
                onChange={(e) => setForm((p) => ({ ...p, payment_date: e.target.value }))}
                required
                className="w-full bg-[#0a0a0a] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 [color-scheme:dark]"
              />
            </div>

            {/* Method */}
            <div>
              <label className="block text-[9px] font-black tracking-widest uppercase text-white/40 mb-1.5">Method</label>
              <select
                value={form.method}
                onChange={(e) => setForm((p) => ({ ...p, method: e.target.value }))}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30"
              >
                {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[9px] font-black tracking-widest uppercase text-white/40 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30"
              >
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-[9px] font-black tracking-widest uppercase text-white/40 mb-1.5">Notes (optional)</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="e.g. Wire transfer reference #12345"
              className="w-full bg-[#0a0a0a] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-white text-black px-10 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? <Loader size={13} className="animate-spin" /> : <Plus size={13} />}
            Record Payment
          </button>
        </form>
      </div>

      {/* Payments Table */}
      {loadingTx ? (
        <div className="flex items-center justify-center h-32 gap-3 text-white/40">
          <Loader size={18} className="animate-spin" />
          <span className="text-xs font-bold tracking-widest uppercase">Loading…</span>
        </div>
      ) : transactions.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-3xl p-16 text-center space-y-3">
          <CreditCard size={32} className="mx-auto text-white/15" />
          <p className="text-white/40 text-sm font-bold uppercase tracking-widest">No payments recorded yet</p>
        </div>
      ) : (
        <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden">
          <div className="hidden lg:grid grid-cols-[0.4fr_0.8fr_2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 border-b border-white/10 text-[9px] font-black tracking-widest uppercase text-white/25">
            <span>#</span><span>Type</span><span>Property / Client</span>
            <span>Amount</span><span>Date</span><span>Method</span><span>Status</span>
            <span className="sr-only">Del</span>
          </div>

          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex flex-col lg:grid lg:grid-cols-[0.4fr_0.8fr_2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-5
                         border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02] transition items-center"
            >
              <span className="text-[10px] text-white/30 font-bold">#{tx.id}</span>

              <span className="text-[9px] font-black tracking-widest uppercase text-white/50 bg-white/5 border border-white/10 px-2 py-1 rounded-lg">
                {tx.payment_type || 'Deposit'}
              </span>

              <div>
                <p className="text-sm font-semibold text-white">{tx.property_title || `Contract #${tx.contract_id}`}</p>
                <p className="text-[10px] text-white/40">{tx.client_name || ''}</p>
                {tx.contract_number && (
                  <p className="text-[9px] text-white/20">{tx.contract_number}</p>
                )}
              </div>

              <span className="text-sm font-bold text-white">{fmt(tx.amount)}</span>

              <span className="text-sm text-white/60">
                {tx.payment_date
                  ? new Date(tx.payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '—'}
              </span>

              <span className="text-xs text-white/50">{tx.method}</span>

              <div className="space-y-1.5">
                <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${TX_STATUS_STYLE[tx.status] || ''}`}>
                  {tx.status}
                </span>
                <select
                  value={tx.status}
                  onChange={(e) => handleTxStatus(tx.id, e.target.value)}
                  disabled={updatingTx === tx.id}
                  className="block w-full bg-[#0a0a0a] border border-white/10 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold focus:outline-none disabled:opacity-50"
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>

              <button
                onClick={() => handleDelete(tx.id)}
                disabled={deletingTx === tx.id}
                className="p-2 rounded-xl text-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-40"
              >
                {deletingTx === tx.id ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentTransactionsView;
