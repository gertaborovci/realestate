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
import MaintenanceVisits from '../components/MaintenanceVisits';
import { API_BASE, apiFetch } from '../lib/api';
import { Home, Users, DollarSign, Clock, Calendar } from 'lucide-react';

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
