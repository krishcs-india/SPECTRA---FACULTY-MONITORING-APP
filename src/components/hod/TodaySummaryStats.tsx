import React from 'react';
import { KalyaniStatCard } from '../common/KalyaniStatCard';
import { DayAvailabilityOverview, ScheduleStatus } from '../../types/schedule';
import { FilterStatus } from '../common/KalyaniFilterBar';
import { Users, CheckCircle2, Coffee, AlertCircle, Briefcase, CalendarX } from 'lucide-react';

interface TodaySummaryStatsProps {
  overview: DayAvailabilityOverview;
  onFilterStatus?: (status: FilterStatus) => void;
}

export const TodaySummaryStats: React.FC<TodaySummaryStatsProps> = ({
  overview,
  onFilterStatus,
}) => {
  const totalSubmitted =
    overview.submittedCount +
    overview.fullDayFreeCount +
    (overview.onDutyCount || 0) +
    (overview.leaveCount || 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 items-stretch">
      {/* Total Faculty */}
      <KalyaniStatCard
        title="Total Faculty"
        value={overview.totalFaculty}
        subtitle={`${overview.submissionPercentage}% responded`}
        variant="gold"
        icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />}
        onClick={() => onFilterStatus && onFilterStatus('ALL')}
      />

      {/* Submitted (All who submitted: Teaching, Free, OD, Leave) */}
      <KalyaniStatCard
        title="Submitted"
        value={totalSubmitted}
        subtitle={`${overview.submissionPercentage}% completed`}
        variant="emerald"
        icon={<CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 dark:text-emerald-400" />}
        onClick={() => onFilterStatus && onFilterStatus('SUBMITTED')}
      />

      {/* Full Day Free */}
      <KalyaniStatCard
        title="Full Day Free"
        value={overview.fullDayFreeCount}
        subtitle="100% available"
        variant="teal"
        icon={<Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500 dark:text-teal-400" />}
        onClick={() => onFilterStatus && onFilterStatus('FULL_DAY_FREE')}
      />

      {/* On Duty (OD) */}
      <KalyaniStatCard
        title="On Duty (OD)"
        value={overview.onDutyCount || 0}
        subtitle="Exam / External duty"
        variant="amber"
        icon={<Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 dark:text-amber-400" />}
        onClick={() => onFilterStatus && onFilterStatus('ON_DUTY')}
      />

      {/* On Leave */}
      <KalyaniStatCard
        title="On Leave"
        value={overview.leaveCount || 0}
        subtitle="Full / Half / Period"
        variant="ruby"
        icon={<CalendarX className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 dark:text-rose-400" />}
        onClick={() => onFilterStatus && onFilterStatus('LEAVE')}
      />

      {/* Not Submitted */}
      <KalyaniStatCard
        title="Not Submitted"
        value={overview.notSubmittedCount}
        subtitle="Pending submission"
        variant="slate"
        icon={<AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500 dark:text-slate-400" />}
        onClick={() => onFilterStatus && onFilterStatus('NOT_SUBMITTED')}
      />
    </div>
  );
};
