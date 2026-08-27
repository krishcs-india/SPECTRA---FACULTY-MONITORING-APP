import React, { useState, useRef, useEffect } from 'react';
import { KalyaniModal } from '../common/KalyaniModal';
import { KalyaniButton } from '../common/KalyaniButton';
import { excelService, ImportResult, UserImportRow } from '../../services/excelService';
import { KalyaniUser } from '../../types/user';
import { Download, UploadCloud, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
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
          <KalyaniButton variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </KalyaniButton>
          {parseResult && parseResult.validRecords.length > 0 && (
            <KalyaniButton variant="gold" size="sm" onClick={handleConfirmImport}>
              Confirm &amp; Import ({parseResult.validRecords.length} Staff)
            </KalyaniButton>
          )}
        </>
      }
    >
      <div className="space-y-5">
        {/* Template Download Banner */}
        <div className="p-4 rounded-2xl bg-kalyani-crimson-950/70 border border-kalyani-gold-500/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-kalyani-gold-500/10 border border-kalyani-gold-500/30 flex items-center justify-center text-kalyani-gold-400 shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-100">Step 1: Download Excel Template</p>
              <p className="text-[11px] text-slate-400">
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
          <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadMsg}</span>
          </div>
        )}

        {/* Upload Zone */}
        <div>
          <label className="block text-xs font-bold text-slate-200 mb-2">
            Step 2: Upload Completed Staff Spreadsheet (.xlsx, .xls, .csv)
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-kalyani-gold-500/30 hover:border-kalyani-gold-400/60 rounded-2xl p-6 text-center cursor-pointer transition-all bg-kalyani-crimson-950/40 hover:bg-kalyani-crimson-950/70 group"
          >
            <UploadCloud className="w-10 h-10 text-kalyani-gold-400/70 group-hover:text-kalyani-gold-300 mx-auto mb-2 transition-colors" />
            <p className="text-xs font-semibold text-slate-200 group-hover:text-kalyani-gold-200">
              {isParsing ? 'Analyzing spreadsheet…' : 'Click to browse and upload Excel spreadsheet'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Accepts standard Excel files (.xlsx, .xls) and CSV</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Parse Results Preview */}
        {parseResult && (
          <div className="space-y-3 animate-in fade-in">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center">
                <p className="text-lg font-bold text-emerald-400">{parseResult.validCount}</p>
                <p className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider">
                  Ready to Import
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-center">
                <p className="text-lg font-bold text-amber-400">{parseResult.duplicateCount}</p>
                <p className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider">
                  Duplicate Emails
                </p>
              </div>
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-center">
                <p className="text-lg font-bold text-rose-400">{parseResult.errorCount}</p>
                <p className="text-[10px] text-rose-300 font-semibold uppercase tracking-wider">
                  Invalid Rows
                </p>
              </div>
            </div>

            {/* Valid Rows Preview */}
            {parseResult.validRecords.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-black/20 divide-y divide-white/5 text-xs">
                <div className="px-3 py-2 text-[10px] font-bold text-kalyani-gold-300 uppercase tracking-wider bg-black/40 sticky top-0">
                  Preview of Valid Staff Records ({parseResult.validRecords.length})
                </div>
                {parseResult.validRecords.map((r, i) => (
                  <div key={i} className="px-3 py-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-kalyani-gold-500/10 border border-kalyani-gold-500/30 flex items-center justify-center text-kalyani-gold-300 text-[10px] font-bold">
                        {r.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100 text-xs">{r.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{r.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.hodType === 'AHOD'
                            ? 'bg-teal-500/15 border-teal-500/30 text-teal-300'
                            : 'bg-kalyani-gold-500/15 border-kalyani-gold-400/30 text-kalyani-gold-300'
                        }`}
                      >
                        {r.hodType === 'AHOD' ? 'Assistant HOD' : 'Faculty'}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{r.designation}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error Rows */}
            {parseResult.errors.length > 0 && (
              <div className="max-h-36 overflow-y-auto rounded-xl border border-rose-500/20 bg-rose-950/20 divide-y divide-rose-500/10 text-xs">
                <div className="px-3 py-2 text-[10px] font-bold text-rose-300 uppercase tracking-wider bg-rose-950/40 sticky top-0">
                  Skipped / Erroneous Rows ({parseResult.errors.length})
                </div>
                {parseResult.errors.map((err, i) => (
                  <div key={i} className="px-3 py-1.5 flex items-center justify-between text-[11px] text-rose-200">
                    <span>Row {err.row}: {err.reason}</span>
                    <span className="font-mono text-[10px] text-rose-400">{err.data?.["College Email"] || err.data?.["Email"] || '-'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </KalyaniModal>
  );
};
