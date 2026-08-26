import * as XLSX from 'xlsx';
import { KalyaniUser, UserRole, HodType } from '../types/user';
import { Subject } from '../types/subject';
import { DayAvailabilityOverview } from '../types/schedule';
import { formatTimeDisplay } from '../utils/dateUtils';

export interface UserImportRow {
  name: string;
  email: string;
  departmentCode: string;
  designation: string;
  role: UserRole;
  hodType?: HodType;
  error?: string;
  isDuplicate?: boolean;
}

export interface SubjectImportRow {
  subjectCode: string;
  subjectName: string;
  error?: string;
  isDuplicate?: boolean;
}

export interface ImportResult<T> {
  totalProcessed: number;
  validCount: number;
  duplicateCount: number;
  errorCount: number;
  validRecords: T[];
  errors: { row: number; data: any; reason: string }[];
}

export const excelService = {
  /**
   * Neutralizes spreadsheet formula injection: user-controlled text starting
   * with = + - @ or tab could execute as a formula when the report is opened
   */
  sanitizeCell(value: any): any {
    if (typeof value === 'string' && /^[=+\-@\t\r]/.test(value)) {
      return `'${value}`;
    }
    return value;
  },

  /**
   * Generates and downloads the Official Users Import Excel Template
   */
  downloadUserTemplate(): void {
    const templateData = [
      {
        "Full Name": "Dr. Arun Kumar",
        "College Email": "arun.cse@krce.ac.in",
        "Department Code": "CSE",
        "Designation": "Professor & Head of Department",
        "Role (ADMIN/HOD/AHOD/FACULTY)": "HOD",
      },
      {
        "Full Name": "Dr. Meenakshi Sundaram",
        "College Email": "meenakshi.cse@krce.ac.in",
        "Department Code": "CSE",
        "Designation": "Assistant HOD",
        "Role (ADMIN/HOD/AHOD/FACULTY)": "AHOD",
      },
      {
        "Full Name": "Prof. Priya Sharma",
        "College Email": "priya.cse@krce.ac.in",
        "Department Code": "CSE",
        "Designation": "Associate Professor",
        "Role (ADMIN/HOD/AHOD/FACULTY)": "FACULTY",
      },
      {
        "Full Name": "Dr. K. S. Rajan",
        "College Email": "admin@krce.ac.in",
        "Department Code": "CSE",
        "Designation": "Principal & Chief Administrator",
        "Role (ADMIN/HOD/AHOD/FACULTY)": "ADMIN",
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users_Template");
    XLSX.writeFile(wb, "KRCE_Users_Import_Template.xlsx");
  },

  /**
   * Generates and downloads the Official Subjects Import Excel Template
   */
  downloadSubjectTemplate(): void {
    const templateData = [
      {
        "Subject Code": "CS501",
        "Subject Name": "Database Management Systems"
      },
      {
        "Subject Code": "CS502",
        "Subject Name": "Operating Systems & Architecture"
      },
      {
        "Subject Code": "CS503",
        "Subject Name": "Computer Networks & Security"
      },
      {
        "Subject Code": "CS504",
        "Subject Name": "Artificial Intelligence & Machine Learning"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Subjects_Template");
    XLSX.writeFile(wb, "KRCE_Subjects_Import_Template.xlsx");
  },

  /**
   * Parses an uploaded Excel/CSV file containing Users data
   */
  async parseUsersFile(
    file: File,
    existingEmails: Set<string>
  ): Promise<ImportResult<UserImportRow>> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);

    const validRecords: UserImportRow[] = [];
    const errors: { row: number; data: any; reason: string }[] = [];
    const seenFileEmails = new Set<string>();
    let duplicateCount = 0;

    rawRows.forEach((row, idx) => {
      const rowNumber = idx + 2; // considering 1-based index + header
      const name = (row["Full Name"] || row["Name"] || row["name"] || "").toString().trim();
      const email = (row["College Email"] || row["Email"] || row["email"] || "").toString().trim().toLowerCase();
      const dept = (row["Department Code"] || row["Department"] || row["department"] || "CSE").toString().trim().toUpperCase();
      const designation = (row["Designation"] || row["designation"] || "Assistant Professor").toString().trim();
      const rawRole = (row["Role (ADMIN/HOD/AHOD/FACULTY)"] || row["Role (ADMIN/HOD/FACULTY)"] || row["Role"] || row["role"] || "FACULTY").toString().trim().toUpperCase();
      const rawHodType = (row["HOD Type (HOD/AHOD/None)"] || row["HodType"] || row["hodType"] || "").toString().trim().toUpperCase();

      if (!name) {
        errors.push({ row: rowNumber, data: row, reason: "Missing user name" });
        return;
      }
      if (!email || !email.includes('@')) {
        errors.push({ row: rowNumber, data: row, reason: "Invalid or missing college email" });
        return;
      }

      if (existingEmails.has(email) || seenFileEmails.has(email)) {
        duplicateCount++;
        errors.push({ row: rowNumber, data: row, reason: `Email already exists (${email})` });
        return;
      }

      seenFileEmails.add(email);

      let role: UserRole = 'FACULTY';
      let hodType: HodType = null;

      if (rawRole === 'ADMIN') {
        role = 'ADMIN';
      } else if (rawRole === 'HOD' || rawRole === 'HEAD OF DEPARTMENT') {
        role = 'HOD';
        hodType = 'HOD';
      } else if (rawRole === 'AHOD' || rawRole === 'ASSISTANT HOD' || rawHodType === 'AHOD') {
        role = 'FACULTY';
        hodType = 'AHOD';
      }

      validRecords.push({
        name,
        email,
        departmentCode: dept,
        designation: hodType === 'AHOD' && (!designation || designation === 'Assistant Professor') ? 'Assistant HOD' : designation,
        role,
        hodType
      });
    });

    return {
      totalProcessed: rawRows.length,
      validCount: validRecords.length,
      duplicateCount,
      errorCount: errors.length - duplicateCount,
      validRecords,
      errors
    };
  },

  /**
   * Parses an uploaded Excel/CSV file containing Subjects data
   */
  async parseSubjectsFile(
    file: File,
    existingCodes: Set<string>
  ): Promise<ImportResult<SubjectImportRow>> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);

    const validRecords: SubjectImportRow[] = [];
    const errors: { row: number; data: any; reason: string }[] = [];
    const seenFileCodes = new Set<string>();
    let duplicateCount = 0;

    rawRows.forEach((row, idx) => {
      const rowNumber = idx + 2;
      const code = (row["Subject Code"] || row["Code"] || row["subjectCode"] || "").toString().trim().toUpperCase();
      const name = (row["Subject Name"] || row["Name"] || row["subjectName"] || "").toString().trim();

      if (!code) {
        errors.push({ row: rowNumber, data: row, reason: "Missing Subject Code" });
        return;
      }
      if (!name) {
        errors.push({ row: rowNumber, data: row, reason: "Missing Subject Name" });
        return;
      }

      if (existingCodes.has(code) || seenFileCodes.has(code)) {
        duplicateCount++;
        errors.push({ row: rowNumber, data: row, reason: `Subject Code already exists (${code})` });
        return;
      }

      seenFileCodes.add(code);

      validRecords.push({
        subjectCode: code,
        subjectName: name,
      });
    });

    return {
      totalProcessed: rawRows.length,
      validCount: validRecords.length,
      duplicateCount,
      errorCount: errors.length - duplicateCount,
      validRecords,
      errors
    };
  },

  /**
   * Exports Daily Department Availability Matrix to Excel
   */
  exportAvailabilityReport(overview: DayAvailabilityOverview, departmentName: string): void {
    const sanitize = (v: any) => excelService.sanitizeCell(v);
    const data = overview.facultyStatuses.map(f => {
      const row: Record<string, any> = {
        "Faculty Name": sanitize(f.facultyName),
        "Designation": sanitize(f.facultyDesignation),
        "Status": f.status === 'SUBMITTED' ? 'Submitted' : f.status === 'FULL_DAY_FREE' ? 'Full Day Free' : 'Not Submitted',
        "Submitted At": f.submittedAt ? formatTimeDisplay(f.submittedAt) : 'N/A',
        "Assigned Periods": f.assignedPeriodsCount
      };

      // Add period columns
      overview.periodAvailability.forEach(p => {
        const colTitle = `${p.periodName || p.shortName}`;
        if (!f.schedule || f.status === 'NOT_SUBMITTED') {
          row[colTitle] = 'Not Submitted';
        } else if (f.status === 'FULL_DAY_FREE') {
          row[colTitle] = 'FREE (Full Day)';
        } else {
          const entry = f.schedule.periods[p.periodId];
          if (!entry || entry.type === 'FREE') {
            row[colTitle] = 'FREE';
          } else if (entry.type === 'SUBJECT') {
            row[colTitle] = sanitize(`${entry.subjectCode || ''} ${entry.subjectName || ''}`.trim());
          } else {
            row[colTitle] = sanitize(`Other: ${entry.customText || ''}`);
          }
        }
      });

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Faculty_Availability");
    XLSX.writeFile(wb, `Kalyani_Availability_${departmentName}_${overview.date}.xlsx`);
  }
};
