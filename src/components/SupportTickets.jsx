import React, { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy, Search, ChevronDown, ChevronUp,
  Trash2, Send, Circle, Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { showAlert, showConfirm } from '../lib/modal';

const STATUSES   = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const STATUS_STYLE = {
  'Open':        'bg-yellow-500/10 text-yellow-400  border-yellow-500/20',
  'In Progress': 'bg-blue-500/10   text-blue-400    border-blue-500/20',
  'Resolved':    'bg-green-500/10  text-green-400   border-green-500/20',
  'Closed':      'bg-zinc-800      text-zinc-500    border-zinc-700',
};

const PRIORITY_STYLE = {
  'Low':    'bg-zinc-800      text-zinc-400   border-zinc-700',
  'Medium': 'bg-blue-500/10   text-blue-400   border-blue-500/20',
  'High':   'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Urgent': 'bg-red-500/10    text-red-400    border-red-500/20',
};

const STATUS_ICON = {
  'Open':        <Circle       size={13} className="text-yellow-400 shrink-0" />,
  'In Progress': <Loader2      size={13} className="text-blue-400   shrink-0 animate-spin" />,
  'Resolved':    <CheckCircle2 size={13} className="text-green-400  shrink-0" />,
  'Closed':      <CheckCircle2 size={13} className="text-zinc-500   shrink-0" />,
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function SupportTickets() {
  const [tickets, setTickets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('All');
  const [search, setSearch]       = useState('');
  const [expanded, setExpanded]   = useState(null);
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState('');

  // Per-ticket draft reply + status edit stored in local state
  const [drafts, setDrafts] = useState({});

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/tickets');
      setTickets(Array.isArray(data) ? data : []);
    } catch { setTickets([]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // Initialise draft when a ticket is expanded
  const expand = (ticket) => {
    if (expanded === ticket.id) { setExpanded(null); return; }
    setExpanded(ticket.id);
    if (!drafts[ticket.id]) {
      setDrafts((d) => ({
        ...d,
        [ticket.id]: {
          status:      ticket.status,
          priority:    ticket.priority,
          admin_reply: ticket.admin_reply || '',
        },
      }));
    }
  };

  const setDraftField = (id, field, value) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [field]: value } }));

  const handleSave = async (ticket) => {
    const draft = drafts[ticket.id];
    if (!draft) return;
    setSaving(true);
    setSaveMsg('');
    try {
      await apiFetch(`/api/tickets/${ticket.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({
          status:      draft.status,
          priority:    draft.priority,
          admin_reply: draft.admin_reply || null,
        }),
      });
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticket.id
            ? { ...t, status: draft.status, priority: draft.priority, admin_reply: draft.admin_reply || null }
            : t
        )
      );
      setSaveMsg('Saved!');
      setTimeout(() => setSaveMsg(''), 2500);
    } catch (err) {
      setSaveMsg(err.message || 'Failed to save.');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!await showConfirm('Delete this ticket permanently?')) return;
    try {
      await apiFetch(`/api/tickets/${id}`, { method: 'DELETE' });
      setTickets((prev) => prev.filter((t) => t.id !== id));
      if (expanded === id) setExpanded(null);
    } catch (err) { await showAlert(err.message, 'error'); }
  };

  // Stats
  const counts = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  // Filtered list
  const visible = tickets.filter((t) => {
    const matchFilter = filter === 'All' || t.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      t.subject.toLowerCase().includes(q) ||
      (t.user_name || '').toLowerCase().includes(q) ||
      (t.user_email || '').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-8">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-2xl">
            <LifeBuoy size={24} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white">SUPPORT TICKETS</h1>
            <p className="text-white/40 text-xs font-bold tracking-widest uppercase mt-1">
              Manage user & agent support requests
            </p>
          </div>
        </div>
        {saveMsg && (
          <span className={`text-sm font-bold px-4 py-2 rounded-full ${
            saveMsg === 'Saved!'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {saveMsg}
          </span>
        )}
      </div>

      {/* Stats pills */}
      <div className="flex gap-4 flex-wrap">
        {[
          { label: 'Open',        val: counts['Open']        || 0, color: 'text-yellow-400' },
          { label: 'In Progress', val: counts['In Progress'] || 0, color: 'text-blue-400'   },
          { label: 'Resolved',    val: counts['Resolved']    || 0, color: 'text-green-400'  },
          { label: 'Total',       val: tickets.length,             color: 'text-white'       },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-[#111] border border-white/8 rounded-2xl px-6 py-4">
            <p className={`text-2xl font-black ${color}`}>{val}</p>
            <p className="text-[10px] font-bold tracking-widest uppercase text-white/30 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase border transition ${
                filter === s
                  ? 'bg-white text-black border-white'
                  : 'text-white/40 border-white/10 hover:text-white hover:border-white/30'
              }`}
            >
              {s} {s !== 'All' && counts[s] ? `(${counts[s]})` : ''}
            </button>
          ))}
        </div>

        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user or subject…"
            className="bg-[#111] border border-white/10 rounded-full pl-9 pr-4 py-2 text-white text-xs placeholder-white/20 focus:outline-none focus:border-white/30 w-64 transition"
          />
        </div>
      </div>

      {/* Ticket list */}
      {loading ? (
        <p className="text-white/30 animate-pulse text-sm">Loading tickets…</p>
      ) : visible.length === 0 ? (
        <div className="text-center py-20 text-white/20">
          <LifeBuoy size={40} className="mx-auto mb-4 opacity-20" />
          <p className="font-bold">No tickets found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((t) => {
            const draft    = drafts[t.id];
            const isOpen   = expanded === t.id;

            return (
              <div
                key={t.id}
                className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden transition hover:border-white/15"
              >
                {/* Ticket row */}
                <div
                  className="flex items-center gap-4 px-6 py-5 cursor-pointer select-none"
                  onClick={() => expand(t)}
                >
                  {STATUS_ICON[t.status] || STATUS_ICON['Open']}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[10px] text-white/30 font-bold">#{t.id}</span>
                      <p className="text-sm font-bold text-white truncate">{t.subject}</p>
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">
                      {t.user_name || `User #${t.user_id}`}
                      {t.user_email ? ` · ${t.user_email}` : ''}
                      {' · '}
                      {timeAgo(t.created_at)}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${PRIORITY_STYLE[t.priority]}`}>
                      {t.priority}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${STATUS_STYLE[t.status]}`}>
                      {t.status}
                    </span>
                    {t.admin_reply && (
                      <span className="px-2 py-1 rounded-full text-[9px] font-black tracking-widest uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        Replied
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                      className="p-1.5 text-white/20 hover:text-red-400 transition"
                      title="Delete ticket"
                    >
                      <Trash2 size={13} />
                    </button>
                    {isOpen
                      ? <ChevronUp   size={14} className="text-white/30" />
                      : <ChevronDown size={14} className="text-white/30" />
                    }
                  </div>
                </div>

                {/* Expanded detail + admin form */}
                {isOpen && (
                  <div className="border-t border-white/8 px-6 py-6 space-y-6">

                    {/* User's message */}
                    <div>
                      <p className="text-[9px] font-black tracking-widest uppercase text-white/30 mb-2">
                        Message from {t.user_name || `User #${t.user_id}`}
                      </p>
                      <div className="bg-[#0a0a0a] border border-white/6 rounded-xl px-5 py-4">
                        <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{t.message}</p>
                      </div>
                    </div>

                    {/* Admin controls */}
                    {draft && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Status */}
                          <div>
                            <label className="block text-[9px] font-black tracking-widest uppercase text-white/30 mb-2">
                              Status
                            </label>
                            <select
                              value={draft.status}
                              onChange={(e) => setDraftField(t.id, 'status', e.target.value)}
                              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-white/30 transition"
                            >
                              {['Open', 'In Progress', 'Resolved', 'Closed'].map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          {/* Priority */}
                          <div>
                            <label className="block text-[9px] font-black tracking-widest uppercase text-white/30 mb-2">
                              Priority
                            </label>
                            <select
                              value={draft.priority}
                              onChange={(e) => setDraftField(t.id, 'priority', e.target.value)}
                              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-white/30 transition"
                            >
                              {PRIORITIES.map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Reply textarea */}
                        <div>
                          <label className="block text-[9px] font-black tracking-widest uppercase text-white/30 mb-2">
                            Your Reply (visible to user)
                          </label>
                          <textarea
                            value={draft.admin_reply}
                            onChange={(e) => setDraftField(t.id, 'admin_reply', e.target.value)}
                            placeholder="Type your reply here…"
                            rows={4}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition resize-none"
                          />
                        </div>

                        {/* Save button */}
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleSave(t)}
                            disabled={saving}
                            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-black px-8 py-3 rounded-full transition tracking-widest uppercase"
                          >
                            <Send size={13} />
                            {saving ? 'Saving…' : 'Save & Notify User'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

