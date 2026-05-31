import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, ExternalLink, Building2 } from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function OfficeLocations() {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/offices')
      .then((data) => setOffices(Array.isArray(data) ? data : []))
      .catch(() => setOffices([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null; // silent load — don't flash a spinner in the footer
  if (offices.length === 0) return null; // nothing to show

  return (
    <section className="w-full bg-[#050505] text-white px-16 md:px-24 py-24">
      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <div className="mb-14">
          <p className="text-[11px] font-black tracking-[0.4em] uppercase text-white/30 mb-3">
            Find Us
          </p>
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-[0.85]">
            Our Offices
          </h2>
        </div>

        {/* Office cards */}
        <div className={`grid gap-6 ${
          offices.length === 1
            ? 'grid-cols-1 max-w-md'
            : offices.length === 2
            ? 'grid-cols-1 md:grid-cols-2 max-w-3xl'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {offices.map((office) => (
            <div
              key={office.id}
              className="group bg-white/[0.03] border border-white/8 rounded-[28px] p-8 space-y-6
                         hover:bg-white/[0.06] hover:border-white/15 transition-all duration-300"
            >
              {/* Office name + city */}
              <div>
                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30 mb-2">
                  {office.city}
                </p>
                <h3 className="text-xl font-black text-white leading-tight">{office.name}</h3>
              </div>

              {/* Info */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-white/60">
                  <MapPin size={15} className="shrink-0 mt-0.5 text-white/30" />
                  <span className="text-sm leading-relaxed">{office.address}</span>
                </div>

                {office.phone && (
                  <div className="flex items-center gap-3 text-white/60">
                    <Phone size={15} className="text-white/30" />
                    <a
                      href={`tel:${office.phone}`}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {office.phone}
                    </a>
                  </div>
                )}

                {office.email && (
                  <div className="flex items-center gap-3 text-white/60">
                    <Mail size={15} className="text-white/30" />
                    <a
                      href={`mailto:${office.email}`}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {office.email}
                    </a>
                  </div>
                )}

                {office.working_hours && (
                  <div className="flex items-start gap-3 text-white/60">
                    <Clock size={15} className="shrink-0 mt-0.5 text-white/30" />
                    <span className="text-sm leading-relaxed">{office.working_hours}</span>
                  </div>
                )}
              </div>

              {/* Map link */}
              {office.map_url && (
                <a
                  href={office.map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10
                             text-white text-[10px] font-black tracking-widest uppercase px-5 py-3 rounded-full
                             transition-all group-hover:border-white/20"
                >
                  <MapPin size={12} />
                  View on Map
                  <ExternalLink size={10} className="opacity-50" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
