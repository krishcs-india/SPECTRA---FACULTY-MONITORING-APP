import { useAppStore } from '../store/useAppStore';

export function usePeriods(departmentId?: string) {
  const activePeriods = useAppStore(state => state.getActivePeriods(departmentId));
  const allPeriods = useAppStore(state => state.getAllPeriods());
  const addPeriod = useAppStore(state => state.addPeriod);
  const updatePeriod = useAppStore(state => state.updatePeriod);
  const deletePeriod = useAppStore(state => state.deletePeriod);

  return {
    activePeriods,
    allPeriods,
    addPeriod,
    updatePeriod,
    deletePeriod
  };
}
