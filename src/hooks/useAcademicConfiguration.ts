import { useAppStore } from '../store/useAppStore';

export function useAcademicConfiguration(departmentId: string) {
  const getDepartmentConfig = useAppStore(state => state.getDepartmentConfig);
  const updateDepartmentConfig = useAppStore(state => state.updateDepartmentConfig);
  const systemSettings = useAppStore(state => state.systemSettings);
  const updateSystemSettings = useAppStore(state => state.updateSystemSettings);

  const config = getDepartmentConfig(departmentId);

  return {
    config,
    maxAssignedPeriodsPerDay: config.maxAssignedPeriodsPerDay,
    allowCustomSubjects: config.allowCustomSubjects,
    allowFutureEditing: config.allowFutureEditing,
    reminderIntervalMinutes: config.reminderIntervalMinutes,
    systemSettings,
    updateConfig: (updates: Partial<typeof config>) => updateDepartmentConfig(departmentId, updates),
    updateSystemSettings
  };
}
