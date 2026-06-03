import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { setCurrentUser, setAuthToken, setRefreshToken, normalizeRole, DASHBOARD_VIEWS } from '../lib/auth';

const SignUp = ({ onNavigate, onSignIn }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    try {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });
      // Auto-login after registration — store both tokens
      if (data.token)        setAuthToken(data.token);
      if (data.refreshToken) setRefreshToken(data.refreshToken);
      if (data.user) {
        const user = { ...data.user, role: normalizeRole(data.user.role) };
        setCurrentUser(user);
        if (onSignIn) onSignIn(user);
        // Navigate to appropriate dashboard
        if (user.role === 'admin') onNavigate(DASHBOARD_VIEWS.admin);
        else if (user.role === 'agent') onNavigate(DASHBOARD_VIEWS.agent);
        else onNavigate('user-dashboard');
      } else {
        onNavigate('signin');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="bg-[#121212] border border-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-black text-center text-white mb-2 tracking-wide">KOSOVANEST</h2>
        <p className="text-gray-400 text-sm text-center mb-6">Create a new account</p>

        {error && <p className="text-red-400 text-xs text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-[#1a1a1a] border border-gray-800 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-gray-600"
              placeholder="John Doe"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-[#1a1a1a] border border-gray-800 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-gray-600"
              placeholder="name@example.com"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-1">I am a:</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full bg-[#1a1a1a] border border-gray-800 text-white px-4 py-2.5 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="buyer">Client / Buyer</option>
              <option value="agent">Real Estate Agent</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
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

          {/* Confirm Password */}
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full bg-[#1a1a1a] border border-gray-800 text-white px-4 py-2.5 pr-11 rounded-xl focus:outline-none focus:border-gray-600"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3 px-4 rounded-xl uppercase text-xs tracking-wider mt-2 transition"
          >
            Register
          </button>
        </form>

        <p className="text-xs text-center text-gray-500 mt-6">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('signin')}
            className="text-white hover:underline font-semibold bg-transparent border-none cursor-pointer"
          >
            Sign In here
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
