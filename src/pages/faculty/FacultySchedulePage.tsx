import React, { useState, useEffect } from 'react';
import { KalyaniPageHeader } from '../../components/common/KalyaniPageHeader';
import { KalyaniDatePicker } from '../../components/common/KalyaniDatePicker';
import { DailyScheduleForm } from '../../components/faculty/DailyScheduleForm';
import { getTodayDateString } from '../../utils/dateUtils';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import { notificationService } from '../../services/notificationService';

export const FacultySchedulePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const { currentUser } = useAuth();
  const departmentId = currentUser?.departmentId || 'dept_cse';

  const todayStatus = useAppStore((state) =>
    currentUser ? state.getSchedule(currentUser.uid, getTodayDateString())?.status || 'NOT_SUBMITTED' : 'NOT_SUBMITTED'
  );
  const reminderIntervalMinutes = useAppStore((state) => state.getDepartmentConfig(departmentId).reminderIntervalMinutes);

  // Periodic reminder while today's schedule is still pending
  useEffect(() => {
    if (!currentUser) return;
    if (todayStatus === 'NOT_SUBMITTED') {
      notificationService.startPeriodicReminder(
        currentUser.uid,
        currentUser.name,
        reminderIntervalMinutes || 30
      );
    } else {
      notificationService.stopPeriodicReminder(currentUser.uid);
    }
    return () => notificationService.stopPeriodicReminder(currentUser.uid);
  }, [currentUser, todayStatus, reminderIntervalMinutes]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <KalyaniPageHeader
        title="Daily Period Schedule"
        subtitle="Specify the subjects or academic duties you are handling today, or mark the entire day as Free with one tap."
        breadcrumbs={[{ label: 'Faculty' }, { label: "Daily Schedule" }]}
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-kalyani-gold-500/10 border border-kalyani-gold-500/30 text-kalyani-gold-300">
            {currentUser?.departmentName || 'CSE Department'}
          </span>
        }
      />

      {/* Interactive Date Strip & Calendar Picker */}
      <KalyaniDatePicker
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Dynamic Schedule Form */}
      <DailyScheduleForm date={selectedDate} />
    </div>
  );
};
