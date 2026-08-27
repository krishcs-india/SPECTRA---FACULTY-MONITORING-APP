import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';

export function usePeriods(departmentId?: string) {
  const allPeriods = useAppStore((state) => state.periods);
  const addPeriod = useAppStore((state) => state.addPeriod);
  const updatePeriod = useAppStore((state) => state.updatePeriod);
  const deletePeriod = useAppStore((state) => state.deletePeriod);

  const activePeriods = useMemo(() => {
    return useAppStore.getState().getActivePeriods(departmentId);
  }, [allPeriods, departmentId]);

  return {
    activePeriods,
    allPeriods,
    addPeriod,
    updatePeriod,
    deletePeriod
  };
}
