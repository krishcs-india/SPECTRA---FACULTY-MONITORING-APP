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
  isDateExpiredBeyondRetention,
  getMinRetentionDateString
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
  const isSelectedExpired = isDateExpiredBeyondRetention(selectedDate);

  const handlePrevDay = () => {
    const prev = format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
    if (isDateExpiredBeyondRetention(prev)) return;
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
    if (isDateExpiredBeyondRetention(formatted)) return;
    onDateChange(formatted);
    setIsCalendarOpen(false);
  };

  return (
    <div className={`flex flex-col gap-3 relative ${className}`} ref={pickerRef}>
      {/* Date Header Control */}
      <div className="flex items-center justify-between kalyani-glass px-4 py-3 rounded-2xl border border-rose-200/80 dark:border-rose-950/60 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div 
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                {isToday ? 'Today • ' : isPast ? 'Past Record • ' : 'Upcoming • '}
                {format(parseISO(selectedDate), 'EEEE')}
              </p>
              <h3 className="text-base sm:text-lg font-bold font-marcellus text-slate-900 dark:text-slate-100">
                {format(parseISO(selectedDate), 'd MMMM yyyy')}
              </h3>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isToday && (
            <button
              onClick={handleGoToday}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-500" /> Today
            </button>
          )}

          {/* Custom Calendar Dropdown Button */}
          <button
            type="button"
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className={`p-2 rounded-xl border transition-all ${
              isCalendarOpen
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white border-rose-400 shadow-sm'
                : 'hover:bg-rose-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 border-rose-200 dark:border-rose-950/60'
            }`}
            title="Open Interactive Calendar"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>

          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* CUSTOM LUXURIOUS CALENDAR POPUP */}
      {isCalendarOpen && (
        <div className="absolute top-16 right-0 left-0 sm:left-auto sm:right-0 z-50 w-full sm:w-96 rounded-3xl bg-white dark:bg-[#180E1C] border border-rose-200 dark:border-rose-900/60 p-4 sm:p-5 shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 fade-in duration-150">
          {/* Top Bar: Month & Year Selectors */}
          <div className="flex items-center justify-between pb-3 border-b border-rose-200 dark:border-rose-900/40 mb-3">
            <div className="flex items-center gap-2">
              {/* Month Selector Toggle */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowMonthPicker(!showMonthPicker);
                    setShowYearPicker(false);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900/50 text-xs font-bold text-rose-700 dark:text-rose-300 hover:border-rose-400 transition-colors"
                >
                  <span>{format(viewDate, 'MMMM')}</span>
                  <ChevronDown className="w-3 h-3 text-rose-500" />
                </button>

                {showMonthPicker && (
                  <div className="absolute left-0 mt-1 w-44 max-h-48 overflow-y-auto rounded-2xl bg-white dark:bg-[#180E1C] border border-rose-200 dark:border-rose-900/60 p-1.5 shadow-2xl z-50 grid grid-cols-2 gap-1">
                    {monthsList.map((m, idx) => (
                      <button
                        key={m}
                        onClick={() => {
                          setViewDate(setMonth(viewDate, idx));
                          setShowMonthPicker(false);
                        }}
                        className={`px-2 py-1.5 text-xs rounded-lg text-left transition-colors ${
                          viewDate.getMonth() === idx
                            ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 text-white font-bold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-900 dark:hover:text-rose-200'
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
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900/50 text-xs font-bold text-rose-700 dark:text-rose-300 hover:border-rose-400 transition-colors"
                >
                  <span>{format(viewDate, 'yyyy')}</span>
                  <ChevronDown className="w-3 h-3 text-rose-500" />
                </button>

                {showYearPicker && (
                  <div className="absolute left-0 mt-1 w-32 max-h-48 overflow-y-auto rounded-2xl bg-white dark:bg-[#180E1C] border border-rose-200 dark:border-rose-900/60 p-1.5 shadow-2xl z-50 space-y-1">
                    {yearsList.map((yr) => (
                      <button
                        key={yr}
                        onClick={() => {
                          setViewDate(setYear(viewDate, yr));
                          setShowYearPicker(false);
                        }}
                        className={`w-full px-2 py-1 text-xs rounded-lg text-left transition-colors ${
                          viewDate.getFullYear() === yr
                            ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 text-white font-bold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-900 dark:hover:text-rose-200'
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
                className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewDate(addMonths(viewDate, 1))}
                className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsCalendarOpen(false)}
                className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-500 ml-1 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 py-1">
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
              const isExpired = isDateExpiredBeyondRetention(dateStr);

              return (
                <button
                  key={dateStr}
                  disabled={isExpired}
                  onClick={() => handleSelectDay(day)}
                  className={`h-9 rounded-xl text-xs flex flex-col items-center justify-center relative transition-all duration-150 ${
                    isExpired
                      ? 'text-slate-400 opacity-25 cursor-not-allowed line-through'
                      : isSelected
                      ? 'bg-gradient-to-br from-pink-500 via-rose-500 to-rose-600 border border-rose-300 text-white font-bold shadow-md scale-105'
                      : !isCurrentMonth
                      ? 'text-slate-400 opacity-40 hover:bg-rose-50 dark:hover:bg-rose-950/20'
                      : isDayToday
                      ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-400 text-rose-800 dark:text-rose-200 font-bold hover:bg-rose-100 dark:hover:bg-rose-950/60'
                      : isDayPast
                      ? 'text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-700 dark:hover:text-rose-200'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-800 dark:hover:text-rose-200'
                  }`}
                  title={isExpired ? 'Dates older than 6 days are purged from records' : undefined}
                >
                  <span>{format(day, 'd')}</span>
                  {isDayToday && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-rose-500 absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Shortcuts */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-rose-200 dark:border-rose-900/40 text-xs">
            <button
              onClick={handleGoToday}
              className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-rose-500" /> Jump to Today
            </button>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Selected: {selectedDate}
            </span>
          </div>
        </div>
      )}

      {/* Interactive Horizontal Date Strip */}
      <div className="grid grid-cols-7 gap-2 overflow-x-auto p-1 pb-1.5">
        {nearbyDates.map((dateStr) => {
          const isSelected = dateStr === selectedDate;
          const parsed = parseISO(dateStr);
          const isDayToday = isTodayDate(dateStr);
          const isDayPast = isPastDate(dateStr);
          const isExpired = isDateExpiredBeyondRetention(dateStr);

          return (
            <button
              key={dateStr}
              disabled={isExpired}
              onClick={() => onDateChange(dateStr)}
              className={`p-2.5 sm:p-3 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ${
                isExpired
                  ? 'opacity-25 cursor-not-allowed bg-slate-100 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600'
                  : isSelected
                  ? 'bg-gradient-to-br from-pink-500 via-rose-500 to-rose-600 border-2 border-rose-400 text-white shadow-md ring-2 ring-rose-400/40'
                  : 'kalyani-glass border border-rose-200/70 dark:border-rose-950/60 text-slate-700 dark:text-slate-300 hover:border-rose-400 hover:text-rose-600 dark:hover:text-rose-300'
              }`}
              title={isExpired ? 'Dates older than 6 days are purged from records' : undefined}
            >
              <span className={`text-[10px] sm:text-xs uppercase font-bold tracking-wider ${
                isSelected ? 'text-white/90' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {format(parsed, 'EEE')}
              </span>
              <span className={`text-base sm:text-lg font-bold mt-0.5 ${
                isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-100'
              }`}>
                {format(parsed, 'd')}
              </span>
              {isDayToday && (
                <span className={`w-1.5 h-1.5 rounded-full mt-1 ${
                  isSelected ? 'bg-white shadow-[0_0_6px_#FFF]' : 'bg-rose-500 shadow-[0_0_6px_#F43F5E]'
                }`} />
              )}
              {isDayPast && !isDayToday && (
                <Lock className={`w-2.5 h-2.5 mt-1 ${isSelected ? 'text-white/80' : 'text-slate-400'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
