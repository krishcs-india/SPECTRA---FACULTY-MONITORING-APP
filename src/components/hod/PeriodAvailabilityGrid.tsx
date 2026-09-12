import React, { useState } from 'react';
import { PeriodAvailabilitySummary } from '../../types/schedule';
import { KalyaniCard } from '../common/KalyaniCard';
import { KalyaniModal } from '../common/KalyaniModal';
import { KalyaniBadge } from '../common/KalyaniBadge';
import { Coffee, BookOpen, UserCheck, AlertCircle, ChevronRight, Sparkles } from 'lucide-react';

interface PeriodAvailabilityGridProps {
  periodsAvailability: PeriodAvailabilitySummary[];
}

export const PeriodAvailabilityGrid: React.FC<PeriodAvailabilityGridProps> = ({
  periodsAvailability,
}) => {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);

  const activePeriodModal = React.useMemo(
    () => periodsAvailability.find((p) => p.periodId === selectedPeriodId),
    [periodsAvailability, selectedPeriodId]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold font-marcellus text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm" />
            Live Period-Wise Availability Matrix
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans">
            Click any period to inspect free faculty available for duty or substitution
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {periodsAvailability.map((period) => {
          return (
            <KalyaniCard
              key={period.periodId}
              variant="card"
              onClick={() => setSelectedPeriodId(period.periodId)}
              className="apple-hover group"
              bodyClassName="p-4 flex flex-col justify-between h-full"
            >
              {/* Top: Period Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 shadow-sm font-sans">
                    {period.periodName || period.shortName}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-500/30 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
                  <Coffee className="w-4 h-4" />
                </div>
              </div>

              {/* Middle: Count Badges */}
              <div className="mt-4 pt-3 border-t border-rose-200/80 dark:border-rose-950/60 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 font-sans">Available</p>
                  <p className="text-lg font-bold text-teal-600 dark:text-teal-300 font-sans">
                    {period.freeFacultyCount}{' '}
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Free</span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 font-sans">Assigned</p>
                  <p className="text-sm font-semibold text-rose-700 dark:text-rose-300 font-sans">
                    {period.busyFacultyCount}{' '}
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Busy</span>
                  </p>
                </div>
              </div>

              {/* Bottom Action Hint */}
              <div className="mt-3 flex items-center justify-end text-[11px] font-medium text-rose-600 dark:text-rose-400 group-hover:text-rose-700 dark:group-hover:text-rose-300">
                <span>View faculty</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </KalyaniCard>
          );
        })}
      </div>

      {/* Drilldown Modal: Who is available in this period - Live Reactive */}
      {activePeriodModal && (
        <KalyaniModal
          isOpen={Boolean(activePeriodModal)}
          onClose={() => setSelectedPeriodId(null)}
          maxWidth="lg"
          title={`${activePeriodModal.periodName} Availability`}
          subtitle="Faculty availability breakdown for this period"
        >
          <div className="space-y-6">
            {/* Free Faculty Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                  <Coffee className="w-4 h-4 text-teal-400" />
                  Available Free Faculty ({activePeriodModal.freeFaculty.length})
                </h4>
                <span className="text-[10px] text-teal-400/80">Confirmed available</span>
              </div>

              {activePeriodModal.freeFaculty.length === 0 ? (
                <div className="p-4 rounded-xl bg-teal-950/20 border border-teal-500/20 text-xs text-slate-400 text-center">
                  No faculty available in this period.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activePeriodModal.freeFaculty.map((f) => (
                    <div
                      key={f.facultyId}
                      className="p-3 rounded-xl bg-teal-950/40 border border-teal-500/30 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-marcellus text-base text-slate-100 font-semibold leading-tight">{f.facultyName}</p>
                        <p className="text-[10px] text-teal-300 mt-0.5 font-marcellus">{f.facultyDesignation}</p>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-bold rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        FREE
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Busy / Assigned Faculty Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-200 flex items-center gap-1.5 font-marcellus">
                  <BookOpen className="w-4 h-4 text-rose-500" />
                  Teaching / Assigned Faculty ({activePeriodModal.busyFaculty.length})
                </h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-marcellus">Occupied with classes/duties</span>
              </div>

              {activePeriodModal.busyFaculty.length === 0 ? (
                <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-[#180E1C]/60 border border-rose-200 dark:border-rose-900/40 text-xs text-slate-500 dark:text-slate-400 text-center font-marcellus">
                  No faculty teaching in this period.
                </div>
              ) : (
                <div className="space-y-2">
                  {activePeriodModal.busyFaculty.map((f) => (
                    <div
                      key={f.facultyId}
                      className="p-3.5 rounded-2xl bg-white dark:bg-[#201026] border border-rose-200 dark:border-rose-900/40 shadow-sm flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-marcellus text-base text-slate-800 dark:text-slate-100 font-semibold leading-tight">{f.facultyName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-marcellus">{f.facultyDesignation}</p>
                      </div>

                      <div className="text-right max-w-[60%] sm:max-w-[70%]">
                        <span className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-200 shadow-sm font-sans whitespace-normal break-words leading-relaxed inline-block text-right">
                          {f.activity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </KalyaniModal>
      )}
    </div>
  );
};
