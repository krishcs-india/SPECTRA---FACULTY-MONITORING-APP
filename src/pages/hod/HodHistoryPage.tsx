import React, { useState, useMemo } from 'react';
import { KalyaniPageHeader } from '../../components/common/KalyaniPageHeader';
import { KalyaniDatePicker } from '../../components/common/KalyaniDatePicker';
import { PeriodAvailabilityGrid } from '../../components/hod/PeriodAvailabilityGrid';
import { FacultyStatusList } from '../../components/hod/FacultyStatusList';
import { TodaySummaryStats } from '../../components/hod/TodaySummaryStats';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import { getTodayDateString } from '../../utils/dateUtils';
import { CalendarRange } from 'lucide-react';
import { subDays, format } from 'date-fns';

export const HodHistoryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const departmentId = currentUser?.departmentId || 'dept_cse';
  // Default to yesterday for history exploration
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState<string>(yesterday);
  const [statFilter, setStatFilter] = useState<'ALL' | 'SUBMITTED' | 'FULL_DAY_FREE' | 'NOT_SUBMITTED'>('ALL');

  const getDepartmentAvailability = useAppStore((state) => state.getDepartmentAvailability);
  const schedules = useAppStore((state) => state.schedules);
  const users = useAppStore((state) => state.users);
  // Historical views must include periods that were later disabled,
  // otherwise archived records for those periods become invisible
  const allPeriods = useAppStore((state) => state.getAllDepartmentPeriods(departmentId));
  const subjects = useAppStore((state) => state.getDepartmentSubjects(departmentId));

  const overview = useMemo(
    () => getDepartmentAvailability(departmentId, selectedDate),
    [getDepartmentAvailability, departmentId, selectedDate, schedules, users, allPeriods.length]
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <KalyaniPageHeader
        title="Historical Department Availability"
        subtitle="Browse historical records, archived period allocations, and past faculty submissions."
        breadcrumbs={[{ label: 'HOD' }, { label: 'Historical Archives' }]}
      />

      <KalyaniDatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />

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
          departmentSubjects={subjects}
          statusFilterSignal={statFilter}
          allowManagement={false}
        />
      </div>
    </div>
  );
};
