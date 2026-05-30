import React, { useState, useEffect, useRef } from 'react';
import PropertyFeatures from './PropertyFeatures';
import { API_BASE, apiFetch } from '../lib/api';
import { getCurrentUser } from '../lib/auth';
import { ArrowLeft, Euro, MapPin, Image as ImageIcon, DoorOpen, Bath, Maximize, Activity, Home, UploadCloud, X, CheckCircle } from 'lucide-react';
import LocationAutocomplete from '../components/LocationAutocomplete';

// agentId can be passed directly as a prop (e.g. from AdminDashboard) OR
// auto-resolved from the logged-in agent's session (e.g. from AgentDashboard).
const AddProperty = ({ onBack, onAdd, editData, agentId: agentIdProp }) => {
  // Start with the prop value; will be overwritten by the effect if not provided
  const [agentId,       setAgentId]       = useState(agentIdProp || null);
  const [neighborhoods, setNeighborhoods] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    location: '',
    latitude: '',
    longitude: '',
    type: 'Shitje',
    home_type: '',
    neighborhood_id: '',
    status: 'E Lirë',
    rooms: '',
    bathrooms: '',
    area: '',
  });

  const [step,          setStep]          = useState(1);
  const [savedId,       setSavedId]       = useState(editData ? editData.id : null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  // Populate form when editing an existing property
  useEffect(() => {
    if (editData) setFormData(editData);
  }, [editData]);

  // Auto-resolve agentId from the logged-in user's session when not provided as a prop
  useEffect(() => {
    if (agentIdProp) return; // already provided — nothing to do
    const user = getCurrentUser();
    if (user?.id && user?.role === 'agent') {
      apiFetch(`/api/agents/by-user/${user.id}`)
        .then((a) => setAgentId(a.id))
        .catch(() => {}); // non-fatal — admin adding a property without an agent profile
    }
  }, [agentIdProp]);

  // Load neighbourhoods for the dropdown
  useEffect(() => {
    apiFetch('/api/neighborhoods')
      .then(data => setNeighborhoods(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // ── Submit handler ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const isEditing = Boolean(editData && editData.id);
      const url    = isEditing
        ? `${API_BASE}/api/properties/${editData.id}`
        : `${API_BASE}/api/properties`;
      const method = isEditing ? 'PUT' : 'POST';

      // 1. Save base property data
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          image: '',
          // Only attach agent_id on create — don't overwrite it on edit
          ...(agentId && !isEditing ? { agent_id: agentId } : {}),
        }),
      });

      if (!response.ok) {
        console.error('Error saving to server.');
        return;
      }

      // 2. Get the property ID
      const responseData = await response.json();
      const propertyId   = isEditing ? editData.id : responseData.id;

      // 3. Upload photos
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const fileObj       = selectedFiles[i];
          const imageFormData = new FormData();
          imageFormData.append('image',         fileObj.file);
          imageFormData.append('eshte_kryesore', fileObj.isMain);
          imageFormData.append('renditja',       i);

          try {
            const imgUploadRes = await fetch(
              `${API_BASE}/api/properties/${propertyId}/images`,
              { method: 'POST', body: imageFormData }
            );
            if (!imgUploadRes.ok) {
              const errorText = await imgUploadRes.text();
              console.error(`Failed to upload image ${i}:`, errorText);
            } else {
              console.log(`Image ${i} uploaded successfully!`);
            }
          } catch (err) {
            console.error(`Network error uploading image ${i}:`, err);
          }
        }
      }

      console.log(`Property successfully ${isEditing ? 'modified' : 'saved'}!`);
      setSavedId(propertyId);
      setStep(2);
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  // ── File handlers ───────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newFiles = files.map((file, index) => ({
        file,
        preview: URL.createObjectURL(file),
        isMain:  selectedFiles.length === 0 && index === 0,
      }));
      setSelectedFiles([...selectedFiles, ...newFiles]);
    }
  };

  const removeFile = (indexToRemove) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== indexToRemove);
    if (selectedFiles[indexToRemove].isMain && updatedFiles.length > 0) {
      updatedFiles[0].isMain = true;
    }
    setSelectedFiles(updatedFiles);
  };

  const setAsMain = (indexToMain) => {
    setSelectedFiles(selectedFiles.map((item, i) => ({ ...item, isMain: i === indexToMain })));
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] font-bold tracking-[0.2em]">BACK TO LIST</span>
      </button>

      <h2 className="text-white text-4xl font-bold tracking-tighter mb-12 uppercase">
        {editData ? 'Edit Property' : 'Add New Property'}
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-10 bg-[#0A0A0A] border border-white/10 p-12 rounded-[40px] shadow-2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* Property Name */}
          <div className="space-y-3">
            <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">
              Property Name
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="E.g. Villa in Sunny Hill"
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white focus:border-white/30 outline-none transition-all"
            />
          </div>

          {/* Location */}
          <div className="space-y-3">
            <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">
              Location / Address
              {formData.latitude && formData.longitude && (
                <span className="ml-2 text-emerald-400 text-[9px] font-bold normal-case tracking-normal">
                  ✓ Coordinates saved
                </span>
              )}
            </label>
            <LocationAutocomplete
              value={formData.location}
              onChange={(address, lat, lon) =>
                setFormData(f => ({ ...f, location: address, latitude: lat, longitude: lon }))
              }
              placeholder="Start typing an address…"
            />
            {/* Hidden inputs so lat/lng are submitted with the form */}
            <input type="hidden" value={formData.latitude}  onChange={() => {}} />
            <input type="hidden" value={formData.longitude} onChange={() => {}} />
          </div>

          {/* Price */}
          <div className="space-y-3">
            <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">
              Price (€)
            </label>
            <div className="relative">
              <Euro size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="Enter price"
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white focus:border-white/30 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Transaction Type */}
          <div className="space-y-3">
            <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">
              Transaction Type
            </label>
            <div className="relative">
              <Home size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-[#0F0F0F] border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white focus:border-white/30 outline-none appearance-none cursor-pointer"
              >
                <option value="Shitje">For Sale</option>
                <option value="Qira">For Rent</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">Property Category</label>
            <div className="relative">
              <Home size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
              <select
                value={formData.home_type}
                onChange={(e) => setFormData({...formData, home_type: e.target.value})}
                className="w-full bg-[#0F0F0F] border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white focus:border-white/30 outline-none appearance-none cursor-pointer"
              >
                <option value="">— Select category —</option>
                <option value="House">House</option>
                <option value="Apartment">Apartment</option>
                <option value="Villa">Villa</option>
                <option value="Townhouse">Townhouse</option>
                <option value="Mansion">Mansion</option>
                <option value="Penthouse">Penthouse</option>
                <option value="Duplex">Duplex</option>
                <option value="Studio">Studio</option>
                <option value="Cabin">Cabin</option>
                <option value="Condo">Condo</option>
              </select>
            </div>
          </div>

          {neighborhoods.length > 0 && (
            <div className="space-y-3">
              <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">Neighbourhood</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                <select
                  value={formData.neighborhood_id}
                  onChange={(e) => setFormData({...formData, neighborhood_id: e.target.value})}
                  className="w-full bg-[#0F0F0F] border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white focus:border-white/30 outline-none appearance-none cursor-pointer"
                >
                  <option value="">— No neighbourhood selected —</option>
                  {neighborhoods.map(n => (
                    <option key={n.id} value={n.id}>{n.name} — {n.city}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="space-y-3 md:col-span-2">
            <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">
              Current Property Status
            </label>
            <div className="relative">
              <Activity size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-[#0F0F0F] border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white focus:border-white/30 outline-none appearance-none cursor-pointer"
              >
                <option value="E Lirë">Available (Can be bought/rented)</option>
                <option value="E Shitur">Sold (Not available)</option>
                <option value="E Dhënë me Qira">Rented (Not available)</option>
              </select>
            </div>
          </div>

          {/* Rooms / Bathrooms / Area */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:col-span-2 pt-6 border-t border-white/5">
            <div className="space-y-3">
              <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">Rooms</label>
              <div className="relative">
                <DoorOpen size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                <input
                  type="number"
                  value={formData.rooms}
                  onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white outline-none focus:border-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">Bathrooms</label>
              <div className="relative">
                <Bath size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                <input
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white outline-none focus:border-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">Area m²</label>
              <div className="relative">
                <Maximize size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                <input
                  type="number"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white outline-none focus:border-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="md:col-span-2 pt-6 border-t border-white/5">
            <h3 className="text-white text-lg font-bold tracking-tight mb-6">Property Photos</h3>

            <div className="relative border-2 border-dashed border-white/10 hover:border-white/30 rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all bg-white/5">
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <UploadCloud size={32} className="text-white/40 mb-4" />
              <p className="text-sm font-bold text-white uppercase tracking-widest mb-1">Drag photos here</p>
              <p className="text-[10px] text-white/40 font-bold tracking-[0.2em] uppercase">
                or click to select from computer
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-6 space-y-3">
                {selectedFiles.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-black p-4 rounded-2xl border border-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-white/5">
                        <img src={item.preview} alt="preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col items-start gap-1">
                        <p className="text-xs font-bold text-white truncate max-w-[200px]">{item.file.name}</p>
                        {item.isMain ? (
                          <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-full">
                            <CheckCircle size={10} /> Main Photo
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAsMain(index)}
                            className="text-[9px] font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors"
                          >
                            Set as main
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-white/30 hover:text-red-500 transition-colors p-2 bg-white/5 rounded-full"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Step 1 submit button */}
        {step === 1 && (
          <button
            type="submit"
            className="w-full bg-white text-black font-black text-[11px] tracking-[0.4em] py-6 rounded-2xl hover:bg-neutral-200 transition-all uppercase shadow-xl"
          >
            {editData ? 'Save Changes' : 'Register Property'}
          </button>
        )}
      </form>

      {/* Step 2 — extra features */}
      {step === 2 && (
        <div className="mt-8 animate-in fade-in slide-in-from-top-8 duration-700">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 mb-8 text-center">
            <CheckCircle className="text-emerald-500" size={32} />
            <h3 className="text-emerald-500 font-black tracking-widest uppercase text-lg">
              {editData ? 'Changes saved!' : 'Property registered successfully!'}
            </h3>
            <p className="text-white/60 text-xs font-bold tracking-widest uppercase mt-2">
              Would you like to add extra features to this property?
            </p>
          </div>

          <PropertyFeatures propertyId={savedId} onBack={() => {}} />

          <button
            type="button"
            onClick={() => onAdd(savedId)}
            className="w-full mt-6 bg-emerald-500 text-black font-black text-[11px] tracking-[0.4em] py-6 rounded-2xl hover:bg-emerald-400 transition-all uppercase shadow-xl"
          >
            Finish and Return to List
          </button>
        </div>
      )}
    </div>
  );
};

export default AddProperty;
