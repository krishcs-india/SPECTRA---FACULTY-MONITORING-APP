export interface Period {
  id: string; // e.g. "P01", "P02", "P03"...
  departmentId?: string; // or 'GLOBAL'
  name: string; // e.g. "1st Period"
  shortName: string; // e.g. "P1"
  startTime: string; // e.g. "08:45"
  endTime: string; // e.g. "09:35"
  sequence: number; // 1, 2, 3, 4...
  active: boolean;
  isBreak?: boolean;
}
