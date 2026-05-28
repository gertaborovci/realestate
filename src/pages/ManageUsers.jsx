import React, { useState, useEffect } from 'react';
import { Users, Trash2, UserCheck } from 'lucide-react';
import { API_BASE, apiFetch } from '../lib/api';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');

  const loadUsers = async () => {
    try {
      const data = await apiFetch('/api/users');
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChangeSubmit = async (id) => {
    try {
      await apiFetch(`/api/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      });
      await loadUsers();
      setEditingUserId(null);
      setSelectedRole('');
    } catch (error) {
      alert(error.message || 'Failed to update role.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('⚠️ Are you sure you want to delete this user from the system?')) return;
    try {
      await fetch(`${API_BASE}/api/users/${id}`, { method: 'DELETE' });
      await loadUsers();
    } catch (error) {
      alert(error.message || 'Failed to delete user.');
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
        <h1 className="text-5xl font-bold tracking-tight">USERS</h1>
      </div>

      <div className="bg-[#121212] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 bg-[#1a1a1a]/50 border-b border-gray-800 flex items-center gap-2">
          <Users size={18} className="text-gray-400" />
          <h3 className="text-sm font-bold tracking-widest uppercase text-gray-300">Account Management</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-[#1a1a1a]/30 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="p-5">Full Name</th>
                <th className="p-5">Email Address</th>
                <th className="p-5">Current Role</th>
                <th className="p-5 text-center">Change Role</th>
                <th className="p-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-900">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 font-medium">No registered users found.</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-[#1a1a1a]/30 transition">
                    <td className="p-5 font-semibold text-white">{user.username}</td>
                    <td className="p-5 text-gray-400">{user.email}</td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${
                        user.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        user.role === 'agent' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        user.role === 'client' ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20' :
                        'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    
                    <td className="p-5 text-center">
                      {editingUserId === user.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="bg-[#1a1a1a] border border-gray-800 text-white px-3 py-1.5 rounded-xl text-xs focus:outline-none cursor-pointer"
                          >
                            <option value="user">Client / Buyer</option>
                            <option value="agent">Real Estate Agent</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => handleRoleChangeSubmit(user.id)}
                            className="text-green-400 hover:text-green-300 transition"
                            title="Save"
                          >
                            <UserCheck size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingUserId(user.id); setSelectedRole(user.role); }}
                          className="text-xs font-bold text-gray-400 hover:text-white border border-gray-800 hover:border-gray-600 px-3 py-1.5 rounded-xl bg-[#1a1a1a] transition"
                        >
                          Change Role
                        </button>
                      )}
                    </td>

                    <td className="p-5">
                      <div className="flex justify-center items-center">
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-gray-500 hover:text-red-400 transition"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;