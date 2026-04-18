import React, { useState, useEffect } from 'react';
import { ArrowLeft, Euro, MapPin, Image as ImageIcon, DoorOpen, Bath, Maximize, Activity } from 'lucide-react';

const AddProperty = ({ onBack, onAdd, editData }) => {
  const [formData, setFormData] = useState({
    title: '', 
    price: '', 
    location: '', 
    type: 'BUY', 
    status: 'Available', 
    image: '', 
    rooms: '', 
    bathrooms: '', 
    area: ''
  });

  useEffect(() => {
    if (editData) setFormData(editData);
  }, [editData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData); 
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
        <span className="text-[10px] font-bold tracking-[0.2em]">KTHEHU TE LISTA</span>
      </button>

      <h2 className="text-white text-4xl font-bold tracking-tighter mb-12 uppercase">
        {editData ? 'Modifiko Pronën' : 'Shto Pronë të Re'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-10 bg-[#0A0A0A] border border-white/10 p-12 rounded-[40px] shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* URL E FOTOS */}
          <div className="space-y-3 md:col-span-2">
            <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">URL e Fotos</label>
            <div className="relative">
              <ImageIcon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
              <input 
                type="text" 
                value={formData.image}
                onChange={(e) => setFormData({...formData, image: e.target.value})} 
                placeholder="/photos/Property1.jpg" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white focus:border-white/30 outline-none transition-all" 
              />
            </div>
          </div>

          {/* EMRI I PRONËS */}
          <div className="space-y-3">
            <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">Emri i Pronës</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})} 
              placeholder="P.sh. Vila në Veternik"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white focus:border-white/30 outline-none transition-all" 
            />
          </div>

          {/* LOKACIONI */}
          <div className="space-y-3">
            <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">Lokacioni</label>
            <div className="relative">
              <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
              <input 
                type="text" 
                value={formData.location} 
                onChange={(e) => setFormData({...formData, location: e.target.value})} 
                placeholder="Prishtinë"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white focus:border-white/30 outline-none transition-all" 
              />
            </div>
          </div>

          {/* ÇMIMI - ZGJIDHJA PËR INPUTIN PA SHIGJETA */}
          <div className="space-y-3">
            <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">Çmimi (€)</label>
            <div className="relative">
              <Euro size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
              <input 
                type="number" 
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})} 
                placeholder="Shkruaj çmimin (p.sh. 250000)"
                /* KLASAT POSHTË FISHEHIN SHIGJETAT E BROWSER-IT */
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white focus:border-white/30 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
              />
            </div>
          </div>

          {/* STATUSI */}
          <div className="space-y-3">
            <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">Statusi</label>
            <div className="relative">
              <Activity size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
              <select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full bg-[#0F0F0F] border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white focus:border-white/30 outline-none appearance-none cursor-pointer"
              >
                <option value="Available">E Lirë</option>
                <option value="Sold">E Shitur</option>
                <option value="Rented">Me Qira</option>
                <option value="Mortgage">Nën Hipotekë</option>
              </select>
            </div>
          </div>

          {/* DETAJET: DHOMAT, BANJOT, SIPËRFAQJA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:col-span-2 pt-6 border-t border-white/5">
            <div className="space-y-3">
              <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">Dhoma</label>
              <div className="relative">
                <DoorOpen size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
                <input 
                  type="number" 
                  value={formData.rooms} 
                  onChange={(e) => setFormData({...formData, rooms: e.target.value})} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white outline-none focus:border-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">Banjo</label>
              <div className="relative">
                <Bath size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
                <input 
                  type="number" 
                  value={formData.bathrooms} 
                  onChange={(e) => setFormData({...formData, bathrooms: e.target.value})} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white outline-none focus:border-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-white/40 text-[11px] font-bold tracking-[0.2em] px-2 uppercase">Sipërfaqja m²</label>
              <div className="relative">
                <Maximize size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
                <input 
                  type="number" 
                  value={formData.area} 
                  onChange={(e) => setFormData({...formData, area: e.target.value})} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white outline-none focus:border-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" className="w-full bg-white text-black font-black text-[11px] tracking-[0.4em] py-6 rounded-2xl hover:bg-neutral-200 transition-all uppercase shadow-xl">
          {editData ? 'Ruaj Ndryshimet' : 'Regjistro Pronën'}
        </button>
      </form>
    </div>
  );
};

export default AddProperty;