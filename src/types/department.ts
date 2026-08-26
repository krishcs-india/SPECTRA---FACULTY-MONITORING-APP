export interface Department {
  id: string;
  name: string; // e.g. "Computer Science & Engineering"
  code: string; // e.g. "CSE"
  active: boolean;
  hodUid?: string | null;
  hodName?: string | null;
  ahodUid?: string | null;
  ahodName?: string | null;
  ahodUids?: string[]; // Multiple AHOD UIDs
  ahodNames?: string[]; // Multiple AHOD names
  facultyCount?: number;
  createdAt: string;
}
