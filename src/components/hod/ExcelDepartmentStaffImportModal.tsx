import React, { useState, useRef, useEffect } from 'react';
import { KalyaniModal } from '../common/KalyaniModal';
import { KalyaniButton } from '../common/KalyaniButton';
import { excelService, ImportResult, UserImportRow } from '../../services/excelService';
import { KalyaniUser } from '../../types/user';
import { Download, UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface ExcelDepartmentStaffImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
  departmentName: string;
  existingUsers: KalyaniUser[];
  onImportSuccess: (importedCount: number) => void;
}

export const ExcelDepartmentStaffImportModal: React.FC<ExcelDepartmentStaffImportModalProps> = ({
  isOpen,
  onClose,
  departmentId,
  departmentName,
  existingUsers,
  onImportSuccess,
}) => {
  const bulkImportUsers = useAppStore((state) => state.bulkImportUsers);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ImportResult<UserImportRow> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);

  const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));

  useEffect(() => {
    if (downloadMsg) {
      const t = setTimeout(() => setDownloadMsg(null), 5000);
      return () => clearTimeout(t);
    }
  }, [downloadMsg]);

  const handleDownloadTemplate = async () => {
    try {
      const deptCode = departmentId.toUpperCase() || 'CSE';
      setDownloadMsg(await excelService.downloadDepartmentStaffTemplate(deptCode));
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
      const res = await excelService.parseDepartmentStaffFile(file, existingEmails, departmentId);
      setParseResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse Excel file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleReset = () => {
    setParseResult(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.validRecords.length === 0) return;

    const usersToImport = parseResult.validRecords.map((r) => ({
      name: r.name,
      email: r.email,
      departmentId: departmentId,
      departmentName: departmentName,
      designation: r.designation,
      role: r.role,
      hodType: r.hodType || null,
      active: true,
    }));

    bulkImportUsers(usersToImport);
    onImportSuccess(usersToImport.length);
    handleClose();
  };

  const handleClose = () => {
    setParseResult(null);
    setErrorMsg(null);
    setDownloadMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  return (
    <KalyaniModal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="2xl"
      title={`Excel Bulk Staff Import — ${departmentName}`}
      subtitle={`Import faculties and Assistant HODs into ${departmentName} via Excel or CSV`}
      footer={
        <>
          {parseResult ? (
            <div className="w-full flex items-center justify-between">
              <KalyaniButton variant="ghost" size="sm" onClick={handleReset}>
                Upload Different File
              </KalyaniButton>
              <div className="flex items-center gap-2">
                <KalyaniButton variant="ghost" size="sm" onClick={handleClose}>
                  Cancel
                </KalyaniButton>
                <KalyaniButton
                  variant="gold"
                  size="sm"
                  onClick={handleConfirmImport}
                  disabled={parseResult.validRecords.length === 0}
                >
                  Confirm &amp; Import ({parseResult.validRecords.length} Staff)
                </KalyaniButton>
              </div>
            </div>
          ) : (
            <KalyaniButton variant="ghost" size="sm" onClick={handleClose}>
              Cancel
            </KalyaniButton>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* State 1: Before Upload / Parsing */}
        {!parseResult && (
          <div className="space-y-4 animate-in fade-in">
            {/* Template Download Banner */}
            <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-[#180E1C] border border-rose-200 dark:border-rose-900/50 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Step 1: Download Excel Template</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pre-formatted with Name, College Email, Position, and Role Assignment columns.
                  </p>
                </div>
              </div>
              <KalyaniButton
                variant="outline-gold"
                size="sm"
                onClick={handleDownloadTemplate}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Download
              </KalyaniButton>
            </div>

            {downloadMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{downloadMsg}</span>
              </div>
            )}

            {/* Upload Zone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                Step 2: Upload Completed Staff Spreadsheet (.xlsx, .xls, .csv)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-rose-300 dark:border-rose-800/40 hover:border-rose-400 rounded-2xl p-6 text-center cursor-pointer transition-all bg-rose-50/40 hover:bg-rose-50/70 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 group"
              >
                <UploadCloud className="w-10 h-10 text-rose-500 group-hover:text-rose-600 mx-auto mb-2 transition-colors" />
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-300">
                  {isParsing ? 'Analyzing spreadsheet…' : 'Click to browse and upload Excel spreadsheet'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Accepts standard Excel files (.xlsx, .xls) and CSV</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-500/40 text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* State 2: Parsed Results Preview */}
        {parseResult && (
          <div className="space-y-4 animate-in fade-in">
            {/* Compact Header Summary Bar */}
            <div className="p-3 rounded-2xl bg-rose-50/80 dark:bg-[#1C0E20] border border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Spreadsheet Analyzed Successfully</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{parseResult.totalProcessed} total rows found in file</p>
                </div>
              </div>
              <KalyaniButton variant="ghost" size="sm" onClick={handleReset}>
                Upload Different File
              </KalyaniButton>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 text-center shadow-xs">
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{parseResult.validCount}</p>
                <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-wider mt-0.5">
                  Ready to Import
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30 text-center shadow-xs">
                <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{parseResult.duplicateCount}</p>
                <p className="text-[10px] text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider mt-0.5">
                  Duplicate Emails
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30 text-center shadow-xs">
                <p className="text-xl font-bold text-rose-700 dark:text-rose-400">{parseResult.errorCount}</p>
                <p className="text-[10px] text-rose-800 dark:text-rose-300 font-bold uppercase tracking-wider mt-0.5">
                  Invalid Rows
                </p>
              </div>
            </div>

            {/* Valid Rows Preview Card - Header is strictly outside the scrollable body to prevent bleed-through */}
            {parseResult.validRecords.length > 0 && (
              <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-[#1A0E1C] overflow-hidden shadow-xs">
                <div className="px-4 py-2.5 bg-gradient-to-r from-rose-50 to-pink-50/60 dark:from-[#251026] dark:to-[#1E0D22] border-b border-rose-200/80 dark:border-rose-900/50 flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-950 dark:text-rose-100 uppercase tracking-wider font-marcellus">
                    Preview of Valid Staff Records ({parseResult.validRecords.length})
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Scroll down to review
                  </span>
                </div>
                <div className="max-h-52 overflow-y-auto divide-y divide-rose-100 dark:divide-rose-950/40">
                  {parseResult.validRecords.map((r, i) => (
                    <div key={i} className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-rose-50/30 dark:hover:bg-rose-950/20 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-300 text-xs font-bold shrink-0">
                          {r.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-xs">{r.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{r.email}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            r.hodType === 'AHOD'
                              ? 'bg-teal-50 dark:bg-teal-950/70 border-teal-300 dark:border-teal-500/30 text-teal-800 dark:text-teal-300'
                              : 'bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-400/30 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {r.hodType === 'AHOD' ? 'Assistant HOD' : 'Faculty'}
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{r.designation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skipped / Duplicate / Erroneous Rows - Crisp, High-Contrast Warm Amber Card */}
            {parseResult.errors.length > 0 && (
              <div className="rounded-2xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/95 dark:bg-[#25170A] overflow-hidden shadow-xs">
                <div className="px-4 py-2.5 bg-amber-100/90 dark:bg-[#34200E] border-b border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-amber-950 dark:text-amber-100 uppercase tracking-wider font-marcellus">
                      Skipped &amp; Duplicate Rows ({parseResult.errors.length})
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                    Excluded from import
                  </span>
                </div>
                <div className="max-h-36 overflow-y-auto divide-y divide-amber-200/60 dark:divide-amber-800/40 p-1">
                  {parseResult.errors.map((err, i) => (
                    <div key={i} className="px-3 py-2 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-amber-200/90 dark:bg-amber-800 text-amber-950 dark:text-amber-100 shrink-0 shadow-xs">
                          Row {err.row}
                        </span>
                        <span className="font-semibold text-amber-950 dark:text-amber-50 truncate">
                          {err.reason}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] font-semibold text-amber-900 dark:text-amber-200 bg-white/95 dark:bg-black/50 border border-amber-300 dark:border-amber-700/60 px-2 py-0.5 rounded shrink-0 shadow-xs">
                        {err.data?.["College Email"] || err.data?.["Email"] || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </KalyaniModal>
  );
};
