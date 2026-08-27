export interface Period {
  id: string; // e.g. "P_CSE_1", "P_AIDS_1"...
  departmentId: string; // Department identifier, e.g. "CSE"
  name: string; // e.g. "Period 1"
  shortName: string; // e.g. "Period 1"
  startTime: string; // e.g. "08:45"
  endTime: string; // e.g. "09:35"
  sequence: number; // 1, 2, 3, 4...
  active: boolean;
  isBreak?: boolean;
}
