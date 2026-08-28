import XLSX from 'xlsx-js-style';
import { Capacitor } from '@capacitor/core';
import { KalyaniUser, UserRole, HodType } from '../types/user';
import { Subject } from '../types/subject';
import { DayAvailabilityOverview } from '../types/schedule';
import { formatTimeDisplay } from '../utils/dateUtils';

/**
 * Sanitizes a string for use as a safe, cross-platform filename
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[/\\?%*:|"<>]/g, '_') // Remove illegal OS characters
    .replace(/&/g, 'and')           // Replace & with 'and'
    .replace(/\s+/g, '_')           // Replace whitespace with underscores
    .replace(/_+/g, '_');           // Collapse multiple underscores
}

/**
 * Saves a workbook for the current platform:
 * - Web: triggers a direct browser blob download with fallback to XLSX.writeFile
 * - Android/iOS app: writes to Directory.Cache (always writable on Android 10-15 without scoped storage blocks),
 *   falls back to Directory.Documents / Directory.Data, then triggers the native Share sheet & notification.
 * Returns a human-friendly confirmation message.
 */
async function saveWorkbook(wb: any, fileName: string, reportLabel = 'Excel file'): Promise<string> {
  const safeFileName = sanitizeFileName(fileName);

  if (Capacitor.isNativePlatform?.()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');

    const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64', cellStyles: true });
    
    let fileUri = '';

    // Step 1: Write file to Cache directory (most reliable on Android 10/11/12/13/14/15)
    try {
      const result = await Filesystem.writeFile({
        path: safeFileName,
        data: base64,
        directory: Directory.Cache,
        recursive: true
      });
      fileUri = result.uri;
    } catch (cacheErr) {
      console.warn('Cache write failed, attempting Documents directory:', cacheErr);
      try {
        const result = await Filesystem.writeFile({
          path: safeFileName,
          data: base64,
          directory: Directory.Documents,
          recursive: true
        });
        fileUri = result.uri;
      } catch (docErr) {
        console.warn('Documents write failed, attempting Data directory:', docErr);
        const result = await Filesystem.writeFile({
          path: safeFileName,
          data: base64,
          directory: Directory.Data,
          recursive: true
        });
        fileUri = result.uri;
      }
    }

    // Step 2: Dispatch system notification "Report Ready for You! 📂"
    try {
      const { notificationService } = await import('./notificationService');
      await notificationService.native.notifyDownloadComplete(safeFileName, fileUri);
    } catch (notifErr) {
      console.warn('Download notification error:', notifErr);
    }

    // Step 3: Open native Share/Save sheet so user can view/save to any app/folder
    try {
      await Share.share({
        title: safeFileName,
        url: fileUri,
        dialogTitle: 'Save / Open Excel File'
      });
      return `✅ ${reportLabel} is saved successfully.`;
    } catch {
      // User dismissed the share sheet; file is safely created on device
      return `✅ ${reportLabel} is saved successfully.`;
    }
  }

  // Web Browser Environment: Use robust Blob download
  try {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeFileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1500);
    return `✅ ${reportLabel} is downloaded successfully.`;
  } catch (webErr) {
    XLSX.writeFile(wb, safeFileName, { cellStyles: true });
    return `✅ ${reportLabel} is downloaded successfully.`;
  }
}

/**
 * Applies professional formatting, typography, and spacing to an Excel worksheet:
 * 1. Auto-calculates generous column widths with padding so no text is truncated
 * 2. Sets genuine Times New Roman font style, sizes (12pt bold for headers, 11pt regular for data)
 * 3. Applies clean header fills, borders, row heights, and vertical/horizontal cell alignments
 */
