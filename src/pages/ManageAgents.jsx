import React, { useState, useEffect } from 'react';
import { UserPlus, Edit2, Trash2, Eye } from 'lucide-react';

const ManageAgents = ({ onViewProfile }) => {
  const [agents, setAgents] = useState([]);
  const [users, setUsers] = useState([]); 
  
  const [formData, setFormData] = useState({
    user_id: '',
    license_number: '',
    specialization: '',
    commission_percentage: '',
    zone: '',
    status: 'Active'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [currentAgentId, setCurrentAgentId] = useState(null);

  useEffect(() => {
    // 1. Lexojmë përdoruesit realë nga sistemi yt
    const savedUsers = localStorage.getItem('realestate_users');
    
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      const myRealUsers = [
        { id: 1, username: 'Gerta Borovci', email: 'gerta@example.com' },
        { id: 2, username: 'Alba Rudari', email: 'alba@example.com' },
        { id: 3, username: 'Eljesa Bytyqi', email: 'eljesa@example.com' },
        { id: 4, username: 'Elza Shabani', email: 'elza@example.com' }
      ];
      setUsers(myRealUsers);
      localStorage.setItem('realestate_users', JSON.stringify(myRealUsers));
    }

    // 2. Lexojmë agjentët
    const savedAgents = localStorage.getItem('my_agents_list');
    if (savedAgents) {
      setAgents(JSON.parse(savedAgents));
    } else {
      const defaultAgents = [
        { id: 1, user_id: 3, username: 'Eljesa Bytyqi', license_number: 'LIC-2026-001', specialization: 'Sale', commission_percentage: '3.5', zone: 'Prishtinë', status: 'Active' }
      ];
      setAgents(defaultAgents);
      localStorage.setItem('my_agents_list', JSON.stringify(defaultAgents));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let updatedAgents;

    // Gjejmë përdoruesin e saktë të përzgjedhur nga lista bazuar në user_id e formës
    const selectedUser = users.find(u => String(u.id) === String(formData.user_id));
    const targetUsername = selectedUser ? selectedUser.username : 'Unknown User';

    if (isEditing) {
      // PËRMIRËSIMI: Përditësojmë të dhënat duke u siguruar që ruhet ose ndryshohet edhe username-i saktë
      updatedAgents = agents.map(agent => 
        agent.id === currentAgentId 
          ? { ...agent, ...formData, username: targetUsername } 
          : agent
      );
      setIsEditing(false);
      setCurrentAgentId(null);
    } else {
      const newAgent = {
        id: Date.now(),
        ...formData,
        username: targetUsername
      };
      updatedAgents = [...agents, newAgent];
    }
    
    setAgents(updatedAgents);
    localStorage.setItem('my_agents_list', JSON.stringify(updatedAgents));

    // Resetojmë formën në gjendjen fillestare
    setFormData({ user_id: '', license_number: '', specialization: '', commission_percentage: '', zone: '', status: 'Active' });
  };

  const handleEdit = (agent) => {
    setIsEditing(true);
    setCurrentAgentId(agent.id);
    setFormData({
      user_id: agent.user_id,
      license_number: agent.license_number,
      specialization: agent.specialization,
      commission_percentage: agent.commission_percentage,
      zone: agent.zone,
      status: agent.status
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('⚠️ Are you sure you want to delete this agent?')) {
      const updatedAgents = agents.filter(agent => agent.id !== id);
      setAgents(updatedAgents);
      localStorage.setItem('my_agents_list', JSON.stringify(updatedAgents));
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
        <h1 className="text-5xl font-bold tracking-tight">AGENTS</h1>
      </div>

      {/* FORMA E SHTIMIT */}
      <div className="bg-[#121212] border border-gray-800 p-8 rounded-2xl shadow-2xl">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 tracking-wide uppercase">
          <UserPlus size={18} /> {isEditing ? 'Modify Agent' : 'Add New Agent'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Select User</label>
            <select 
              name="user_id" value={formData.user_id} onChange={handleChange} required disabled={isEditing}
              className="w-full bg-[#1a1a1a] border border-gray-800 text-white px-4 py-3 rounded-xl focus:outline-none cursor-pointer text-sm"
            >
              <option value="">Select Account</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.username}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">License Number</label>
            <input 
              type="text" name="license_number" value={formData.license_number} onChange={handleChange} required
              className="w-full bg-[#1a1a1a] border border-gray-800 text-white px-4 py-3 rounded-xl focus:outline-none text-sm"
              placeholder="LIC-2026-000"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Specialization</label>
            <input 
              type="text" name="specialization" value={formData.specialization} onChange={handleChange} required
              className="w-full bg-[#1a1a1a] border border-gray-800 text-white px-4 py-3 rounded-xl focus:outline-none text-sm"
              placeholder="Sale / Rent"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Commission (%)</label>
            <input 
              type="number" step="0.1" name="commission_percentage" value={formData.commission_percentage} onChange={handleChange} required
              className="w-full bg-[#1a1a1a] border border-gray-800 text-white px-4 py-3 rounded-xl focus:outline-none text-sm"
              placeholder="3.5"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Coverage Area</label>
            <input 
              type="text" name="zone" value={formData.zone} onChange={handleChange} required
              className="w-full bg-[#1a1a1a] border border-gray-800 text-white px-4 py-3 rounded-xl focus:outline-none text-sm"
              placeholder="Center of Prishtinë"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Status</label>
            <select 
              name="status" value={formData.status} onChange={handleChange}
              className="w-full bg-[#1a1a1a] border border-gray-800 text-white px-4 py-3 rounded-xl focus:outline-none cursor-pointer text-sm"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="md:col-span-3 flex justify-end gap-3 pt-2">
            {isEditing && (
              <button 
                type="button" 
                onClick={() => { setIsEditing(false); setFormData({ user_id: '', license_number: '', specialization: '', commission_percentage: '', zone: '', status: 'Active' }); }}
                className="px-6 py-3 border border-gray-800 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#1a1a1a] transition"
              >
                Anulo
              </button>
            )}
            <button 
              type="submit" 
              className="bg-white hover:bg-gray-200 text-black font-bold py-3 px-8 rounded-xl uppercase text-xs tracking-wider transition"
            >
              {isEditing ? 'Update' : 'Save Agent'}
            </button>
          </div>
        </form>
      </div>

      {/* TABELA */}
      <div className="bg-[#121212] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-[#1a1a1a]/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="p-5">User</th>
                <th className="p-5">License Number</th>
                <th className="p-5">Specialization</th>
                <th className="p-5">Commission</th>
                <th className="p-5">Coverage Area</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-900">
              {agents.map(agent => (
                <tr key={agent.id} className="hover:bg-[#1a1a1a]/30 transition">
                  <td className="p-5 font-semibold text-white">{agent.username}</td>
                  <td className="p-5 text-gray-300">{agent.license_number}</td>
                  <td className="p-5 text-gray-300">{agent.specialization}</td>
                  <td className="p-5 text-gray-300">{agent.commission_percentage}%</td>
                  <td className="p-5 text-gray-300">{agent.zone}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${agent.status === 'Active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {agent.status}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex justify-center items-center gap-4">
                      <button
                        onClick={() => onViewProfile && onViewProfile(agent.id)}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white border border-gray-800 hover:border-gray-600 px-3 py-1.5 rounded-xl bg-[#1a1a1a] transition"
                      >
                        <Eye size={14} /> Profile
                      </button>
                      <button onClick={() => handleEdit(agent)} className="text-gray-400 hover:text-white transition">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(agent.id)} className="text-gray-500 hover:text-red-400 transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageAgents;