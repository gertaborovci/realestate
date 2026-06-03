import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, Check, Loader, Receipt } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { showAlert, showConfirm } from '../lib/modal';

const API = '/api/expenses';

const CATEGORIES = [
  'Marketing', 'Maintenance', 'Office Supplies', 'Utilities',
  'Staff & Salaries', 'Technology', 'Travel', 'Legal & Compliance', 'Other',
];

const EMPTY = { category: 'Marketing', amount: '', description: '', expense_date: '' };

const inputCls =
  'w-full bg-[#1a1a1a] border border-gray-800 text-white px-4 py-3 rounded-xl text-sm ' +
  'focus:outline-none focus:border-gray-600 placeholder:text-white/20 transition';

const labelCls = 'block text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1.5';

const CATEGORY_COLORS = {
  'Marketing':          'bg-blue-500/10   text-blue-400   border-blue-500/20',
  'Maintenance':        'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Office Supplies':    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Utilities':          'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Staff & Salaries':   'bg-green-500/10  text-green-400  border-green-500/20',
  'Technology':         'bg-cyan-500/10   text-cyan-400   border-cyan-500/20',
  'Travel':             'bg-pink-500/10   text-pink-400   border-pink-500/20',
  'Legal & Compliance': 'bg-red-500/10    text-red-400    border-red-500/20',
  'Other':              'bg-white/5       text-white/50   border-white/10',
};

const catCls = (cat) => CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other'];

