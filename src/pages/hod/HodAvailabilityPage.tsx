import React, { useState, useMemo } from 'react';
import { KalyaniPageHeader } from '../../components/common/KalyaniPageHeader';
import { KalyaniDatePicker } from '../../components/common/KalyaniDatePicker';
import { PeriodAvailabilityGrid } from '../../components/hod/PeriodAvailabilityGrid';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import { getTodayDateString } from '../../utils/dateUtils';
import { BarChart3 } from 'lucide-react';

export const HodAvailabilityPage: React.FC = () => {
  const { currentUser } = useAuth();
  const departmentId = currentUser?.departmentId || 'dept_cse';
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  const getDepartmentAvailability = useAppStore((state) => state.getDepartmentAvailability);
  const schedules = useAppStore((state) => state.schedules);
  const users = useAppStore((state) => state.users);
  const activePeriods = useAppStore((state) => state.getActivePeriods(departmentId));

  const overview = useMemo(
    () => getDepartmentAvailability(departmentId, selectedDate),
    [getDepartmentAvailability, departmentId, selectedDate, schedules, users, activePeriods.length]
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <KalyaniPageHeader
        title="Period Availability Matrix"
        subtitle="Detailed matrix of free and teaching faculty across all scheduled periods."
        breadcrumbs={[{ label: 'HOD' }, { label: 'Period Availability' }]}
      />

      <KalyaniDatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />

      <PeriodAvailabilityGrid periodsAvailability={overview.periodAvailability} />
    </div>
  );
};
