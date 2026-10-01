import React, { useState } from 'react';
import { KalyaniPageHeader } from '../../components/common/KalyaniPageHeader';
import { KalyaniCard } from '../../components/common/KalyaniCard';
import { KalyaniBadge } from '../../components/common/KalyaniBadge';
import { KalyaniEmptyState } from '../../components/common/KalyaniEmptyState';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import { formatDateDisplay, formatTimeDisplay, isDateWithinRetentionWindow } from '../../utils/dateUtils';
import { Calendar, History, Clock, BookOpen, Coffee, Sparkles } from 'lucide-react';

export const FacultyHistoryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const facultyId = currentUser?.uid || '';
  const departmentId = currentUser?.departmentId || 'CSE';

  const history = useAppStore((state) =>
    Object.values(state.schedules)
      .filter((s) => s.facultyId === facultyId && isDateWithinRetentionWindow(s.date))
      .sort((a, b) => b.date.localeCompare(a.date))
  );
  const allPeriods = useAppStore((state) => state.getAllDepartmentPeriods(departmentId));

  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <KalyaniPageHeader
        title="Schedule Submission History"
        subtitle="Review your past period availability logs and declared teaching assignments."
        breadcrumbs={[{ label: 'Faculty' }, { label: 'History' }]}
      />

      {history.length === 0 ? (
        <KalyaniEmptyState
          title="No Submission History Found"
          description="You have not submitted any past daily schedules yet. As you submit schedules each day, they will be archived here."
        />
      ) : (
        <div className="space-y-4">
          {history.map((record) => {
            const isExpanded = expandedDate === record.date;
            const assignedCount = Object.values(record.periods || {}).filter(
              (p) => p && (p.type === 'SUBJECT' || p.type === 'CUSTOM')
            ).length;
            const odCount = Object.values(record.periods || {}).filter((p) => p && p.type === 'ON_DUTY').length;
            const leaveCount = Object.values(record.periods || {}).filter((p) => p && p.type === 'LEAVE').length;

            return (
              <KalyaniCard
                key={record.id}
                variant="glass"
                className="apple-hover"
                bodyClassName="p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-bold font-marcellus text-slate-900 dark:text-slate-100">
                          {formatDateDisplay(record.date)}
                        </h3>
                        <KalyaniBadge status={record.status} size="sm" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {record.status === 'FULL_DAY_FREE'
                          ? 'Declared full day free'
                          : record.status === 'LEAVE'
                          ? `On Leave (${leaveCount > 0 ? `${leaveCount} period(s)` : 'Full Day'}) • Submitted at ${formatTimeDisplay(record.submittedAt)}`
                          : record.status === 'ON_DUTY'
                          ? `On Duty (${odCount > 0 ? `${odCount} period(s)` : 'Full Day'}) • Submitted at ${formatTimeDisplay(record.submittedAt)}`
                          : `${assignedCount} teaching period(s) assigned • Submitted at ${formatTimeDisplay(record.submittedAt)}`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedDate(isExpanded ? null : record.date)}
                    className="self-end sm:self-center text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#180E1C] border border-rose-200 dark:border-rose-900/50 hover:border-rose-400 text-rose-600 dark:text-rose-300 shadow-sm transition-colors"
                  >
                    {isExpanded ? 'Hide Details' : 'View Period Breakdown'}
                  </button>
                </div>

                {/* Expanded Period Breakdown */}
                {isExpanded && (
                  <div className="mt-5 pt-4 border-t border-rose-200 dark:border-rose-900/40 space-y-2 animate-in fade-in duration-150">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-200 font-marcellus mb-2">
                      Recorded Period Allocation
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {(() => {
                        const recordedKeys = Object.keys(record.periods || {});
                        const periodsToRender = (recordedKeys.length > 0
                          ? recordedKeys.map((k, idx) => {
                              const found = allPeriods.find((p) => p.id === k);
                              const numMatch = k.match(/\d+/);
                              const num = numMatch ? parseInt(numMatch[0], 10) : idx + 1;
                              return found || {
                                id: k,
                                name: `Period ${num}`,
                                shortName: `P${num}`,
                                sequence: num,
                                startTime: '',
                                endTime: '',
                                active: true,
                                departmentId: departmentId,
                              };
                            })
                          : allPeriods
                        ).sort((a, b) => {
                          const seqA = a.sequence ?? (parseInt((a.name || a.shortName || a.id || '').replace(/\D/g, ''), 10) || 999);
                          const seqB = b.sequence ?? (parseInt((b.name || b.shortName || b.id || '').replace(/\D/g, ''), 10) || 999);
                          return seqA - seqB;
                        });

                        return periodsToRender.map((period) => {
                          const entry = record.periods?.[period.id] ||
                            (typeof period.sequence === 'number'
                              ? Object.entries(record.periods || {}).find(([k]) => {
                                  const match = k.match(/\d+/);
                                  return match ? parseInt(match[0], 10) === period.sequence : false;
                                })?.[1]
                              : undefined);
                          const isFree = !entry || entry.type === 'FREE';
                          const isSubject = entry?.type === 'SUBJECT';
                          const isLeave = entry?.type === 'LEAVE';
                          const isOnDuty = entry?.type === 'ON_DUTY';

                          return (
                            <div
                              key={period.id}
                              className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between ${
                                isFree
                                  ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-500/20 text-teal-800 dark:text-teal-200'
                                  : isLeave
                                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700/50 text-rose-800 dark:text-rose-200'
                                  : isOnDuty
                                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-600/40 text-amber-800 dark:text-amber-200'
                                  : isSubject
                                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-200'
                                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200'
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold">
                                <span>{period.name || period.shortName}</span>
                                <span className="text-[10px] uppercase font-semibold">
                                  {isFree ? 'FREE' : isLeave ? 'LEAVE' : isOnDuty ? 'ON DUTY' : isSubject ? 'Assigned' : 'Other'}
                                </span>
                              </div>
                              <p className="mt-1 font-medium text-slate-800 dark:text-slate-100 break-words whitespace-normal leading-snug text-[11px]">
                                {isFree && 'Available'}
                                {isLeave && (entry?.leaveReason ? `Leave: ${entry.leaveReason}` : 'On Leave')}
                                {isOnDuty && `OD: ${entry?.onDutyCategory ? `[${entry.onDutyCategory}] ` : ''}${entry?.onDutyReason || ''}`}
                                {isSubject && `${entry?.subjectCode ? `${entry.subjectCode} — ` : ''}${entry?.subjectName || ''}`}
                                {entry?.type === 'CUSTOM' && `Other: ${entry?.customText}`}
                              </p>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </KalyaniCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
