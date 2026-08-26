import { useAppStore } from '../store/useAppStore';
import { DayAvailabilityOverview } from '../types/schedule';

export function useFacultyAvailability(departmentId: string, date: string): DayAvailabilityOverview {
  const getDepartmentAvailability = useAppStore(state => state.getDepartmentAvailability);
  return getDepartmentAvailability(departmentId, date);
}
