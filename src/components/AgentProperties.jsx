import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, MapPin, Euro, Pencil, Plus, Loader, Home,
  DoorOpen, Maximize, Trash2, AlertTriangle,
} from 'lucide-react';
import { apiFetch, API_BASE } from '../lib/api';
import { getCurrentUser } from '../lib/auth';
import AddProperty from '../pages/AddProperty';
import { showAlert, showConfirm } from '../lib/modal';

// â"€â"€ Status display helpers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const STATUS_META = {
  'E LirÃ«':          { label: 'Available', cls: 'bg-green-500/10 text-green-400 border-green-500/30' },
  'E Shitur':        { label: 'Sold',      cls: 'bg-red-500/10   text-red-400   border-red-500/30'   },
  'E DhÃ«nÃ« me Qira': { label: 'Rented',    cls: 'bg-blue-500/10  text-blue-400  border-blue-500/30'  },
};

const TYPE_LABELS = {
  Shitje: 'For Sale',
  Qira:   'For Rent',
};

// â"€â"€ Delete confirmation modal â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const DeleteModal = ({ property, onCancel, onConfirm, deleting }) => (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
    <div className="bg-[#111] border border-white/10 rounded-3xl p-8 w-full max-w-sm text-center space-y-4">
      <AlertTriangle size={32} className="mx-auto text-red-400" />
      <h3 className="text-white font-bold text-lg">Delete property?</h3>
      <p className="text-white/50 text-sm">
        <span className="text-white font-semibold">{property.title}</span> will be permanently removed.
      </p>
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white text-xs font-bold uppercase tracking-widest transition"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={deleting}
          className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 text-xs font-bold uppercase tracking-widest transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {deleting ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />}
          Delete
        </button>
      </div>
    </div>
  </div>
);

// â"€â"€ Main component â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const AgentProperties = () => {
  const [properties,       setProperties]       = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState('');
  const [agentId,          setAgentId]          = useState(null);
  const [view,             setView]             = useState('list'); // 'list' | 'add' | 'edit'
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [deleteTarget,     setDeleteTarget]     = useState(null);
  const [deleting,         setDeleting]         = useState(false);

  // â"€â"€ Data fetching â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const loadProperties = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const currentUser = getCurrentUser();
      if (!currentUser?.id) {
        setError('You must be logged in.');
        return;
      }
      const agentRecord = await apiFetch(`/api/agents/by-user/${currentUser.id}`);
      setAgentId(agentRecord.id);
      const data = await apiFetch(`/api/properties/agent/${agentRecord.id}`);
      setProperties(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.message?.includes('No agent record')) {
        setError('Your account is not linked to an agent profile. Ask an admin to set it up.');
      } else {
        setError('Failed to load properties. Make sure the backend server is running.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProperties(); }, [loadProperties]);

  // â"€â"€ Navigation helpers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const goEdit = (property) => { setSelectedProperty(property); setView('edit'); };
  const goAdd  = ()         => { setSelectedProperty(null);     setView('add');  };
  const goList = ()         => { setView('list'); loadProperties(); };

  // â"€â"€ Delete â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`${API_BASE}/api/properties/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      loadProperties();
    } catch (err) {
      await showAlert('Failed to delete property.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // â"€â"€ Add / Edit view â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  if (view === 'add' || view === 'edit') {
    return (
      <div className="p-10">
        <AddProperty
          editData={view === 'edit' ? selectedProperty : null}
          agentId={agentId}
          onBack={goList}
          onAdd={goList}
        />
      </div>
    );
  }

  // â"€â"€ Loading / Error states â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-white/40">
        <Loader size={18} className="animate-spin" />
        <span className="text-xs font-bold tracking-widest uppercase">Loading properties…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400 text-sm">{error}</div>
      </div>
    );
  }

  // â"€â"€ List view â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  return (
    <div className="p-10 space-y-8">

      {/* Delete confirmation */}
      {deleteTarget && (
        <DeleteModal
          property={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-extrabold uppercase tracking-tight">MY PROPERTIES</h2>
          <p className="text-white/40 text-xs font-bold tracking-widest uppercase mt-1">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} listed
          </p>
        </div>
        <button
          onClick={goAdd}
          className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-all"
        >
          <Plus size={14} /> Add Property
        </button>
      </div>

      {/* Empty state */}
      {properties.length === 0 && (
        <div className="border border-dashed border-white/10 rounded-3xl p-20 text-center space-y-4">
          <Home size={36} className="mx-auto text-white/15" />
          <p className="text-white/40 text-sm font-bold uppercase tracking-widest">No properties yet</p>
          <p className="text-white/20 text-xs leading-relaxed">
            Add your first listing using the button above.<br />
            It will appear here and on the public properties page.
          </p>
          <button
            onClick={goAdd}
            className="inline-flex items-center gap-2 mt-4 bg-white/10 hover:bg-white/15 border border-white/10 text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition"
          >
            <Plus size={13} /> Add Your First Property
          </button>
        </div>
      )}

      {/* Properties table */}
      {properties.length > 0 && (
        <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden">

          {/* Column headers */}
          <div className="hidden md:grid grid-cols-[2fr_1.4fr_0.9fr_0.8fr_0.9fr_0.6fr_auto] gap-4 px-6 py-4 border-b border-white/10 text-[9px] font-black tracking-widest uppercase text-white/25">
            <span>Property</span>
            <span>Location</span>
            <span>Price</span>
            <span>Specs</span>
            <span>Type</span>
            <span>Status</span>
            <span className="sr-only">Actions</span>
          </div>

          {/* Rows */}
          {properties.map((property) => {
            const statusMeta = STATUS_META[property.status] || { label: property.status, cls: 'bg-white/5 text-white/40 border-white/10' };

            return (
              <div
                key={property.id}
                className="flex flex-col md:grid md:grid-cols-[2fr_1.4fr_0.9fr_0.8fr_0.9fr_0.6fr_auto] gap-4 px-6 py-5 border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02] transition items-center"
              >
                {/* Property title */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                    <Building2 size={14} className="text-white/40" />
                  </div>
                  <p className="font-semibold text-sm text-white truncate">{property.title}</p>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-sm text-white/50 min-w-0">
                  <MapPin size={11} className="shrink-0 text-white/30" />
                  <span className="truncate">{property.location || ' - '}</span>
                </div>

                {/* Price */}
                <div className="flex items-center gap-1 text-sm font-bold text-white">
                  <Euro size={11} className="text-white/30" />
                  {property.price ? Number(property.price).toLocaleString('en') : ' - '}
                </div>

                {/* Specs (rooms / area) */}
                <div className="flex flex-col gap-0.5 text-[11px] text-white/40">
                  {property.rooms && (
                    <span className="flex items-center gap-1">
                      <DoorOpen size={10} /> {property.rooms} rooms
                    </span>
                  )}
                  {property.area && (
                    <span className="flex items-center gap-1">
                      <Maximize size={10} /> {property.area} mÂ²
                    </span>
                  )}
                </div>

                {/* Type */}
                <span className="text-xs text-white/50">
                  {TYPE_LABELS[property.type] || property.type || ' - '}
                </span>

                {/* Status badge */}
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border whitespace-nowrap ${statusMeta.cls}`}>
                  {statusMeta.label}
                </span>

                {/* Action buttons */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => goEdit(property)}
                    title="Edit property"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-[9px] font-black tracking-widest uppercase text-white/60 hover:text-white transition"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(property)}
                    title="Delete property"
                    className="flex items-center px-2.5 py-2 rounded-xl bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 text-red-500/60 hover:text-red-400 transition"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AgentProperties;
