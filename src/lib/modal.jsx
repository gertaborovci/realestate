/**
 * modal.jsx — imperative styled modal system
 *
 * Usage (from any component):
 *   import { showAlert, showConfirm } from '../lib/modal';
 *
 *   await showAlert('Something went wrong.', 'error');
 *   await showAlert('Saved!', 'success');
 *   const ok = await showConfirm('Delete this item?');
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

/* ── Singleton container ─────────────────────────────────────────────────── */
let _container = null;
let _root = null;

function getRoot() {
  if (!_container) {
    _container = document.createElement('div');
    _container.id = 'modal-root';
    document.body.appendChild(_container);
    _root = createRoot(_container);
  }
  return _root;
}

function unmount() {
  getRoot().render(null);
}

/* ── Alert Modal ─────────────────────────────────────────────────────────── */
function AlertModal({ message, type, onClose }) {
  const isSuccess = type === 'success';
  const isError   = type === 'error';

  const border = isSuccess ? 'border-green-500/40' : isError ? 'border-red-500/40' : 'border-white/20';
  const iconCl = isSuccess ? 'text-green-400'      : isError ? 'text-red-400'      : 'text-white/50';
  const Icon   = isSuccess ? CheckCircle            : isError ? AlertCircle         : Info;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`bg-[#111] border ${border} rounded-2xl p-8 max-w-sm w-full mx-5 shadow-2xl`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-6">
          <Icon size={20} className={`${iconCl} shrink-0 mt-0.5`} />
          <p className="text-white/90 text-sm font-medium leading-relaxed">{message}</p>
        </div>
        <button
          onClick={onClose}
          autoFocus
          className="w-full bg-white text-black py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/90 transition"
        >
          OK
        </button>
      </div>
    </div>
  );
}

/* ── Confirm Modal ───────────────────────────────────────────────────────── */
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-[#111] border border-white/20 rounded-2xl p-8 max-w-sm w-full mx-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-white/90 text-sm font-medium leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-white/10 border border-white/20 text-white/80 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            className="flex-1 bg-white text-black py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/90 transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Public API ──────────────────────────────────────────────────────────── */

/** Show a styled alert dialog. type: 'info' | 'success' | 'error' */
export function showAlert(message, type = 'info') {
  return new Promise((resolve) => {
    getRoot().render(
      <AlertModal
        message={String(message || '')}
        type={type}
        onClose={() => { unmount(); resolve(); }}
      />
    );
  });
}

/** Show a styled confirmation dialog. Returns true if confirmed, false if cancelled. */
export function showConfirm(message) {
  return new Promise((resolve) => {
    getRoot().render(
      <ConfirmModal
        message={String(message || '')}
        onConfirm={() => { unmount(); resolve(true); }}
        onCancel={() =>  { unmount(); resolve(false); }}
      />
    );
  });
}
