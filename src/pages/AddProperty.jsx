import React, { useState, useEffect, useRef } from 'react';
import PropertyFeatures from './PropertyFeatures';
import { API_BASE } from '../lib/api';
import { ArrowLeft, Euro, MapPin, Image as ImageIcon, DoorOpen, Bath, Maximize, Activity, Home, UploadCloud, X, CheckCircle } from 'lucide-react';

const AddProperty = ({ onBack, onAdd, editData, agentId }) => {
  const [formData, setFormData] = useState({
    title: '', 
    price: '', 
    location: '', 
    type: 'Shitje', 
    status: 'E Lirë', 
    rooms: '', 
    bathrooms: '', 
    area: ''
  });

  const [step, setStep] = useState(1); // Step 1: Base Form, Step 2: Features
  const [savedId, setSavedId] = useState(editData ? editData.id : null);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (editData) setFormData(editData);
  }, [editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const isEditing = Boolean(editData && editData.id);
      const url = isEditing 
        ? `${API_BASE}/api/properties/${editData.id}` 
        : `${API_BASE}/api/properties`;
      const method = isEditing ? 'PUT' : 'POST';

      // 1. Save base data (Text)
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          image: '',
          // Link property to this agent (only set on create; ignored on edit)
          ...(agentId && !isEditing ? { agent_id: agentId } : {}),
        }),
      });

      if (!response.ok) {
        console.error("Error saving to server.");
        return;
      }

      // 2. Get the new property ID from the database
      const responseData = await response.json();
      const propertyId = isEditing ? editData.id : responseData.id;

      // 3. Send physical photos to the server with Error Logging
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const fileObj = selectedFiles[i];
          const imageFormData = new FormData();
          
          imageFormData.append('image', fileObj.file); // Physical photo
          imageFormData.append('eshte_kryesore', fileObj.isMain); // Is it main?
          imageFormData.append('renditja', i);

          try {
            const imgUploadRes = await fetch(`${API_BASE}/api/properties/${propertyId}/images`, {
              method: 'POST',
              body: imageFormData 
            });
            
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
      
      setSavedId(propertyId); // Save the new ID
      setStep(2); // Move to Step 2 (Features)

    } catch (error) {
      console.error("Network error:", error);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newFiles = files.map((file, index) => ({
        file,
        preview: URL.createObjectURL(file), 
        isMain: selectedFiles.length === 0 && index === 0 
      }));
      setSelectedFiles([...selectedFiles, ...newFiles]);
    }
  };

  const removeFile = (indexToRemove) => {
    const updatedFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
    if (selectedFiles[indexToRemove].isMain && updatedFiles.length > 0) {
      updatedFiles[0].isMain = true;
    }
    setSelectedFiles(updatedFiles);
  };

  const setAsMain = (indexToMain) => {
    const updatedFiles = selectedFiles.map((item, index) => ({
      ...item,
      isMain: index === indexToMain
    }));
    setSelectedFiles(updatedFiles);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
        <span className="text-[10px] font-bold tracking-[0.2em]">BACK TO LIST</span>
      </button>

      <h2 className="text-white text-4xl font-bold tracking-tighter mb-12 uppercase">
        {editData ? 'Edit Property' : 'Add New Property'}
      </h2>

      {/* FIX: Form wraps only the base inputs */}
      <form onSubmit={handleSubmit} className="space-y-10 bg-[#0A0A0A] border border-white/10 p-12 rounded-[40px] shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          <div className="space-y-3">
            <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">Property Name</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})} 
              placeholder="E.g. Villa in Sunny Hill"
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white focus:border-white/30 outline-none transition-all" 
            />
          </div>

          <div className="space-y-3">
            <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">Location / Address</label>
            <div className="relative">
              <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
              <input 
                type="text" 
                value={formData.location} 
                onChange={(e) => setFormData({...formData, location: e.target.value})} 
                placeholder="E.g. Pristina, Sunny Hill"
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white focus:border-white/30 outline-none transition-all" 
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">Price (€)</label>
            <div className="relative">
              <Euro size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
              <input 
                type="number" 
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})} 
                placeholder="Enter price"
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white focus:border-white/30 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">Transaction Type</label>
            <div className="relative">
              <Home size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full bg-[#0F0F0F] border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white focus:border-white/30 outline-none appearance-none cursor-pointer"
              >
                <option value="Shitje">For Sale</option>
                <option value="Qira">For Rent</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 md:col-span-2">
            <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">Current Property Status</label>
            <div className="relative">
              <Activity size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
              <select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full bg-[#0F0F0F] border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white focus:border-white/30 outline-none appearance-none cursor-pointer"
              >
                <option value="E Lirë">Available (Can be bought/rented)</option>
                <option value="E Shitur">Sold (Not available)</option>
                <option value="E Dhënë me Qira">Rented (Not available)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:col-span-2 pt-6 border-t border-white/5">
            <div className="space-y-3">
              <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">Rooms</label>
              <div className="relative">
                <DoorOpen size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                <input 
                  type="number" 
                  value={formData.rooms} 
                  onChange={(e) => setFormData({...formData, rooms: e.target.value})} 
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
                  onChange={(e) => setFormData({...formData, bathrooms: e.target.value})} 
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
                  onChange={(e) => setFormData({...formData, area: e.target.value})} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white outline-none focus:border-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                />
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2 pt-6 border-t border-white/5">
            <h3 className="text-white text-lg font-bold tracking-tight mb-6">Property Photos</h3>

            <div className="relative border-2 border-dashed border-white/10 hover:border-white/30 rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all bg-white/5">
                <input 
                  type="file" 
                  multiple 
                  onChange={handleFileChange}
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <UploadCloud size={32} className="text-white/40 mb-4" />
                <p className="text-sm font-bold text-white uppercase tracking-widest mb-1">Drag photos here</p>
                <p className="text-[10px] text-white/40 font-bold tracking-[0.2em] uppercase">or click to select from computer</p>
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="mt-6 space-y-3">
                {selectedFiles.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-black p-4 rounded-2xl border border-white/5">
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
                      <X size={16}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* STEP 1: BASE PROPERTY SAVE BUTTON */}
        {step === 1 && (
          <button type="submit" className="w-full bg-white text-black font-black text-[11px] tracking-[0.4em] py-6 rounded-2xl hover:bg-neutral-200 transition-all uppercase shadow-xl">
            {editData ? 'Save Changes' : 'Register Property'}
          </button>
        )}
      </form>

      {/* STEP 2: EXTRA FEATURES SECTION */}
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

          {/* Features Component */}
          <PropertyFeatures propertyId={savedId} onBack={() => {}} />

          {/* Final Button */}
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