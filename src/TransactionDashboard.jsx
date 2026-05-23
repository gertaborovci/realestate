import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, FileText, CheckCircle, Clock, TrendingUp } from 'lucide-react';

export default function TransactionDashboard() {
  const [stats, setStats] = useState({ overview: {}, monthlyRevenue: [] });
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    property_id: '1', 
    user_id: '1',     
    visit_date: '',
    visit_time: ''
  });
  const [message, setMessage] = useState({ text: '', isError: false });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setStats({
          overview: { total_contracts: 12, total_sales: 540000, total_rents: 14800 },
          monthlyRevenue: [
            { month: 'Jan', total: 45000 },
            { month: 'Feb', total: 95000 },
            { month: 'Mar', total: 60000 },
            { month: 'Apr', total: 140000 },
            { month: 'May', total: 110000 }
          ]
        });

        const defaultVisits = [
          { id: 1, property_title: "Modern Glass Villa", location: "Dubai", visit_date: "2026-05-25", visit_time: "14:00", status: "APPROVED" },
          { id: 2, property_title: "Banesë në Prishtinë", location: "Qendër", visit_date: "2026-05-28", visit_time: "11:30", status: "PENDING" }
        ];

        try {
          const res = await fetch('http://localhost:5000/api/visits');
          if (res.ok) {
            const dbVisits = await res.json();
            setVisits([...defaultVisits, ...dbVisits]);
          } else {
            setVisits(defaultVisits);
          }
        } catch (dbErr) {
          setVisits(defaultVisits);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Gabim gjatë ngarkimit të të dhënave", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleBooking = async (e) => {
    e.preventDefault();
    setMessage({ text: '', isError: false });

    if (!formData.visit_date || !formData.visit_time) {
      setMessage({ text: 'Ju lutem plotësoni datën dhe orën!', isError: true });
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: 'Rezervimi i vizitës u ruajt në databazë me sukses!', isError: false });
        
        setVisits([...visits, {
          id: data.visitId || Date.now(),
          property_title: "Vizitë e re e planifikuar",
          location: "Lokacioni i zgjedhur",
          visit_date: formData.visit_date,
          visit_time: formData.visit_time,
          status: 'PENDING'
        }]);

        setFormData({ ...formData, visit_date: '', visit_time: '' });
      } else {
        setMessage({ text: data.error || 'Gabim gjatë ruajtjes në server.', isError: true });
      }
    } catch (err) {
      setMessage({ text: 'Gabim rrjeti: ' + err.message, isError: true });
    }
  };

  const maxRevenue = Math.max(...stats.monthlyRevenue.map(d => d.total), 1);

  if (loading) return <div className="p-6 text-center text-slate-500">Duke u ngarkuar...</div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800 font-sans">
      {/* KOKA E PANELIT */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Paneli i Transaksioneve</h1>
          <p className="text-sm text-slate-500 mt-1">Menaxhimi i vizitave, kontratave dhe statistikave të biznesit.</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-semibold text-sm border border-indigo-100">
          <TrendingUp size={16} /> Viti Akademik 2025/2026
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vëllimi i Shitjeve</p>
            <h3 className="text-2xl font-bold mt-1 text-emerald-600">${stats.overview.total_sales?.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign size={24} /></div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Të hyrat nga Qiratë</p>
            <h3 className="text-2xl font-bold mt-1 text-blue-600">${stats.overview.total_rents?.toLocaleString()}/muaj</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><FileText size={24} /></div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kontrata të Nënshkruara</p>
            <h3 className="text-2xl font-bold mt-1 text-slate-900">{stats.overview.total_contracts} Kontrata</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><CheckCircle size={24} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Grafiku i Pagesave Mujore</h2>
            <p className="text-xs text-slate-400 mt-0.5">Pasqyrimi vizual i të hyrave të realizuara.</p>
          </div>
          
          <div className="h-64 flex items-end gap-4 pt-8 border-b border-l border-slate-200 px-4 mt-4">
            {stats.monthlyRevenue.map((data, index) => {
              const barHeight = (data.total / maxRevenue) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  <span className="absolute -top-2 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    ${data.total / 1000}k
                  </span>
                  <div 
                    style={{ height: `${barHeight}%` }} 
                    className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-t-lg transition-all duration-500 cursor-pointer shadow-sm"
                  />
                  <span className="text-xs font-semibold text-slate-500 mt-2">{data.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Cakto një Vizitë të Re</h2>
          <p className="text-xs text-slate-400 mt-0.5">Përzgjidhni datën dhe orën e lirë.</p>

          <form onSubmit={handleBooking} className="space-y-4 mt-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase">Data e Vizitës</label>
              <input 
                type="date" 
                className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                value={formData.visit_date}
                onChange={(e) => setFormData({...formData, visit_date: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase">Ora e Vizitës</label>
              <input 
                type="time" 
                className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                value={formData.visit_time}
                onChange={(e) => setFormData({...formData, visit_time: e.target.value})}
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm cursor-pointer"
            >
              Gjenero Rezervimin
            </button>

            {message.text && (
              <p className={`text-xs text-center font-medium mt-2 p-2 rounded ${message.isError ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {message.text}
              </p>
            )}
          </form>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Terminet e Vizitave</h2>
            <p className="text-xs text-slate-400 mt-0.5">Lista e të gjitha rezervimeve aktive të gjeneruara nga kalendari.</p>
          </div>
          <Calendar className="text-indigo-600" size={20} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visits.map((visit, index) => (
            <div key={visit.id || index} className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{visit.property_title || "Vizitë e planifikuar"}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{visit.location || "Lokacioni i zgjedhur"}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider ${
                  visit.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {visit.status}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-xs font-medium text-slate-600 mt-4 pt-2 border-t border-slate-200/40">
                <span className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-400"/> {visit.visit_date}</span>
                <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400"/> {visit.visit_time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}