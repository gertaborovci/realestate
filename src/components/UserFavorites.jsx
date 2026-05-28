import React from 'react';
import { Heart, Building, MapPin, DoorOpen, Bath, Maximize, ChevronRight } from 'lucide-react';

const getStatusDisplay = (status) => {
  if (!status) return 'AVAILABLE';
  const upper = status.toUpperCase();
  if (upper.includes('SHITUR') || upper === 'SOLD') return 'SOLD';
  if ((upper.includes('QIRA') && upper.includes('DHËNË')) || upper === 'RENTED') return 'RENTED';
  return 'AVAILABLE';
};

const getStatusBadgeStyle = (status) => {
  switch (getStatusDisplay(status)) {
    case 'SOLD':   return 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]';
    case 'RENTED': return 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]';
    default:       return 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]';
  }
};

export default function UserFavorites({ favorites, handleRemoveFavorite, onViewProperty }) {
  return (
    <div className="max-w-7xl mx-auto mt-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Heart className="text-red-500 fill-red-500" size={22} />
          <h2 className="text-2xl font-bold text-white">My Saved Properties</h2>
        </div>
        <span className="bg-white/5 border border-white/10 text-white/50 text-sm font-semibold px-4 py-2 rounded-full flex items-center gap-2">
          <Building size={14} />
          {favorites.length} {favorites.length === 1 ? 'Property' : 'Properties'} Saved
        </span>
      </div>

      {/* Empty state */}
      {favorites.length === 0 ? (
        <div className="bg-white/5 border border-white/10 border-dashed p-16 rounded-[40px] text-center">
          <Heart size={48} className="mx-auto mb-4 text-white/20" />
          <p className="text-lg font-bold text-white/40">No saved properties yet.</p>
          <p className="text-sm mt-2 text-white/30">
            Browse properties and click the heart icon to save them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
          {favorites.map((property) => (
            <div
              key={property.id}
              onClick={() => onViewProperty && onViewProperty(property.id)}
              className="group cursor-pointer relative bg-[#0a0a0a] rounded-[40px] border border-white/5 overflow-hidden hover:shadow-2xl hover:border-white/20 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full"
            >
              {/* Image */}
              <div className="h-72 w-full overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent z-10" />
                <img
                  src={property.mainImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1920'}
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                />
                {/* Price badge */}
                <div className="absolute top-6 left-6 bg-white text-black px-4 py-2 rounded-full font-black tracking-tighter text-sm z-20 shadow-xl">
                  €{Number(property.price).toLocaleString()}
                </div>
                {/* Status badge */}
                <div className={`absolute top-6 right-6 px-4 py-2 rounded-full text-[9px] font-black tracking-widest uppercase z-20 border border-white/10 ${getStatusBadgeStyle(property.status)}`}>
                  {getStatusDisplay(property.status)}
                </div>
                {/* Remove from favorites */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveFavorite(property.id); }}
                  className="absolute bottom-6 right-6 z-20 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 p-3 rounded-full transition-all hover:scale-110"
                  title="Remove from favorites"
                >
                  <Heart size={16} className="text-red-500 fill-red-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 relative z-20 -mt-10 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/40 mb-2 flex items-center gap-2">
                    <MapPin size={12} /> {property.location}
                  </p>
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-6 line-clamp-1">
                    {property.title}
                  </h3>
                  <div className="flex gap-6 text-white/60 text-sm font-medium mb-6">
                    <div className="flex items-center gap-2"><DoorOpen size={16} /> {property.rooms || 0}</div>
                    <div className="flex items-center gap-2"><Bath size={16} /> {property.bathrooms || 0}</div>
                    <div className="flex items-center gap-2"><Maximize size={16} /> {property.area || 0}m²</div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-4 group-hover:border-white/20 transition-colors">
                  <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase">View Details</p>
                  <div className="bg-white text-black p-3 rounded-full group-hover:scale-110 transition-transform">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
