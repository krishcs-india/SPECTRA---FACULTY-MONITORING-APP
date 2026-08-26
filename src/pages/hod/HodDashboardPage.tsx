import React, { useState, useMemo } from 'react';
import { KalyaniPageHeader } from '../../components/common/KalyaniPageHeader';
import { KalyaniDatePicker } from '../../components/common/KalyaniDatePicker';
import { TodaySummaryStats } from '../../components/hod/TodaySummaryStats';
import { PeriodAvailabilityGrid } from '../../components/hod/PeriodAvailabilityGrid';
import { FacultyStatusList } from '../../components/hod/FacultyStatusList';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import { getTodayDateString } from '../../utils/dateUtils';
import { Sparkles, RefreshCw } from 'lucide-react';

export const HodDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const departmentId = currentUser?.departmentId || 'dept_cse';

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [statFilter, setStatFilter] = useState<'ALL' | 'SUBMITTED' | 'FULL_DAY_FREE' | 'NOT_SUBMITTED'>('ALL');

  const getDepartmentAvailability = useAppStore((state) => state.getDepartmentAvailability);
  const schedules = useAppStore((state) => state.schedules);
  const users = useAppStore((state) => state.users);
  const activePeriods = useAppStore((state) => state.getActivePeriods(departmentId));
  const subjects = useAppStore((state) => state.getDepartmentSubjects(departmentId));

  const overview = useMemo(
    () => getDepartmentAvailability(departmentId, selectedDate),
    [getDepartmentAvailability, departmentId, selectedDate, schedules, users, activePeriods.length]
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <KalyaniPageHeader
        title="Department Availability Operations"
        subtitle="Real-time faculty period allocation, substitution tracking, and submission monitoring."
        breadcrumbs={[{ label: 'HOD' }, { label: 'Live Dashboard' }]}
        badge={
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-kalyani-gold-500/15 border border-kalyani-gold-400/40 text-kalyani-gold-300">
            {currentUser?.departmentName || 'Computer Science & Engineering'}
          </span>
        }
      />

      {/* Date Ribbon Picker */}
      <KalyaniDatePicker
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Summary KPI Cards */}
      <TodaySummaryStats overview={overview} onFilterStatus={setStatFilter} />

      {/* Period-Wise Availability Matrix with 1-click drilldowns */}
      <PeriodAvailabilityGrid periodsAvailability={overview.periodAvailability} />

      {/* Faculty Response List & Filters */}
      <div className="space-y-3 pt-2">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
          Faculty Submissions &amp; Period Roster
        </h3>
        <FacultyStatusList
          overview={overview}
          activePeriods={activePeriods}
          departmentName={currentUser?.departmentName || 'Computer Science & Engineering'}
          departmentSubjects={subjects}
          statusFilterSignal={statFilter}
          allowManagement={false}
        />
      </div>
    </div>
  );
};
