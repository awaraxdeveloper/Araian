import React, { useState, useRef, useEffect } from "react";
import { Clock, ChevronDown } from "lucide-react";

export default function CustomTimePicker({
  label,
  value = "",
  onChange,
  placeholder = "--:--",
  className = "",
  disabled = false, // new prop
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const containerRef = useRef(null);

  // Parse the value (format "HH:MM") into hours and minutes
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":");
      setHours(h || "");
      setMinutes(m || "");
    } else {
      setHours("");
      setMinutes("");
    }
  }, [value]);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectHour = (h) => {
    setHours(h);
    if (minutes) {
      onChange(`${h}:${minutes}`);
    }
  };

  const handleSelectMinute = (m) => {
    setMinutes(m);
    if (hours) {
      onChange(`${hours}:${m}`);
    }
  };

  const clearTime = () => {
    setHours("");
    setMinutes("");
    onChange("");
    setIsOpen(false);
  };

  const displayValue = value || "";

  const hourOptions = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0")
  );
  const minuteOptions = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  );

  return (
    <div
      className={`relative inline-flex items-center gap-2 ${className}`}
      ref={containerRef}
    >
      {label && (
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider select-none">
          {label}:
        </span>
      )}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex-1 h-9 bg-neutral-950/90 border border-neutral-800 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 rounded-xl px-3.5 flex items-center justify-between transition-all shadow-sm group ${
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <span
          className={`text-xs ${
            displayValue ? "text-white" : "text-neutral-500"
          } font-mono`}
        >
          {displayValue || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-red-400" : ""
          }`}
        />
      </div>

      {isOpen && !disabled && (
        <div className="absolute right-0 top-full mt-2 w-[240px] z-50 bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 rounded-2xl p-3 shadow-2xl shadow-black/80 animate-popover">
          <div className="flex gap-3">
            {/* Hours */}
            <div className="flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1 text-center">
                Hour
              </div>
              <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-900 pr-1 space-y-0.5">
                {hourOptions.map((h) => {
                  const isActive = h === hours;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleSelectHour(h)}
                      className={`w-full py-1.5 text-xs font-mono rounded-lg transition-all border ${
                        isActive
                          ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-950/60 font-bold"
                          : "bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 hover:bg-neutral-800"
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minutes */}
            <div className="flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1 text-center">
                Min
              </div>
              <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-900 pr-1 space-y-0.5">
                {minuteOptions.map((m) => {
                  const isActive = m === minutes;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectMinute(m)}
                      className={`w-full py-1.5 text-xs font-mono rounded-lg transition-all border ${
                        isActive
                          ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-950/60 font-bold"
                          : "bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 hover:bg-neutral-800"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {displayValue && (
            <button
              onClick={clearTime}
              className="mt-2 w-full text-xs text-red-400 hover:text-red-300 transition-colors py-1 border-t border-neutral-800"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
