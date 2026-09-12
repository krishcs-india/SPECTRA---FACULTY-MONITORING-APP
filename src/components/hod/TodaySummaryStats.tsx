import React from 'react';
import { KalyaniStatCard } from '../common/KalyaniStatCard';
import { DayAvailabilityOverview } from '../../types/schedule';
import { Users, CheckCircle2, Coffee, AlertCircle, TrendingUp } from 'lucide-react';

interface TodaySummaryStatsProps {
  overview: DayAvailabilityOverview;
  onFilterStatus?: (status: 'ALL' | 'SUBMITTED' | 'FULL_DAY_FREE' | 'NOT_SUBMITTED') => void;
}

export const TodaySummaryStats: React.FC<TodaySummaryStatsProps> = ({
  overview,
  onFilterStatus,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
      {/* Total Faculty */}
      <KalyaniStatCard
        title="Total Faculty"
        value={overview.totalFaculty}
        subtitle={`${overview.submissionPercentage}% responded`}
        variant="gold"
        icon={<Users className="w-6 h-6 text-rose-500" />}
        onClick={() => onFilterStatus && onFilterStatus('ALL')}
      />

      {/* Submitted */}
      <KalyaniStatCard
        title="Submitted"
        value={overview.submittedCount}
        subtitle="Entered teaching periods"
        variant="emerald"
        icon={<CheckCircle2 className="w-6 h-6 text-emerald-400" />}
        onClick={() => onFilterStatus && onFilterStatus('SUBMITTED')}
      />

      {/* Full Day Free */}
      <KalyaniStatCard
        title="Full Day Free"
        value={overview.fullDayFreeCount}
        subtitle="100% available all periods"
        variant="teal"
        icon={<Coffee className="w-6 h-6 text-teal-400" />}
        onClick={() => onFilterStatus && onFilterStatus('FULL_DAY_FREE')}
      />

      {/* Not Submitted */}
      <KalyaniStatCard
        title="Not Submitted"
        value={overview.notSubmittedCount}
        subtitle="Unresponsive / Pending"
        variant="ruby"
        icon={<AlertCircle className="w-6 h-6 text-rose-400" />}
        onClick={() => onFilterStatus && onFilterStatus('NOT_SUBMITTED')}
      />
    </div>
  );
};
