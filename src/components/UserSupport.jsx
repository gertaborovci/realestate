import React, { useState, useEffect } from 'react';
import { LifeBuoy, Send, ChevronDown, ChevronUp, Trash2, Clock, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { getCurrentUser } from '../lib/auth';

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const STATUS_STYLE = {
  'Open':        'bg-yellow-500/10 text-yellow-400  border-yellow-500/20',
  'In Progress': 'bg-blue-500/10   text-blue-400    border-blue-500/20',
  'Resolved':    'bg-green-500/10  text-green-400   border-green-500/20',
  'Closed':      'bg-zinc-800      text-zinc-500    border-zinc-700',
};

const PRIORITY_STYLE = {
  'Low':    'bg-zinc-800    text-zinc-400  border-zinc-700',
  'Medium': 'bg-blue-500/10 text-blue-400  border-blue-500/20',
  'High':   'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Urgent': 'bg-red-500/10  text-red-400   border-red-500/20',
};

const STATUS_ICON = {
  'Open':        <Circle size={13} className="text-yellow-400" />,
  'In Progress': <Loader2 size={13} className="text-blue-400 animate-spin" />,
  'Resolved':    <CheckCircle2 size={13} className="text-green-400" />,
  'Closed':      <CheckCircle2 size={13} className="text-zinc-500" />,
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

export default function UserSupport() {
  const user = getCurrentUser();

  const [tickets, setTickets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]     = useState('');
  const [error, setError]         = useState('');

  const [form, setForm] = useState({ subject: '', message: '', priority: 'Medium' });

  const fetchTickets = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/api/tickets/user/${user.id}`);
      setTickets(Array.isArray(data) ? data : []);
    } catch { setTickets([]); }
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      setError('Subject and message are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const created = await apiFetch('/api/tickets', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, ...form }),
      });
      setTickets((prev) => [created, ...prev]);
      setForm({ subject: '', message: '', priority: 'Medium' });
      setSuccess('Your ticket has been submitted! We\'ll get back to you shortly.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to submit ticket.');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ticket?')) return;
    try {
      await apiFetch(`/api/tickets/${id}`, { method: 'DELETE' });
      setTickets((prev) => prev.filter((t) => t.id !== id));
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="space-y-10 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-2xl">
          <LifeBuoy size={22} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Support</h2>
          <p className="text-white/40 text-xs font-bold tracking-widest uppercase mt-0.5">
            Submit a ticket — we'll reply as soon as possible
          </p>
        </div>
      </div>

      {/* Submit Form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 space-y-5">
        <h3 className="text-xs font-black tracking-widest uppercase text-white/50 flex items-center gap-2">
          <Send size={12} /> New Ticket
        </h3>

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-[10px] font-black tracking-widest uppercase text-white/40 mb-2">
              Subject *
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="What's the issue about?"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[10px] font-black tracking-widest uppercase text-white/40 mb-2">
              Priority
            </label>
            <div className="flex gap-2 flex-wrap">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, priority: p }))}
                  className={`px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase border transition ${
                    form.priority === p
                      ? PRIORITY_STYLE[p]
                      : 'bg-transparent text-zinc-600 border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-[10px] font-black tracking-widest uppercase text-white/40 mb-2">
              Message *
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Describe your issue in detail…"
              rows={5}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition resize-none"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black text-xs font-black px-8 py-3 rounded-full transition tracking-widest uppercase"
            >
              <Send size={13} />
              {submitting ? 'Submitting…' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>

      {/* Ticket List */}
      <div className="space-y-4">
        <h3 className="text-xs font-black tracking-widest uppercase text-white/40 flex items-center gap-2">
          <Clock size={12} /> My Tickets ({tickets.length})
        </h3>

        {loading ? (
          <p className="text-zinc-600 text-sm animate-pulse">Loading tickets…</p>
        ) : tickets.length === 0 ? (
          <div className="text-center py-14 text-zinc-700">
            <LifeBuoy size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold">No tickets yet</p>
            <p className="text-xs mt-1">Submit a ticket above if you need help.</p>
          </div>
        ) : (
          tickets.map((t) => (
            <div
              key={t.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden transition hover:border-zinc-700"
            >
              {/* Ticket header — always visible */}
              <div
                className="flex items-center gap-4 px-6 py-4 cursor-pointer select-none"
                onClick={() => setExpanded(expanded === t.id ? null : t.id)}
              >
                <div className="shrink-0">{STATUS_ICON[t.status] || STATUS_ICON['Open']}</div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{t.subject}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{timeAgo(t.created_at)}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Priority badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${PRIORITY_STYLE[t.priority]}`}>
                    {t.priority}
                  </span>
                  {/* Status badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${STATUS_STYLE[t.status]}`}>
                    {t.status}
                  </span>
                  {/* Delete (only unresolved) */}
                  {t.status !== 'Resolved' && t.status !== 'Closed' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                      className="p-1.5 text-zinc-700 hover:text-red-400 transition"
                      title="Delete ticket"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  {expanded === t.id ? <ChevronUp size={14} className="text-zinc-600" /> : <ChevronDown size={14} className="text-zinc-600" />}
                </div>
              </div>

              {/* Expanded content */}
              {expanded === t.id && (
                <div className="px-6 pb-6 space-y-4 border-t border-zinc-800 pt-5">
                  {/* User message */}
                  <div>
                    <p className="text-[9px] font-black tracking-widest uppercase text-zinc-600 mb-2">Your Message</p>
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{t.message}</p>
                  </div>

                  {/* Admin reply */}
                  {t.admin_reply ? (
                    <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl px-5 py-4">
                      <p className="text-[9px] font-black tracking-widest uppercase text-violet-400/70 mb-2">
                        Admin Reply
                      </p>
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{t.admin_reply}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-zinc-700">
                      <Clock size={12} />
                      <p className="text-xs">Waiting for admin response…</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
