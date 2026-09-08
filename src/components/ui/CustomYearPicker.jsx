import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const DEFAULT_YEARS = [2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];

export default function CustomYearPicker({
  value,
  onChange,
  years = DEFAULT_YEARS,
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

  const currentYear = Number(value) || new Date().getFullYear();

  const handlePrevYear = (e) => {
    e.stopPropagation();
    onChange(currentYear - 1);
  };

  const handleNextYear = (e) => {
    e.stopPropagation();
    onChange(currentYear + 1);
  };

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
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 bg-neutral-950/90 hover:bg-neutral-900 border border-neutral-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 rounded-xl px-3.5 flex items-center justify-between text-xs text-white transition-all shadow-sm group cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Calendar className="w-4 h-4 text-red-500 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="font-semibold truncate font-mono">
            {currentYear}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-red-400" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-full min-w-[220px] z-50 bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 rounded-2xl p-3 shadow-2xl shadow-black/80 animate-popover">
          <div className="flex items-center justify-between bg-neutral-950/80 p-1.5 rounded-xl border border-neutral-800 mb-2.5">
            <button
              type="button"
              onClick={handlePrevYear}
              className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Previous Year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-white font-mono px-2">
              {currentYear}
            </span>
            <button
              type="button"
              onClick={handleNextYear}
              className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Next Year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {years.map((y) => {
              const isActive = y === currentYear;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    onChange(y);
                    setIsOpen(false);
                  }}
                  className={`py-2 px-1 text-xs font-semibold rounded-lg font-mono transition-all flex items-center justify-center border cursor-pointer ${
                    isActive
                      ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-950/60 font-bold scale-[1.02]"
                      : "bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 hover:bg-neutral-800"
                  }`}
                >
                  {y}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
