import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Plus, Pencil, Trash2, X, Check, Loader, MapPin, Search } from 'lucide-react';
import { apiFetch } from '../lib/api';
import NeighborhoodAutocomplete from '../components/NeighborhoodAutocomplete';

// ── Fix Leaflet default marker icons in Vite ──────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Highlighted (selected) marker icon
const selectedIcon = new L.Icon({
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize:     [30, 46],
  iconAnchor:   [15, 46],
  popupAnchor:  [0, -46],
  className:    'selected-marker',
});

// ── Fly to a location when editing ───────────────────────────────────────────
function FlyToMarker({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], 14, { duration: 1 });
  }, [lat, lng]);
  return null;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const KOSOVO_CENTER = [42.6629, 21.1655];
const API           = '/api/neighborhoods';

const EMPTY = {
  city: '', name: '', description: '',
  safety_score: '', schools_score: '', transport_score: '', walk_score: '',
  avg_price: '', price_per_sqm: '',
  latitude: '', longitude: '',
};

const inputCls =
  'w-full bg-[#1a1a1a] border border-gray-800 text-white px-3 py-2.5 rounded-xl text-sm ' +
  'focus:outline-none focus:border-gray-500 placeholder:text-white/20 transition';

const labelCls = 'block text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1';

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ value }) {
  const n = Number(value);
  if (!n) return <span className="text-white/20 text-xs">—</span>;
  const color = n >= 8 ? 'bg-green-500' : n >= 5 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-white/10 rounded-full h-1.5 max-w-[50px]">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${(n / 10) * 100}%` }} />
      </div>
      <span className="text-xs font-bold text-white tabular-nums">{n}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ManageNeighborhoods() {
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [form,          setForm]          = useState(EMPTY);
  const [editingId,     setEditingId]     = useState(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [deletingId,    setDeletingId]    = useState(null);
  const [formError,     setFormError]     = useState('');
  const [success,       setSuccess]       = useState('');

  const formRef = useRef(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(API);
      setNeighborhoods(Array.isArray(data) ? data : []);
    } catch {
      setNeighborhoods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Form helpers ───────────────────────────────────────────────────────────
  const resetForm = () => { setForm(EMPTY); setEditingId(null); setFormError(''); };

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const startEdit = (n) => {
    setForm({
      city:            n.city            || '',
      name:            n.name            || '',
      description:     n.description     || '',
      safety_score:    n.safety_score    ?? '',
      schools_score:   n.schools_score   ?? '',
      transport_score: n.transport_score ?? '',
      walk_score:      n.walk_score      ?? '',
      avg_price:       n.avg_price       ?? '',
      price_per_sqm:   n.price_per_sqm   ?? '',
      latitude:        n.latitude        ?? '',
      longitude:       n.longitude       ?? '',
    });
    setEditingId(n.id);
    setFormError('');
    // Scroll form into view
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  // ── CREATE / UPDATE ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.city.trim() || !form.name.trim()) {
      setFormError('City and neighbourhood name are required.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      if (editingId) {
        await apiFetch(`${API}/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        flash('Neighbourhood updated.');
      } else {
        await apiFetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        flash('Neighbourhood added.');
      }
      resetForm();
      load();
    } catch (err) {
      setFormError(err.message || 'Failed to save.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── DELETE ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this neighbourhood? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await apiFetch(`${API}/${id}`, { method: 'DELETE' });
      setNeighborhoods(prev => prev.filter(n => n.id !== id));
      if (editingId === id) resetForm();
      flash('Neighbourhood deleted.');
    } catch (err) {
      alert(err.message || 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  };

  // Parsed lat/lng for map fly-to
  const flyLat = editingId && form.latitude  ? Number(form.latitude)  : null;
  const flyLng = editingId && form.longitude ? Number(form.longitude) : null;

  // Neighbourhoods that have valid coords
  const mapped = neighborhoods.filter(n => n.latitude != null && n.longitude != null);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div ref={formRef} className="flex justify-between items-center">
        <div>
          <h1 className="text-5xl font-bold">NEIGHBOURHOODS</h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">
            Manage neighbourhoods and view them on the map
          </p>
        </div>
        {editingId && (
          <button onClick={resetForm}
            className="flex items-center gap-2 text-white/40 hover:text-white text-[10px] font-bold uppercase tracking-widest transition">
            <X size={13} /> Cancel edit
          </button>
        )}
      </div>

      {/* Success banner */}
      {success && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 px-5 py-3 rounded-xl text-sm font-bold">
          <Check size={14} /> {success}
        </div>
      )}

      {/* ── FORM ── */}
      <div className="bg-[#121212] border border-gray-800 rounded-2xl p-6">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-white/50 mb-5 flex items-center gap-2">
          {editingId ? <><Pencil size={13} /> Edit Neighbourhood</> : <><Plus size={13} /> Add Neighbourhood</>}
        </h2>

        {formError && (
          <p className="text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
            {formError}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Area search autocomplete ── */}
          <div className="pb-4 border-b border-gray-800">
            <label className={labelCls}>
              <Search size={11} className="inline mr-1" />
              Quick-fill from map (optional)
            </label>
            <NeighborhoodAutocomplete
              placeholder="Search for an area or neighbourhood in Kosovo…"
              onSelect={({ name, city, lat, lon }) =>
                setForm(f => ({
                  ...f,
                  name:      name || f.name,
                  city:      city || f.city,
                  latitude:  lat  || f.latitude,
                  longitude: lon  || f.longitude,
                }))
              }
            />
            <p className="text-[9px] text-white/20 font-bold mt-1.5">
              Selecting a result auto-fills the name, city and coordinates below.
            </p>
          </div>

          {/* Row 1: City + Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>City *</label>
              <input type="text" value={form.city} required
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="e.g. Prishtina" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Neighbourhood Name *</label>
              <input type="text" value={form.name} required
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Bregu i Diellit" className={inputCls} />
            </div>
          </div>

          {/* Row 2: Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={2} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Short description of the area…"
              className={`${inputCls} resize-none`} />
          </div>

          {/* Row 3: Scores */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'safety_score',    label: 'Safety (1–10)'    },
              { key: 'schools_score',   label: 'Schools (1–10)'   },
              { key: 'transport_score', label: 'Transport (1–10)' },
              { key: 'walk_score',      label: 'Walk Score (1–10)'},
            ].map(({ key, label }) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <input type="number" min="0" max="10" step="0.1"
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder="0–10" className={inputCls} />
              </div>
            ))}
          </div>

          {/* Row 4: Prices + Coords */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Avg. Price (€)</label>
              <input type="number" min="0" value={form.avg_price}
                onChange={e => setForm(f => ({ ...f, avg_price: e.target.value }))}
                placeholder="150000" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Price / m² (€)</label>
              <input type="number" min="0" value={form.price_per_sqm}
                onChange={e => setForm(f => ({ ...f, price_per_sqm: e.target.value }))}
                placeholder="1200" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Latitude</label>
              <input type="number" step="any" value={form.latitude}
                onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))}
                placeholder="42.6629" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Longitude</label>
              <input type="number" step="any" value={form.longitude}
                onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))}
                placeholder="21.1655" className={inputCls} />
            </div>
          </div>

          <p className="text-[10px] text-white/20 font-bold">
            💡 Tip: Right-click on Google Maps → "What's here?" to copy coordinates
          </p>

          {/* Submit */}
          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition disabled:opacity-50">
              {submitting
                ? <><Loader size={12} className="animate-spin" /> Saving…</>
                : editingId
                  ? <><Check size={12} /> Save Changes</>
                  : <><Plus size={12} /> Add Neighbourhood</>}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm}
                className="px-6 py-2.5 rounded-xl border border-gray-800 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── MAP ── */}
      <div className="bg-[#121212] border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
            <MapPin size={12} /> Interactive Map — {mapped.length} pinned neighbourhood{mapped.length !== 1 ? 's' : ''}
          </p>
          <p className="text-[9px] text-white/20 font-bold">Click a pin to edit</p>
        </div>

        <div style={{ height: 420 }}>
          <MapContainer
            center={KOSOVO_CENTER}
            zoom={11}
            style={{ height: '100%', width: '100%', background: '#111' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />

            {/* Fly to selected neighbourhood */}
            {flyLat && flyLng && <FlyToMarker lat={flyLat} lng={flyLng} />}

            {/* Markers */}
            {mapped.map(n => (
              <Marker
                key={n.id}
                position={[Number(n.latitude), Number(n.longitude)]}
                icon={editingId === n.id ? selectedIcon : new L.Icon.Default()}
                eventHandlers={{ click: () => startEdit(n) }}
              >
                <Popup>
                  <div style={{ minWidth: 160, fontFamily: 'sans-serif' }}>
                    <strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                      {n.name}
                    </strong>
                    <span style={{ fontSize: 11, color: '#888' }}>{n.city}</span>
                    {n.avg_price && (
                      <div style={{ marginTop: 6, fontSize: 11 }}>
                        Avg: <strong>€{Number(n.avg_price).toLocaleString()}</strong>
                      </div>
                    )}
                    {(n.safety_score || n.walk_score) && (
                      <div style={{ marginTop: 4, fontSize: 11 }}>
                        Safety: {n.safety_score || '—'} &nbsp; Walk: {n.walk_score || '—'}
                      </div>
                    )}
                    <button
                      onClick={() => startEdit(n)}
                      style={{
                        marginTop: 8, background: '#111', color: '#fff',
                        border: '1px solid #333', borderRadius: 6,
                        padding: '4px 10px', fontSize: 10, cursor: 'pointer',
                        fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em',
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">
          {neighborhoods.length} neighbourhood{neighborhoods.length !== 1 ? 's' : ''}
        </p>

        {loading ? (
          <div className="flex items-center justify-center h-28 gap-3 text-white/30">
            <Loader size={16} className="animate-spin" />
            <span className="text-xs font-bold tracking-widest uppercase">Loading…</span>
          </div>
        ) : neighborhoods.length === 0 ? (
          <div className="bg-[#121212] border border-dashed border-gray-800 rounded-2xl p-12 text-center">
            <MapPin size={28} className="mx-auto text-white/15 mb-3" />
            <p className="text-white/30 text-sm font-bold uppercase tracking-widest">No neighbourhoods yet</p>
          </div>
        ) : (
          <div className="bg-[#121212] border border-gray-800 rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <th className="p-4">City / Name</th>
                  <th className="p-4">Safety</th>
                  <th className="p-4">Schools</th>
                  <th className="p-4">Transport</th>
                  <th className="p-4">Walk</th>
                  <th className="p-4">Avg. Price</th>
                  <th className="p-4">€/m²</th>
                  <th className="p-4">Coords</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900">
                {neighborhoods.map(n => (
                  <tr key={n.id}
                    className={`hover:bg-white/[0.02] transition ${editingId === n.id ? 'bg-yellow-500/5' : ''}`}>

                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{n.name}</div>
                      <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                        <MapPin size={9} /> {n.city}
                      </div>
                    </td>

                    <td className="p-4"><ScoreBar value={n.safety_score} /></td>
                    <td className="p-4"><ScoreBar value={n.schools_score} /></td>
                    <td className="p-4"><ScoreBar value={n.transport_score} /></td>
                    <td className="p-4"><ScoreBar value={n.walk_score} /></td>

                    <td className="p-4">
                      {n.avg_price
                        ? <span className="text-white font-mono text-sm">€{Number(n.avg_price).toLocaleString()}</span>
                        : <span className="text-white/20 text-xs">—</span>}
                    </td>

                    <td className="p-4">
                      {n.price_per_sqm
                        ? <span className="text-white/70 font-mono text-xs">€{Number(n.price_per_sqm).toLocaleString()}</span>
                        : <span className="text-white/20 text-xs">—</span>}
                    </td>

                    <td className="p-4">
                      {n.latitude && n.longitude
                        ? <span className="text-white/40 font-mono text-[10px]">{Number(n.latitude).toFixed(4)}, {Number(n.longitude).toFixed(4)}</span>
                        : <span className="text-white/20 text-xs italic">No pin</span>}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => startEdit(n)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-[9px] font-black uppercase tracking-widest transition">
                          <Pencil size={10} /> Edit
                        </button>
                        <button onClick={() => handleDelete(n.id)} disabled={deletingId === n.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[9px] font-black uppercase tracking-widest transition disabled:opacity-40">
                          {deletingId === n.id ? <Loader size={10} className="animate-spin" /> : <Trash2 size={10} />}
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
