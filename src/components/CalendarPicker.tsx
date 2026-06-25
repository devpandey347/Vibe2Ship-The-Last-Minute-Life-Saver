import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface CalendarPickerProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({ selectedDate, onChange }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Helper to get number of days in the current month
  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  // Helper to get start day of the week for the current month
  const getStartDayOfWeek = (y: number, m: number) => {
    return new Date(y, m, 1).getDay();
  };

  const totalDays = getDaysInMonth(year, month);
  const startDayOfWeek = getStartDayOfWeek(year, month);

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleDaySelect = (dayNum: number) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(year);
    newDate.setMonth(month);
    newDate.setDate(dayNum);
    onChange(newDate);
  };

  const isToday = (dayNum: number) => {
    const today = new Date();
    return (
      today.getDate() === dayNum &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isSelected = (dayNum: number) => {
    return (
      selectedDate.getDate() === dayNum &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  // Generate date cells
  const daysArray: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    daysArray.push(i);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-slate-800" id="custom-calendar-picker">
      {/* Month Header Navigation */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-indigo-600" />
          {monthNames[month]} {year}
        </h4>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-1.5">
        {daysOfWeek.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysArray.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="py-2"></div>;
          }

          const daySelected = isSelected(day);
          const dayToday = isToday(day);

          return (
            <button
              key={`day-${day}`}
              type="button"
              onClick={() => handleDaySelect(day)}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer text-center relative ${
                daySelected
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : dayToday
                  ? "bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100"
                  : "hover:bg-slate-100 text-slate-700"
              }`}
            >
              {day}
              {dayToday && !daySelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