function formatWorksheet(ws: any, data: Record<string, any>[]): void {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);

  // Calculate generous column widths based on maximum content length
  const colWidths = headers.map(header => {
    let maxLen = header.length;
    for (const row of data) {
      const val = row[header];
      if (val !== undefined && val !== null) {
        const str = String(val);
        if (str.length > maxLen) {
          maxLen = str.length;
        }
      }
    }
    // Generous breathing room: +4 chars padding, minimum width 16, max 55
    return { wch: Math.min(Math.max(maxLen + 4, 16), 55) };
  });

  ws['!cols'] = colWidths;

  // Set default row heights (header row: 26pt, data rows: 21pt)
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  const rowHeights: { hpt: number }[] = [];
  for (let R = range.s.r; R <= range.e.r; ++R) {
    rowHeights.push({ hpt: R === 0 ? 26 : 21 });
  }
  ws['!rows'] = rowHeights;

  // Apply Times New Roman font, header background fill, and full borders on all sides of every cell
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddress];
      if (!cell) continue;

      const isHeader = R === 0;
      const cellValueStr = cell.v !== undefined && cell.v !== null ? String(cell.v).trim() : '';
      const isFree = !isHeader && (cellValueStr === 'FREE' || cellValueStr.startsWith('FREE') || cellValueStr === 'Full Day Free');

      cell.s = {
        font: {
          name: 'Times New Roman',
          sz: isHeader ? 12 : 11,
          bold: isHeader || isFree,
          color: { rgb: isHeader ? '000000' : isFree ? '854D0E' : '1A1A1A' }
        },
        fill: isHeader ? {
          patternType: 'solid',
          fgColor: { rgb: 'F5E6BD' } // Subtle gold/cream header tint
        } : isFree ? {
          patternType: 'solid',
          fgColor: { rgb: 'FEF3C7' } // Light golden yellow highlight for FREE period slots
        } : undefined,
        border: {
          top: { style: 'thin', color: { rgb: isHeader ? 'BA9225' : 'D4AF37' } },
          bottom: { style: isHeader ? 'medium' : 'thin', color: { rgb: isHeader ? 'BA9225' : 'D4AF37' } },
          left: { style: 'thin', color: { rgb: isHeader ? 'BA9225' : 'D4AF37' } },
          right: { style: 'thin', color: { rgb: isHeader ? 'BA9225' : 'D4AF37' } }
        },
        alignment: {
          vertical: 'center',
          horizontal: isHeader || isFree ? 'center' : (typeof cell.v === 'number' ? 'center' : 'left'),
          wrapText: false
        }
      };
    }
  }
}

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
  async downloadUserTemplate(): Promise<string> {
    const templateData = [
      {
        "Full Name": "Dr. Kalyani",
        "College Email": "kalyani.cse@krce.ac.in",
        "Department Code": "CSE",
        "Designation": "Professor & Head of Department",
        "Role (ADMIN/HOD/AHOD/FACULTY)": "HOD",
      },
      {
        "Full Name": "Prof. Kalyani R",
        "College Email": "kalyani.r@krce.ac.in",
        "Department Code": "CSE",
        "Designation": "Assistant HOD",
        "Role (ADMIN/HOD/AHOD/FACULTY)": "AHOD",
      },
      {
        "Full Name": "Prof. Kalyani Sundaram",
        "College Email": "kalyani.s@krce.ac.in",
        "Department Code": "CSE",
        "Designation": "Associate Professor",
        "Role (ADMIN/HOD/AHOD/FACULTY)": "FACULTY",
      },
      {
        "Full Name": "Prof. Kalyani Devi",
        "College Email": "kalyani.devi@krce.ac.in",
        "Department Code": "CSE",
        "Designation": "Assistant Professor",
        "Role (ADMIN/HOD/AHOD/FACULTY)": "FACULTY",
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    formatWorksheet(ws, templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users_Template");
    return await saveWorkbook(wb, "KRCE_Users_Import_Template.xlsx", "User import template excel");
  },

  /**
   * Generates and downloads the Official Subjects Import Excel Template
   */
  async downloadSubjectTemplate(): Promise<string> {
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
    formatWorksheet(ws, templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Subjects_Template");
    return await saveWorkbook(wb, "KRCE_Subjects_Import_Template.xlsx", "Subject import template excel");
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
   * Generates and downloads a department staff Excel template for HODs
   */
  async downloadDepartmentStaffTemplate(departmentCode = 'CSE'): Promise<string> {
    const templateData = [
      {
        "Faculty Name": "Dr. S. Karthikeyan",
        "College Email": `karthik.${departmentCode.toLowerCase()}@krce.ac.in`,
        "Position / Designation": "Associate Professor",
        "Role Assignment (Faculty / Assistant HOD)": "Faculty"
      },
      {
        "Faculty Name": "Mrs. Priya R.",
        "College Email": `priya.${departmentCode.toLowerCase()}@krce.ac.in`,
        "Position / Designation": "Assistant HOD",
        "Role Assignment (Faculty / Assistant HOD)": "Assistant HOD"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    formatWorksheet(ws, templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Department_Staff_Template");
    return await saveWorkbook(wb, `KRCE_${departmentCode}_Staff_Template.xlsx`, "Department staff template excel");
  },

  /**
   * Parses an uploaded Excel/CSV file containing Department Staff data for HOD
   */
  async parseDepartmentStaffFile(
    file: File,
    existingEmails: Set<string>,
    departmentId: string
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
      const rowNumber = idx + 2;
      const name = (row["Faculty Name"] || row["Full Name"] || row["Name"] || row["name"] || "").toString().trim();
      const email = (row["College Email"] || row["Email"] || row["email"] || "").toString().trim().toLowerCase();
      const designation = (row["Position / Designation"] || row["Designation"] || row["Position"] || row["designation"] || "Assistant Professor").toString().trim();
      const rawRole = (row["Role Assignment (Faculty / Assistant HOD)"] || row["Role Assignment"] || row["Role"] || row["role"] || "FACULTY").toString().trim().toUpperCase();

      if (!name) {
        errors.push({ row: rowNumber, data: row, reason: "Missing faculty name" });
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

      if (rawRole.includes('AHOD') || rawRole.includes('ASSISTANT HOD') || designation.toLowerCase().includes('assistant hod')) {
        role = 'FACULTY';
        hodType = 'AHOD';
      }

      validRecords.push({
        name,
        email,
        departmentCode: departmentId,
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
  async exportAvailabilityReport(overview: DayAvailabilityOverview, departmentName: string): Promise<string> {
    if (!overview || !overview.facultyStatuses || overview.facultyStatuses.length === 0) {
      return '⚠️ No faculty records available to export for this date.';
    }

    const sanitize = (v: any) => excelService.sanitizeCell(v);
    const periods = overview.periodAvailability || [];

    const data = overview.facultyStatuses.map(f => {
      const row: Record<string, any> = {
        "Faculty Name": sanitize(f.facultyName || 'Unknown Faculty'),
        "Designation": sanitize(f.facultyDesignation || 'Faculty'),
        "Status": f.status === 'SUBMITTED' ? 'Submitted' : f.status === 'FULL_DAY_FREE' ? 'Full Day Free' : 'Not Submitted',
        "Submitted At": f.submittedAt ? formatTimeDisplay(f.submittedAt) : 'N/A',
        "Assigned Periods": f.assignedPeriodsCount || 0
      };

      // Add period columns safely
      periods.forEach(p => {
        const colTitle = `${p.periodName || p.shortName || 'Period'}`;
        if (!f.schedule || f.status === 'NOT_SUBMITTED') {
          row[colTitle] = 'Not Submitted';
        } else if (f.status === 'FULL_DAY_FREE') {
          row[colTitle] = 'FREE (Full Day)';
        } else {
          const entry = f.schedule.periods ? f.schedule.periods[p.periodId] : undefined;
          if (!entry || entry.type === 'FREE') {
            row[colTitle] = 'FREE';
          } else if (entry.type === 'SUBJECT') {
            row[colTitle] = sanitize(`${entry.subjectCode || ''} ${entry.subjectName || ''}`.trim() || 'Assigned Subject');
          } else {
            row[colTitle] = sanitize(`Other: ${entry.customText || ''}`);
          }
        }
      });

      return row;
    });

    const reportDate = overview.date || new Date().toISOString().slice(0, 10);
    const safeDept = (departmentName || 'Department').trim();

    const ws = XLSX.utils.json_to_sheet(data);
    formatWorksheet(ws, data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Faculty_Availability");
    return await saveWorkbook(wb, `Kalyani_Availability_${safeDept}_${reportDate}.xlsx`, "Faculty daily submission excel");
  },

  /**
   * Exports User / Staff Directory to Excel
   */
  async exportUserDirectory(userList: KalyaniUser[], fileNamePrefix = 'Kalyani_Staff_Directory'): Promise<string> {
    if (!userList || userList.length === 0) {
      return '⚠️ No staff records available to export.';
    }

    const sanitize = (v: any) => excelService.sanitizeCell(v);
    const data = userList.map(u => ({
      "Full Name": sanitize(u.name || 'Unknown User'),
      "Email ID": sanitize(u.email || 'N/A'),
      "Department": sanitize(u.departmentName || u.departmentId || 'General'),
      "Designation": sanitize(u.designation || 'Staff'),
      "Role": u.hodType === 'AHOD' ? 'Assistant HOD' : (u.role || 'FACULTY'),
      "Status": u.active ? 'Active' : 'Inactive'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    formatWorksheet(ws, data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Staff_Directory");
    return await saveWorkbook(wb, `${fileNamePrefix}_${new Date().toISOString().slice(0, 10)}.xlsx`, "Staff directory excel");
  }
};
