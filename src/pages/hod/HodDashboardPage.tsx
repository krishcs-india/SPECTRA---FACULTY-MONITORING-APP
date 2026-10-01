import React, { useState, useMemo } from 'react';
import { KalyaniPageHeader } from '../../components/common/KalyaniPageHeader';
import { KalyaniDatePicker } from '../../components/common/KalyaniDatePicker';
import { TodaySummaryStats } from '../../components/hod/TodaySummaryStats';
import { PeriodAvailabilityGrid } from '../../components/hod/PeriodAvailabilityGrid';
import { FacultyStatusList } from '../../components/hod/FacultyStatusList';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import { getTodayDateString } from '../../utils/dateUtils';

interface HodDashboardPageProps {
  onNavigate: (path: string) => void;
}

export const HodDashboardPage: React.FC<HodDashboardPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const departmentId = currentUser?.departmentId || 'CSE';

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [statFilter, setStatFilter] = useState<'ALL' | import('../../types/schedule').ScheduleStatus>('ALL');

  const getDepartmentAvailability = useAppStore((state) => state.getDepartmentAvailability);
  const schedules = useAppStore((state) => state.schedules);
  const users = useAppStore((state) => state.users);
  const periods = useAppStore((state) => state.periods);
  const subjects = useAppStore((state) => state.subjects);

  const activePeriods = useMemo(
    () => useAppStore.getState().getActivePeriods(departmentId),
    [periods, departmentId]
  );

  const deptSubjects = useMemo(
    () => useAppStore.getState().getDepartmentSubjects(departmentId),
    [subjects, departmentId]
  );

  const overview = useMemo(
    () => getDepartmentAvailability(departmentId, selectedDate),
    [getDepartmentAvailability, departmentId, selectedDate, schedules, users, periods]
  );

  const handleStatCardClick = (status: 'ALL' | import('../../types/schedule').ScheduleStatus) => {
    sessionStorage.setItem('hod_faculty_filter', status);
    sessionStorage.setItem('hod_faculty_date', selectedDate);
    onNavigate('/hod/faculty');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <KalyaniPageHeader
        title="Department Availability Operations"
        subtitle="Real-time faculty period allocation, substitution tracking, and submission monitoring."
        breadcrumbs={[{ label: 'HOD' }, { label: 'Live Dashboard' }]}
        badge={
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-500/15 border border-rose-400/40 text-rose-700 dark:text-rose-300">
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
      <TodaySummaryStats overview={overview} onFilterStatus={handleStatCardClick} />

      {/* Period-Wise Availability Matrix with 1-click drilldowns */}
      <PeriodAvailabilityGrid periodsAvailability={overview.periodAvailability} />

      {/* Faculty Response List & Filters */}
      <div className="space-y-3 pt-2">
        <h3 className="text-base font-bold font-marcellus text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
          Faculty Submissions &amp; Period Roster
        </h3>
        <FacultyStatusList
          overview={overview}
          activePeriods={activePeriods}
          departmentName={currentUser?.departmentName || 'Computer Science & Engineering'}
          departmentSubjects={deptSubjects}
          statusFilterSignal={statFilter}
          allowManagement={false}
        />
      </div>
    </div>
  );
};
