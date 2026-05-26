import React from 'react';
import { Heart, Building, MapPin, Trash2, Plus } from 'lucide-react';

export default function UserFavorites({ favorites, handleRemoveFavorite, onAddFavorite }) {
  return (
    <div className="max-w-7xl mx-auto mt-8">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Heart className="text-red-500 fill-red-500" size={22} />
          <h2 className="text-2xl font-bold text-white">Pronat e mia të preferuara</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Building size={13} /> Total: {favorites.length}
          </span>
          <button 
            onClick={onAddFavorite}
            className="bg-white text-black hover:bg-zinc-200 transition font-bold px-4 py-2 rounded-xl flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> Shto Pronë
          </button>
        </div>
      </div>

      {/* --- FAVORITES GRID --- */}
      {favorites.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 border-dashed p-14 rounded-2xl text-center text-zinc-500 font-medium">
          Nuk keni asnjë pronë të ruajtur.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {favorites.map((property) => (
            <div
              key={property.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-zinc-700 transition duration-300 shadow-xl flex flex-col"
            >
              {/* --- IMAGE SECTION --- */}
              <div className="relative h-52 overflow-hidden">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                />
                <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-zinc-200 border border-zinc-800">
                  <MapPin size={12} /> {property.location}
                </span>
                <button
                  onClick={() => handleRemoveFavorite(property.id)}
                  className="absolute top-3 right-3 bg-red-500/20 hover:bg-red-500/30 p-2 rounded-xl border border-red-500/30 transition hover:scale-110"
                >
                  <Heart size={15} className="text-red-500 fill-red-500" />
                </button>
              </div>

              {/* --- CONTENT SECTION --- */}
              <div className="p-5 flex flex-col flex-1 justify-between">
                <div>
                  <h3 className="text-base font-bold text-white mb-3">{property.title}</h3>
                  <div className="inline-block bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
                    <p className="text-base font-black text-emerald-400">€{property.price}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleRemoveFavorite(property.id)}
                  className="w-full mt-5 bg-black hover:bg-red-950/30 border border-zinc-800 hover:border-red-900/40 text-zinc-400 hover:text-red-400 py-3 rounded-xl text-sm font-semibold transition duration-300 flex items-center justify-center gap-2"
                >
                  <Trash2 size={15} /> Hiq nga të Preferuarat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}