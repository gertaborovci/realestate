import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * blockedRanges : [{ start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }]  – APPROVED bookings
 * checkIn       : 'YYYY-MM-DD' | ''   – controlled check-in value
 * checkOut      : 'YYYY-MM-DD' | ''   – controlled check-out value
 * onCheckIn     : (dateStr) => void   – called when user picks check-in
 * onCheckOut    : (dateStr) => void   – called when user picks check-out
 *
 * Click logic:
 *   • No check-in set            → first click sets check-in
 *   • Check-in set, no check-out → click after check-in sets check-out;
 *                                   click on/before check-in resets check-in
 *   • Both set                   → any click resets and starts over
 */
export default function RentalCalendar({
  blockedRanges = [],
  checkIn  = '',
  checkOut = '',
  onCheckIn,
  onCheckOut,
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [hovered, setHovered] = useState(null); // date being hovered

  const fmt = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const toDate = (str) => {
    if (!str) return null;
    const d = new Date(str + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  };

  const inRange = (date, start, end) => {
    const s = toDate(start), e = toDate(end);
    return s && e && date >= s && date <= e;
  };

  const isBlocked = (date) => blockedRanges.some(r => inRange(date, r.start, r.end));

  // Determine highlight range — use hovered for live preview
  const previewEnd = checkIn && !checkOut && hovered ? hovered : toDate(checkOut);
  const rangeStart = toDate(checkIn);
  const rangeEnd   = previewEnd && rangeStart && previewEnd >= rangeStart ? previewEnd : null;

  const isInSelectedRange = (date) => rangeStart && rangeEnd && date >= rangeStart && date <= rangeEnd;
  const isRangeStart      = (date) => rangeStart && date.toDateString() === rangeStart.toDateString();
  const isRangeEnd        = (date) => rangeEnd   && date.toDateString() === rangeEnd.toDateString();

  const handleDateClick = (date) => {
    if (isBlocked(date)) return;
    if (date < today) return; // no past dates

    const dateStr = fmt(date);

    // Both set → reset
    if (checkIn && checkOut) {
      onCheckIn?.(dateStr);
      onCheckOut?.('');
      return;
    }

    // No check-in yet → set check-in
    if (!checkIn) {
      onCheckIn?.(dateStr);
      return;
    }

    // Check-in set, no check-out
    const cin = toDate(checkIn);
    if (date <= cin) {
      // Clicked same or earlier — reset to this date as new check-in
      onCheckIn?.(dateStr);
      onCheckOut?.('');
    } else {
      // Clicked after check-in — set check-out
      onCheckOut?.(dateStr);
    }
  };

  const prevMonth = () => month === 0  ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1);
  const nextMonth = () => month === 11 ? (setMonth(0),  setYear(y => y + 1)) : setMonth(m => m + 1);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayRaw = new Date(year, month, 1).getDay();
  const startOffset = (firstDayRaw + 6) % 7; // Mon = 0

  const monthLabel = new Date(year, month, 1).toLocaleString('default', {
    month: 'long', year: 'numeric',
  });

  const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const isInteractive = !!(onCheckIn || onCheckOut);

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-5 w-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition">
          <ChevronLeft size={14} className="text-white/50" />
        </button>
        <span className="text-[11px] font-black tracking-[0.2em] uppercase text-white/60">{monthLabel}</span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition">
          <ChevronRight size={14} className="text-white/50" />
        </button>
      </div>

      {/* Hint when interactive */}
      {isInteractive && (
        <p className="text-center text-[9px] font-bold tracking-widest uppercase text-white/25 mb-3">
          {!checkIn ? 'Click to set check-in' : !checkOut ? 'Click to set check-out' : 'Click any date to reset'}
        </p>
      )}

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[9px] font-black tracking-widest uppercase text-white/25 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} />;

          const blocked   = isBlocked(date);
          const isPast    = date < today;
          const inSel     = isInSelectedRange(date);
          const isStart   = isRangeStart(date);
          const isEnd     = isRangeEnd(date);
          const isToday   = date.toDateString() === today.toDateString();
          const clickable = isInteractive && !blocked && !isPast;

          let cls = 'aspect-square flex items-center justify-center text-[11px] font-bold transition-all select-none ';

          if (blocked || isPast) {
            cls += blocked
              ? 'bg-red-500/20 text-red-400/60 line-through cursor-not-allowed rounded-lg'
              : 'text-white/15 cursor-not-allowed rounded-lg';
          } else if (isStart || isEnd) {
            cls += 'bg-white text-black rounded-lg z-10';
          } else if (inSel) {
            cls += 'bg-white/20 text-white rounded-none'; // range fill, no radius
          } else if (isToday) {
            cls += 'border border-white/30 text-white rounded-lg ' + (clickable ? 'cursor-pointer hover:bg-white/10' : '');
          } else {
            cls += 'text-white/50 rounded-lg ' + (clickable ? 'cursor-pointer hover:bg-white/10' : '');
          }

          return (
            <div
              key={date.toISOString()}
              className={cls}
              title={blocked ? 'Already booked' : isPast ? 'Past date' : ''}
              onClick={() => clickable && handleDateClick(date)}
              onMouseEnter={() => isInteractive && !blocked && !isPast && setHovered(date)}
              onMouseLeave={() => setHovered(null)}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500/25 border border-red-400/30" />
          <span className="text-[9px] font-bold tracking-widest uppercase text-white/25">Booked</span>
        </div>
        {checkIn && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-white" />
            <span className="text-[9px] font-bold tracking-widest uppercase text-white/25">
              {checkOut ? 'Your Stay' : 'Check-in'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
