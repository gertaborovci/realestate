import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { apiFetch } from '../lib/api';

const POLL_INTERVAL = 30_000; // 30 seconds

const typeStyles = {
  visit_update: 'bg-purple-500/15 border-purple-500/25',
  cert_update:  'bg-blue-500/15   border-blue-500/25',
  broadcast:    'bg-amber-500/15  border-amber-500/25',
  system:       'bg-zinc-800      border-zinc-700',
};

const typeDot = {
  visit_update: 'bg-purple-400',
  cert_update:  'bg-blue-400',
  broadcast:    'bg-amber-400',
  system:       'bg-zinc-400',
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

const NotificationBell = ({ userId, onNavigate }) => {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]               = useState(0);
  const [open, setOpen]                   = useState(false);
  const [loading, setLoading]             = useState(false);
  const dropdownRef                        = useRef(null);

  /* ── fetch list ── */
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await apiFetch(`/api/notifications/user/${userId}`);
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnread(data.filter((n) => !n.is_read).length);
      }
    } catch { /* silent */ }
  }, [userId]);

  /* ── poll every 30 s ── */
  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  /* ── fetch full list when dropdown opens ── */
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  /* ── close on outside click ── */
  useEffect(() => {
    function handle(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  /* ── mark one as read ── */
  const markRead = async (id) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnread((u) => Math.max(0, u - 1));
    } catch { /* silent */ }
  };

  /* ── mark all as read ── */
  const markAllRead = async () => {
    setLoading(true);
    try {
      await apiFetch(`/api/notifications/user/${userId}/read-all`, { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnread(0);
    } catch { /* silent */ }
    setLoading(false);
  };

  /* ── delete one ── */
  const deleteOne = async (id, e) => {
    e.stopPropagation();
    try {
      await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnread((u) => Math.max(0, u - 1));
    } catch { /* silent */ }
  };

  /* ── clear all ── */
  const clearAll = async () => {
    setLoading(true);
    try {
      await apiFetch(`/api/notifications/user/${userId}/clear-all`, { method: 'DELETE' });
      setNotifications([]);
      setUnread(0);
    } catch { /* silent */ }
    setLoading(false);
  };

  /* ── click notification ── */
  const handleClick = (n) => {
    if (!n.is_read) markRead(n.id);
    if (n.link && onNavigate) {
      setOpen(false);
      onNavigate(n.link);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 hover:bg-white/10 rounded-full transition"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-white" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-3 w-[360px] max-h-[520px] flex flex-col bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl z-[200] overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-white/60" />
              <span className="text-white font-black text-[11px] tracking-widest uppercase">
                Notifications
              </span>
              {unread > 0 && (
                <span className="bg-red-500/20 text-red-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-red-500/20">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  title="Mark all as read"
                  className="p-1.5 hover:bg-white/5 rounded-lg transition text-white/40 hover:text-white/80"
                >
                  <CheckCheck size={14} />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  disabled={loading}
                  title="Clear all"
                  className="p-1.5 hover:bg-red-500/10 rounded-lg transition text-white/40 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-white/5 rounded-lg transition text-white/40 hover:text-white/80"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Bell size={32} className="text-white/10" />
                <p className="text-white/30 text-xs font-bold tracking-widest uppercase">
                  No notifications
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`relative flex gap-3 px-5 py-4 cursor-pointer transition-all hover:bg-white/4 ${
                      !n.is_read ? 'bg-white/[0.03]' : ''
                    }`}
                  >
                    {/* Type dot */}
                    <div className="mt-1 shrink-0">
                      <span className={`block w-2 h-2 rounded-full ${typeDot[n.type] || typeDot.system}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-bold leading-snug ${!n.is_read ? 'text-white' : 'text-white/60'}`}>
                          {n.title}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {n.link && (
                            <ExternalLink size={10} className="text-white/20" />
                          )}
                          {!n.is_read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                              title="Mark as read"
                              className="p-0.5 hover:text-green-400 text-white/20 transition"
                            >
                              <Check size={12} />
                            </button>
                          )}
                          <button
                            onClick={(e) => deleteOne(n.id, e)}
                            title="Delete"
                            className="p-0.5 hover:text-red-400 text-white/20 transition"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-white/45 mt-0.5 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[9px] text-white/25 mt-1.5 font-bold tracking-wide uppercase">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>

                    {/* Unread bar */}
                    {!n.is_read && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4/5 bg-white/20 rounded-r" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
