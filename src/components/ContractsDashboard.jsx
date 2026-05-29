import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, CreditCard, Plus, Trash2, Loader, CheckCircle,
  RefreshCw, AlertTriangle, Euro, Building2, User, Calendar,
} from 'lucide-react';
import { apiFetch } from '../lib/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const CONTRACT_STATUS_STYLES = {
  'Deposit Pending': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  'Active':          'bg-green-500/10  text-green-400  border-green-500/30',
  'Closed':          'bg-white/5       text-white/40   border-white/10',
};

const TX_STATUS_STYLES = {
  Pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  Completed: 'bg-green-500/10  text-green-400  border-green-500/30',
};

const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Credit Card', 'Crypto', 'Other'];

const fmt = (n) => `€${Number(n || 0).toLocaleString('en')}`;

// ── Contracts tab ─────────────────────────────────────────────────────────────
const ContractsTab = ({ contracts, loading, onRefresh }) => {
  const [updating, setUpdating] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const handleStatus = async (id, status) => {
    setUpdating(id);
    try {
      await apiFetch(`/api/contracts/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contract and all its transactions?')) return;
    setDeleting(id);
    try {
      await apiFetch(`/api/contracts/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to delete contract.');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 gap-3 text-white/40">
        <Loader size={18} className="animate-spin" />
        <span className="text-xs font-bold tracking-widest uppercase">Loading contracts…</span>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center space-y-3">
        <FileText size={32} className="mx-auto text-white/15" />
        <p className="text-white/40 text-sm font-bold uppercase tracking-widest">No contracts yet</p>
        <p className="text-white/20 text-xs">Contracts are created when a user initiates a purchase.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden">
      {/* Column headers */}
      <div className="hidden lg:grid grid-cols-[0.4fr_2fr_1.5fr_1fr_1fr_1fr_1fr_auto] gap-3 px-6 py-4 border-b border-white/10 text-[9px] font-black tracking-widest uppercase text-white/25">
        <span>#</span>
        <span>Property</span>
        <span>Client</span>
        <span>Type</span>
        <span>Price</span>
        <span>Paid</span>
        <span>Status</span>
        <span className="sr-only">Actions</span>
      </div>

      {contracts.map((c) => {
        const depositRequired = Number(c.property_price) * 0.2;
        const paid = Number(c.total_paid);
        const depositMet = paid >= depositRequired;

        return (
          <div
            key={c.id}
            className="flex flex-col lg:grid lg:grid-cols-[0.4fr_2fr_1.5fr_1fr_1fr_1fr_1fr_auto] gap-3 px-6 py-5 border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02] transition items-center"
          >
            {/* ID */}
            <span className="text-[10px] text-white/30 font-bold">#{c.id}</span>

            {/* Property */}
            <div className="flex items-center gap-2 min-w-0">
              <Building2 size={13} className="text-white/30 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{c.property_title}</p>
                <p className="text-[10px] text-white/40 truncate">{c.property_location}</p>
              </div>
            </div>

            {/* Client */}
            <div className="flex items-center gap-2 min-w-0">
              <User size={12} className="text-white/30 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-white truncate">{c.client_name || '—'}</p>
                <p className="text-[10px] text-white/40 truncate">{c.client_email || ''}</p>
              </div>
            </div>

            {/* Type */}
            <span className="text-xs text-white/50">{c.type}</span>

            {/* Price */}
            <div>
              <p className="text-sm font-bold text-white">{fmt(c.property_price)}</p>
              <p className="text-[10px] text-white/40">Deposit: {fmt(depositRequired)}</p>
            </div>

            {/* Total paid + progress */}
            <div>
              <p className={`text-sm font-bold ${depositMet ? 'text-green-400' : 'text-yellow-400'}`}>
                {fmt(paid)}
              </p>
              {depositMet
                ? <p className="text-[10px] text-green-500/70">Deposit met ✓</p>
                : <p className="text-[10px] text-white/30">{fmt(depositRequired - paid)} remaining</p>}
            </div>

            {/* Status dropdown */}
            <div>
              <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border mb-2 whitespace-nowrap ${CONTRACT_STATUS_STYLES[c.status] || ''}`}>
                {c.status}
              </span>
              <select
                value={c.status}
                onChange={(e) => handleStatus(c.id, e.target.value)}
                disabled={updating === c.id}
                className="block w-full bg-[#0a0a0a] border border-white/10 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold focus:outline-none focus:border-white/30 disabled:opacity-50"
              >
                <option value="Deposit Pending">Deposit Pending</option>
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Delete */}
            <button
              onClick={() => handleDelete(c.id)}
              disabled={deleting === c.id}
              className="p-2 rounded-xl text-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-40"
            >
              {deleting === c.id ? <Loader size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          </div>
        );
      })}
    </div>
  );
};

// ── Transactions tab ──────────────────────────────────────────────────────────
const TransactionsTab = ({ contracts, transactions, loading, onRefresh }) => {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    contract_id:  '',
    amount:       '',
    payment_date: today,
    method:       'Bank Transfer',
    status:       'Completed',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [updatingTx, setUpdatingTx] = useState(null);
  const [deletingTx, setDeletingTx] = useState(null);

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
        }),
      });
      setForm((prev) => ({ ...prev, contract_id: '', amount: '' }));
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 3000);
      onRefresh();
    } catch (err) {
      setFormError(err.message || 'Failed to add payment.');
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
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingTx(null);
    }
  };

  const handleTxDelete = async (id) => {
    if (!window.confirm('Delete this payment record?')) return;
    setDeletingTx(id);
    try {
      await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingTx(null);
    }
  };

  return (
    <div className="space-y-10">

      {/* ── Add Payment form ── */}
      <div className="bg-[#111] border border-white/10 rounded-3xl p-8">
        <h3 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-3">
          <Plus size={18} className="text-white/40" /> Add Payment
        </h3>

        {formSuccess && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-6 text-green-400 text-sm">
            <CheckCircle size={16} /> Payment recorded successfully!
          </div>
        )}
        {formError && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 text-red-400 text-sm">
            <AlertTriangle size={16} /> {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Contract dropdown */}
          <div className="lg:col-span-3">
            <label className="block text-[9px] font-black tracking-widest uppercase text-white/40 mb-1.5">
              Contract *
            </label>
            <select
              value={form.contract_id}
              onChange={(e) => setForm((p) => ({ ...p, contract_id: e.target.value }))}
              required
              className="w-full bg-[#0a0a0a] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30"
            >
              <option value="">— Select a contract —</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.id} · {c.property_title} — {c.client_name} ({c.status})
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[9px] font-black tracking-widest uppercase text-white/40 mb-1.5">
              Amount (€) *
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              required
              placeholder="e.g. 30000"
              className="w-full bg-[#0a0a0a] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 [appearance:textfield]"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-[9px] font-black tracking-widest uppercase text-white/40 mb-1.5">
              Payment Date *
            </label>
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
            <label className="block text-[9px] font-black tracking-widest uppercase text-white/40 mb-1.5">
              Payment Method
            </label>
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
            <label className="block text-[9px] font-black tracking-widest uppercase text-white/40 mb-1.5">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              className="w-full bg-[#0a0a0a] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30"
            >
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          {/* Submit */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-white text-black py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader size={13} className="animate-spin" /> : <Plus size={13} />}
              Record Payment
            </button>
          </div>
        </form>
      </div>

      {/* ── Transactions table ── */}
      {loading ? (
        <div className="flex items-center justify-center h-32 gap-3 text-white/40">
          <Loader size={18} className="animate-spin" />
          <span className="text-xs font-bold tracking-widest uppercase">Loading…</span>
        </div>
      ) : transactions.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center space-y-2">
          <CreditCard size={28} className="mx-auto text-white/15" />
          <p className="text-white/40 text-sm font-bold uppercase tracking-widest">No payments recorded yet</p>
        </div>
      ) : (
        <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden">
          <div className="hidden lg:grid grid-cols-[0.4fr_2fr_1fr_1fr_1fr_1fr_auto] gap-3 px-6 py-4 border-b border-white/10 text-[9px] font-black tracking-widest uppercase text-white/25">
            <span>#</span>
            <span>Property / Client</span>
            <span>Amount</span>
            <span>Date</span>
            <span>Method</span>
            <span>Status</span>
            <span className="sr-only">Del</span>
          </div>

          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex flex-col lg:grid lg:grid-cols-[0.4fr_2fr_1fr_1fr_1fr_1fr_auto] gap-3 px-6 py-5 border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02] transition items-center"
            >
              <span className="text-[10px] text-white/30 font-bold">#{tx.id}</span>

              <div>
                <p className="text-sm font-semibold text-white">{tx.property_title || `Contract #${tx.contract_id}`}</p>
                <p className="text-[10px] text-white/40">{tx.client_name || ''}</p>
              </div>

              <span className="text-sm font-bold text-white">{fmt(tx.amount)}</span>

              <span className="text-sm text-white/60">
                {tx.payment_date ? new Date(tx.payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
              </span>

              <span className="text-xs text-white/50">{tx.method}</span>

              {/* Status toggle */}
              <div>
                <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border mb-2 ${TX_STATUS_STYLES[tx.status] || ''}`}>
                  {tx.status}
                </span>
                <select
                  value={tx.status}
                  onChange={(e) => handleTxStatus(tx.id, e.target.value)}
                  disabled={updatingTx === tx.id}
                  className="block w-full bg-[#0a0a0a] border border-white/10 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold focus:outline-none disabled:opacity-50"
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <button
                onClick={() => handleTxDelete(tx.id)}
                disabled={deletingTx === tx.id}
                className="p-2 rounded-xl text-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-40"
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

// ── Root component ────────────────────────────────────────────────────────────
const ContractsDashboard = () => {
  const [tab,          setTab]          = useState('contracts');
  const [contracts,    setContracts]    = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingC,     setLoadingC]     = useState(true);
  const [loadingT,     setLoadingT]     = useState(true);

  const loadContracts = useCallback(async () => {
    setLoadingC(true);
    try {
      const data = await apiFetch('/api/contracts');
      setContracts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load contracts:', err);
    } finally {
      setLoadingC(false);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    setLoadingT(true);
    try {
      const data = await apiFetch('/api/transactions');
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoadingT(false);
    }
  }, []);

  const refresh = useCallback(() => {
    loadContracts();
    loadTransactions();
  }, [loadContracts, loadTransactions]);

  useEffect(() => { refresh(); }, [refresh]);

  // Summary stats
  const activeContracts  = contracts.filter((c) => c.status === 'Active').length;
  const pendingContracts = contracts.filter((c) => c.status === 'Deposit Pending').length;
  const totalRevenue     = transactions
    .filter((t) => t.status === 'Completed')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="space-y-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold tracking-tight">CONTRACTS</h1>
          <p className="text-white/40 text-xs font-bold tracking-widest uppercase mt-1">
            Purchase agreements & payment tracking
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
          { label: 'Total Contracts',  value: contracts.length,   color: 'border-white/10 text-white' },
          { label: 'Deposit Pending',  value: pendingContracts,   color: 'border-yellow-500/30 text-yellow-400' },
          { label: 'Active',           value: activeContracts,    color: 'border-green-500/30 text-green-400' },
          { label: 'Total Collected',  value: fmt(totalRevenue),  color: 'border-blue-500/30 text-blue-400' },
        ].map((s) => (
          <div key={s.label} className={`bg-[#111] border rounded-2xl px-6 py-4 ${s.color}`}>
            <p className="text-[9px] font-black tracking-widest uppercase text-white/30 mb-1">{s.label}</p>
            <p className="text-2xl font-black">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-2xl w-fit border border-white/10">
        {[['contracts', 'Contracts', FileText], ['transactions', 'Payments', CreditCard]].map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition ${
              tab === id ? 'bg-white text-black' : 'text-white/40 hover:text-white'
            }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'contracts' && (
        <ContractsTab contracts={contracts} loading={loadingC} onRefresh={refresh} />
      )}
      {tab === 'transactions' && (
        <TransactionsTab
          contracts={contracts}
          transactions={transactions}
          loading={loadingT}
          onRefresh={refresh}
        />
      )}
    </div>
  );
};

export default ContractsDashboard;
