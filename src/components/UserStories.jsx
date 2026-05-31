import React, { useState } from 'react';
import { MessageSquare, PlusCircle, Pencil, Trash2, Check, X, Loader } from 'lucide-react';
import { apiFetch, API_BASE } from '../lib/api';

export default function UserStories({ testimonials, setIsStoryModalOpen, setTestimonials }) {
  const [editingId,   setEditingId]   = useState(null);
  const [editText,    setEditText]    = useState('');
  const [editName,    setEditName]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const [deletingId,  setDeletingId]  = useState(null);

  const startEdit = (t) => {
    setEditingId(t.id);
    setEditText(t.text  || t.teksti        || '');
    setEditName(t.client || t.klienti_emri || '');
  };

  const cancelEdit = () => { setEditingId(null); setEditText(''); setEditName(''); };

  const saveEdit = async (id) => {
    if (!editText.trim()) { alert('Story text cannot be empty.'); return; }
    setSaving(true);
    try {
      await apiFetch(`/api/testimonials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ klienti_emri: editName || 'Anonymous', teksti: editText }),
      });
      // Update local state
      if (setTestimonials) {
        setTestimonials(prev => prev.map(t =>
          t.id === id ? { ...t, teksti: editText, text: editText, klienti_emri: editName, client: editName } : t
        ));
      }
      cancelEdit();
    } catch (err) {
      alert(err.message || 'Failed to update story.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this story? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/testimonials/${id}`, { method: 'DELETE' });
      if (setTestimonials) setTestimonials(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete story.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
          <MessageSquare size={20} /> Your Stories
        </h2>
        <button
          onClick={() => setIsStoryModalOpen(true)}
          className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-sm font-bold transition"
        >
          <PlusCircle size={16} /> Add Story
        </button>
      </div>

      {testimonials.length === 0 && (
        <div className="text-center py-12 text-white/30">
          <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-bold uppercase tracking-widest">No stories yet</p>
          <p className="text-xs mt-1">Share your experience with KosovaNest.</p>
        </div>
      )}

      <div className="space-y-3">
        {testimonials.map((t) => {
          const text   = t.text   || t.teksti        || '';
          const client = t.client || t.klienti_emri  || 'Anonymous';

          return (
            <div key={t.id} className="p-5 bg-zinc-900/60 rounded-2xl border border-white/5 group">
              {editingId === t.id ? (
                /* ── Edit mode ── */
                <div className="space-y-3">
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Your name (optional)"
                    className="w-full bg-black/50 border border-zinc-700 focus:border-zinc-500 text-white text-sm rounded-xl px-4 py-2.5 outline-none transition placeholder:text-white/20"
                  />
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    rows={3}
                    className="w-full bg-black/50 border border-zinc-700 focus:border-zinc-500 text-white text-sm rounded-xl px-4 py-3 outline-none resize-none transition"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(t.id)} disabled={saving}
                      className="flex items-center gap-1.5 bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition disabled:opacity-50">
                      {saving ? <Loader size={12} className="animate-spin" /> : <Check size={12} />} Save
                    </button>
                    <button onClick={cancelEdit}
                      className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white/50 hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition">
                      <X size={12} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* ── View mode ── */
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Photo if present */}
                    {(t.foto_url) && (
                      <img
                        src={t.foto_url.startsWith('http') ? t.foto_url : `${API_BASE}${t.foto_url}`}
                        alt="story"
                        className="w-full h-40 object-cover rounded-xl border border-zinc-800"
                      />
                    )}
                    <p className="italic text-zinc-300 text-sm leading-relaxed">"{text}"</p>
                    <span className="text-xs font-bold text-emerald-400 block">— {client}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => startEdit(t)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(t.id)} disabled={deletingId === t.id}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition disabled:opacity-40">
                      {deletingId === t.id ? <Loader size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
