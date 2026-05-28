import React, { useState } from 'react';
import { apiFetch } from '../lib/api';
import { setCurrentUser, normalizeRole, DASHBOARD_VIEWS } from '../lib/auth';

const SignIn = ({ onNavigate }) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const handleChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const user = { ...data.user, role: normalizeRole(data.user.role) };
      setCurrentUser(user);
      if (user.role === 'admin') onNavigate(DASHBOARD_VIEWS.admin);
      else if (user.role === 'agent') onNavigate(DASHBOARD_VIEWS.agent);
      else onNavigate('user-dashboard');
    } catch (err) {
      setError(err.message);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="bg-[#121212] border border-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-black text-center text-white mb-2 tracking-wide">KOSOVANEST</h2>
        <p className="text-gray-400 text-sm text-center mb-6">Welcome back</p>
        {error && <p className="text-red-400 text-xs text-center mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Email Address</label>
            <input 
              type="email" 
              name="email" 
              value={credentials.email} 
              onChange={handleChange} 
              className="w-full bg-[#1a1a1a] border border-gray-800 text-white px-4 py-2.5 rounded-xl focus:outline-none" 
              placeholder="name@example.com" 
              required 
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Password</label>
            <input 
              type="password" 
              name="password" 
              value={credentials.password} 
              onChange={handleChange} 
              className="w-full bg-[#1a1a1a] border border-gray-800 text-white px-4 py-2.5 rounded-xl focus:outline-none" 
              placeholder="••••••••" 
              required 
            />
          </div>
          <button type="submit" className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3 px-4 rounded-xl uppercase text-xs tracking-wider mt-4">
            Sign In
          </button>
        </form>
        <p className="text-xs text-center text-gray-500 mt-6">
          Don't have an account?{' '}
          <button onClick={() => onNavigate('signup')} className="text-white hover:underline font-semibold bg-transparent border-none cursor-pointer">
            Create one now
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignIn;