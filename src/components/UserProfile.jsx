import React, { useState, useEffect } from 'react';

export default function UserProfile({ clientId = 1 }) { 
  // Shënim: Kemi lënë clientId = 1 si default për testim. Më vonë këtë e merr dinamikisht.
  
  const [clientInfo, setClientInfo] = useState({
    emri: '',
    mbiemri: '',
    telefoni: '',
    email: '',
    buxheti_max: '',
    preferencat: '',
    lloji_klientit: ''
  });

  const [message, setMessage] = useState('');

  // 1. Merr të dhënat aktuale kur hapet profili
  useEffect(() => {
    fetch('http://localhost:5000/api/clients')
      .then(res => res.json())
      .then(data => {
        const currentClient = data.find(c => c.id === clientId);
        if (currentClient) {
          setClientInfo({
            emri: currentClient.emri || '',
            mbiemri: currentClient.mbiemri || '',
            telefoni: currentClient.telefoni || '',
            email: currentClient.email || '',
            buxheti_max: currentClient.buxheti_max || '',
            preferencat: currentClient.preferencat || '',
            lloji_klientit: currentClient.lloji_klientit || ''
          });
        }
      })
      .catch(err => console.error("Gabim në marrjen e të dhënave:", err));
  }, [clientId]);

  // 2. Ruaj të dhënat e reja në bazën e të dhënave
  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    setMessage('Po ruhet...');
    
    try {
      const response = await fetch(`http://localhost:5000/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientInfo)
      });

      if (response.ok) {
        setMessage('Të dhënat u ruajtën me sukses në Find Home DB!');
        setTimeout(() => setMessage(''), 4000); 
      } else {
        setMessage('Gabim në ruajtje. Provo përsëri.');
      }
    } catch (error) {
      console.error("Gabim:", error);
      setMessage('Gabim në lidhje me serverin.');
    }
  };

  // 3. Përditëso formën kur përdoruesi shkruan
  const handleChange = (e) => {
    setClientInfo({
      ...clientInfo,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="bg-[#050505] p-8 rounded-2xl border border-zinc-800 text-white w-full">
      <h2 className="text-3xl font-black tracking-tighter uppercase mb-6">Përditëso Profilin</h2>
      
      {/* Mesazhi i suksesit ose gabimit */}
      {message && (
        <div className={`p-4 mb-6 rounded-xl font-bold ${message.includes('sukses') ? 'bg-green-900/30 text-green-400 border border-green-800/50' : 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleUpdateInfo} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col">
            <label className="text-zinc-500 font-bold text-xs uppercase tracking-widest mb-2">Emri</label>
            <input 
              type="text" name="emri" value={clientInfo.emri} onChange={handleChange}
              className="bg-black border border-zinc-800 rounded-xl p-4 text-white focus:border-zinc-500 outline-none transition"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-zinc-500 font-bold text-xs uppercase tracking-widest mb-2">Mbiemri</label>
            <input 
              type="text" name="mbiemri" value={clientInfo.mbiemri} onChange={handleChange}
              className="bg-black border border-zinc-800 rounded-xl p-4 text-white focus:border-zinc-500 outline-none transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col">
            <label className="text-zinc-500 font-bold text-xs uppercase tracking-widest mb-2">Email</label>
            <input 
              type="email" name="email" value={clientInfo.email} onChange={handleChange}
              className="bg-black border border-zinc-800 rounded-xl p-4 text-white focus:border-zinc-500 outline-none transition"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-zinc-500 font-bold text-xs uppercase tracking-widest mb-2">Telefoni</label>
            <input 
              type="text" name="telefoni" value={clientInfo.telefoni} onChange={handleChange}
              className="bg-black border border-zinc-800 rounded-xl p-4 text-white focus:border-zinc-500 outline-none transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col">
            <label className="text-zinc-500 font-bold text-xs uppercase tracking-widest mb-2">Buxheti Maksimal (€)</label>
            <input 
              type="number" name="buxheti_max" value={clientInfo.buxheti_max} onChange={handleChange}
              className="bg-black border border-zinc-800 rounded-xl p-4 text-white focus:border-zinc-500 outline-none transition"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-zinc-500 font-bold text-xs uppercase tracking-widest mb-2">Lloji i Klientit</label>
            <select 
              name="lloji_klientit" value={clientInfo.lloji_klientit} onChange={handleChange}
              className="bg-black border border-zinc-800 rounded-xl p-4 text-white focus:border-zinc-500 outline-none transition"
            >
              <option value="" className="text-zinc-500">Zgjidh llojin...</option>
              <option value="Blerës">Blerës</option>
              <option value="Qiramarrës">Qiramarrës</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-zinc-500 font-bold text-xs uppercase tracking-widest mb-2">Preferencat e Pronës</label>
          <textarea 
            name="preferencat" value={clientInfo.preferencat} onChange={handleChange} rows="3"
            placeholder="P.sh. 2 dhoma gjumi, afër qendrës, ballkon..."
            className="bg-black border border-zinc-800 rounded-xl p-4 text-white focus:border-zinc-500 outline-none transition resize-none"
          ></textarea>
        </div>

        <button 
          type="submit" 
          className="w-full mt-4 bg-white hover:bg-zinc-200 text-black font-bold text-sm tracking-widest uppercase py-4 rounded-xl transition duration-300"
        >
          Ruaj Të Dhënat
        </button>
      </form>
    </div>
  );
}