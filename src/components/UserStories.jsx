import React from 'react';
import { MessageSquare, PlusCircle } from 'lucide-react';

export default function UserStories({ testimonials, setIsStoryModalOpen }) {
  return (
    <div className="max-w-5xl mx-auto mt-20 bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare /> Historitë
        </h2>
        <button
          onClick={() => setIsStoryModalOpen(true)}
          className="text-emerald-400 text-sm flex items-center gap-1"
        >
          <PlusCircle size={16} /> Shto tënden
        </button>
      </div>

      {testimonials.map((t) => (
        <div key={t.id} className="p-4 bg-black rounded-xl border border-zinc-800 mb-3">
          <p className="italic text-zinc-400">"{t.text}"</p>
          <span className="text-sm font-bold text-emerald-400">- {t.client}</span>
        </div>
      ))}
    </div>
  );
}