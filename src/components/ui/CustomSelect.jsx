import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function CustomSelect({
  options = [],
  value,
  onChange,
  label,
  placeholder = "Select option...",
  className = "",
  disabled = false,
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

  const normalizedOptions = options.map((opt) =>
    typeof opt === "object" && opt !== null
      ? opt
      : { value: opt, label: String(opt) }
  );

  const selectedOpt = normalizedOptions.find((o) => o.value === value) || null;

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
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 bg-neutral-950/90 hover:bg-neutral-900 border border-neutral-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 rounded-xl px-3.5 flex items-center justify-between text-xs text-white transition-all shadow-sm group cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedOpt?.icon && (
            <span className="shrink-0">{selectedOpt.icon}</span>
          )}
          <span
            className={`font-semibold truncate ${
              selectedOpt ? "text-white" : "text-neutral-500"
            }`}
          >
            {selectedOpt ? selectedOpt.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-red-400" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-full min-w-[200px] max-h-60 overflow-y-auto z-50 bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 rounded-2xl p-1.5 shadow-2xl shadow-black/80 animate-popover">
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-red-600/15 text-red-400 border border-red-500/30 font-bold"
                    : "text-neutral-300 hover:text-white hover:bg-neutral-800 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-red-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
