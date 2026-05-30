import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

// Fix Leaflet default icons in Vite (same fix as ManageNeighborhoods)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * Small embeddable map for a single property.
 * Props:
 *   latitude  – decimal latitude
 *   longitude – decimal longitude
 *   title     – property title shown in the popup
 *   height    – CSS height string (default '280px')
 */
export default function PropertyMap({ latitude, longitude, title, height = '280px' }) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  // No coords → render a subtle placeholder
  if (!latitude || !longitude || isNaN(lat) || isNaN(lng)) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-[24px]"
        style={{ height }}
      >
        <MapPin size={24} className="text-white/20" />
        <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest">No location data</p>
      </div>
    );
  }

  return (
    <div style={{ height, borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        zoomControl={true}
        attributionControl={false}
      >
        {/* Dark tile layer to match the app theme */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        <Marker position={[lat, lng]}>
          {title && (
            <Popup>
              <div style={{ fontFamily: 'sans-serif', fontSize: 13, fontWeight: 700, minWidth: 140 }}>
                {title}
              </div>
            </Popup>
          )}
        </Marker>
      </MapContainer>
    </div>
  );
}
