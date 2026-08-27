import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { normalizeDepartmentId } from '../services/seedDataService';

export function useSubjects(departmentId: string, includeInactive: boolean = true) {
  const allSubjects = useAppStore((state) => state.subjects);
  const addSubject = useAppStore((state) => state.addSubject);
  const updateSubject = useAppStore((state) => state.updateSubject);
  const deleteSubject = useAppStore((state) => state.deleteSubject);
  const toggleSubjectActive = useAppStore((state) => state.toggleSubjectActive);
  const bulkDeleteSubjects = useAppStore((state) => state.bulkDeleteSubjects);
  const bulkImportSubjects = useAppStore((state) => state.bulkImportSubjects);

  const cleanDept = normalizeDepartmentId(departmentId);

  const subjects = useMemo(() => {
    return (allSubjects || [])
      .filter((s) => {
        if (!s) return false;
        const sDept = normalizeDepartmentId(s.departmentId);
        const matchesDept = sDept === cleanDept || s.departmentId === 'GLOBAL';
        if (!matchesDept) return false;
        return includeInactive ? true : s.active !== false;
      })
      .sort((a, b) => (a.subjectCode || '').localeCompare(b.subjectCode || ''));
  }, [allSubjects, cleanDept, includeInactive]);

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
