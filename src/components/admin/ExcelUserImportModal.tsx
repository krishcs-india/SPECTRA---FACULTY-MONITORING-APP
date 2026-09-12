import React, { useState, useRef } from 'react';
import { KalyaniModal } from '../common/KalyaniModal';
import { KalyaniButton } from '../common/KalyaniButton';
import { excelService, ImportResult, UserImportRow } from '../../services/excelService';
import { KalyaniUser } from '../../types/user';
import { Download, UploadCloud, CheckCircle2, AlertTriangle } from 'lucide-react';

import { useAppStore } from '../../store/useAppStore';

interface ExcelUserImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingUsers: KalyaniUser[];
  onImportSuccess: (importedCount: number) => void;
}

export const ExcelUserImportModal: React.FC<ExcelUserImportModalProps> = ({
  isOpen,
  onClose,
  existingUsers,
  onImportSuccess,
}) => {
  const bulkImportUsers = useAppStore((state) => state.bulkImportUsers);
  const departments = useAppStore((state) => state.departments);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ImportResult<UserImportRow> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);
  const [unmatchedDeptRecords, setUnmatchedDeptRecords] = useState<UserImportRow[]>([]);

  const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));

  // Auto-dismiss download confirmation after 5 seconds
  React.useEffect(() => {
    if (downloadMsg) {
      const t = setTimeout(() => setDownloadMsg(null), 5000);
      return () => clearTimeout(t);
    }
  }, [downloadMsg]);

  // Resolve a Department Code from the sheet against the live department directory
  const resolveDepartment = (code: string) =>
    departments.find(
      (d) =>
        d.code.toUpperCase() === code.trim().toUpperCase() ||
        d.name.toLowerCase().includes(code.trim().toLowerCase())
    );

  const handleDownloadTemplate = async () => {
    try {
      setDownloadMsg(await excelService.downloadUserTemplate());
    } catch (e: any) {
      setDownloadMsg(`Template download failed: ${e?.message || 'unknown error'}`);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setErrorMsg(null);

    try {
      const res = await excelService.parseUsersFile(file, existingEmails);
      setParseResult(res);
      // Flag rows whose Department Code does not match any existing department
      // instead of silently defaulting them to the first department
      setUnmatchedDeptRecords(res.validRecords.filter((r) => !resolveDepartment(r.departmentCode)));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse Excel file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.validRecords.length === 0) return;

    const usersToImport = parseResult.validRecords
      .filter((r) => {
        const matchedDept = resolveDepartment(r.departmentCode);
        if (!matchedDept) {
          console.warn(`Skipping "${r.name}": unknown Department Code "${r.departmentCode}"`);
          return false;
        }
        return true;
      })
      .map((r) => {
        const matchedDept = resolveDepartment(r.departmentCode)!;
        return {
          name: r.name,
          email: r.email,
          departmentId: matchedDept.id,
          departmentName: matchedDept.name,
          designation: r.designation,
          role: r.role,
          hodType: r.hodType || null,
          active: true,
        };
      });

    if (usersToImport.length === 0) return;

    const importedCount = bulkImportUsers(usersToImport);
    onImportSuccess(importedCount);
    onClose();
  };

  const handleReset = () => {
    setParseResult(null);
    setErrorMsg(null);
    setUnmatchedDeptRecords([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <KalyaniModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title="Bulk Import Institutional Users via Excel"
      subtitle="Import faculty members, HODs, and administrators into the central directory"
    >
      <div className="space-y-6">
        {downloadMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadMsg}</span>
          </div>
        )}
        {/* Step 1: Download Template */}
        <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <p className="text-xs font-bold text-rose-800 dark:text-rose-200">
              Step 1: Download Users Excel Template
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              Includes pre-configured columns for Full Name, College Email, Department, Designation, and Role.
            </p>
          </div>
          <KalyaniButton
            variant="outline-gold"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleDownloadTemplate}
          >
            Download Template
          </KalyaniButton>
        </div>

        {/* Step 2: Upload File Area */}
        {!parseResult && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-rose-300 hover:border-rose-400 dark:border-rose-500/30 rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 bg-rose-50/40 hover:bg-rose-50/80 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 shadow-xs"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-400/30 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-3">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {isParsing ? 'Parsing Excel File…' : 'Click to Upload Excel / CSV File'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Supports .xlsx, .xls, and .csv formats</p>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 3: Preview */}
        {parseResult && (
          <div className="space-y-4 animate-in fade-in">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-white/80 dark:bg-[#180E1C]/80 border border-rose-200 dark:border-rose-900/40 shadow-xs">
                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Total Rows</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{parseResult.totalProcessed}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 shadow-xs">
                <p className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400">Valid Users</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{parseResult.validCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-500/30 shadow-xs">
                <p className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-400">Duplicates / Invalid</p>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{parseResult.duplicateCount + parseResult.errorCount}</p>
              </div>
            </div>

            {/* Preview List */}
            <div className="max-h-48 overflow-y-auto border border-rose-200 dark:border-rose-900/30 rounded-xl bg-white/70 dark:bg-[#180E1C]/60 p-2 divide-y divide-rose-100 dark:divide-white/5">
              {parseResult.validRecords.map((item, idx) => (
                <div key={idx} className="py-2 px-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{item.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-400/30">
                      {item.role} {item.hodType ? `(${item.hodType})` : ''}
                    </span>
                    <p className={`text-[10px] mt-0.5 ${resolveDepartment(item.departmentCode) ? 'text-slate-500 dark:text-slate-400' : 'text-rose-600 dark:text-rose-400 font-semibold'}`}>
                      {resolveDepartment(item.departmentCode)?.name || `Unknown dept: ${item.departmentCode}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {unmatchedDeptRecords.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300">
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Unknown Department Codes ({unmatchedDeptRecords.length} will be skipped):
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300 max-h-24 overflow-y-auto">
                  {unmatchedDeptRecords.map((r, idx) => (
                    <li key={idx}>
                      {r.name}: no department matches code "{r.departmentCode}". Add the department first, then re-upload.
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {parseResult.errors.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-300">
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Validation Notes ({parseResult.errors.length} excluded):
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300 max-h-24 overflow-y-auto">
                  {parseResult.errors.map((e, idx) => (
                    <li key={idx}>
                      Row {e.row}: {e.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <KalyaniButton variant="ghost" size="sm" onClick={handleReset}>
                Upload Different File
              </KalyaniButton>

              <div className="flex items-center gap-2">
                <KalyaniButton variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </KalyaniButton>
                <KalyaniButton
                  variant="gold"
                  size="sm"
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={handleConfirmImport}
                  disabled={parseResult.validCount === 0}
                >
                  Confirm Import ({parseResult.validCount})
                </KalyaniButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </KalyaniModal>
  );
};
