import React, { useState, useEffect } from 'react';
import { HelpCircle, Trash2, Loader, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { showAlert, showConfirm } from '../lib/modal';

export default function AdminQA() {
  const [agents,   setAgents]   = useState([]);
  const [qaMap,    setQaMap]    = useState({}); // { agentId: [qa items] }
  const [loading,  setLoading]  = useState(true);
  const [openAgent,setOpenAgent]= useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/agents');
      setAgents(Array.isArray(data) ? data : []);
    } catch { setAgents([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const loadAgentQA = async (agentId) => {
    if (qaMap[agentId]) return; // already loaded
    try {
      const data = await apiFetch(`/api/qa/agent/${agentId}/global`);
      setQaMap(prev => ({ ...prev, [agentId]: Array.isArray(data) ? data : [] }));
    } catch {
      setQaMap(prev => ({ ...prev, [agentId]: [] }));
    }
  };

  const toggleAgent = (agentId) => {
    if (openAgent === agentId) { setOpenAgent(null); return; }
    setOpenAgent(agentId);
    loadAgentQA(agentId);
  };

  const handleDeleteGlobal = async (agentId, itemId) => {
    if (!await showConfirm('Delete this Q&A item?')) return;
    setDeleting(itemId);
    try {
      await apiFetch(`/api/qa/global/${itemId}`, { method: 'DELETE' });
      setQaMap(prev => ({
        ...prev,
        [agentId]: prev[agentId].filter(q => q.id !== itemId),
      }));
    } catch (err) { await showAlert(err.message, 'error'); }
    finally { setDeleting(null); }
  };

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-5xl font-bold">PROPERTY Q&A</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
            View and moderate agent Q&A templates
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-white/40 hover:text-white text-[10px] font-bold uppercase tracking-widest transition">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <p className="text-white/30 text-sm">
        Each agent can create a global Q&A template that appears on all their property listings.
        Expand an agent below to view or delete their questions.
      </p>

      {loading ? (
        <div className="flex items-center justify-center h-32 gap-3 text-white/30">
          <Loader size={16} className="animate-spin" />
          <span className="text-xs font-bold tracking-widest uppercase">Loading agents…</span>
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-[#121212] border border-dashed border-gray-800 rounded-2xl p-12 text-center">
          <HelpCircle size={28} className="mx-auto text-white/15 mb-3" />
          <p className="text-white/30 text-sm font-bold uppercase tracking-widest">No agents found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {agents.map(agent => {
            const isOpen = openAgent === agent.id;
            const items  = qaMap[agent.id] || [];
            return (
              <div key={agent.id} className="bg-[#121212] border border-gray-800 rounded-2xl overflow-hidden">

                {/* Agent row */}
                <button onClick={() => toggleAgent(agent.id)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-white/[0.02] transition text-left">
                  <div className="flex items-center gap-3">
                    <HelpCircle size={15} className="text-white/30 shrink-0" />
                    <div>
                      <p className="text-white font-bold text-sm">{agent.username}</p>
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                        {agent.specialization || 'Agent'} · {agent.zone || 'Kosovo'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isOpen && qaMap[agent.id] && (
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                        {items.length} question{items.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {isOpen ? <ChevronUp size={15} className="text-white/40" /> : <ChevronDown size={15} className="text-white/40" />}
                  </div>
                </button>

                {/* Q&A list */}
                {isOpen && (
                  <div className="border-t border-gray-800 divide-y divide-gray-900">
                    {!qaMap[agent.id] ? (
                      <div className="flex items-center gap-2 px-6 py-4 text-white/30">
                        <Loader size={13} className="animate-spin" />
                        <span className="text-xs">Loading…</span>
                      </div>
                    ) : items.length === 0 ? (
                      <div className="px-6 py-4 text-white/20 text-xs italic">
                        No global Q&A set up yet.
                      </div>
                    ) : (
                      items.map(item => (
                        <div key={item.id} className="flex items-start justify-between gap-4 px-6 py-4 hover:bg-white/[0.01] transition group">
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold mb-1">{item.question}</p>
                            <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{item.answer}</p>
                          </div>
                          <button onClick={() => handleDeleteGlobal(agent.id, item.id)} disabled={deleting === item.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[9px] font-black uppercase tracking-widest transition disabled:opacity-40 shrink-0 opacity-0 group-hover:opacity-100">
                            {deleting === item.id ? <Loader size={9} className="animate-spin" /> : <Trash2 size={9} />}
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
