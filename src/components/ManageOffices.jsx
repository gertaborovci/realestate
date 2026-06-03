import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Pencil, Trash2, MapPin, Phone, Mail, Clock, ExternalLink, X, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { showAlert, showConfirm } from '../lib/modal';

const EMPTY_FORM = {
  name: '', address: '', city: '', phone: '',
  email: '', working_hours: '', map_url: '', is_active: true,
};

export default function ManageOffices() {
  const [offices, setOffices]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null); // office object being edited
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [deleteId, setDeleteId]   = useState(null);

  const fetchOffices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/offices/all');
      setOffices(Array.isArray(data) ? data : []);
    } catch { setOffices([]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchOffices(); }, [fetchOffices]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const openEdit = (office) => {
    setEditing(office);
    setForm({
      name:          office.name          || '',
      address:       office.address       || '',
      city:          office.city          || '',
      phone:         office.phone         || '',
      email:         office.email         || '',
      working_hours: office.working_hours || '',
      map_url:       office.map_url       || '',
      is_active:     !!office.is_active,
    });
    setError('');
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); setError(''); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim() || !form.city.trim()) {
      setError('Name, address and city are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await apiFetch(`/api/offices/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
          body: JSON.stringify(form),
        });
        setSuccess('Office updated.');
      } else {
        await apiFetch('/api/offices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
          body: JSON.stringify(form),
        });
        setSuccess('Office added.');
      }
      await fetchOffices();
      closeForm();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save.');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/api/offices/${id}`, { method: 'DELETE' });
      setOffices((prev) => prev.filter((o) => o.id !== id));
      setDeleteId(null);
    } catch (err) { await showAlert(err.message, 'error'); }
  };

  const toggleActive = async (office) => {
    try {
      await apiFetch(`/api/offices/${office.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({ is_active: !office.is_active }),
      });
      setOffices((prev) =>
        prev.map((o) => o.id === office.id ? { ...o, is_active: o.is_active ? 0 : 1 } : o)
      );
    } catch (err) { await showAlert(err.message, 'error'); }
  };

  const field = (label, key, placeholder, type = 'text') => (
    <div>
      <label className="block text-[9px] font-black tracking-widest uppercase text-white/40 mb-2">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition"
      />
    </div>
  );

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <Building2 size={24} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white">OFFICE LOCATIONS</h1>
            <p className="text-white/40 text-xs font-bold tracking-widest uppercase mt-1">
              Manage agency offices visible to the public
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {success && (
            <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2">
              <Check size={12} /> {success}
            </span>
          )}
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-white text-black text-xs font-black px-6 py-3 rounded-full hover:bg-zinc-200 transition tracking-widest uppercase"
          >
            <Plus size={14} /> Add Office
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <div className="bg-[#111] border border-white/8 rounded-2xl px-6 py-4">
          <p className="text-2xl font-black text-white">{offices.length}</p>
          <p className="text-[10px] font-bold tracking-widest uppercase text-white/30 mt-1">Total</p>
        </div>
        <div className="bg-[#111] border border-white/8 rounded-2xl px-6 py-4">
          <p className="text-2xl font-black text-green-400">{offices.filter(o => o.is_active).length}</p>
          <p className="text-[10px] font-bold tracking-widest uppercase text-white/30 mt-1">Active</p>
        </div>
        <div className="bg-[#111] border border-white/8 rounded-2xl px-6 py-4">
          <p className="text-2xl font-black text-white/30">{offices.filter(o => !o.is_active).length}</p>
          <p className="text-[10px] font-bold tracking-widest uppercase text-white/30 mt-1">Inactive</p>
        </div>
      </div>

      {/* Office list */}
      {loading ? (
        <p className="text-white/30 text-sm animate-pulse">Loading offices…</p>
      ) : offices.length === 0 ? (
        <div className="text-center py-20 text-white/20">
          <Building2 size={40} className="mx-auto mb-4 opacity-20" />
          <p className="font-bold">No offices yet  -  add your first one</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {offices.map((o) => (
            <div
              key={o.id}
              className={`bg-[#111] border rounded-2xl p-6 space-y-4 transition ${
                o.is_active ? 'border-white/8' : 'border-white/4 opacity-50'
              }`}
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black tracking-widest uppercase text-white/30 mb-1">{o.city}</p>
                  <h3 className="text-base font-black text-white leading-tight">{o.name}</h3>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleActive(o)}
                    title={o.is_active ? 'Deactivate' : 'Activate'}
                    className="p-1.5 hover:bg-white/5 rounded-lg transition"
                  >
                    {o.is_active
                      ? <ToggleRight size={18} className="text-green-400" />
                      : <ToggleLeft  size={18} className="text-white/30" />
                    }
                  </button>
                  <button
                    onClick={() => openEdit(o)}
                    className="p-1.5 hover:bg-white/5 rounded-lg transition text-white/40 hover:text-white"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteId(o.id)}
                    className="p-1.5 hover:bg-red-500/10 rounded-lg transition text-white/40 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Info rows */}
              <div className="space-y-2 text-xs text-white/50">
                <div className="flex items-start gap-2">
                  <MapPin size={12} className="shrink-0 mt-0.5 text-white/30" />
                  <span>{o.address}</span>
                </div>
                {o.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-white/30" />
                    <span>{o.phone}</span>
                  </div>
                )}
                {o.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-white/30" />
                    <span>{o.email}</span>
                  </div>
                )}
                {o.working_hours && (
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-white/30" />
                    <span>{o.working_hours}</span>
                  </div>
                )}
              </div>

              {/* Map link */}
              {o.map_url && (
                <a
                  href={o.map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-emerald-400/70 hover:text-emerald-400 transition"
                >
                  <ExternalLink size={11} /> View on Map
                </a>
              )}

              {/* Active badge */}
              <div className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${
                o.is_active
                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : 'bg-zinc-800 text-zinc-500 border-zinc-700'
              }`}>
                {o.is_active ? 'Active' : 'Inactive'}
              </div>

              {/* Delete confirm */}
              {deleteId === o.id && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-red-400 font-bold">Delete this office?</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(o.id)} className="text-[10px] font-black bg-red-500 text-white px-3 py-1.5 rounded-full hover:bg-red-400 transition">Yes</button>
                    <button onClick={() => setDeleteId(null)} className="text-[10px] font-black bg-white/10 text-white px-3 py-1.5 rounded-full hover:bg-white/20 transition">No</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex items-center justify-center p-6">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-7 py-5 border-b border-white/8">
              <h2 className="text-sm font-black tracking-widest uppercase text-white">
                {editing ? 'Edit Office' : 'Add New Office'}
              </h2>
              <button onClick={closeForm} className="text-white/40 hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-7 py-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              {field('Office Name *',    'name',          'e.g. Main Office  -  Prishtina')}
              {field('City *',           'city',          'e.g. Prishtina')}
              {field('Address *',        'address',       'e.g. Rr. UCK, Nr. 45')}
              {field('Phone',            'phone',         'e.g. +383 44 123 456', 'tel')}
              {field('Email',            'email',         'e.g. info@kosovanest.com', 'email')}
              {field('Working Hours',    'working_hours', 'e.g. Mon - Fri: 09:00 - 18:00')}

              {/* Map URL */}
              <div>
                <label className="block text-[9px] font-black tracking-widest uppercase text-white/40 mb-2">
                  Google Maps Link
                  <span className="normal-case font-normal tracking-normal text-white/20 ml-2">(paste the share URL)</span>
                </label>
                <input
                  type="url"
                  value={form.map_url}
                  onChange={(e) => setForm((f) => ({ ...f, map_url: e.target.value }))}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition"
                />
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3">
                <div>
                  <p className="text-xs font-bold text-white">Visible to public</p>
                  <p className="text-[10px] text-white/30 mt-0.5">Show this office on the website</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                  className="transition"
                >
                  {form.is_active
                    ? <ToggleRight size={28} className="text-green-400" />
                    : <ToggleLeft  size={28} className="text-white/20" />
                  }
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-white text-black text-xs font-black py-3 rounded-full hover:bg-zinc-200 disabled:opacity-50 transition tracking-widest uppercase"
                >
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Office'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-6 bg-white/5 text-white text-xs font-black py-3 rounded-full hover:bg-white/10 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

