import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Lock,
  Sparkles,
  X,
  ChevronDown
} from 'lucide-react';
import {
  formatDateDisplay,
  formatDayName,
  getNearbyDates,
  isPastDate,
  isTodayDate,
  getTodayDateString,
} from '../../utils/dateUtils';
import {
  parseISO,
  addDays,
  subDays,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  setYear,
  setMonth
} from 'date-fns';

interface KalyaniDatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  className?: string;
}

export const KalyaniDatePicker: React.FC<KalyaniDatePickerProps> = ({
  selectedDate,
  onDateChange,
  className = '',
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => parseISO(selectedDate));
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const pickerRef = useRef<HTMLDivElement>(null);

  // Sync view date when selectedDate changes
  useEffect(() => {
    try {
      setViewDate(parseISO(selectedDate));
    } catch {}
  }, [selectedDate]);

  // Close calendar popup on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
        setShowYearPicker(false);
        setShowMonthPicker(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCalendarOpen]);

  const nearbyDates = getNearbyDates(selectedDate, 7);
  const isPast = isPastDate(selectedDate);
  const isToday = isTodayDate(selectedDate);

  const handlePrevDay = () => {
    const prev = format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
    onDateChange(prev);
  };

  const handleNextDay = () => {
    const next = format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
    onDateChange(next);
  };

  const handleGoToday = () => {
    const todayStr = getTodayDateString();
    onDateChange(todayStr);
    setViewDate(parseISO(todayStr));
    setIsCalendarOpen(false);
  };

  // Calendar calculations
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = viewDate.getFullYear();
  const yearsList = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const handleSelectDay = (day: Date) => {
    const formatted = format(day, 'yyyy-MM-dd');
    onDateChange(formatted);
    setIsCalendarOpen(false);
  };

  return (
    <div className={`flex flex-col gap-3 relative ${className}`} ref={pickerRef}>
      {/* Date Header Control */}
      <div className="flex items-center justify-between kalyani-glass px-4 py-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-kalyani-gold-300 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div 
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="p-2 rounded-xl bg-kalyani-gold-500/10 border border-kalyani-gold-500/30 text-kalyani-gold-400 group-hover:scale-105 transition-transform shadow-gold-sm">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-normal font-marcellus text-slate-100 flex items-center gap-2 group-hover:text-kalyani-gold-200 transition-colors">
                <span>{formatDateDisplay(selectedDate)}</span>
                {isToday && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-kalyani-gold-500 text-kalyani-crimson-950 uppercase tracking-wider shadow-[0_0_8px_#D4AF37]">
                    Today
                  </span>
                )}
                {isPast && (
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-800 text-slate-400 flex items-center gap-1 border border-slate-700">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </h2>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isToday && (
            <button
              onClick={handleGoToday}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-kalyani-gold-500/20 border border-kalyani-gold-500/30 text-kalyani-gold-300 hover:bg-kalyani-gold-500/30 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Today
            </button>
          )}

          {/* Custom Calendar Dropdown Button */}
          <button
            type="button"
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className={`p-2 rounded-xl border transition-all ${
              isCalendarOpen
                ? 'bg-kalyani-gold-500 text-kalyani-crimson-950 border-kalyani-gold-400 shadow-gold-sm'
                : 'hover:bg-white/10 text-slate-300 hover:text-kalyani-gold-300 border-white/10'
            }`}
            title="Open Interactive Calendar"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>

          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-kalyani-gold-300 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* CUSTOM LUXURIOUS KALYANI CALENDAR POPUP */}
      {isCalendarOpen && (
        <div className="absolute top-16 right-0 left-0 sm:left-auto sm:right-0 z-50 w-full sm:w-96 rounded-3xl kalyani-glass-elevated border border-kalyani-gold-500/40 p-4 sm:p-5 shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 fade-in duration-150">
          {/* Top Bar: Month & Year Selectors */}
          <div className="flex items-center justify-between pb-3 border-b border-kalyani-gold-500/20 mb-3">
            <div className="flex items-center gap-2">
              {/* Month Selector Toggle */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowMonthPicker(!showMonthPicker);
                    setShowYearPicker(false);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-kalyani-crimson-900/80 border border-kalyani-gold-500/30 text-xs font-bold text-kalyani-gold-300 hover:border-kalyani-gold-400 transition-colors"
                >
                  <span>{format(viewDate, 'MMMM')}</span>
                  <ChevronDown className="w-3 h-3 text-kalyani-gold-400" />
                </button>

                {showMonthPicker && (
                  <div className="absolute left-0 mt-1 w-44 max-h-48 overflow-y-auto rounded-2xl kalyani-glass-elevated border border-kalyani-gold-500/40 p-1.5 shadow-2xl z-50 grid grid-cols-2 gap-1">
                    {monthsList.map((m, idx) => (
                      <button
                        key={m}
                        onClick={() => {
                          setViewDate(setMonth(viewDate, idx));
                          setShowMonthPicker(false);
                        }}
                        className={`px-2 py-1.5 text-xs rounded-lg text-left transition-colors ${
                          viewDate.getMonth() === idx
                            ? 'bg-kalyani-gold-500 text-kalyani-crimson-950 font-bold'
                            : 'text-slate-200 hover:bg-kalyani-gold-500/20'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Year Selector Toggle */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowYearPicker(!showYearPicker);
                    setShowMonthPicker(false);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-kalyani-crimson-900/80 border border-kalyani-gold-500/30 text-xs font-bold text-kalyani-gold-300 hover:border-kalyani-gold-400 transition-colors"
                >
                  <span>{format(viewDate, 'yyyy')}</span>
                  <ChevronDown className="w-3 h-3 text-kalyani-gold-400" />
                </button>

                {showYearPicker && (
                  <div className="absolute left-0 mt-1 w-32 max-h-48 overflow-y-auto rounded-2xl kalyani-glass-elevated border border-kalyani-gold-500/40 p-1.5 shadow-2xl z-50 space-y-1">
                    {yearsList.map((yr) => (
                      <button
                        key={yr}
                        onClick={() => {
                          setViewDate(setYear(viewDate, yr));
                          setShowYearPicker(false);
                        }}
                        className={`w-full px-2 py-1 text-xs rounded-lg text-left transition-colors ${
                          viewDate.getFullYear() === yr
                            ? 'bg-kalyani-gold-500 text-kalyani-crimson-950 font-bold'
                            : 'text-slate-200 hover:bg-kalyani-gold-500/20'
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Prev/Next Month Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewDate(subMonths(viewDate, 1))}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-kalyani-gold-300"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewDate(addMonths(viewDate, 1))}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-kalyani-gold-300"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsCalendarOpen(false)}
                className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 ml-1"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-[10px] font-bold uppercase tracking-wider text-kalyani-gold-400/80 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isSelected = isSameDay(day, parseISO(selectedDate));
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isDayToday = isSameDay(day, new Date());
              const isDayPast = isPastDate(dateStr);

              return (
                <button
                  key={dateStr}
                  onClick={() => handleSelectDay(day)}
                  className={`h-9 rounded-xl text-xs flex flex-col items-center justify-center relative transition-all duration-150 ${
                    isSelected
                      ? 'bg-gradient-to-br from-kalyani-crimson-800 to-kalyani-gold-600 border border-kalyani-gold-300 text-white font-bold shadow-gold-md scale-105'
                      : !isCurrentMonth
                      ? 'text-slate-600 opacity-40 hover:bg-white/5'
                      : isDayToday
                      ? 'bg-kalyani-gold-500/20 border border-kalyani-gold-400/50 text-kalyani-gold-200 font-bold hover:bg-kalyani-gold-500/30'
                      : isDayPast
                      ? 'text-slate-400 hover:bg-kalyani-gold-500/15 hover:text-kalyani-gold-100'
                      : 'text-slate-200 hover:bg-kalyani-gold-500/20 hover:text-kalyani-gold-200'
                  }`}
                >
                  <span>{format(day, 'd')}</span>
                  {isDayToday && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-kalyani-gold-400 shadow-[0_0_4px_#D4AF37] absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Shortcuts */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-kalyani-gold-500/20 text-xs">
            <button
              onClick={handleGoToday}
              className="text-kalyani-gold-300 hover:text-white font-semibold flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-kalyani-gold-400" /> Jump to Today
            </button>
            <span className="text-[10px] text-slate-400">
              Selected: {selectedDate}
            </span>
          </div>
        </div>
      )}

      {/* Interactive Horizontal Date Strip */}
      <div className="grid grid-cols-7 gap-2 overflow-x-auto pb-1">
        {nearbyDates.map((dateStr) => {
          const isSelected = dateStr === selectedDate;
          const parsed = parseISO(dateStr);
          const isDayToday = isTodayDate(dateStr);
          const isDayPast = isPastDate(dateStr);

          return (
            <button
              key={dateStr}
              onClick={() => onDateChange(dateStr)}
              className={`p-2.5 sm:p-3 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ${
                isSelected
                  ? 'bg-gradient-to-b from-kalyani-crimson-800 to-kalyani-crimson-900 border-2 border-kalyani-gold-400 text-white shadow-gold-sm scale-[1.02]'
                  : 'kalyani-glass hover:border-kalyani-gold-500/40 text-slate-300 hover:text-white hover:bg-kalyani-crimson-900/30'
              }`}
            >
              <span className="text-[10px] sm:text-xs uppercase font-semibold text-kalyani-gold-300/80">
                {format(parsed, 'EEE')}
              </span>
              <span className="text-base sm:text-lg font-bold mt-0.5">{format(parsed, 'd')}</span>
              {isDayToday && (
                <span className="w-1.5 h-1.5 rounded-full bg-kalyani-gold-400 shadow-[0_0_6px_#D4AF37] mt-1" />
              )}
              {isDayPast && !isDayToday && (
                <Lock className="w-2.5 h-2.5 text-slate-500 mt-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
