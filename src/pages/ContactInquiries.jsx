import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { apiFetch } from '../lib/api';

const ContactInquiries = () => {
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inquiries, setInquiries] = useState([]);

  const loadInquiries = async () => {
    try {
      const data = await apiFetch('/api/inquiries');
      setInquiries(data);
    } catch (error) {
      console.error('Failed to load inquiries:', error);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const handleReplyClick = (inquiry) => {
    setSelectedInquiry(inquiry);
    setShowReplyModal(true);
  };

  const handleSendReply = async () => {
    if (!replyText || !selectedInquiry) return;
    try {
      await apiFetch(`/api/inquiries/${selectedInquiry.id}/reply`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText }),
      });
      alert("Përgjigja u dërgua!");
      setReplyText("");
      setShowReplyModal(false);
      loadInquiries();
    } catch (error) {
      alert(error.message || 'Failed to send reply.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-4xl font-extrabold uppercase tracking-tight leading-none mb-12">
        CONTACT INQUIRIES
      </h2>

      <div className="bg-[#111] border border-white/10 rounded-3xl p-10">
        <h4 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-8">Recent Messages</h4>
        
        <div className="space-y-6">
          {inquiries.length === 0 ? (
            <p className="text-white/40 text-sm">No inquiries yet.</p>
          ) : (
            inquiries.map((inquiry) => (
              <div key={inquiry.id} className="border-b border-white/10 pb-6">
                <div className="flex justify-between mb-2">
                  <h3 className="font-bold text-lg">Klienti: {inquiry.client_name}</h3>
                  <span className="text-[10px] text-white/40 uppercase">{new Date(inquiry.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-white/70 mb-4">{inquiry.message}</p>
                {inquiry.reply && <p className="text-sm text-green-400 mb-4">Reply: {inquiry.reply}</p>}
                <button 
                  onClick={() => handleReplyClick(inquiry)}
                  className="text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-white"
                >
                  Reply Message
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODALI PËR PËRGJIGJE */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 p-8 rounded-3xl w-full max-w-md relative">
            <button onClick={() => setShowReplyModal(false)} className="absolute top-6 right-6 text-white/50"><X size={20}/></button>
            <h3 className="font-bold uppercase tracking-widest mb-6">Reply to {selectedInquiry?.client_name}</h3>
            
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