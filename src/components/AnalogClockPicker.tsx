import React, { useState } from "react";
import { Clock, Sun, Moon } from "lucide-react";

interface AnalogClockPickerProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
}

export const AnalogClockPicker: React.FC<AnalogClockPickerProps> = ({ selectedDate, onChange }) => {
  const [viewMode, setViewMode] = useState<"hours" | "minutes">("hours");

  const currentHour24 = selectedDate.getHours();
  const currentMinute = selectedDate.getMinutes();

  // Convert 24-hour to 12-hour format
  const isPm = currentHour24 >= 12;
  const currentHour12 = currentHour24 % 12 === 0 ? 12 : currentHour24 % 12;

  const setHour = (h12: number) => {
    const newDate = new Date(selectedDate);
    let finalHour = h12;
    if (isPm) {
      finalHour = h12 === 12 ? 12 : h12 + 12;
    } else {
      finalHour = h12 === 12 ? 0 : h12;
    }
    newDate.setHours(finalHour);
    onChange(newDate);
    // Auto switch to minutes for great UX
    setViewMode("minutes");
  };

  const setMinute = (m: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMinutes(m);
    onChange(newDate);
  };

  const setAmPm = (pm: boolean) => {
    const newDate = new Date(selectedDate);
    let currentH12 = currentHour24 % 12;
    if (currentH12 === 0) currentH12 = 12; // Handle 12 AM/PM

    let finalHour = currentH12;
    if (pm) {
      finalHour = currentH12 === 12 ? 12 : currentH12 + 12;
    } else {
      finalHour = currentH12 === 12 ? 0 : currentH12;
    }
    newDate.setHours(finalHour);
    onChange(newDate);
  };

  // Helper to place clock numbers on a circle
  const getPositionStyles = (index: number) => {
    const angle = (index * 30 - 90) * (Math.PI / 180);
    const radius = 76; // radius of the dial circle in px
    const x = Math.round(Math.cos(angle) * radius);
    const y = Math.round(Math.sin(angle) * radius);
    return {
      transform: `translate(${x}px, ${y}px)`,
      position: "absolute" as const,
      left: "calc(50% - 14px)", // offset by half the width of the badge
      top: "calc(50% - 14px)",
    };
  };

  // Get current active angle for the clock hand
  const getHandAngle = () => {
    if (viewMode === "hours") {
      // 30 degrees per hour
      return (currentHour12 % 12) * 30;
    } else {
      // 6 degrees per minute
      return currentMinute * 6;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-slate-800 flex flex-col items-center" id="analog-clock-picker">
      {/* Header and Toggle view mode */}
      <div className="flex items-center justify-between w-full mb-3">
        <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          Time:{" "}
          <span className="text-slate-800 font-extrabold normal-case text-sm ml-1 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
            {currentHour12.toString().padStart(2, "0")}:{currentMinute.toString().padStart(2, "0")}{" "}
            {isPm ? "PM" : "AM"}
          </span>
        </span>

        {/* View Mode Switcher */}
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode("hours")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md border transition-all cursor-pointer ${
              viewMode === "hours"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            Hours
          </button>
          <button
            type="button"
            onClick={() => setViewMode("minutes")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md border transition-all cursor-pointer ${
              viewMode === "minutes"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            Minutes
          </button>
        </div>
      </div>

      {/* Clock Face Container */}
      <div className="relative w-48 h-48 bg-slate-50 rounded-full border border-slate-200/80 flex items-center justify-center shadow-inner my-2 select-none">
        {/* Center pivot point */}
        <div className="w-3 h-3 bg-indigo-600 rounded-full z-10 shadow-md"></div>

        {/* Clock Hand Pointer */}
        <div
          className="absolute origin-bottom w-0.5 bg-indigo-500/80 transition-transform duration-300 pointer-events-none"
          style={{
            height: "64px",
            transform: `rotate(${getHandAngle()}deg)`,
            bottom: "50%",
          }}
        >
          {/* Hand tip pointer indicator */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-indigo-600 rounded-full border border-white"></div>
        </div>

        {/* Circular number indicators */}
        {viewMode === "hours"
          ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h, i) => {
              const active = currentHour12 === h;
              return (
                <button
                  key={`hr-${h}`}
                  type="button"
                  onClick={() => setHour(h)}
                  style={getPositionStyles(i)}
                  className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded-full transition-all duration-150 cursor-pointer ${
                    active
                      ? "bg-indigo-600 text-white shadow-md font-extrabold"
                      : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                  }`}
                >
                  {h}
                </button>
              );
            })
          : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m, i) => {
              // Highlight the nearest 5 min or exact if it matches
              const active = Math.round(currentMinute / 5) * 5 === m || currentMinute === m;
              return (
                <button
                  key={`min-${m}`}
                  type="button"
                  onClick={() => setMinute(m)}
                  style={getPositionStyles(i)}
                  className={`w-7 h-7 flex items-center justify-center text-[10px] font-bold rounded-full transition-all duration-150 cursor-pointer ${
                    active
                      ? "bg-indigo-600 text-white shadow-md font-extrabold"
                      : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                  }`}
                >
                  {m.toString().padStart(2, "0")}
                </button>
              );
            })}
      </div>

      {/* AM/PM toggle and fine minute adjustments */}
      <div className="flex items-center justify-between w-full gap-4 mt-3 pt-2.5 border-t border-slate-100">
        {/* AM/PM switcher */}
        <div className="flex bg-slate-100 border border-slate-200 p-0.5 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setAmPm(false)}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
              !isPm
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sun className="w-3 h-3" />
            AM
          </button>
          <button
            type="button"
            onClick={() => setAmPm(true)}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
              isPm
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Moon className="w-3 h-3" />
            PM
          </button>
        </div>

        {/* Fine Minute Step slider */}
        <div className="flex-1 flex items-center gap-1.5 max-w-[120px]">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase">Fine:</span>
          <input
            type="range"
            min="0"
            max="59"
            value={currentMinute}
            onChange={(e) => setMinute(parseInt(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
            title="Slide for exact minute"
          />
        </div>
      </div>
    </div>
  );
};