const fmt    = (n) => `€${Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function ManageExpenses() {
  const [expenses,   setExpenses]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [form,       setForm]       = useState(EMPTY);
  const [editingId,  setEditingId]  = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formError,  setFormError]  = useState('');
  const [success,    setSuccess]    = useState('');
  const [filterCat,   setFilterCat]   = useState('All');
  const [hoveredBar,  setHoveredBar]  = useState(null); // index of hovered month bar

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(API);
      setExpenses(Array.isArray(data) ? data : []);
    } catch {
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Derived totals ─────────────────────────────────────────────────────────
  const totalAll = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
    [expenses]
  );

  const byCategory = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      const cat = e.category || 'Other';
      map[cat] = (map[cat] || 0) + Number(e.amount || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  // Last 8 months of data for the bar chart
  const byMonth = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('default', { month: 'short' }),
        year:  d.getFullYear(),
        total: 0,
      });
    }
    expenses.forEach(e => {
      if (!e.expense_date) return;
      const d = new Date(e.expense_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const m = months.find(m => m.key === key);
      if (m) m.total += Number(e.amount || 0);
    });
    return months;
  }, [expenses]);

  const displayed = filterCat === 'All'
    ? expenses
    : expenses.filter(e => e.category === filterCat);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const resetForm = () => { setForm(EMPTY); setEditingId(null); setFormError(''); };
  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const startEdit = (e) => {
    setForm({
      category:     e.category     || 'Other',
      amount:       e.amount       || '',
      description:  e.description  || '',
      expense_date: e.expense_date ? e.expense_date.split('T')[0] : '',
    });
    setEditingId(e.id);
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── CREATE / UPDATE ────────────────────────────────────────────────────────
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!form.amount || !form.expense_date) {
      setFormError('Amount and date are required.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      if (editingId) {
        await apiFetch(`${API}/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        flash('Expense updated.');
      } else {
        await apiFetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        flash('Expense added.');
      }
      resetForm();
      load();
    } catch (err) {
      setFormError(err.message || 'Failed to save.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── DELETE ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!await showConfirm('Delete this expense? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await apiFetch(`${API}/${id}`, { method: 'DELETE' });
      setExpenses(prev => prev.filter(e => e.id !== id));
      flash('Expense deleted.');
    } catch (err) {
      await showAlert(err.message || 'Failed to delete.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-5xl font-bold">EXPENSES</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Agency expense tracking</p>
        </div>
        {editingId && (
          <button onClick={resetForm}
            className="flex items-center gap-2 text-white/40 hover:text-white text-[10px] font-bold uppercase tracking-widest transition">
            <X size={13} /> Cancel edit
          </button>
        )}
      </div>

      {/* ── Chart dashboard ── */}
      <div className="bg-[#121212] border border-gray-800 rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">

        {/* LEFT: Monthly bar chart */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-black tracking-widest uppercase text-gray-500 mb-0.5">Monthly Spending</p>
              <p className="text-2xl font-black text-white">{fmt(totalAll)}</p>
            </div>
            <p className="text-[9px] font-bold tracking-widest uppercase text-gray-600">Last 8 months</p>
          </div>

          {/* SVG bar chart */}
          {(() => {
            const H = 140;       // chart height
            const pad = 40;      // left padding for y-axis labels
            const maxVal = Math.max(...byMonth.map(m => m.total), 1);
            // Nice round y-axis max
            const mag    = Math.pow(10, Math.floor(Math.log10(maxVal)));
            const yMax   = Math.ceil(maxVal / mag) * mag;
            const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => yMax * t);

            return (
              <div className="relative select-none">
                <svg
                  viewBox={`0 0 ${pad + byMonth.length * 56} ${H + 36}`}
                  className="w-full overflow-visible"
                >
                  {/* Grid lines + y labels */}
                  {yTicks.map((val, i) => {
                    const y = H - (val / yMax) * H;
                    return (
                      <g key={i}>
                        <line
                          x1={pad} y1={y} x2={pad + byMonth.length * 56} y2={y}
                          stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4"
                        />
                        <text
                          x={pad - 6} y={y + 4}
                          textAnchor="end" fill="rgba(255,255,255,0.25)"
                          fontSize="10" fontWeight="700"
                        >
                          {val >= 1000 ? `€${Math.round(val/1000)}k` : val === 0 ? '€0' : `€${val}`}
                        </text>
                      </g>
                    );
                  })}

                  {/* Bars */}
                  {byMonth.map((m, i) => {
                    const barW  = 36;
                    const gap   = 20;
                    const x     = pad + i * (barW + gap);
                    const barH  = m.total > 0 ? Math.max(4, (m.total / yMax) * H) : 0;
                    const y     = H - barH;
                    const isHov = hoveredBar === i;

                    return (
                      <g
                        key={m.key}
                        onMouseEnter={() => setHoveredBar(i)}
                        onMouseLeave={() => setHoveredBar(null)}
                        style={{ cursor: 'default' }}
                      >
                        {/* Background track */}
                        <rect x={x} y={0} width={barW} height={H} rx={6} fill="rgba(255,255,255,0.03)" />

                        {/* Bar */}
                        {m.total > 0 && (
                          <rect
                            x={x} y={y} width={barW} height={barH} rx={6}
                            fill={isHov ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)'}
                            style={{ transition: 'fill 0.15s, height 0.3s' }}
                          />
                        )}

                        {/* Hover tooltip */}
                        {isHov && m.total > 0 && (
                          <g>
                            <rect
                              x={x - 10} y={y - 32}
                              width={barW + 20} height={24}
                              rx={6} fill="white"
                            />
                            <text
                              x={x + barW / 2} y={y - 14}
                              textAnchor="middle" fill="black"
                              fontSize="10" fontWeight="900"
                            >
                              {fmt(m.total)}
                            </text>
                          </g>
                        )}

                        {/* Month label */}
                        <text
                          x={x + barW / 2} y={H + 18}
                          textAnchor="middle" fill="rgba(255,255,255,0.35)"
                          fontSize="11" fontWeight="700"
                        >
                          {m.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            );
          })()}
        </div>

        {/* RIGHT: Category breakdown */}
        <div className="border-t lg:border-t-0 lg:border-l border-gray-800 lg:pl-8 pt-6 lg:pt-0">
          <p className="text-[10px] font-black tracking-widest uppercase text-gray-500 mb-5">By Category</p>
          {byCategory.length === 0 ? (
            <p className="text-white/20 text-xs italic">No data yet.</p>
          ) : (
            <div className="space-y-4">
              {byCategory.map(([cat, total]) => {
                const pct = totalAll > 0 ? (total / totalAll) * 100 : 0;
                // Pick a bar colour from the category badge colours
                const barColour = {
                  'Marketing': '#60a5fa', 'Maintenance': '#fb923c',
                  'Office Supplies': '#c084fc', 'Utilities': '#facc15',
                  'Staff & Salaries': '#4ade80', 'Technology': '#22d3ee',
                  'Travel': '#f472b6', 'Legal & Compliance': '#f87171',
                }[cat] || '#ffffff50';

                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black tracking-wider uppercase text-white/60">{cat}</span>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-white">{fmt(total)}</span>
                        <span className="text-[9px] text-gray-600 font-bold ml-1.5">{Math.round(pct)}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: barColour }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Success banner */}
      {success && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 px-5 py-3 rounded-xl text-sm font-bold">
          <Check size={14} /> {success}
        </div>
      )}

      {/* ── CREATE / EDIT form ── */}
      <div className="bg-[#121212] border border-gray-800 rounded-2xl p-8">
        <h2 className="text-sm font-black uppercase tracking-widest text-white/60 mb-6 flex items-center gap-2">
          {editingId ? <><Pencil size={14} /> Edit Expense</> : <><Plus size={14} /> Add Expense</>}
        </h2>

        {formError && (
          <p className="text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5">
            {formError}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

            <div>
              <label className={labelCls}>Category</label>
              <select value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className={inputCls}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>Amount (€) *</label>
              <input type="number" step="0.01" min="0"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="e.g. 1500.00"
                required
                className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Date *</label>
              <input type="date"
                value={form.expense_date}
                onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
                required
                className={`${inputCls} [color-scheme:dark]`} />
            </div>

            <div>
              <label className={labelCls}>Description</label>
              <input type="text"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional note…"
                className={inputCls} />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition disabled:opacity-50">
              {submitting
                ? <><Loader size={12} className="animate-spin" /> Saving…</>
                : editingId
                  ? <><Check size={12} /> Save Changes</>
                  : <><Plus size={12} /> Add Expense</>}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm}
                className="px-6 py-3 rounded-xl border border-gray-800 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Category filter chips ── */}
      <div className="flex flex-wrap gap-2">
        {['All', ...CATEGORIES.filter(c => expenses.some(e => e.category === c))].map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition ${
              filterCat === cat ? 'bg-white text-black border-white' : 'text-white/40 border-gray-800 hover:text-white hover:border-gray-600'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* ── READ: Expense table ── */}
      {loading ? (
        <div className="flex items-center justify-center h-32 gap-3 text-white/30">
          <Loader size={18} className="animate-spin" />
          <span className="text-xs font-bold tracking-widest uppercase">Loading…</span>
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-[#121212] border border-dashed border-gray-800 rounded-2xl p-16 text-center">
          <Receipt size={32} className="mx-auto text-white/15 mb-3" />
          <p className="text-white/30 text-sm font-bold uppercase tracking-widest">No expenses yet</p>
          <p className="text-white/20 text-xs mt-1">Use the form above to log one.</p>
        </div>
      ) : (
        <div className="bg-[#121212] border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <th className="p-5">Date</th>
                <th className="p-5">Category</th>
                <th className="p-5">Description</th>
                <th className="p-5 text-right">Amount</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900">
              {displayed.map(e => (
                <tr key={e.id}
                  className={`hover:bg-white/[0.02] transition ${editingId === e.id ? 'bg-yellow-500/5' : ''}`}>

                  <td className="p-5 text-gray-400 text-sm whitespace-nowrap">
                    {fmtDate(e.expense_date)}
                  </td>

                  <td className="p-5">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${catCls(e.category)}`}>
                      {e.category || 'Other'}
                    </span>
                  </td>

                  <td className="p-5 text-gray-400 text-xs max-w-[240px]">
                    <span className="line-clamp-1">{e.description || '—'}</span>
                  </td>

                  <td className="p-5 text-right font-mono font-bold text-white whitespace-nowrap">
                    {fmt(e.amount)}
                  </td>

                  <td className="p-5">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => startEdit(e)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-[9px] font-black uppercase tracking-widest transition">
                        <Pencil size={11} /> Edit
                      </button>
                      <button onClick={() => handleDelete(e.id)} disabled={deletingId === e.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[9px] font-black uppercase tracking-widest transition disabled:opacity-40">
                        {deletingId === e.id ? <Loader size={11} className="animate-spin" /> : <Trash2 size={11} />}
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Footer total */}
            <tfoot>
              <tr className="border-t border-gray-700 bg-white/[0.02]">
                <td colSpan={3} className="p-5 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  {filterCat === 'All' ? `${displayed.length} expenses` : `${displayed.length} in ${filterCat}`}
                </td>
                <td className="p-5 text-right font-mono font-black text-white text-base whitespace-nowrap">
                  {fmt(displayed.reduce((s, e) => s + Number(e.amount || 0), 0))}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
