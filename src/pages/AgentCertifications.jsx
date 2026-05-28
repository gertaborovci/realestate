import React, { useState, useRef, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { API_BASE, apiFetch } from '../lib/api';

const AgentCertifications = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [certifications, setCertifications] = useState([]);
  const fileInputRef = useRef(null);

  const loadCertifications = async () => {
    try {
      const data = await apiFetch('/api/certifications');
      setCertifications(data);
    } catch (error) {
      console.error('Failed to load certifications:', error);
    }
  };

  useEffect(() => {
    loadCertifications();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile({
        file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  const handleFinalSubmit = async () => {
    if (!selectedFile) {
      alert("Ju lutem zgjidhni një foto!");
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile.file);
    formData.append('type', 'Passport / ID'); 

    try {
      const response = await fetch(`${API_BASE}/api/certifications`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert("Dokumenti u ngarkua me sukses!");
        setShowModal(false);
        setSelectedFile(null);
        loadCertifications();
      } else {
        alert("Gabim gjatë ruajtjes në server.");
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Gabim në rrjet.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-4xl font-extrabold uppercase tracking-tight leading-none mb-12">
        AGENT CERTIFICATIONS
      </h2>
      
      <div className="bg-[#111] border border-white/10 rounded-3xl p-10">
        <div className="flex justify-between items-center mb-8">
          <h4 className="text-sm font-bold uppercase tracking-widest text-white/50">Your Certificates</h4>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-white text-black px-6 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-all"
          >
            + Upload New
          </button>
        </div>
        
        <div className="grid grid-cols-4 gap-4 px-5 mb-4 text-[10px] font-bold uppercase text-white/40 tracking-widest">
          <span>Certificate Name</span>
          <span>Type</span>
          <span>Status</span>
          <span className="text-right">Expires</span>
        </div>

        <div className="space-y-4">
          {certifications.length === 0 ? (
            <p className="text-white/40 text-sm">No certifications uploaded yet.</p>
          ) : (
            certifications.map((cert) => (
              <div key={cert.id} className="grid grid-cols-4 gap-4 items-center p-5 border border-white/10 rounded-2xl bg-[#0a0a0a]">
                <span className="text-sm font-bold">{cert.type}</span>
                <span className="text-xs text-white/60">{cert.type}</span>
                <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full w-fit ${
                  cert.status === 'Verified' ? 'text-green-500 bg-green-500/10' :
                  cert.status === 'Rejected' ? 'text-red-500 bg-red-500/10' :
                  'text-yellow-500 bg-yellow-500/10'
                }`}>{cert.status}</span>
                <span className="text-xs text-white/40 text-right">{cert.expires_at || '-'}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 p-6 border border-dashed border-white/10 rounded-3xl flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest">Agent Trust Score</h4>
          <p className="text-[10px] text-white/40">Upload all required docs to get your Verified Badge.</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-white">66%</span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4">
          <div className="bg-[#111] border border-white/10 p-8 rounded-3xl w-full max-w-sm relative">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-white/50 hover:text-white">
              <X size={20}/>
            </button>
            <h3 className="font-bold uppercase tracking-widest mb-6">Upload Document</h3>
            
            <div className="mb-4">
              <label className="text-[10px] font-bold uppercase text-white/40 mb-2 block">Choose Type</label>
              <select className="w-full bg-[#050505] border border-white/10 rounded-xl p-4 text-sm text-white outline-none cursor-pointer">
                <option>Passport / ID</option>
                <option>Real Estate License</option>
                <option>Sales Training Certificate</option>
              </select>
            </div>

            <div 
              onClick={() => fileInputRef.current.click()}
              className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer mb-6 hover:border-white/30 transition-all bg-white/5"
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              {selectedFile ? (
                <div className="text-center">
                  <img src={selectedFile.preview} alt="preview" className="h-16 mx-auto rounded-lg mb-2 object-cover" />
                  <p className="text-[10px] font-bold text-white">{selectedFile.file.name}</p>
                </div>
              ) : (
                <><Upload className="text-white/40 mb-2" size={24} /><span className="text-[10px] font-bold uppercase text-white/40">Click to upload photo</span></>
              )}
            </div>

            <button 
              onClick={handleFinalSubmit}
              className="w-full bg-white text-black py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-neutral-200 transition-all"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentCertifications;