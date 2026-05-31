import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import PropertyTable from '../components/PropertyTable';
import AddProperty from './AddProperty';
import ManageAgents from './ManageAgents';
import ManageUsers from './ManageUsers';
import AgentProfile from './AgentProfile';
import RentalRequests from './RentalRequests';
import AdminAnalytics from './AdminAnalytics';
import ManageNeighborhoods from './ManageNeighborhoods';
import ManageExpenses from './ManageExpenses';
import AdminPropertyReviews from './AdminPropertyReviews';
import AdminQA from './AdminQA';
import MaintenanceVisits from '../components/MaintenanceVisits';
import SupportTickets from '../components/SupportTickets';
import { API_BASE, apiFetch } from '../lib/api';
import { Home, Users, DollarSign, Clock, Calendar, Bell, Send } from 'lucide-react';

/* ─── Broadcast Panel ────────────────────────────────────────────── */
const BroadcastPanel = () => {
  const [form, setForm]       = useState({ title: '', message: '', link: '' });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      setError('Title and message are required.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const result = await apiFetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({
          title:   form.title.trim(),
          message: form.message.trim(),
          link:    form.link.trim() || null,
        }),
      });
      setSuccess(`✅ Broadcast sent to ${result.count} user${result.count !== 1 ? 's' : ''}.`);
      setForm({ title: '', message: '', link: '' });
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to send broadcast.');
    }
    setSending(false);
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <Bell size={24} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">NOTIFICATIONS</h1>
          <p className="text-white/40 text-xs font-bold tracking-widest uppercase mt-1">
            Broadcast messages to all users
          </p>
        </div>
      </div>

      {/* Compose */}
      <div className="bg-[#111] border border-white/8 rounded-2xl p-8 space-y-6">
        <h2 className="text-xs font-black tracking-widest uppercase text-white/60 flex items-center gap-2">
          <Send size={13} /> Compose Broadcast
        </h2>

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl font-semibold">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black tracking-widest uppercase text-white/40 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. New Properties Available!"
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black tracking-widest uppercase text-white/40 mb-2">
              Message *
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Write your broadcast message here…"
              rows={4}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black tracking-widest uppercase text-white/40 mb-2">
              Link <span className="text-white/20 normal-case font-normal tracking-normal">(optional — page to navigate to)</span>
            </label>
            <input
              type="text"
              value={form.link}
              onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
              placeholder="e.g. properties"
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-white/30 text-xs">
              This message will be sent to <strong className="text-white/50">all registered users</strong>.
            </p>
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-black px-8 py-3 rounded-full transition tracking-widest uppercase"
            >
              <Send size={14} />
              {sending ? 'Sending…' : 'Send Broadcast'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminDashboard = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingProperty, setEditingProperty] = useState(null);
  const [properties, setProperties] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(null);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/properties`);
      const data = await response.json();
      setProperties(Array.isArray(data) ? data : []);
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
  }, []);

  useEffect(() => {
    if (activeTab === 'visits') {
      fetchVisits();
    }
  }, [activeTab, fetchVisits]);

  const deleteProperty = async (id) => {
    if (window.confirm('⚠️ Are you sure?')) {
      const response = await fetch(`${API_BASE}/api/properties/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setProperties((prev) => prev.filter((p) => p.id !== id));
      }
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
      alert(err.message || 'Failed to update visit.');
    }
  };

  const pendingVisits = visits.filter((v) => v.status === 'PENDING').length;

  return (
    <div className="flex h-full bg-[#050505]">
      <Sidebar onTabChange={setActiveTab} activeTab={activeTab} />
      <main className="flex-1 p-12 overflow-y-auto">
        {loading && activeTab !== 'visits' ? (
          <div className="text-xl">Duke ngarkuar...</div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <AdminAnalytics onBack={onBack} />
            )}

            {activeTab === 'properties' && (
              <>
                <div className="flex justify-between mb-12">
                  <h1 className="text-5xl font-bold">PROPERTIES</h1>
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
                <div className="flex justify-between items-center mb-12">
                  <h1 className="text-5xl font-bold">CONSULTATIONS & VISITS</h1>
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
