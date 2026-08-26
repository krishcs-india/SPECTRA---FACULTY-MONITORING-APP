import { useAppStore } from '../store/useAppStore';

export function useSubjects(departmentId: string) {
  const subjects = useAppStore(state => state.getDepartmentSubjects(departmentId));
  const addSubject = useAppStore(state => state.addSubject);
  const updateSubject = useAppStore(state => state.updateSubject);
  const deleteSubject = useAppStore(state => state.deleteSubject);
  const toggleSubjectActive = useAppStore(state => state.toggleSubjectActive);
  const bulkDeleteSubjects = useAppStore(state => state.bulkDeleteSubjects);
  const bulkImportSubjects = useAppStore(state => state.bulkImportSubjects);

  return {
    subjects,
    addSubject,
    updateSubject,
    deleteSubject,
    toggleSubjectActive,
    bulkDeleteSubjects,
    bulkImportSubjects
  };
}
