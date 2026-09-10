import React, { useState, useRef, useEffect } from "react";
import { Timer, ChevronDown, Minus, Plus } from "lucide-react";

const QUICK_VALUES = [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

export default function CustomOvertimePicker({
  value,
  onChange,
  step = 0.5,
  maxHours = 12,
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

  const currentValue = Math.min(Math.max(0, Number(value) || 0), maxHours);

  const roundToStep = (n) => Math.round(n / step) * step;

  const handleDecrement = (e) => {
    e.stopPropagation();
    if (currentValue > 0) {
      onChange(Math.max(0, roundToStep(currentValue - step)));
    }
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (currentValue < maxHours) {
      onChange(Math.min(maxHours, roundToStep(currentValue + step)));
    }
  };

  const formatHours = (n) => {
    const rounded = Math.round(n * 100) / 100;
    return rounded % 1 === 0 ? `${rounded}` : `${rounded}`;
  };

  const quickValues = QUICK_VALUES.filter((v) => v <= maxHours);

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
          disabled={currentValue <= 0}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Decrease overtime"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 h-full flex items-center justify-center gap-2 px-2 text-xs font-semibold text-white cursor-pointer select-none"
        >
          <Timer className="w-4 h-4 text-red-500 shrink-0" />
          <span className="font-mono">{formatHours(currentValue)}h</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-red-400" : ""
            }`}
          />
        </button>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={currentValue >= maxHours}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Increase overtime"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-full min-w-[260px] z-50 bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 rounded-2xl p-3 shadow-2xl shadow-black/80 animate-popover">
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2 px-1 flex items-center justify-between">
            <span>Select Overtime Hours</span>
            <span className="text-red-400 font-mono">0–{maxHours}h</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {quickValues.map((hrs) => {
              const isActive = hrs === currentValue;
              return (
                <button
                  key={hrs}
                  type="button"
                  onClick={() => {
                    onChange(hrs);
                    setIsOpen(false);
                  }}
                  className={`py-2 px-1 text-xs font-mono font-semibold rounded-lg transition-all flex items-center justify-center border cursor-pointer ${
                    isActive
                      ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-950/60 font-bold scale-[1.02]"
                      : "bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 hover:bg-neutral-800"
                  }`}
                >
                  {hrs}h
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-neutral-800">
            <input
              type="range"
              min={0}
              max={maxHours}
              step={step}
              value={currentValue}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-full accent-red-600 cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
