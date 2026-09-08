import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, X, Clock } from "lucide-react";
import { MONTH_NAMES, MONTH_SHORT_NAMES } from "./CustomMonthPicker";

export default function CustomDatePicker({
  value = "",
  onChange,
  label,
  placeholder = "Select date...",
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse initial date or default to current date
  const parseDate = (str) => {
    if (!str) return new Date();
    const parts = str.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date();
  };

  const selectedDate = value ? parseDate(value) : null;
  const [viewDate, setViewDate] = useState(() => selectedDate || new Date());

  useEffect(() => {
    if (value) {
      setViewDate(parseDate(value));
    }
  }, [value]);

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

  const formatDateStr = (d) => {
    if (!d) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatDisplay = (d) => {
    if (!d) return placeholder;
    return `${MONTH_SHORT_NAMES[d.getMonth()]} ${String(d.getDate()).padStart(
      2,
      "0"
    )}, ${d.getFullYear()}`;
  };

  // Calendar Math
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInViewMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleSelectDay = (dayNum) => {
    const newD = new Date(viewYear, viewMonth, dayNum);
    onChange(formatDateStr(newD));
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    setViewDate(today);
    onChange(formatDateStr(today));
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

  // Generate grid days
  const calendarCells = [];
  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarCells.push({
      dayNum: daysInPrevMonth - i,
      currentMonth: false,
      dateStr: formatDateStr(
        new Date(viewYear, viewMonth - 1, daysInPrevMonth - i)
      ),
    });
  }
  // Current month days
  for (let d = 1; d <= daysInViewMonth; d++) {
    calendarCells.push({
      dayNum: d,
      currentMonth: true,
      dateStr: formatDateStr(new Date(viewYear, viewMonth, d)),
    });
  }
  // Next month leading days to complete grid
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    calendarCells.push({
      dayNum: d,
      currentMonth: false,
      dateStr: formatDateStr(new Date(viewYear, viewMonth + 1, d)),
    });
  }

  const todayStr = formatDateStr(new Date());

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

      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 bg-neutral-950/90 hover:bg-neutral-900 border border-neutral-800 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 rounded-xl px-3.5 flex items-center justify-between text-xs text-white transition-all shadow-sm group cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Calendar className="w-4 h-4 text-red-500 shrink-0 group-hover:scale-110 transition-transform" />
          <span
            className={`font-semibold truncate ${
              value ? "text-white font-mono" : "text-neutral-500"
            }`}
          >
            {formatDisplay(selectedDate)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-neutral-300 transition-colors"
              title="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 z-50 bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 rounded-2xl p-4 shadow-2xl shadow-black/80 animate-popover">
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-white tracking-wide">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-neutral-500 mb-2">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              const isSelected = value && cell.dateStr === value;
              const isToday = cell.dateStr === todayStr;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (cell.currentMonth) {
                      handleSelectDay(cell.dayNum);
                    } else {
                      const newD = parseDate(cell.dateStr);
                      setViewDate(newD);
                      onChange(cell.dateStr);
                      setIsOpen(false);
                    }
                  }}
                  className={`h-8 rounded-lg text-xs font-mono font-semibold transition-all flex items-center justify-center border cursor-pointer ${
                    isSelected
                      ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-950/80 font-bold scale-105"
                      : isToday
                      ? "bg-neutral-800 border-red-500/50 text-red-400 font-bold"
                      : cell.currentMonth
                      ? "bg-neutral-950/40 border-transparent text-neutral-200 hover:bg-neutral-800 hover:text-white hover:border-neutral-700"
                      : "bg-transparent border-transparent text-neutral-600 hover:text-neutral-400"
                  }`}
                >
                  {cell.dayNum}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Actions */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-800 text-xs">
            <button
              type="button"
              onClick={handleToday}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              <Clock className="w-3 h-3 text-red-500" />
              <span>Today</span>
            </button>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1.5 text-neutral-500 hover:text-red-400 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Clear selection
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
