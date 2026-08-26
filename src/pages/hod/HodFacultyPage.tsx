import React, { useState, useMemo } from 'react';
import { KalyaniPageHeader } from '../../components/common/KalyaniPageHeader';
import { KalyaniDatePicker } from '../../components/common/KalyaniDatePicker';
import { FacultyStatusList } from '../../components/hod/FacultyStatusList';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import { getTodayDateString } from '../../utils/dateUtils';
import { Users } from 'lucide-react';

export const HodFacultyPage: React.FC = () => {
  const { currentUser } = useAuth();
  const departmentId = currentUser?.departmentId || 'dept_cse';
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

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
    <div className="space-y-6 animate-in fade-in duration-200">
      <KalyaniPageHeader
        title="Department Faculty Monitoring"
        subtitle="Individual faculty submission tracking, period logs, and substitution lookup."
        breadcrumbs={[{ label: 'HOD' }, { label: 'Faculty Monitoring' }]}
      />

      <KalyaniDatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />

      <FacultyStatusList
        overview={overview}
        activePeriods={activePeriods}
        departmentName={currentUser?.departmentName || 'Computer Science & Engineering'}
        departmentSubjects={subjects}
      />
    </div>
  );
};
