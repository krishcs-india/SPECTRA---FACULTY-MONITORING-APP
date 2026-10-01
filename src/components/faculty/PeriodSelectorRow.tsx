import React from 'react';
import { Period } from '../../types/period';
import { PeriodEntry } from '../../types/schedule';
import { KalyaniBadge } from '../common/KalyaniBadge';
import { ChevronRight, Coffee, BookOpen, Sparkles, CalendarX, Briefcase } from 'lucide-react';

interface PeriodSelectorRowProps {
  period: Period;
  entry?: PeriodEntry;
  isReadOnly?: boolean;
  onOpenPicker: () => void;
  onQuickToggleFree: () => void;
}

export const PeriodSelectorRow: React.FC<PeriodSelectorRowProps> = ({
  period,
  entry,
  isReadOnly = false,
  onOpenPicker,
  onQuickToggleFree,
}) => {
  const isFree = !entry || entry.type === 'FREE';
  const isSubject = entry?.type === 'SUBJECT';
  const isCustom = entry?.type === 'CUSTOM';
  const isLeave = entry?.type === 'LEAVE';
  const isOnDuty = entry?.type === 'ON_DUTY';

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isFree
          ? 'bg-white/90 dark:bg-[#180E1C]/90 border-rose-200/80 dark:border-rose-900/30 hover:border-rose-400/50 shadow-sm'
          : isLeave
          ? 'bg-rose-50/90 dark:bg-[#280d1a]/90 border-rose-400/80 dark:border-rose-500/50 shadow-sm'
          : isOnDuty
          ? 'bg-amber-50/90 dark:bg-[#26180a]/90 border-amber-400/80 dark:border-amber-500/50 shadow-sm'
          : isSubject
          ? 'bg-rose-50/90 dark:bg-[#231229]/90 border-rose-300/80 dark:border-rose-500/40 shadow-sm'
          : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300/60 dark:border-amber-500/30 shadow-sm'
      }`}
    >
      {/* Top / Left: Period Info & Badge */}
      <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
        <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-400/30 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
            {period.name || period.shortName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <KalyaniBadge entryType={entry?.type || 'FREE'} size="sm" />
        </div>
      </div>

      {/* Bottom / Right: Assignment Button with Multi-Line Expansion */}
      <div className="flex items-center gap-2 w-full sm:w-auto sm:max-w-[70%] justify-end min-w-0">
        <button
          type="button"
          disabled={isReadOnly}
          onClick={onOpenPicker}
          className={`flex-1 flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all apple-hover border min-h-[44px] min-w-0 text-left ${
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

        {!isReadOnly && !isFree && (
          <button
            type="button"
            onClick={onQuickToggleFree}
            title="Quick toggle to Free"
            className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 transition-colors shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px]"
          >
            <Coffee className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
