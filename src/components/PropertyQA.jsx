import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Pencil, Trash2, Check, X, Loader } from 'lucide-react';
import { apiFetch } from '../lib/api';

const inputCls = 'w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl px-3 py-2 outline-none resize-none focus:border-white/30 transition placeholder:text-white/20';

function AdminQAEdit({ item, onSave, onCancel }) {
  const [question, setQuestion] = useState(item.question);
  const [answer,   setAnswer]   = useState(item.answer);
  const [saving,   setSaving]   = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(item.id, item._source, { question, answer });
    setSaving(false);
  };

  return (
    <div className="px-5 py-4 border-t border-white/5 space-y-3 bg-black/20">
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1.5">Question</p>
        <input value={question} onChange={e => setQuestion(e.target.value)} className={inputCls} />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1.5">Answer</p>
        <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1 bg-white text-black px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition disabled:opacity-50">
          {saving ? <Loader size={10} className="animate-spin" /> : <Check size={10} />} Save
        </button>
        <button onClick={onCancel}
          className="px-4 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-wider transition">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function PropertyQA({ propertyId, isAdmin = false }) {
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [openId,    setOpenId]    = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deletingId,setDeletingId]= useState(null);

  const load = () => {
    if (!propertyId) return;
    setLoading(true);
    apiFetch(`/api/qa/property/${propertyId}`)
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [propertyId]);

  const handleAdminSave = async (id, source, form) => {
    const endpoint = source === 'property'
      ? `/api/qa/specific/${id}`
      : `/api/qa/global/${id}`;
    await apiFetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setEditingId(null);
    load();
  };

  const handleAdminDelete = async (id, source) => {
    if (!window.confirm('Delete this Q&A item?')) return;
    setDeletingId(id);
    const endpoint = source === 'property'
      ? `/api/qa/specific/${id}`
      : `/api/qa/global/${id}`;
    try {
      await apiFetch(endpoint, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) { alert(err.message); }
    finally { setDeletingId(null); }
  };

  if (loading) return null;
  if (items.length === 0) {
    if (isAdmin) return (
      <p className="text-white/20 text-xs italic">No Q&A set up for this property.</p>
    );
    return null;
  }

  return (
    <div className={isAdmin ? '' : 'border-t border-white/10 pt-10 mt-10'}>
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle size={14} className="text-white/40" />
        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/40">
          Common Questions
        </p>
        {isAdmin && items[0]?._source && (
          <span className={`ml-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
            items[0]._source === 'property'
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              : 'bg-white/5 text-white/30 border-white/10'
          }`}>
            {items[0]._source === 'property' ? 'Property-specific' : 'Agent global'}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id}
            className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">

            {/* Question row */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpenId(openId === item.id ? null : item.id)}
                className="flex-1 flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/5 transition"
              >
                <span className="text-white font-semibold text-sm">{item.question}</span>
                {openId === item.id
                  ? <ChevronUp size={15} className="text-white/40 shrink-0" />
                  : <ChevronDown size={15} className="text-white/40 shrink-0" />}
              </button>

              {/* Admin controls */}
              {isAdmin && editingId !== item.id && (
                <div className="flex gap-1 pr-3 shrink-0">
                  <button onClick={() => { setEditingId(item.id); setOpenId(null); }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/30 hover:text-white transition" title="Edit">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => handleAdminDelete(item.id, item._source)}
                    disabled={deletingId === item.id}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 transition disabled:opacity-40" title="Delete">
                    {deletingId === item.id ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  </button>
                </div>
              )}
            </div>

            {/* Answer */}
            {openId === item.id && editingId !== item.id && (
              <div className="px-5 pb-4 border-t border-white/5">
                <p className="text-white/60 text-sm leading-relaxed pt-3">{item.answer}</p>
              </div>
            )}

            {/* Admin edit form */}
            {isAdmin && editingId === item.id && (
              <AdminQAEdit
                item={item}
                onSave={handleAdminSave}
                onCancel={() => setEditingId(null)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
