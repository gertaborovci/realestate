import React, { useState } from 'react';
import { X, Calendar, Clock, MessageSquare, CheckCircle } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { getCurrentUser } from '../lib/auth';

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
];

const ConsultationModal = ({ agentId, agentName, onClose }) => {
  const [date, setDate]   = useState('');
  const [time, setTime]   = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !time) {
      setError('Please select a date and a time slot.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = getCurrentUser();
      // Consultations are stored in the visits table with property_id = NULL.
      // This makes them appear in the admin Visits tab AND the agent's
      // Contact Inquiries tab (filtered by property_id IS NULL).
      await apiFetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id:   agentId,
          user_id:    user?.id    || null,
          visit_date: date,
          visit_time: time,
          notes:      notes.trim() || null,
        }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to schedule consultation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-gray-800 rounded-3xl w-full max-w-md shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-white font-bold text-lg tracking-tight">Schedule a Consultation</h2>
            <p className="text-gray-500 text-xs mt-0.5">with {agentName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition p-1 rounded-lg hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Success state ── */}
        {success ? (
          <div className="p-10 flex flex-col items-center gap-4 text-center">
            <CheckCircle size={52} className="text-green-400" />
            <h3 className="text-white font-bold text-lg">Request Sent!</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your consultation request has been submitted.<br />
              The agent will confirm your appointment shortly.
            </p>
            <button
              onClick={onClose}
              className="mt-2 bg-white text-black px-8 py-3 rounded-full text-xs font-bold tracking-widest hover:bg-gray-200 transition"
            >
              CLOSE
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* Date picker */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 tracking-widest uppercase flex items-center gap-1.5 mb-2">
                <Calendar size={12} /> Select Date
              </label>
              <input
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-[#1a1a1a] border border-gray-800 text-white rounded-xl px-4 py-3 text-sm
                           focus:outline-none focus:border-gray-600 transition [color-scheme:dark]"
              />
            </div>

            {/* Time slots */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 tracking-widest uppercase flex items-center gap-1.5 mb-2">
                <Clock size={12} /> Select Time Slot
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTime(slot)}
                    className={`py-2.5 rounded-xl text-xs font-bold tracking-wider transition border ${
                      time === slot
                        ? 'bg-white text-black border-white'
                        : 'bg-[#1a1a1a] text-gray-400 border-gray-800 hover:border-gray-600 hover:text-white'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 tracking-widest uppercase flex items-center gap-1.5 mb-2">
                <MessageSquare size={12} /> Notes{' '}
                <span className="text-gray-700 normal-case tracking-normal font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Briefly describe what you'd like to discuss…"
                className="w-full bg-[#1a1a1a] border border-gray-800 text-white rounded-xl px-4 py-3 text-sm
                           focus:outline-none focus:border-gray-600 resize-none placeholder-gray-700 transition"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black py-4 rounded-full text-xs font-bold tracking-widest uppercase
                         hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'SUBMITTING…' : 'CONFIRM CONSULTATION'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ConsultationModal;