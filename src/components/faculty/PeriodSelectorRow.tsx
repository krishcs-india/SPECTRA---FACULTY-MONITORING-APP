import React from 'react';
import { Period } from '../../types/period';
import { PeriodEntry } from '../../types/schedule';
import { KalyaniBadge } from '../common/KalyaniBadge';
import { ChevronRight, Coffee, BookOpen, Sparkles } from 'lucide-react';

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

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isFree
          ? 'kalyani-glass hover:border-kalyani-gold-500/30'
          : isSubject
          ? 'bg-kalyani-crimson-900/60 border-kalyani-gold-500/40 shadow-gold-sm'
          : 'bg-amber-950/30 border-amber-500/30'
      }`}
    >
      {/* Top / Left: Period Info & Badge */}
      <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
        <div className="px-3 py-1.5 rounded-xl bg-kalyani-gold-500/10 border border-kalyani-gold-400/30 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-kalyani-gold-300">
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
              ? 'bg-teal-950/60 border-teal-500/30 text-teal-300 hover:bg-teal-900/50'
              : isSubject
              ? 'bg-kalyani-gold-500/15 border-kalyani-gold-400/50 text-kalyani-gold-200 hover:bg-kalyani-gold-500/25'
              : 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/50'
          } ${isReadOnly ? 'cursor-default opacity-85' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {isFree && <Coffee className="w-4 h-4 text-teal-400 shrink-0" />}
            {isSubject && <BookOpen className="w-4 h-4 text-kalyani-gold-400 shrink-0" />}
            {isCustom && <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />}

            <span className="whitespace-normal break-words leading-relaxed text-xs">
              {isFree && 'FREE (Available)'}
              {isSubject && (entry?.subjectCode ? `${entry.subjectCode} — ${entry.subjectName}` : entry?.subjectName)}
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
            className="p-2.5 rounded-xl hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 transition-colors shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px]"
          >
            <Coffee className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
