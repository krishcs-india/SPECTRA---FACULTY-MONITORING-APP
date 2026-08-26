export interface Subject {
  id: string; // e.g. "SUB001"
  departmentId: string;
  subjectCode: string; // e.g. "CS501"
  subjectName: string; // e.g. "Database Management Systems"
  active: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}
