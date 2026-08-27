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

            return (
              <KalyaniCard
                key={record.id}
                variant="glass"
                className="apple-hover"
                bodyClassName="p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-kalyani-gold-500/10 border border-kalyani-gold-500/20 text-kalyani-gold-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-bold text-slate-100">
                          {formatDateDisplay(record.date)}
                        </h3>
                        <KalyaniBadge status={record.status} size="sm" />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {record.status === 'FULL_DAY_FREE'
                          ? 'Declared full day free'
                          : `${assignedCount} teaching period(s) assigned • Submitted at ${formatTimeDisplay(record.submittedAt)}`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedDate(isExpanded ? null : record.date)}
                    className="self-end sm:self-center text-xs font-semibold px-3.5 py-1.5 rounded-xl kalyani-glass hover:border-kalyani-gold-400 text-kalyani-gold-300 transition-colors"
                  >
                    {isExpanded ? 'Hide Details' : 'View Period Breakdown'}
                  </button>
                </div>

                {/* Expanded Period Breakdown */}
                {isExpanded && (
                  <div className="mt-5 pt-4 border-t border-kalyani-gold-500/15 space-y-2 animate-in fade-in duration-150">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-kalyani-gold-300 mb-2">
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

                          return (
                            <div
                              key={period.id}
                              className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between ${
                                isFree
                                  ? 'bg-teal-950/40 border-teal-500/20 text-teal-200'
                                  : isSubject
                                  ? 'bg-kalyani-crimson-900/60 border-kalyani-gold-500/30 text-kalyani-gold-200'
                                  : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold">
                                <span>{period.name || period.shortName}</span>
                                <span className="text-[10px] uppercase font-semibold">
                                  {isFree ? 'FREE' : isSubject ? 'Assigned' : 'Other'}
                                </span>
                              </div>
                              <p className="mt-1 font-medium text-slate-100 break-words whitespace-normal leading-snug text-[11px]">
                                {isFree && 'Available'}
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
