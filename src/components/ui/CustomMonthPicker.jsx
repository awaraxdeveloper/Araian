import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const MONTH_SHORT_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function CustomMonthPicker({
  value,
  onChange,
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

  const selectedIndex = typeof value === "number" ? value : 0;
  const currentMonthName = MONTH_NAMES[selectedIndex] || MONTH_NAMES[0];

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
          <span className="font-semibold truncate">{currentMonthName}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-red-400" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-full min-w-[240px] z-50 bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 rounded-2xl p-3 shadow-2xl shadow-black/80 animate-popover">
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2 px-1 flex items-center justify-between">
            <span>Select Month</span>
            <span className="text-red-400 font-mono">12 Months</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {MONTH_SHORT_NAMES.map((shortName, idx) => {
              const isActive = idx === selectedIndex;
              return (
                <button
                  key={shortName}
                  type="button"
                  onClick={() => {
                    onChange(idx);
                    setIsOpen(false);
                  }}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all flex flex-col items-center justify-center border cursor-pointer ${
                    isActive
                      ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-950/60 font-bold scale-[1.02]"
                      : "bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 hover:bg-neutral-800"
                  }`}
                >
                  <span>{shortName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
