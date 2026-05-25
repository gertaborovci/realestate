import React, { useState } from 'react';

const SignUp = ({ onNavigate }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'buyer' });
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="bg-[#121212] border border-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-black text-center text-white mb-2 tracking-wide">KOSOVANEST</h2>
        <p className="text-gray-400 text-sm text-center mb-6">Create a new account</p>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-[#1a1a1a] border border-gray-800 text-white px-4 py-2.5 rounded-xl focus:outline-none" placeholder="John Doe" required />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-[#1a1a1a] border border-gray-800 text-white px-4 py-2.5 rounded-xl focus:outline-none" placeholder="name@example.com" required />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-1">I am a:</label>
            <select name="role" value={formData.role} onChange={handleChange} className="w-full bg-[#1a1a1a] border border-gray-800 text-white px-4 py-2.5 rounded-xl focus:outline-none cursor-pointer">
              <option value="buyer">Client / Buyer</option>
              <option value="agent">Real Estate Agent</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full bg-[#1a1a1a] border border-gray-800 text-white px-4 py-2.5 rounded-xl focus:outline-none" placeholder="••••••••" required />
          </div>
          <button type="submit" className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3 px-4 rounded-xl uppercase text-xs tracking-wider mt-2">Register</button>
        </form>
        <p className="text-xs text-center text-gray-500 mt-6">
          Already have an account?{' '}
          <button onClick={() => onNavigate('signin')} className="text-white hover:underline font-semibold bg-transparent border-none cursor-pointer">Sign In here</button>
        </p>
      </div>
    </div>
  );
};

export default SignUp;