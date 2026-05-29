import React, { useState, useEffect } from 'react';
import {
  Users, Trash2, Pencil, X, Check,
  ChevronDown, ChevronUp, Heart, Star, MapPin, Trash, User,
} from 'lucide-react';
import { apiFetch, API_BASE } from '../lib/api';

/* ── Shared input style ─────────────────────────────────────────────────────── */
const inputCls =
  'w-full bg-[#1a1a1a] border border-gray-800 focus:border-gray-500 ' +
  'text-white rounded-xl px-4 py-3 outline-none transition text-sm';

/* ── Tiny star display ──────────────────────────────────────────────────────── */
function StarRow({ rating, size = 13 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = rating >= s;
        const half   = !filled && rating >= s - 0.5;
        return (
          <div key={s} className="relative inline-flex" style={{ width: size, height: size }}>
            <Star size={size} className="absolute text-white/15" />
            {(filled || half) && (
              <div className="absolute overflow-hidden" style={{ width: half ? '50%' : '100%' }}>
                <Star size={size} className="text-yellow-400 fill-yellow-400" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Section label wrapper ──────────────────────────────────────────────────── */
function Section({ label, note, required, children }) {
  return (
    <div>
      <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
        {note && <span className="text-white/20 normal-case font-normal tracking-normal ml-1">{note}</span>}
      </p>
      {children}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────────── */
const ManageUsers = () => {
  const [users,       setUsers]       = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [form,        setForm]        = useState({});
  const [saving,      setSaving]      = useState(false);

  /* collapsible panels */
  const [showFavs,    setShowFavs]    = useState(false);
  const [showRatings, setShowRatings] = useState(false);
  const [favs,        setFavs]        = useState([]);
  const [ratings,     setRatings]     = useState([]);
  const [favsLoading, setFavsLoading] = useState(false);
  const [ratsLoading, setRatsLoading] = useState(false);

  /* ── load users ── */
  const loadUsers = async () => {
    try { setUsers(await apiFetch('/api/users')); }
    catch (e) { console.error(e); }
  };
  useEffect(() => { loadUsers(); }, []);

  /* ── open edit panel ── */
  const openEdit = (u) => {
    setEditingUser(u);
    setForm({
      name:           u.username       || '',
      phone:          u.phone          || '',
      role:           u.role           || 'user',
      bio:            u.bio            || '',
      license_id:     u.license_id     || '',
      specialization: u.specialization || '',
    });
    setShowFavs(false);
    setShowRatings(false);
    setFavs([]);
    setRatings([]);
  };

  /* ── save edits ── */
  const handleSave = async () => {
    if (!form.name.trim()) { alert('Name cannot be empty.'); return; }
    setSaving(true);
    try {
      await apiFetch(`/api/users/${editingUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:           form.name.trim(),
          phone:          form.phone.trim(),
          bio:            form.bio.trim(),
          license_id:     form.license_id.trim(),
          specialization: form.specialization.trim(),
        }),
      });
      if (form.role !== editingUser.role) {
        await apiFetch(`/api/users/${editingUser.id}/role`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: form.role }),
        });
      }
      await loadUsers();
      setEditingUser(null);
    } catch (e) {
      alert(e.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  /* ── delete user ── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
      await loadUsers();
      if (editingUser?.id === id) setEditingUser(null);
    } catch (e) {
      alert(e.message || 'Delete failed.');
    }
  };

  /* ── toggle favorites panel ── */
  const toggleFavs = async () => {
    if (showFavs) { setShowFavs(false); return; }
    setFavsLoading(true);
    try {
      setFavs(await apiFetch(`/api/favorites/${editingUser.id}`));
      setShowFavs(true);
    } catch (e) { alert(e.message); }
    finally { setFavsLoading(false); }
  };

  /* ── toggle ratings panel ── */
  const toggleRatings = async () => {
    if (showRatings) { setShowRatings(false); return; }
    setRatsLoading(true);
    try {
      setRatings(await apiFetch(`/api/ratings/user/${editingUser.id}`));
      setShowRatings(true);
    } catch (e) { alert(e.message); }
    finally { setRatsLoading(false); }
  };

  /* ── admin delete agent photo ── */
  const handleDeletePhoto = async () => {
    if (!window.confirm("Remove this agent's profile photo?")) return;
    try {
      await apiFetch(`/api/users/${editingUser.id}/photo`, { method: 'DELETE' });
      const updated = { ...editingUser, photo_url: null };
      setEditingUser(updated);
      setUsers((prev) => prev.map((u) => u.id === editingUser.id ? { ...u, photo_url: null } : u));
    } catch (e) { alert(e.message); }
  };

  /* ── admin delete rating ── */
  const deleteRating = async (ratingId) => {
    if (!window.confirm('Delete this rating?')) return;
    try {
      await apiFetch(`/api/ratings/admin/${ratingId}`, { method: 'DELETE' });
      setRatings((prev) => prev.filter((r) => r.id !== ratingId));
    } catch (e) { alert(e.message); }
  };

  const roleBadge = (role) => {
    if (role === 'admin') return 'bg-red-500/10 text-red-400 border border-red-500/20';
    if (role === 'agent') return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
  };

  const isAgent = editingUser?.role === 'agent' || form.role === 'agent';

  /* ── render ── */
  return (
    <div className="space-y-10">
      <h1 className="text-5xl font-bold tracking-tight">USERS</h1>

      {/* Table */}
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
                <th className="p-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-900">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">No registered users found.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className={`hover:bg-[#1a1a1a]/30 transition ${editingUser?.id === u.id ? 'bg-white/5' : ''}`}
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        {/* Show photo only for agents */}
                        {u.role === 'agent' ? (
                          u.photo_url ? (
                            <img
                              src={u.photo_url.startsWith('http') ? u.photo_url : `${API_BASE}${u.photo_url}`}
                              alt={u.username}
                              className="w-9 h-9 rounded-full object-cover border border-white/10 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                              <User size={16} className="text-white/30" />
                            </div>
                          )
                        ) : null}
                        <span className="font-semibold text-white">{u.username}</span>
                      </div>
                    </td>
                    <td className="p-5 text-gray-400">{u.email}</td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${roleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex justify-center items-center gap-3">
                        <button
                          onClick={() => openEdit(u)}
                          className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white border border-gray-800 hover:border-gray-500 px-3 py-1.5 rounded-xl bg-[#1a1a1a] hover:bg-[#252525] transition"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="text-gray-500 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-red-500/10"
                          title="Delete user"
                        >
                          <Trash2 size={15} />
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

      {/* Edit slide-in panel */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg h-full bg-[#0d0d0d] border-l border-white/10 overflow-y-auto shadow-2xl flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 sticky top-0 bg-[#0d0d0d] z-10">
              <div className="flex items-center gap-4">
                {editingUser.role === 'agent' && (
                  <div className="relative group">
                    {editingUser.photo_url ? (
                      <img
                        src={editingUser.photo_url.startsWith('http') ? editingUser.photo_url : `${API_BASE}${editingUser.photo_url}`}
                        alt={editingUser.username}
                        className="w-12 h-12 rounded-full object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <User size={20} className="text-white/30" />
                      </div>
                    )}
                    {editingUser.photo_url && (
                      <button
                        onClick={handleDeletePhoto}
                        title="Remove photo"
                        className="absolute -bottom-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center transition"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30">Editing</p>
                  <h2 className="text-xl font-black text-white tracking-tight mt-0.5">{editingUser.username}</h2>
                </div>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-white/30 hover:text-white transition p-1">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 px-8 py-8 space-y-6">

              <Section label="Full Name" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                  placeholder="Full name"
                />
              </Section>

              <Section label="Email Address" note="(read-only)">
                <div className={`${inputCls} text-white/30 cursor-not-allowed`}>{editingUser.email}</div>
              </Section>

              <Section label="Phone Number" note="(optional)">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputCls}
                  placeholder="+383 44 000 000"
                />
              </Section>

              <Section label="Role">
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className={`${inputCls} cursor-pointer`}
                >
                  <option value="user">Client / Buyer</option>
                  <option value="agent">Real Estate Agent</option>
                  <option value="admin">Administrator</option>
                </select>
              </Section>

              {/* Agent-only fields */}
              {isAgent && (
                <div className="border-t border-white/5 pt-6 space-y-5">
                  <p className="text-[10px] font-black tracking-[0.3em] uppercase text-blue-400/60">
                    Agent Profile Fields
                  </p>
                  <Section label="License ID" note="(optional)">
                    <input
                      type="text"
                      value={form.license_id}
                      onChange={(e) => setForm({ ...form, license_id: e.target.value })}
                      className={inputCls}
                      placeholder="e.g. KS-AGT-001"
                    />
                  </Section>
                  <Section label="Specialization" note="(optional)">
                    <input
                      type="text"
                      value={form.specialization}
                      onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                      className={inputCls}
                      placeholder="e.g. Residential, Commercial..."
                    />
                  </Section>
                  <Section label="Bio" note="(optional)">
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      rows={3}
                      className={`${inputCls} resize-none`}
                      placeholder="Short bio..."
                    />
                  </Section>
                </div>
              )}

              {/* Save / Cancel */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-white hover:bg-zinc-200 text-black py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {saving ? 'Saving…' : <><Check size={13} /> Save Changes</>}
                </button>
              </div>

              {/* Collapsible data panels */}
              <div className="border-t border-white/5 pt-6 space-y-3">
                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/20 mb-4">User Data</p>

                {/* Favorites */}
                <button
                  onClick={toggleFavs}
                  className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 px-5 py-3.5 rounded-xl transition"
                >
                  <div className="flex items-center gap-3">
                    <Heart size={14} className="text-red-400" />
                    <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Saved Properties</span>
                    {favs.length > 0 && (
                      <span className="bg-white/10 text-white/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {favs.length}
                      </span>
                    )}
                  </div>
                  {favsLoading
                    ? <span className="text-white/30 text-xs">Loading…</span>
                    : showFavs
                      ? <ChevronUp size={14} className="text-white/30" />
                      : <ChevronDown size={14} className="text-white/30" />
                  }
                </button>

                {showFavs && (
                  <div className="ml-2 space-y-2 pb-1">
                    {favs.length === 0 ? (
                      <p className="text-white/30 text-xs px-5 py-3">No saved properties.</p>
                    ) : (
                      favs.map((p) => (
                        <div key={p.id} className="flex items-center gap-4 bg-black/40 border border-white/5 px-5 py-3 rounded-xl">
                          {p.mainImage && (
                            <img src={p.mainImage} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 opacity-70" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-bold truncate">{p.title}</p>
                            <p className="text-white/40 text-[10px] flex items-center gap-1 mt-0.5">
                              <MapPin size={9} /> {p.location}
                            </p>
                          </div>
                          <p className="text-white text-xs font-black flex-shrink-0">
                            €{Number(p.price).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Ratings */}
                <button
                  onClick={toggleRatings}
                  className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 px-5 py-3.5 rounded-xl transition"
                >
                  <div className="flex items-center gap-3">
                    <Star size={14} className="text-yellow-400" />
                    <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Agent Ratings</span>
                    {ratings.length > 0 && (
                      <span className="bg-white/10 text-white/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {ratings.length}
                      </span>
                    )}
                  </div>
                  {ratsLoading
                    ? <span className="text-white/30 text-xs">Loading…</span>
                    : showRatings
                      ? <ChevronUp size={14} className="text-white/30" />
                      : <ChevronDown size={14} className="text-white/30" />
                  }
                </button>

                {showRatings && (
                  <div className="ml-2 space-y-2 pb-1">
                    {ratings.length === 0 ? (
                      <p className="text-white/30 text-xs px-5 py-3">No ratings submitted.</p>
                    ) : (
                      ratings.map((r) => (
                        <div key={r.id} className="flex items-start gap-3 bg-black/40 border border-white/5 px-5 py-3 rounded-xl">
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-white text-xs font-bold">{r.agent_name}</p>
                            <StarRow rating={Number(r.rating)} size={12} />
                            {r.comment && (
                              <p className="text-white/40 text-[10px] italic truncate">"{r.comment}"</p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteRating(r.id)}
                            className="flex-shrink-0 p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Delete rating"
                          >
                            <Trash size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;