import React from 'react';
import { KalyaniModal } from '../common/KalyaniModal';
import { KalyaniBadge } from '../common/KalyaniBadge';
import { Period } from '../../types/period';
import { FacultySchedule } from '../../types/schedule';
import { BookOpen, Coffee, Sparkles, Calendar, Mail, User } from 'lucide-react';
import { formatDateDisplay } from '../../utils/dateUtils';

interface FacultyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  facultyName: string;
  facultyDesignation: string;
  facultyEmail: string;
  date: string;
  schedule?: FacultySchedule;
  activePeriods: Period[];
}

export const FacultyDetailModal: React.FC<FacultyDetailModalProps> = ({
  isOpen,
  onClose,
  facultyName,
  facultyDesignation,
  facultyEmail,
  date,
  schedule,
  activePeriods,
}) => {
  const status = schedule?.status || 'NOT_SUBMITTED';

  return (
    <KalyaniModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={<span className="font-cursive text-3xl text-gold-gradient font-normal">{facultyName}</span>}
      subtitle={<span className="font-marcellus text-xs text-slate-300">{facultyDesignation}</span>}
    >
      <div className="space-y-5">
        {/* Info Header Box */}
        <div className="p-4 rounded-2xl kalyani-glass flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-kalyani-gold-400" />
              <span className="text-xs font-bold text-slate-100">{formatDateDisplay(date)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>{facultyEmail}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <KalyaniBadge status={status} size="md" />
          </div>
        </div>

        {/* Not Submitted Notice */}
        {status === 'NOT_SUBMITTED' && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs text-center">
            This faculty member has not submitted their period availability for today yet.
          </div>
        )}

        {/* Full Day Free Notice */}
        {status === 'FULL_DAY_FREE' && (
          <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-500/30 text-teal-200 text-xs text-center flex items-center justify-center gap-2">
            <Coffee className="w-4 h-4 text-teal-400" />
            <span>Faculty has explicitly declared FULL DAY FREE across all periods today.</span>
          </div>
        )}

        {/* Detailed Period Grid */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-kalyani-gold-300">
            Period-by-Period Timeline
          </h4>

          <div className="space-y-2">
            {activePeriods.map((period) => {
              if (!schedule || status === 'NOT_SUBMITTED') {
                return (
                  <div
                    key={period.id}
                    className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/40 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300 whitespace-nowrap">
                        {period.name || period.shortName}
                      </span>
                    </div>
                    <span className="text-xs text-rose-400 font-semibold">Not Submitted</span>
                  </div>
                );
              }

              if (status === 'FULL_DAY_FREE') {
                return (
                  <div
                    key={period.id}
                    className="p-3.5 rounded-2xl border border-teal-500/20 bg-teal-950/30 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-teal-900/50 border border-teal-500/30 text-teal-300 whitespace-nowrap">
                        {period.name || period.shortName}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-bold rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      FREE (Full Day)
                    </span>
                  </div>
                );
              }

              const entry = schedule.periods?.[period.id];
              const isFree = !entry || entry.type === 'FREE';
              const isSubject = entry?.type === 'SUBJECT';

              return (
                <div
                  key={period.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                    isFree
                      ? 'border-teal-500/25 bg-teal-950/20'
                      : isSubject
                      ? 'border-kalyani-gold-500/40 bg-kalyani-crimson-900/60'
                      : 'border-amber-500/30 bg-amber-950/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-kalyani-crimson-950 border border-kalyani-gold-500/30 text-kalyani-gold-300 whitespace-nowrap">
                      {period.name || period.shortName}
                    </span>
                  </div>

                  <div className="text-right flex-1 flex justify-end">
                    {isFree && (
                      <span className="px-2.5 py-1 text-xs font-bold rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        FREE
                      </span>
                    )}
                    {isSubject && (
                      <span className="px-3 py-1 text-xs font-semibold rounded-xl bg-kalyani-gold-500/15 border border-kalyani-gold-400/40 text-kalyani-gold-200 shadow-sm">
                        {entry.subjectCode ? `${entry.subjectCode} — ${entry.subjectName}` : entry.subjectName}
                      </span>
                    )}
                    {entry?.type === 'CUSTOM' && (
                      <span className="px-3 py-1 text-xs font-semibold rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-200">
                        Other: {entry.customText}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {schedule?.submittedAt && (
          <p className="text-[11px] text-slate-400 text-right">
            Synchronized at: {new Date(schedule.submittedAt).toLocaleString()}
          </p>
        )}
      </div>
    </KalyaniModal>
  );
};
