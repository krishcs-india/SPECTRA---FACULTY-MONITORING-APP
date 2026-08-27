import { useAppStore } from '../store/useAppStore';
import { PeriodEntry } from '../types/schedule';
import { notificationService } from '../services/notificationService';

export function useSchedule(facultyId: string, date: string) {
  const schedule = useAppStore(state => (facultyId && date ? state.schedules[`${facultyId}_${date}`] || null : null));
  const submitScheduleAction = useAppStore(state => state.submitSchedule);
  const submitFullDayFreeAction = useAppStore(state => state.submitFullDayFree);
  const history = useAppStore(state => state.getFacultyHistory(facultyId));

  const submit = (periods: Record<string, PeriodEntry>) => {
    const res = submitScheduleAction(facultyId, date, periods);
    if (res.success) {
      notificationService.notifySubmissionSuccess(date);
    }
    return res;
  };

  const markFullDayFree = () => {
    const res = submitFullDayFreeAction(facultyId, date);
    if (res.success) {
      notificationService.notifySubmissionSuccess(date);
    }
    return res;
  };

  return {
    schedule,
    status: schedule?.status || 'NOT_SUBMITTED',
    periods: schedule?.periods || {},
    submittedAt: schedule?.submittedAt,
    updatedAt: schedule?.updatedAt,
    history,
    submit,
    markFullDayFree
  };
}
