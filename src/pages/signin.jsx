import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { setCurrentUser, setAuthToken, setRefreshToken, normalizeRole } from '../lib/auth';

const SignIn = ({ onNavigate, onSignIn }) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
      // Store access + refresh tokens
      if (data.token)        setAuthToken(data.token);
      if (data.refreshToken) setRefreshToken(data.refreshToken);
      const user = { ...data.user, role: normalizeRole(data.user.role) };
      setCurrentUser(user);
      if (onSignIn) onSignIn(user);
      setSuccess(`Welcome back, ${user.username || 'there'}! Redirecting…`);
      setTimeout(() => onNavigate('hero'), 1200);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="bg-[#121212] border border-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-black text-center text-white mb-2 tracking-wide">KOSOVANEST</h2>
        <p className="text-gray-400 text-sm text-center mb-6">Welcome back</p>

        {success && (
          <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold px-4 py-3 rounded-xl mb-4">
            <span className="text-base">✓</span> {success}
          </div>
        )}
        {error && <p className="text-red-400 text-xs text-center mb-2">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              className="w-full bg-[#1a1a1a] border border-gray-800 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-gray-600"
              placeholder="name@example.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={credentials.password}
                onChange={handleChange}
                className="w-full bg-[#1a1a1a] border border-gray-800 text-white px-4 py-2.5 pr-11 rounded-xl focus:outline-none focus:border-gray-600"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3 px-4 rounded-xl uppercase text-xs tracking-wider mt-4 transition"
          >
            Sign In
          </button>
        </form>

        <p className="text-xs text-center text-gray-500 mt-6">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('signup')}
            className="text-white hover:underline font-semibold bg-transparent border-none cursor-pointer"
          >
            Create one now
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
