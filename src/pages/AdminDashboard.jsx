import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import PropertyTable from '../components/PropertyTable';
import AddProperty from './AddProperty';
import ManageAgents from './ManageAgents';
import ManageUsers from './ManageUsers';
import AgentProfile from './AgentProfile';
// RentalRequests removed — agent rental requests are handled in AgentDashboard
import AdminAnalytics from './AdminAnalytics';
import ManageNeighborhoods from './ManageNeighborhoods';
import ManageExpenses from './ManageExpenses';
import AdminPropertyReviews from './AdminPropertyReviews';
import AdminQA from './AdminQA';
import MaintenanceVisits from '../components/MaintenanceVisits';
import SupportTickets from '../components/SupportTickets';
import ManageOffices from '../components/ManageOffices';
import AgentCertifications from './AgentCertifications';
import ContactInquiries from './ContactInquiries';
import { API_BASE, apiFetch } from '../lib/api';
import { Home, Users, DollarSign, Clock, Calendar, Bell, Send } from 'lucide-react';
import { showAlert, showConfirm } from '../lib/modal';

/* ── Broadcast Panel ─────────────────────────────────────────────────────── */
function BroadcastPanel() {
  // ── Compose state ──
  const [title,   setTitle]   = useState('');
  const [message, setMessage] = useState('');
  const [type,    setType]    = useState('info');
  const [target,  setTarget]  = useState('all');
  const [userId,  setUserId]  = useState('');
  const [sending, setSending] = useState(false);

  // ── Toast ──
  const [toast, setToast] = useState(null); // { text, color }
  const showToast = (text, color = 'green') => {
    setToast({ text, color });
    setTimeout(() => setToast(null), 3500);
  };

  // ── List state ──
  const [list,     setList]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [loadErr,  setLoadErr]  = useState('');
  const [filter,   setFilter]   = useState('all');   // all | unread | broadcast | info | alert | warning
  const [search,   setSearch]   = useState('');

  // ── Edit state ──
  const [editId,   setEditId]   = useState(null);
  const [editData, setEditData] = useState({});

  const loadAll = () => {
    setLoading(true);
    setLoadErr('');
    apiFetch('/api/notifications')
      .then(data => setList(Array.isArray(data) ? data : []))
      .catch(err => setLoadErr(err.message || 'Failed to load notifications.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  // ── Send ──
  const handleSend = async () => {
    if (!title.trim() || !message.trim()) { showToast('Fill in Title and Message.', 'red'); return; }
    if (target === 'user' && !userId.trim()) { showToast('Enter a User ID.', 'red'); return; }
    setSending(true);
    try {
      if (target === 'all') {
        const res = await apiFetch('/api/notifications/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim(), message: message.trim(), link: 'user-dashboard' }),
        });
        showToast(`✓ Notification sent to ${res.count ?? 'all'} users!`);
      } else {
        await apiFetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: parseInt(userId, 10), type, title: title.trim(), message: message.trim(), link: 'user-dashboard' }),
        });
        showToast('✓ Notification added!');
      }
      setTitle(''); setMessage(''); setUserId('');
      loadAll();
    } catch (err) {
      showToast(err.message || 'Failed to send.', 'red');
    } finally { setSending(false); }
  };

  // ── Mark read ──
  const handleMarkRead = async (id) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setList(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch {}
  };

  // ── Save edit ──
  const handleSaveEdit = async (id) => {
    try {
      await apiFetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      setList(prev => prev.map(n => n.id === id ? { ...n, ...editData } : n));
      setEditId(null);
      showToast('✓ Notification updated!');
    } catch (err) {
      showToast(err.message || 'Update failed.', 'red');
    }
  };

  // ── Delete ──
  const handleDelete = async (id) => {
    if (!await showConfirm('Delete this notification?')) return;
    try {
      await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' });
      setList(prev => prev.filter(n => n.id !== id));
      showToast('✓ Notification deleted.');
    } catch {}
  };

  // ── Filtered list ──
  const filtered = list.filter(n => {
    if (filter === 'unread'    && n.is_read)              return false;
    if (filter === 'broadcast' && n.type !== 'broadcast') return false;
    if (['info','alert','warning'].includes(filter) && n.type !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!n.title?.toLowerCase().includes(q) && !n.message?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const TYPE_STYLE = {
    info:         'bg-blue-500/10   text-blue-400   border-blue-500/20',
    alert:        'bg-green-500/10  text-green-400  border-green-500/20',
    warning:      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    broadcast:    'bg-orange-500/10 text-orange-400 border-orange-500/20',
    visit_update: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    system:       'bg-zinc-500/10   text-zinc-400   border-zinc-500/20',
  };

  const unreadCount = list.filter(n => !n.is_read).length;

  return (
    <div className="text-white space-y-10 relative">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-8 z-50 px-6 py-3 rounded-xl font-bold text-sm shadow-2xl transition-all ${
          toast.color === 'red' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {toast.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-5xl font-bold">NOTIFICATIONS</h1>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
            {unreadCount} unread
          </span>
        )}
      </div>

      {/* ── Compose card ── */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-8 space-y-5 max-w-2xl">
        <h2 className="text-xs font-black uppercase tracking-widest text-white/50">Send Notification</h2>

        {/* Target */}
        <div className="flex gap-3">
          {[['all','All Users'],['user','Specific User']].map(([val, lbl]) => (
            <button key={val} onClick={() => setTarget(val)}
              className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest border transition ${
                target === val ? 'bg-white text-black border-white' : 'text-white/40 border-white/15 hover:border-white/40'
              }`}>
              {lbl}
            </button>
          ))}
        </div>

        {target === 'user' && (
          <input type="number" placeholder="User ID..." value={userId}
            onChange={e => setUserId(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30" />
        )}

        {/* Type (only relevant for single-user sends) */}
        {target === 'user' && (
          <div className="flex gap-2 flex-wrap">
            {[['info','Info'],['alert','Alert'],['warning','Warning']].map(([val, lbl]) => (
              <button key={val} onClick={() => setType(val)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition ${
                  type === val ? 'bg-white text-black border-white' : 'text-white/40 border-white/10 hover:border-white/30'
                }`}>
                {lbl}
              </button>
            ))}
          </div>
        )}

        <input placeholder="Title..." value={title} onChange={e => setTitle(e.target.value)}
          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30" />

        <textarea placeholder="Message..." value={message} onChange={e => setMessage(e.target.value)}
          rows={3}
          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30 resize-none" />

        <button onClick={handleSend} disabled={sending}
          className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition disabled:opacity-40">
          <Send size={14} />
          {sending ? 'Sending…' : 'Send Notification'}
        </button>
      </div>

      {/* ── Notification list ── */}
      <div>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-white/40">
            All Notifications ({list.length})
          </h2>
          {/* Search */}
          <input placeholder="Search title or message…" value={search} onChange={e => setSearch(e.target.value)}
            className="bg-[#111] border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-white/30 w-64" />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {[
            ['all','All'],['unread','Unread'],['broadcast','Broadcast'],
            ['info','Info'],['alert','Alert'],['warning','Warning'],
          ].map(([val, lbl]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition ${
                filter === val ? 'bg-white text-black border-white' : 'text-white/40 border-white/10 hover:border-white/30'
              }`}>
              {lbl}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-white/30 text-sm animate-pulse">Loading…</p>
        ) : loadErr ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-6 py-4 text-sm font-bold">
            ⚠ Error: {loadErr}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-white/30 text-sm">No notifications found.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(n => (
              <div key={n.id} className={`bg-[#111] border rounded-2xl px-6 py-5 transition ${
                !n.is_read ? 'border-white/15' : 'border-white/5'
              }`}>

                {editId === n.id ? (
                  /* ── Edit mode ── */
                  <div className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      {[['info','Info'],['alert','Alert'],['warning','Warning']].map(([val, lbl]) => (
                        <button key={val} onClick={() => setEditData(d => ({ ...d, type: val }))}
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border transition ${
                            (editData.type ?? n.type) === val ? 'bg-white text-black border-white' : 'text-white/40 border-white/10'
                          }`}>
                          {lbl}
                        </button>
                      ))}
                    </div>
                    <input value={editData.title ?? n.title}
                      onChange={e => setEditData(d => ({ ...d, title: e.target.value }))}
                      className="w-full bg-black border border-white/15 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-white/30" />
                    <textarea value={editData.message ?? n.message}
                      onChange={e => setEditData(d => ({ ...d, message: e.target.value }))}
                      rows={3}
                      className="w-full bg-black border border-white/15 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-white/30 resize-none" />
                    <div className="flex gap-3">
                      <button onClick={() => handleSaveEdit(n.id)}
                        className="bg-white text-black px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition">
                        Save
                      </button>
                      <button onClick={() => { setEditId(null); setEditData({}); }}
                        className="text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── View mode ── */
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${TYPE_STYLE[n.type] || TYPE_STYLE.system}`}>
                          {n.type}
                        </span>
                        {!n.is_read && (
                          <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">● Unread</span>
                        )}
                        <span className="text-[10px] text-white/30">
                          {n.user_name || `User #${n.user_id}`}
                        </span>
                        <span className="text-[10px] text-white/20">
                          {new Date(n.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                          {' '}
                          {new Date(n.created_at).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}
                        </span>
                      </div>
                      <p className="text-white font-bold text-sm mb-0.5">{n.title}</p>
                      <p className="text-white/50 text-xs leading-relaxed">{n.message}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0 items-end">
                      {!n.is_read && (
                        <button onClick={() => handleMarkRead(n.id)}
                          className="text-[10px] font-black uppercase tracking-widest text-green-400 hover:text-green-300 transition">
                          Mark Read
                        </button>
                      )}
                      <button onClick={() => { setEditId(n.id); setEditData({}); }}
                        className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(n.id)}
                        className="text-[10px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-400 transition">
                        Delete
                      </button>
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const AdminDashboard = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('kn_admin_tab') || 'dashboard');

  // Persist admin panel tab across refreshes
  React.useEffect(() => { sessionStorage.setItem('kn_admin_tab', activeTab); }, [activeTab]);
  const [editingProperty, setEditingProperty] = useState(null);
  const [properties, setProperties] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(null);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const raw = await apiFetch('/api/properties?limit=100');
      // API now returns { data, total, page, pages }
      setProperties(Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []));
    } catch (error) {
      console.error('Error:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisits = useCallback(async () => {
    try {
      setVisitsLoading(true);
      const data = await apiFetch('/api/visits');
      setVisits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load visits:', error);
      setVisits([]);
    } finally {
      setVisitsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
    fetchVisits(); // also load on mount so dashboard stats show correct pending count
  }, []);

  useEffect(() => {
    if (activeTab === 'visits') {
      fetchVisits();
    }
  }, [activeTab, fetchVisits]);

  const deleteProperty = async (id) => {
    if (await showConfirm('⚠️ Are you sure?')) {
      try {
        await apiFetch(`/api/properties/${id}`, { method: 'DELETE' });
        setProperties((prev) => prev.filter((p) => p.id !== id));
      } catch (err) { /* silent */ }
    }
  };

  const saveProperty = () => {
    fetchProperties();
    setEditingProperty(null);
    setActiveTab('properties');
  };

  const handleVisitStatusChange = async (id, status) => {
    try {
      await apiFetch(`/api/visits/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
        },
        body: JSON.stringify({ status }),
      });
      fetchVisits();
    } catch (err) {
      await showAlert(err.message || 'Failed to update visit.', 'error');
    }
  };

  const pendingVisits = visits.filter((v) => v.status === 'PENDING').length;

  return (
    <div className="flex h-full bg-[#050505]">
      <Sidebar onTabChange={setActiveTab} activeTab={activeTab} />
      {/* pt-16 on mobile gives room below the hamburger button */}
      <main className="flex-1 p-4 pt-16 md:p-12 md:pt-12 overflow-y-auto">
        {loading && activeTab !== 'visits' ? (
          <div className="text-xl">Duke ngarkuar...</div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <AdminAnalytics onBack={onBack} />
            )}

            {activeTab === 'properties' && (
              <>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-8 md:mb-12">
                  <h1 className="text-2xl md:text-5xl font-bold">PROPERTIES</h1>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProperty(null);
                      setActiveTab('add');
                    }}
                    className="bg-white text-black px-8 py-4 rounded-full text-xs font-bold hover:bg-gray-200"
                  >
                    ADD NEW +
                  </button>
                </div>
                <PropertyTable
                  properties={properties}
                  onDelete={deleteProperty}
                  onEdit={(p) => {
                    setEditingProperty(p);
                    setActiveTab('add');
                  }}
                />
              </>
            )}

            {activeTab === 'add' && (
              <AddProperty
                onBack={() => setActiveTab('properties')}
                onAdd={saveProperty}
                editData={editingProperty}
              />
            )}

            {activeTab === 'visits' && (
              <>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-8 md:mb-12">
                  <h1 className="text-2xl md:text-5xl font-bold">CONSULTATIONS & VISITS</h1>
                  <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">
                    {visits.filter((v) => v.status === 'PENDING').length} pending
                  </span>
                </div>

                {visitsLoading ? (
                  <p className="text-gray-400 animate-pulse">Loading visits…</p>
                ) : visits.length === 0 ? (
                  <p className="text-gray-500">No scheduled visits or consultations yet.</p>
                ) : (
                  <div className="bg-[#121212] border border-gray-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-800 text-xs font-bold text-gray-400 uppercase tracking-wider">
                          <th className="p-5">ID</th>
                          <th className="p-5">Type</th>
                          <th className="p-5">Agent</th>
                          <th className="p-5">Client</th>
                          <th className="p-5">Date & Time</th>
                          <th className="p-5">Notes</th>
                          <th className="p-5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-900">
                        {visits.map((visit) => {
                          const isConsultation = !!visit.agent_id && !visit.property_id;
                          const statusColors = {
                            PENDING:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                            APPROVED:  'bg-green-500/10  text-green-400  border-green-500/20',
                            CANCELLED: 'bg-red-500/10    text-red-400    border-red-500/20',
                          };
                          return (
                            <tr key={visit.id} className="hover:bg-[#1a1a1a]/50 transition">
                              <td className="p-5 text-gray-500 text-xs">#{visit.id}</td>

                              {/* Type badge */}
                              <td className="p-5">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase border ${
                                  isConsultation
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                }`}>
                                  {isConsultation ? 'Consultation' : 'Property Visit'}
                                </span>
                              </td>

                              {/* Agent */}
                              <td className="p-5 font-semibold text-white">
                                {visit.agent_name
                                  ? visit.agent_name.toUpperCase()
                                  : visit.property_title
                                    ? visit.property_title
                                    : '—'}
                              </td>

                              {/* Client */}
                              <td className="p-5">
                                <div className="text-gray-200 font-medium">
                                  {visit.user_name || `User #${visit.user_id}`}
                                </div>
                                {visit.user_email && (
                                  <div className="text-gray-500 text-xs mt-0.5">{visit.user_email}</div>
                                )}
                              </td>

                              {/* Date & Time */}
                              <td className="p-5 text-gray-300">
                                <div>
                                  {visit.visit_date
                                    ? new Date(visit.visit_date).toLocaleDateString('en-GB', {
                                        day: '2-digit', month: 'short', year: 'numeric',
                                      })
                                    : '—'}
                                </div>
                                <div className="text-gray-500 text-xs mt-0.5">{visit.visit_time || ''}</div>
                              </td>

                              {/* Notes */}
                              <td className="p-5 text-gray-500 text-xs max-w-[160px]">
                                <span className="line-clamp-2">{visit.notes || '—'}</span>
                              </td>

                              {/* Status dropdown */}
                              <td className="p-5">
                                <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase border mb-2 ${statusColors[visit.status] || ''}`}>
                                  {visit.status}
                                </span>
                                <select
                                  value={visit.status}
                                  onChange={(e) => handleVisitStatusChange(visit.id, e.target.value)}
                                  className="block w-full bg-[#1a1a1a] border border-gray-800 text-white px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-gray-600"
                                >
                                  <option value="PENDING">PENDING</option>
                                  <option value="APPROVED">APPROVED</option>
                                  <option value="CANCELLED">CANCELLED</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeTab === 'maintenance' && <MaintenanceVisits />}

            {activeTab === 'agents' && (
              <ManageAgents
                onViewProfile={(id) => {
                  setSelectedAgentId(id);
                  setActiveTab('agent-profile');
                }}
              />
            )}

            {activeTab === 'users'          && <ManageUsers />}
            {activeTab === 'neighborhoods'  && <ManageNeighborhoods />}
            {activeTab === 'expenses'       && <ManageExpenses />}
            {activeTab === 'reviews'        && <AdminPropertyReviews />}
            {activeTab === 'qa'             && <AdminQA />}
            {activeTab === 'notifications'  && <BroadcastPanel />}
            {activeTab === 'support'        && <SupportTickets />}
            {activeTab === 'offices'        && <ManageOffices />}

            {activeTab === 'agent-profile' && (
              <AgentProfile
                agentId={selectedAgentId}
                onBack={() => setActiveTab('agents')}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
