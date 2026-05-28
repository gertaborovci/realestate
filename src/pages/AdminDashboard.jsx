import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import PropertyTable from '../components/PropertyTable';
import AddProperty from './AddProperty';
import ManageAgents from './ManageAgents';
import ManageUsers from './ManageUsers';
import AgentProfile from './AgentProfile';
import TransactionDashboard from '../TransactionDashboard';
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
              <>
                <div className="flex justify-between items-center mb-12">
                  <h1 className="text-5xl font-bold">DASHBOARD</h1>
                  <button
                    type="button"
                    onClick={onBack}
                    className="text-xs font-bold tracking-widest text-gray-500 hover:text-white uppercase"
                  >
                    ← Exit Admin
                  </button>
                </div>
                <div className="flex flex-wrap gap-6">
                  <StatCard title="Total Properties" value={properties.length} icon={<Home size={20} />} />
                  <StatCard title="Pending Visits" value={pendingVisits} icon={<Calendar size={20} />} />
                  <StatCard title="Revenue" value="$120K" icon={<DollarSign size={20} />} />
                  <StatCard title="Pending" value="8" icon={<Clock size={20} />} />
                </div>
              </>
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

            {activeTab === 'transactions' && <TransactionDashboard />}

            {activeTab === 'visits' && (
              <>
                <h1 className="text-5xl font-bold mb-12">PROPERTY VISITS</h1>
                {visitsLoading ? (
                  <p className="text-gray-400">Loading visits...</p>
                ) : visits.length === 0 ? (
                  <p className="text-gray-500">No scheduled visits yet.</p>
                ) : (
                  <div className="bg-[#121212] border border-gray-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-800 text-xs font-bold text-gray-400 uppercase tracking-wider">
                          <th className="p-5">ID</th>
                          <th className="p-5">Property</th>
                          <th className="p-5">User</th>
                          <th className="p-5">Date</th>
                          <th className="p-5">Time</th>
                          <th className="p-5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-900">
                        {visits.map((visit) => (
                          <tr key={visit.id} className="hover:bg-[#1a1a1a]/30">
                            <td className="p-5 text-gray-400">#{visit.id}</td>
                            <td className="p-5 font-semibold text-white">
                              {visit.property_title || `Property #${visit.property_id}`}
                            </td>
                            <td className="p-5 text-gray-300">
                              {visit.user_name || `User #${visit.user_id}`}
                            </td>
                            <td className="p-5 text-gray-300">
                              {visit.visit_date
                                ? new Date(visit.visit_date).toLocaleDateString()
                                : '—'}
                            </td>
                            <td className="p-5 text-gray-300">{visit.visit_time || '—'}</td>
                            <td className="p-5">
                              <select
                                value={visit.status}
                                onChange={(e) =>
                                  handleVisitStatusChange(visit.id, e.target.value)
                                }
                                className="bg-[#1a1a1a] border border-gray-800 text-white px-3 py-1.5 rounded-xl text-xs"
                              >
                                <option value="PENDING">PENDING</option>
                                <option value="APPROVED">APPROVED</option>
                                <option value="CANCELLED">CANCELLED</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeTab === 'agents' && (
              <ManageAgents
                onViewProfile={(id) => {
                  setSelectedAgentId(id);
                  setActiveTab('agent-profile');
                }}
              />
            )}

            {activeTab === 'users' && <ManageUsers />}

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
