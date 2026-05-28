import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Tag, List } from 'lucide-react';
import { API_BASE } from '../lib/api';

const PropertyFeatures = ({ propertyId, onBack }) => {
  const [features, setFeatures] = useState([]);
  const [emertimi, setEmertimi] = useState('');
  const [vlera, setVlera] = useState('');

  // 1. Fetch features from the database
  const fetchFeatures = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/properties/${propertyId}/features`);
      if (res.ok) {
        const data = await res.json();
        setFeatures(data);
      }
    } catch (error) {
      console.error("Error fetching features:", error);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, [propertyId]);

  // 2. Add a new feature
  const handleAddFeature = async (e) => {
    e.preventDefault();
    if (!emertimi || !vlera) return;

    try {
      const res = await fetch(`${API_BASE}/api/properties/${propertyId}/features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emertimi, vlera })
      });

      if (res.ok) {
        setEmertimi('');
        setVlera('');
        fetchFeatures(); // Refresh the list automatically
      }
    } catch (error) {
      console.error("Error adding feature:", error);
    }
  };

  // 3. Delete a feature
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/properties/features/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchFeatures();
    } catch (error) {
      console.error("Error deleting feature:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
        <span className="text-[10px] font-bold tracking-[0.2em]">GO BACK</span>
      </button>

      <h2 className="text-white text-4xl font-bold tracking-tighter mb-2 uppercase">
        Property Features
      </h2>
      <p className="text-white/40 text-sm mb-12">Add specific characteristics (e.g., Elevator: Yes, Heating: Central)</p>

      <div className="bg-[#0A0A0A] border border-white/10 p-12 rounded-[40px] shadow-2xl">
        
        {/* ADD FEATURE FORM */}
        <form onSubmit={handleAddFeature} className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12 items-end">
          <div className="space-y-3 md:col-span-2">
            <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">Feature Name</label>
            <div className="relative">
              <Tag size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
              <input 
                type="text" 
                value={emertimi} 
                onChange={(e) => setEmertimi(e.target.value)} 
                placeholder="E.g. Elevator"
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white focus:border-white/30 outline-none transition-all" 
              />
            </div>
          </div>

          <div className="space-y-3 md:col-span-2">
            <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">Value</label>
            <div className="relative">
              <List size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
              <input 
                type="text" 
                value={vlera} 
                onChange={(e) => setVlera(e.target.value)} 
                placeholder="E.g. Yes"
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white focus:border-white/30 outline-none transition-all" 
              />
            </div>
          </div>

          <button type="submit" className="md:col-span-1 w-full bg-white text-black font-black text-[11px] tracking-[0.2em] py-5 rounded-2xl hover:bg-neutral-200 transition-all uppercase flex items-center justify-center gap-2 h-[66px]">
            <Plus size={16} /> Add
          </button>
        </form>

        <div className="border-t border-white/5 pt-10">
          <h3 className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase mb-6">List of Features ({features.length})</h3>
          
          {features.length === 0 ? (
            <div className="text-center py-10 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <p className="text-white/30 text-sm font-bold tracking-widest uppercase">No added features.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature) => (
                <div key={feature.id} className="flex items-center justify-between bg-black p-5 rounded-2xl border border-white/5 group hover:border-white/20 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-white/50 text-[10px] font-bold tracking-widest uppercase mb-1">{feature.emertimi}</span>
                    <span className="text-white text-sm font-bold">{feature.vlera}</span>
                  </div>
                  <button 
                    onClick={() => handleDelete(feature.id)}
                    className="text-white/20 hover:text-red-500 hover:bg-red-500/10 p-3 rounded-full transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PropertyFeatures;