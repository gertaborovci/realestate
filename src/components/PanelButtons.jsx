import React, { useState, useRef } from 'react';
import { Shield, ShieldCheck, X } from 'lucide-react';
import { canAccessAdminDashboard, canAccessAgentDashboard } from '../lib/auth';

// ── Draggable wrapper that snaps to any of the 4 screen corners ──────────────
function DraggableCornerButton({ corner, onCornerChange, children }) {
  const ref       = useRef(null);
  const hasDragged = useRef(false);
  const [livePos, setLivePos] = useState(null); // {left, top} while dragging

  // Map a corner name to fixed-position CSS
  const cornerStyle = (c) => {
    const base = { position: 'fixed', zIndex: 100 };
    if (c === 'top-left')     return { ...base, top: 32,    left: 32  };
    if (c === 'top-right')    return { ...base, top: 32,    right: 32 };
    if (c === 'bottom-right') return { ...base, bottom: 32, right: 32 };
    return                           { ...base, bottom: 32, left: 32  }; // bottom-left default
  };

  // Which corner is the cursor closest to?
  const snap = (cx, cy) =>
    `${cy < window.innerHeight / 2 ? 'top' : 'bottom'}-${cx < window.innerWidth / 2 ? 'left' : 'right'}`;

  const onPointerDown = (e) => {
    if (e.button !== 0) return;   // left-click only
    e.preventDefault();           // prevent text selection while dragging

    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;  // cursor offset inside element
    const offsetY = e.clientY - rect.top;
    const startX  = e.clientX;
    const startY  = e.clientY;
    hasDragged.current = false;

    const onMove = (ev) => {
      // Only start "drag mode" after moving more than 5 px
      if (!hasDragged.current &&
          (Math.abs(ev.clientX - startX) > 5 || Math.abs(ev.clientY - startY) > 5)) {
        hasDragged.current = true;
      }
      if (hasDragged.current) {
        setLivePos({ left: ev.clientX - offsetX, top: ev.clientY - offsetY });
      }
    };

    const onUp = (ev) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup',   onUp);
      if (hasDragged.current) {
        onCornerChange(snap(ev.clientX, ev.clientY));
        setLivePos(null);
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup',   onUp);
  };

  // If the pointer-up was after a drag, swallow the synthetic click so
  // the inner button's onClick doesn't fire accidentally.
  const onClickCapture = (e) => {
    if (hasDragged.current) {
      e.stopPropagation();
      hasDragged.current = false;
    }
  };

  const style = livePos
    ? { position: 'fixed', zIndex: 200, left: livePos.left, top: livePos.top }
    : cornerStyle(corner);

  return (
    <div
      ref={ref}
      style={style}
      onPointerDown={onPointerDown}
      onClickCapture={onClickCapture}
      className={`select-none ${livePos ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      {children}
    </div>
  );
}

// ── Shared button class ───────────────────────────────────────────────────────
const BTN =
  'flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 ' +
  'px-6 py-3 rounded-full hover:bg-white/20 transition-all shadow-2xl';

// ── PanelButtons ─────────────────────────────────────────────────────────────
const PanelButtons = ({ onNavigate, currentView }) => {
  const isAgent = canAccessAgentDashboard();
  const isAdmin = canAccessAdminDashboard();

  // Corner positions — start at defaults, reset automatically on logout
  // because the component remounts after the user object disappears.
  const [agentCorner, setAgentCorner] = useState('bottom-left');
  const [adminCorner, setAdminCorner] = useState('bottom-right');

  const onAgentDash = currentView === 'agent-dashboard';
  const onAdminDash = currentView === 'dashboard';

  if (!isAgent && !isAdmin) return null;

  return (
    <>
      {/* ── AGENT button (open / close) ── */}
      {isAgent && (
        <DraggableCornerButton corner={agentCorner} onCornerChange={setAgentCorner}>
          <button
            type="button"
            onClick={() => onNavigate(onAgentDash ? 'hero' : 'agent-dashboard')}
            className={BTN}
          >
            <div className="bg-white p-2 rounded-full text-black">
              {onAgentDash ? <X size={18} /> : <ShieldCheck size={18} />}
            </div>
            <span className="font-bold text-[10px] tracking-widest pr-1 text-white uppercase">
              {onAgentDash ? 'Close Panel' : 'Agent Panel'}
            </span>
          </button>
        </DraggableCornerButton>
      )}

      {/* ── ADMIN button (open / close) ── */}
      {isAdmin && (
        <DraggableCornerButton corner={adminCorner} onCornerChange={setAdminCorner}>
          <button
            type="button"
            onClick={() => onNavigate(onAdminDash ? 'hero' : 'dashboard')}
            className={BTN}
          >
            <div className="bg-white p-2 rounded-full text-black">
              {onAdminDash ? <X size={18} /> : <Shield size={18} />}
            </div>
            <span className="font-bold text-[10px] tracking-widest pr-1 text-white uppercase">
              {onAdminDash ? 'Close Panel' : 'Admin Panel'}
            </span>
          </button>
        </DraggableCornerButton>
      )}
    </>
  );
};

export default PanelButtons;