import React, { useRef } from 'react';
import { Period } from '../../types/period';
import { PeriodEntry } from '../../types/schedule';
import { KalyaniBadge } from '../common/KalyaniBadge';
import { ChevronRight, Coffee, BookOpen, Sparkles, CalendarX, Briefcase, Check } from 'lucide-react';

interface PeriodSelectorRowProps {
  period: Period;
  entry?: PeriodEntry;
  isReadOnly?: boolean;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onToggleSelect?: () => void;
  onLongPress?: () => void;
  onOpenPicker: () => void;
  onQuickToggleFree: () => void;
}

export const PeriodSelectorRow: React.FC<PeriodSelectorRowProps> = ({
  period,
  entry,
  isReadOnly = false,
  isSelected = false,
  isSelectionMode = false,
  onToggleSelect,
  onLongPress,
  onOpenPicker,
  onQuickToggleFree,
}) => {
  const isFree = !entry || entry.type === 'FREE';
  const isSubject = entry?.type === 'SUBJECT';
  const isCustom = entry?.type === 'CUSTOM';
  const isLeave = entry?.type === 'LEAVE';
  const isOnDuty = entry?.type === 'ON_DUTY';

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressTriggeredRef = useRef(false);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleStartPress = (clientX?: number, clientY?: number) => {
    if (isReadOnly) return;
    isLongPressTriggeredRef.current = false;
    if (clientX !== undefined && clientY !== undefined) {
      touchStartPosRef.current = { x: clientX, y: clientY };
    }
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      try {
        if ('vibrate' in navigator) navigator.vibrate([30, 40, 30]);
      } catch {}
      onLongPress?.();
    }, 450);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current || !longPressTimerRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartPosRef.current.x;
    const dy = touch.clientY - touchStartPosRef.current.y;
    // Jitter tolerance: only cancel if finger moves > 10px (intentional scroll)
    if (Math.hypot(dx, dy) > 10) {
      handleCancelPress();
    }
  };

  const handleCancelPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;
  };

  const handleRowClick = (e: React.MouseEvent) => {
    if (isLongPressTriggeredRef.current) {
      e.preventDefault();
      e.stopPropagation();
      isLongPressTriggeredRef.current = false;
      return;
    }
    if (isSelectionMode && onToggleSelect) {
      e.preventDefault();
      e.stopPropagation();
      try {
        if ('vibrate' in navigator) navigator.vibrate(15);
      } catch {}
      onToggleSelect();
    }
  };

  return (
    <div
      onMouseDown={() => handleStartPress()}
      onMouseUp={handleCancelPress}
      onMouseLeave={handleCancelPress}
      onTouchStart={(e) => handleStartPress(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleCancelPress}
      onTouchMove={handleTouchMove}
      onContextMenu={(e) => {
        if (!isReadOnly) {
          e.preventDefault();
          onLongPress?.(); // Right-click enters multi-select on desktop
        }
      }}
      onClick={handleRowClick}
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none touch-manipulation ${
        isSelected
          ? 'border-rose-500 ring-2 ring-rose-500/40 bg-gradient-to-r from-rose-100/90 via-pink-50/90 to-rose-100/90 dark:from-[#35142e] dark:via-[#280f24] dark:to-[#35142e] shadow-md'
          : isFree
          ? 'bg-white/90 dark:bg-[#180E1C]/90 border-rose-200/80 dark:border-rose-900/30 hover:border-rose-400/50 shadow-sm'
          : isLeave
          ? 'bg-rose-50/90 dark:bg-[#280d1a]/90 border-rose-400/80 dark:border-rose-500/50 shadow-sm'
          : isOnDuty
          ? 'bg-amber-50/90 dark:bg-[#26180a]/90 border-amber-400/80 dark:border-amber-500/50 shadow-sm'
          : isSubject
          ? 'bg-rose-50/90 dark:bg-[#231229]/90 border-rose-300/80 dark:border-rose-500/40 shadow-sm'
          : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300/60 dark:border-amber-500/30 shadow-sm'
      } ${isSelectionMode && !isReadOnly ? 'cursor-pointer hover:border-rose-400 active:scale-[0.99]' : ''}`}
    >
      {/* Top / Left: Selection Indicator, Period Info & Badge */}
      <div className="flex items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto">
        <div className="flex items-center gap-2.5 min-w-0">
          {(isSelectionMode || isSelected) && (
            <button
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              aria-label={`${isSelected ? 'Deselect' : 'Select'} ${period.name || period.shortName}`}
              onClick={(e) => {
                e.stopPropagation();
                try { if ('vibrate' in navigator) navigator.vibrate(15); } catch {}
                onToggleSelect?.();
              }}
              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-90 ${
                isSelected
                  ? 'bg-rose-600 text-white shadow-xs ring-1 ring-rose-400'
                  : 'border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-[#180E1C] hover:border-rose-400'
              }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-400/30 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
              {period.name || period.shortName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <KalyaniBadge entryType={entry?.type || 'FREE'} size="sm" />
        </div>
      </div>

      {/* Bottom / Right: Assignment Button with Multi-Line Expansion */}
      <div className="flex items-center gap-2 w-full sm:w-auto sm:max-w-[70%] justify-end min-w-0">
        <button
          type="button"
          disabled={isReadOnly}
          onClick={(e) => {
            if (isSelectionMode) {
              e.stopPropagation();
              try { if ('vibrate' in navigator) navigator.vibrate(15); } catch {}
              onToggleSelect?.();
            } else {
              onOpenPicker();
            }
          }}
          className={`flex-1 flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border min-h-[44px] min-w-0 text-left touch-manipulation active:scale-[0.98] ${
            isFree
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300/70 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50'
              : isLeave
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-500/50 text-rose-900 dark:text-rose-200 hover:bg-rose-100/80 dark:hover:bg-rose-900/40'
              : isOnDuty
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-500/50 text-amber-900 dark:text-amber-200 hover:bg-amber-100/80 dark:hover:bg-amber-900/40'
              : isSubject
              ? 'bg-gradient-to-r from-rose-500/10 via-pink-500/15 to-rose-500/10 border-rose-300 dark:border-rose-500/40 text-rose-900 dark:text-rose-200 hover:bg-rose-500/20'
              : 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50'
          } ${isReadOnly ? 'cursor-default opacity-85' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {isFree && <Coffee className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
            {isLeave && <CalendarX className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
            {isOnDuty && <Briefcase className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />}
            {isSubject && <BookOpen className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
            {isCustom && <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />}

            <span className="whitespace-normal break-words leading-relaxed text-xs">
              {isFree && 'FREE (Available)'}
              {isLeave && `LEAVE: ${entry?.leaveReason || 'On Leave'}`}
              {isOnDuty && `ON DUTY: ${entry?.onDutyCategory || 'On Duty'}${entry?.onDutyReason && entry?.onDutyReason !== entry?.onDutyCategory ? ` — ${entry.onDutyReason}` : ''}`}
              {isSubject && (entry?.subjectCode ? `${entry.subjectCode} — ${entry?.subjectName || ''}` : entry?.subjectName || 'Subject')}
              {isCustom && `Other: ${entry?.customText || 'Custom Entry'}`}
            </span>
          </div>

          {!isReadOnly && <ChevronRight className="w-4 h-4 opacity-60 shrink-0 ml-1.5 self-center" />}
        </button>

        {!isReadOnly && !isFree && !isSelectionMode && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              try { if ('vibrate' in navigator) navigator.vibrate(20); } catch {}
              onQuickToggleFree();
            }}
            title="Quick toggle to Free"
            aria-label={`Reset ${period.name || period.shortName} to Free`}
            className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 active:scale-95 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 transition-colors shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px] touch-manipulation"
          >
            <Coffee className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
