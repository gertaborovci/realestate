import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X, Loader, HelpCircle, ChevronDown, Eye } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { getCurrentUser } from '../lib/auth';
import { showConfirm } from '../lib/modal';

const inputCls = 'w-full bg-[#1a1a1a] border border-gray-800 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-gray-600 placeholder:text-white/20 transition';
const EMPTY    = { question: '', answer: '' };

// ── Single Q&A item form row ──────────────────────────────────────────────────
function QARow({ item, onSave, onDelete }) {
  const [editing, setEditing] = useState(item.id == null); // new items (no id) start in edit mode
  const [form,    setForm]    = useState({ question: item.question || '', answer: item.answer || '' });
  const [saving,  setSaving]  = useState(false);

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    setSaving(true);
    await onSave(item.id, form);
    setSaving(false);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="flex items-start gap-3 bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 group">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold">{item.question}</p>
          <p className="text-gray-500 text-xs mt-1 line-clamp-2">{item.answer}</p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition">
            <Pencil size={12} />
          </button>
          <button onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border border-white/15 rounded-xl p-4 space-y-3">
      <div>
        <label className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-1.5">Question</label>
        <input value={form.question} onChange={e => setForm(f => ({...f, question: e.target.value}))}
          placeholder="e.g. Is parking available?" className={inputCls} />
      </div>
      <div>
        <label className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-1.5">Answer</label>
        <textarea value={form.answer} onChange={e => setForm(f => ({...f, answer: e.target.value}))}
          rows={2} placeholder="e.g. Yes, there is covered parking for 2 vehicles."
          className={`${inputCls} resize-none`} />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition disabled:opacity-50">
          {saving ? <Loader size={11} className="animate-spin" /> : <Check size={11} />} Save
        </button>
        {item.id ? (
          <button onClick={() => setEditing(false)}
            className="px-4 py-2 rounded-xl border border-gray-800 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-wider transition">
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AgentQAManager({ agentId, properties = [] }) {
  const [globalItems,  setGlobalItems]  = useState([]);
  const [exclusions,   setExclusions]   = useState([]); // property_ids excluded from global
  const [selPropId,    setSelPropId]    = useState('');  // selected property for specific view
  const [propItems,    setPropItems]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showNew,      setShowNew]      = useState(false);
  const [showPropNew,  setShowPropNew]  = useState(false);
  const [tab,          setTab]          = useState('global'); // 'global' | 'specific' | 'exclusions'

  const load = async () => {
    if (!agentId) return;
    setLoading(true);
    try {
      const [g, e] = await Promise.all([
        apiFetch(`/api/qa/agent/${agentId}/global`),
        apiFetch(`/api/qa/exclusions/${agentId}`),
      ]);
      setGlobalItems(Array.isArray(g) ? g : []);
      setExclusions(Array.isArray(e) ? e : []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [agentId]);

  useEffect(() => {
    if (!selPropId) { setPropItems([]); return; }
    apiFetch(`/api/qa/property/${selPropId}/specific`)
      .then(data => setPropItems(Array.isArray(data) ? data : []))
      .catch(() => setPropItems([]));
  }, [selPropId]);

  // ── Global save/delete ────────────────────────────────────────────────────
  const saveGlobal = async (id, form) => {
    // id may be 0 before DB fix — treat 0 as "no id" (new item)
    const isExisting = id != null && id !== 0;
    if (isExisting) {
      await apiFetch(`/api/qa/global/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
      // Update in-place — no reload so no duplicates flash
      setGlobalItems(prev => prev.map(item => item.id === id ? { ...item, ...form } : item));
    } else {
      await apiFetch('/api/qa/global', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ agent_id: agentId, ...form }) });
      // Reload to get the server-assigned id
      load();
    }
    setShowNew(false);
  };

  const deleteGlobal = async (id) => {
    if (!await showConfirm('Remove this question from your global Q&A?')) return;
    await apiFetch(`/api/qa/global/${id}`, { method:'DELETE' });
    setGlobalItems(prev => prev.filter(item => item.id !== id));
  };

  // ── Property-specific save/delete ─────────────────────────────────────────
  const savePropSpecific = async (id, form) => {
    const isExisting = id != null && id !== 0;
    if (isExisting) {
      await apiFetch(`/api/qa/specific/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
      setPropItems(prev => prev.map(item => item.id === id ? { ...item, ...form } : item));
    } else {
      await apiFetch('/api/qa/specific', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ agent_id: agentId, property_id: selPropId, ...form }) });
      const data = await apiFetch(`/api/qa/property/${selPropId}/specific`);
      setPropItems(Array.isArray(data) ? data : []);
    }
    setShowPropNew(false);
  };

  const deletePropSpecific = async (id) => {
    if (!await showConfirm('Remove this Q&A?')) return;
    await apiFetch(`/api/qa/specific/${id}`, { method:'DELETE' });
    setPropItems(prev => prev.filter(item => item.id !== id));
  };

  const clearPropQA = async () => {
    if (!await showConfirm('Remove all custom Q&A for this property? It will revert to your global Q&A.')) return;
    await apiFetch(`/api/qa/property/${selPropId}/clear`, { method:'DELETE' });
    setPropItems([]);
  };

  // ── Exclusion toggle ──────────────────────────────────────────────────────
  const toggleExclusion = async (propId) => {
    const res = await apiFetch('/api/qa/exclusions/toggle', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ agent_id: agentId, property_id: Number(propId) }),
    });
    setExclusions(prev =>
      res.excluded
        ? [...prev, Number(propId)]
        : prev.filter(id => id !== Number(propId))
    );
  };

  const tabCls = (t) => `px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition ${
    tab === t ? 'bg-white text-black' : 'text-white/40 hover:text-white'
  }`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Property Q&A</h2>
          <p className="text-white/40 text-xs mt-0.5">Manage questions shown on your property listings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-[#111] border border-gray-800 rounded-2xl p-2">
        <button onClick={() => setTab('global')} className={tabCls('global')}>
          Global Questions
        </button>
        <button onClick={() => setTab('specific')} className={tabCls('specific')}>
          Per-Property Override
        </button>
        <button onClick={() => setTab('exclusions')} className={tabCls('exclusions')}>
          Exclude Properties
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-white/30 py-4"><Loader size={14} className="animate-spin" /><span className="text-xs">Loading…</span></div>
      ) : (
        <>
          {/* ── GLOBAL Q&A ── */}
          {tab === 'global' && (
            <div className="space-y-3">
              <p className="text-white/30 text-xs">These questions appear on <strong className="text-white">all</strong> your properties unless overridden or excluded.</p>
              {globalItems.map(item => (
                <QARow key={item.id} item={item} onSave={saveGlobal} onDelete={deleteGlobal} />
              ))}
              {showNew && <QARow item={EMPTY} onSave={saveGlobal} onDelete={() => setShowNew(false)} />}
              {!showNew && (
                <button onClick={() => setShowNew(true)}
                  className="flex items-center gap-2 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition">
                  <Plus size={13} /> Add Question
                </button>
              )}
            </div>
          )}

          {/* ── PER-PROPERTY OVERRIDE ── */}
          {tab === 'specific' && (
            <div className="space-y-4">
              <p className="text-white/30 text-xs">Select a property to add or edit questions that <strong className="text-white">override</strong> the global set.</p>
              <select value={selPropId} onChange={e => setSelPropId(e.target.value)} className={inputCls}>
                <option value="">— Select a property —</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>

              {selPropId && (
                <div className="space-y-3 mt-2">
                  {propItems.length === 0 ? (
                    <p className="text-white/20 text-xs italic">No custom Q&A — using your global set.</p>
                  ) : (
                    propItems.map(item => (
                      <QARow key={item.id} item={item} onSave={savePropSpecific} onDelete={deletePropSpecific} />
                    ))
                  )}
                  {showPropNew && <QARow item={EMPTY} onSave={savePropSpecific} onDelete={() => setShowPropNew(false)} />}
                  <div className="flex gap-3">
                    {!showPropNew && (
                      <button onClick={() => setShowPropNew(true)}
                        className="flex items-center gap-2 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition">
                        <Plus size={13} /> Add Question
                      </button>
                    )}
                    {propItems.length > 0 && (
                      <button onClick={clearPropQA} className="text-red-400/60 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition">
                        Revert to Global
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── EXCLUSIONS ── */}
          {tab === 'exclusions' && (
            <div className="space-y-3">
              <p className="text-white/30 text-xs">Toggle off any property that should <strong className="text-white">not</strong> show your global Q&A.</p>
              {properties.map(p => {
                const excluded = exclusions.includes(Number(p.id));
                return (
                  <div key={p.id} className="flex items-center justify-between bg-[#1a1a1a] border border-gray-800 rounded-xl px-4 py-3">
                    <span className="text-white text-sm font-semibold">{p.title}</span>
                    <button onClick={() => toggleExclusion(p.id)}
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition ${
                        excluded
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-green-500/10 text-green-400 border-green-500/20'
                      }`}>
                      {excluded ? 'Excluded' : 'Showing'}
                    </button>
                  </div>
                );
              })}
              {properties.length === 0 && <p className="text-white/20 text-xs italic">No properties yet.</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
