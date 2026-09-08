import React, { useState, useRef, useEffect } from "react";
import { CalendarDays, ChevronDown, Minus, Plus } from "lucide-react";

export default function CustomDayPicker({
  value,
  onChange,
  maxDays = 31,
  label,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentDay = Math.min(Math.max(1, Number(value) || 1), maxDays);

  const handleDecrement = (e) => {
    e.stopPropagation();
    if (currentDay > 1) {
      onChange(currentDay - 1);
    }
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (currentDay < maxDays) {
      onChange(currentDay + 1);
    }
  };

  const daysArray = Array.from({ length: maxDays }, (_, i) => i + 1);

  return (
    <div
      className={`relative inline-block w-full ${className}`}
      ref={containerRef}
    >
      {label && (
        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 block">
          {label}
        </label>
      )}

      <div className="w-full h-11 bg-neutral-950/90 border border-neutral-800 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 rounded-xl px-1.5 flex items-center justify-between transition-all shadow-sm">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={currentDay <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Previous Day"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 h-full flex items-center justify-center gap-2 px-2 text-xs font-semibold text-white cursor-pointer select-none"
        >
          <CalendarDays className="w-4 h-4 text-red-500 shrink-0" />
          <span className="font-mono">Day {currentDay}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-red-400" : ""
            }`}
          />
        </button>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={currentDay >= maxDays}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Next Day"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-full min-w-[260px] z-50 bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 rounded-2xl p-3 shadow-2xl shadow-black/80 animate-popover">
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2 px-1 flex items-center justify-between">
            <span>Select Day of Month</span>
            <span className="text-red-400 font-mono">1–{maxDays}</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {daysArray.map((dayNum) => {
              const isActive = dayNum === currentDay;
              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => {
                    onChange(dayNum);
                    setIsOpen(false);
                  }}
                  className={`h-8 rounded-lg text-xs font-mono font-semibold transition-all flex items-center justify-center border cursor-pointer ${
                    isActive
                      ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-950/60 font-bold scale-105"
                      : "bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 hover:bg-neutral-800"
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
