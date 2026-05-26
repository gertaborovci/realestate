import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

const ContactInquiries = () => {
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);

  const handleReplyClick = (clientName) => {
    setSelectedClient(clientName);
    setShowReplyModal(true);
  };

  const handleSendReply = async () => {
    if (!replyText) return;
    
    // Këtu do të bësh fetch te backend-i yt
    console.log("Dërgohet përgjigja:", replyText, "për:", selectedClient);
    
    alert("Përgjigja u dërgua!");
    setReplyText("");
    setShowReplyModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-4xl font-extrabold uppercase tracking-tight leading-none mb-12">
        CONTACT INQUIRIES
      </h2>

      <div className="bg-[#111] border border-white/10 rounded-3xl p-10">
        <h4 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-8">Recent Messages</h4>
        
        <div className="space-y-6">
          {/* Mesazhi 1 */}
          <div className="border-b border-white/10 pb-6">
            <div className="flex justify-between mb-2">
              <h3 className="font-bold text-lg">Klienti: Arben Hoxha</h3>
              <span className="text-[10px] text-white/40 uppercase">24 Maj, 2026</span>
            </div>
            <p className="text-sm text-white/70 mb-4">Përshëndetje, jam i interesuar për vilën në Veternik. A mund të caktojmë një vizitë?</p>
            <button 
              onClick={() => handleReplyClick("Arben Hoxha")}
              className="text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-white"
            >
              Reply Message
            </button>
          </div>
        </div>
      </div>

      {/* MODALI PËR PËRGJIGJE */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 p-8 rounded-3xl w-full max-w-md relative">
            <button onClick={() => setShowReplyModal(false)} className="absolute top-6 right-6 text-white/50"><X size={20}/></button>
            <h3 className="font-bold uppercase tracking-widest mb-6">Reply to {selectedClient}</h3>
            
            <textarea 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full h-32 bg-[#050505] border border-white/10 rounded-xl p-4 text-sm text-white outline-none mb-4"
              placeholder="Shkruaj përgjigjen këtu..."
            />

            <button 
              onClick={handleSendReply}
              className="w-full bg-white text-black py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
            >
              <Send size={14} /> Send Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactInquiries;