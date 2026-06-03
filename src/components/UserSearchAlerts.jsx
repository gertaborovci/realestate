import React, { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Check, X, Loader, Search } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { getCurrentUser } from '../lib/auth';
import { showAlert, showConfirm } from '../lib/modal';

const EMPTY = {
  qyteti: '',
  cmimi_max: '',
  dhomat: '',
  lloji_prones: '',
  required_features: [],
};

const TYPE_LABELS = { Shitje: 'For Sale', Qira: 'For Rent', '': 'Any' };

const inputCls =
  'w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-xl text-sm ' +
  'focus:outline-none focus:border-zinc-600 placeholder:text-white/30 transition';

const labelCls = 'block text-white/50 text-xs font-bold uppercase tracking-wider mb-2';

export default function UserSearchAlerts({ onNavigate }) {
  const [alerts,        setAlerts]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [form,          setForm]          = useState(EMPTY);
  const [editingId,     setEditingId]     = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [deletingId,    setDeletingId]    = useState(null);
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState('');
  const [featureInput,  setFeatureInput]  = useState('');
  const [matchNotifs,   setMatchNotifs]   = useState([]);
  const featureRef = useRef(null);

  const user = getCurrentUser();

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [alertData, notifData] = await Promise.all([
        apiFetch(`/api/search-alerts/user/${user.id}`),
        apiFetch(`/api/notifications/user/${user.id}`).catch(() => []),
      ]);
      setAlerts(Array.isArray(alertData) ? alertData : []);
      // Keep only unread 'alert' type notifications
      const matches = (Array.isArray(notifData) ? notifData : [])
        .filter(n => n.type === 'alert' && !n.is_read);
      setMatchNotifs(matches);
    } catch { setAlerts([]); }
    finally { setLoading(false); }
  };

  const dismissNotif = async (id) => {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' }).catch(() => {});
    setMatchNotifs(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => { load(); }, []);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); };
  const resetForm = () => { setForm(EMPTY); setEditingId(null); setError(''); };

  const addFeature = () => {
    const val = featureInput.trim();
    if (!val) return;
    if (!form.required_features.includes(val)) {
      setForm(f => ({ ...f, required_features: [...f.required_features, val] }));
    }
    setFeatureInput('');
    featureRef.current?.focus();
  };

  const removeFeature = (feat) =>
    setForm(f => ({ ...f, required_features: f.required_features.filter(x => x !== feat) }));

  const startEdit = (a) => {
    setForm({
      qyteti:            a.qyteti       || '',
      cmimi_max:         a.cmimi_max    ?? '',
      dhomat:            a.dhomat       ?? '',
      lloji_prones:      a.lloji_prones || '',
      required_features: a.required_features
        ? a.required_features.split(',').map(f => f.trim()).filter(Boolean)
        : [],
    });
    setEditingId(a.id);
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      required_features: form.required_features.join(',') || null,
    };
    try {
      if (editingId) {
        await apiFetch(`/api/search-alerts/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        flash('Alert updated.');
      } else {
        await apiFetch('/api/search-alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, user_id: user.id }),
        });
        flash('Alert created! You\'ll be notified when a matching property is listed.');
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!await showConfirm('Remove this alert?')) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/search-alerts/${id}`, { method: 'DELETE' });
      setAlerts(prev => prev.filter(a => a.id !== id));
      flash('Alert removed.');
    } catch (err) {
      await showAlert(err.message || 'Failed to delete.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-widest">
              Search Alerts
            </h2>
            {matchNotifs.length > 0 && (
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-[10px] font-black">
                {matchNotifs.length}
              </span>
            )}
          </div>
          <p className="text-white/40 text-sm leading-relaxed">
            Set your criteria and get notified the moment a matching property is listed.
          </p>
        </div>
      </div>

      {/* Match notifications */}
      {matchNotifs.length > 0 && (
        <div className="space-y-3">
          {matchNotifs.map(n => (
            <div key={n.id}
              className="flex items-start justify-between gap-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl px-5 py-4">
              <div className="flex-1">
                <p className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-1">
                  🏠  New Match Found
                </p>
                <p className="text-white/80 text-sm">{n.message}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => { dismissNotif(n.id); if (onNavigate) onNavigate('properties'); }}
                  className="px-4 py-2 rounded-xl bg-white text-black text-xs font-black uppercase tracking-wider hover:bg-zinc-200 transition"
                >
                  View →'
                </button>
                <button onClick={() => dismissNotif(n.id)}
                  className="text-white/30 hover:text-white transition p-1">
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Success banner */}
      {success && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 px-5 py-4 rounded-2xl text-sm font-bold">
          <Check size={16} /> {success}
        </div>
      )}

      {/* ── Form ── */}
      <div className="bg-zinc-900/60 border border-white/8 rounded-2xl p-8 space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
          {editingId ? <><Pencil size={14} /> Edit Alert</> : <><Plus size={14} /> New Alert</>}
        </h3>

        {error && (
          <p className="text-red-400 text-sm font-bold bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-3">
            {error}
          </p>
        )}

        <form onSubmit={handleSave} className="space-y-6">

          {/* Location + Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>City / Area</label>
              <input type="text" value={form.qyteti}
                onChange={e => setForm(f => ({ ...f, qyteti: e.target.value }))}
                placeholder="e.g. Prishtina" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Max Price (€)</label>
              <input type="number" min="0" value={form.cmimi_max}
                onChange={e => setForm(f => ({ ...f, cmimi_max: e.target.value }))}
                placeholder="e.g. 200,000" className={inputCls} />
            </div>
          </div>

          {/* Rooms + Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Min Rooms</label>
              <input type="number" min="0" value={form.dhomat}
                onChange={e => setForm(f => ({ ...f, dhomat: e.target.value }))}
                placeholder="e.g. 2" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Listing Type</label>
              <select value={form.lloji_prones}
                onChange={e => setForm(f => ({ ...f, lloji_prones: e.target.value }))}
                className={inputCls}>
                <option value="">Any type</option>
                <option value="Shitje">For Sale</option>
                <option value="Qira">For Rent</option>
              </select>
            </div>
          </div>

          {/* Required features */}
          <div>
            <label className={labelCls}>
              Required Features <span className="text-white/25 normal-case tracking-normal font-normal">(optional)</span>
            </label>

            {/* Warning note */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 mb-3">
              <p className="text-yellow-400 text-xs font-bold leading-relaxed">
                ⚠️ Feature names must be written <strong>exactly</strong> as they appear on the property listing
                (e.g. <em>"Elevator"</em>, <em>"Pool"</em>, <em>"Emergency Stairs"</em>).
                If the spelling doesn't match, the alert won't trigger.
              </p>
            </div>

            {/* Tag input */}
            <div className="flex gap-2 mb-3">
              <input
                ref={featureRef}
                type="text"
                value={featureInput}
                onChange={e => setFeatureInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                placeholder='e.g. Elevator, Pool, Parking…'
                className={inputCls}
              />
              <button
                type="button"
                onClick={addFeature}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-wider transition shrink-0"
              >
                Add
              </button>
            </div>

            {/* Added tags */}
            {form.required_features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.required_features.map(feat => (
                  <span key={feat}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-white">
                    {feat}
                    <button type="button" onClick={() => removeFeature(feat)}
                      className="text-white/40 hover:text-white transition ml-0.5">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-white hover:bg-zinc-200 text-black px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition disabled:opacity-50">
              {saving
                ? <><Loader size={13} className="animate-spin" /> Saving…</>
                : editingId
                  ? <><Check size={13} /> Save Changes</>
                  : <><Plus size={13} /> Create Alert</>}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm}
                className="px-6 py-3 rounded-xl border border-zinc-800 text-white/40 hover:text-white text-xs font-black uppercase tracking-wider transition">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Alerts list ── */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-white/30">
          <Loader size={16} className="animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest">Loading…</span>
        </div>
      ) : alerts.length === 0 ? (
        <div className="py-16 text-center space-y-4">
          <Search size={36} className="mx-auto text-white/15" />
          <p className="text-white/30 text-sm font-bold uppercase tracking-widest">No alerts yet</p>
          <p className="text-white/20 text-xs">Create one above  -  we'll ping you when a match is found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest">
            {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
          </p>
          {alerts.map(a => {
            const features = a.required_features
              ? a.required_features.split(',').map(f => f.trim()).filter(Boolean)
              : [];
            return (
              <div key={a.id}
                className={`rounded-2xl p-6 border transition-all ${
                  editingId === a.id
                    ? 'bg-zinc-900/60 border-white/25'
                    : matchNotifs.length > 0
                      ? 'bg-emerald-500/8 border-emerald-500/30'  // green when matched
                      : 'bg-zinc-900/60 border-white/8'
                }`}>
                <div className="flex items-start justify-between gap-4">

                  {/* Criteria chips */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {a.qyteti && (
                        <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/60">
                          📍 {a.qyteti}
                        </span>
                      )}
                      {a.cmimi_max && (
                        <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/60">
                          ≤ €{Number(a.cmimi_max).toLocaleString()}
                        </span>
                      )}
                      {a.dhomat && (
                        <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/60">
                          {a.dhomat}+ rooms
                        </span>
                      )}
                      {a.lloji_prones && (
                        <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/60">
                          {TYPE_LABELS[a.lloji_prones] || a.lloji_prones}
                        </span>
                      )}
                      {!a.qyteti && !a.cmimi_max && !a.dhomat && !a.lloji_prones && features.length === 0 && (
                        <span className="text-white/20 text-xs italic">Matches all properties</span>
                      )}
                    </div>

                    {/* Feature badges */}
                    {features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {features.map(f => (
                          <span key={f} className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-white/20 text-xs">
                      Created {new Date(a.data_krijimit).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => startEdit(a)}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(a.id)} disabled={deletingId === a.id}
                      className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 transition disabled:opacity-40">
                      {deletingId === a.id ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

