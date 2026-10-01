import React, { useState, useMemo } from 'react';
import { KalyaniPageHeader } from '../../components/common/KalyaniPageHeader';
import { KalyaniDatePicker } from '../../components/common/KalyaniDatePicker';
import { PeriodAvailabilityGrid } from '../../components/hod/PeriodAvailabilityGrid';
import { FacultyStatusList } from '../../components/hod/FacultyStatusList';
import { TodaySummaryStats } from '../../components/hod/TodaySummaryStats';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import { subDays, format } from 'date-fns';
import { isDateExpiredBeyondRetention, getMinRetentionDateString } from '../../utils/dateUtils';

export const HodHistoryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const departmentId = currentUser?.departmentId || 'CSE';
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState<string>(yesterday);
  const [statFilter, setStatFilter] = useState<'ALL' | import('../../types/schedule').ScheduleStatus>('ALL');

  // Ensure selectedDate never exceeds the 6-day retention threshold
  const handleDateChange = (newDate: string) => {
    if (isDateExpiredBeyondRetention(newDate)) {
      setSelectedDate(getMinRetentionDateString());
    } else {
      setSelectedDate(newDate);
    }
  };

  const getDepartmentAvailability = useAppStore((state) => state.getDepartmentAvailability);
  const schedules = useAppStore((state) => state.schedules);
  const users = useAppStore((state) => state.users);
  const periods = useAppStore((state) => state.periods);
  const subjects = useAppStore((state) => state.subjects);

  const allPeriods = useMemo(
    () => useAppStore.getState().getAllDepartmentPeriods(departmentId),
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <KalyaniPageHeader
        title="Historical Department Availability"
        subtitle="Browse historical records, archived period allocations, and past faculty submissions."
        breadcrumbs={[{ label: 'HOD' }, { label: 'Historical Archives' }]}
      />

      <KalyaniDatePicker selectedDate={selectedDate} onDateChange={handleDateChange} />

      <TodaySummaryStats overview={overview} onFilterStatus={setStatFilter} />

      <PeriodAvailabilityGrid periodsAvailability={overview.periodAvailability} />

      <div className="space-y-3 pt-2">
        <h3 className="text-base font-bold text-slate-100">
          Archived Faculty Submissions &amp; Logs
        </h3>
        <FacultyStatusList
          overview={overview}
          activePeriods={allPeriods}
          departmentName={currentUser?.departmentName || 'Computer Science & Engineering'}
          departmentSubjects={deptSubjects}
          statusFilterSignal={statFilter}
          allowManagement={false}
        />
      </div>
    </div>
  );
};
