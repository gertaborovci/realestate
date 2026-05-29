import React, { useState, useRef } from 'react';
import {
  User, Mail, Phone, FileText, Briefcase, BookOpen, Pencil, Check, X, Camera, Trash2,
} from 'lucide-react';
import { getCurrentUser, setCurrentUser } from '../lib/auth';
import { apiFetch, API_BASE } from '../lib/api';

const inputCls =
  'w-full bg-black/50 border border-zinc-700 focus:border-zinc-400 text-white text-sm rounded-xl px-4 py-3 outline-none transition placeholder:text-white/20';

function Field({ label, optional, name, placeholder, textarea, form, setForm }) {
  return (
    <div>
      <label className="block text-[10px] font-black tracking-[0.25em] uppercase text-white/40 mb-2">
        {label}{optional && <span className="text-white/20 normal-case tracking-normal font-normal ml-1">(optional)</span>}
      </label>
      {textarea ? (
        <textarea rows={4} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          placeholder={placeholder} className={`${inputCls} resize-none`} />
      ) : (
        <input type="text" value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          placeholder={placeholder} className={inputCls} />
      )}
    </div>
  );
}

function roleBadge(role) {
  if (role === 'agent') return 'Real Estate Agent';
  if (role === 'admin') return 'Administrator';
  return 'Buyer';
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4 py-5 border-b border-white/5 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 text-white/40">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black tracking-[0.25em] uppercase text-white/30 mb-0.5">{label}</p>
        <p className={`font-semibold text-sm ${value ? 'text-white' : 'text-white/25 italic'}`}>
          {value || `+ Add ${label.toLowerCase()}`}
        </p>
      </div>
    </div>
  );
}

export default function UserProfile({ currentUser, onUserChange }) {
  const stored = currentUser || getCurrentUser();
  const [user, setUser] = useState(stored);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const isAgent = user?.role === 'agent';

  const [form, setForm] = useState({
    name:           user?.username       || '',
    phone:          user?.phone          || '',
    license_id:     user?.license_id     || '',
    specialization: user?.specialization || '',
    bio:            user?.bio            || '',
  });

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto mt-8 text-center">
        <p className="text-white/40 text-lg">No user data found. Please sign in again.</p>
      </div>
    );
  }

  const photoSrc = user.photo_url
    ? (user.photo_url.startsWith('http') ? user.photo_url : `${API_BASE}${user.photo_url}`)
    : null;

  const syncUser = (updated) => {
    setUser(updated);
    setCurrentUser(updated);
    if (onUserChange) onUserChange(updated);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { alert('Full name is required.'); return; }
    setSaving(true);
    try {
      await apiFetch(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:           form.name,
          phone:          form.phone          || null,
          license_id:     form.license_id     || null,
          specialization: form.specialization || null,
          bio:            form.bio            || null,
        }),
      });
      syncUser({
        ...user,
        username:       form.name,
        phone:          form.phone          || null,
        license_id:     form.license_id     || null,
        specialization: form.specialization || null,
        bio:            form.bio            || null,
      });
      setEditing(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    setUploadingPhoto(true);
    try {
      const data = await apiFetch(`/api/users/${user.id}/photo`, { method: 'POST', body: formData });
      syncUser({ ...user, photo_url: data.photo_url });
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm('Remove your profile photo?')) return;
    try {
      await apiFetch(`/api/users/${user.id}/photo`, { method: 'DELETE' });
      syncUser({ ...user, photo_url: null });
    } catch (err) {
      alert(err.message);
    }
  };

  /* ── View mode ── */
  if (!editing) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Header card */}
        <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6 mb-6 flex items-center gap-5">
          {/* Avatar — not clickable, just display */}
          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center flex-shrink-0">
            {photoSrc ? (
              <img src={photoSrc} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <User size={28} className="text-white/40" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-white truncate">{user.username}</h2>
            <span className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black tracking-widest uppercase text-white/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              {roleBadge(user.role)}
            </span>
          </div>

          <button
            onClick={() => {
              setForm({
                name:           user.username       || '',
                phone:          user.phone          || '',
                license_id:     user.license_id     || '',
                specialization: user.specialization || '',
                bio:            user.bio            || '',
              });
              setEditing(true);
            }}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition flex-shrink-0"
          >
            <Pencil size={13} /> Edit Profile
          </button>
        </div>

        {/* Info rows */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl px-6">
          <InfoRow icon={<User size={16} />}    label="Full Name"     value={user.username} />
          <InfoRow icon={<Mail size={16} />}     label="Email Address" value={user.email} />
          <InfoRow icon={<Phone size={16} />}    label="Phone Number"  value={user.phone} />
          {isAgent && (
            <>
              <InfoRow icon={<FileText size={16} />}  label="License ID"     value={user.license_id} />
              <InfoRow icon={<Briefcase size={16} />} label="Specialization" value={user.specialization} />
              <InfoRow icon={<BookOpen size={16} />}  label="Bio"            value={user.bio} />
            </>
          )}
        </div>
      </div>
    );
  }

  /* ── Edit mode ── */
  return (
    <div className="max-w-2xl mx-auto bg-zinc-900/40 border border-white/5 rounded-2xl p-8 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-black text-white uppercase tracking-widest">Edit Profile</h3>
        <button onClick={() => setEditing(false)} className="text-white/30 hover:text-white transition">
          <X size={18} />
        </button>
      </div>

      <Field label="Full Name"    name="name"  placeholder="Your full name" form={form} setForm={setForm} />
      <Field label="Phone Number" optional name="phone" placeholder="+383 44 000 000" form={form} setForm={setForm} />

      {isAgent && (
        <>
          <Field label="License ID"     optional name="license_id"     placeholder="e.g. KS-AGT-001" form={form} setForm={setForm} />
          <Field label="Specialization" optional name="specialization" placeholder="e.g. Residential, Commercial..." form={form} setForm={setForm} />
          <Field label="Bio"            optional name="bio"            placeholder="A short bio about yourself..." textarea form={form} setForm={setForm} />

          {/* Photo section — agents only */}
          <div className="border-t border-white/5 pt-6">
            <p className="text-[10px] font-black tracking-[0.25em] uppercase text-white/40 mb-4">
              Profile Photo
            </p>
            <div className="flex items-center gap-4">
              {/* current photo preview */}
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                {photoSrc ? (
                  <img src={photoSrc} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={22} className="text-white/30" />
                )}
              </div>

              <div className="flex gap-3">
                {/* Upload button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-40"
                >
                  <Camera size={13} /> {uploadingPhoto ? 'Uploading...' : photoSrc ? 'Change Photo' : 'Add Photo'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

                {/* Delete button — only if photo exists */}
                {photoSrc && (
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition"
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Email read-only */}
      <div>
        <label className="block text-[10px] font-black tracking-[0.25em] uppercase text-white/40 mb-2">
          Email Address <span className="text-white/20 normal-case tracking-normal font-normal">(cannot be changed)</span>
        </label>
        <input type="email" value={user.email} disabled className={`${inputCls} opacity-40 cursor-not-allowed`} />
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={() => setEditing(false)}
          className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white/60 hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition">
          <X size={13} /> Cancel
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 bg-white hover:bg-zinc-200 text-black px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-50">
          <Check size={13} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
