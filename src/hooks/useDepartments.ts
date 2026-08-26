import { useAppStore } from '../store/useAppStore';

export function useDepartments() {
  const departments = useAppStore(state => state.departments);
  const addDepartment = useAppStore(state => state.addDepartment);
  const updateDepartment = useAppStore(state => state.updateDepartment);
  const assignHod = useAppStore(state => state.assignHod);

  return {
    departments,
    activeDepartments: departments.filter(d => d.active),
    addDepartment,
    updateDepartment,
    assignHod
  };
}
