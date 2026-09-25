import React, { useState, useRef } from 'react';
import { KalyaniModal } from '../common/KalyaniModal';
import { KalyaniButton } from '../common/KalyaniButton';
import { excelService, ImportResult, SubjectImportRow } from '../../services/excelService';
import { Subject } from '../../types/subject';
import { Download, UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet, X } from 'lucide-react';

import { useAppStore } from '../../store/useAppStore';

interface ExcelSubjectImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
  existingSubjects: Subject[];
  onImportSuccess: (importedCount: number) => void;
}

export const ExcelSubjectImportModal: React.FC<ExcelSubjectImportModalProps> = ({
  isOpen,
  onClose,
  departmentId,
  existingSubjects,
  onImportSuccess,
}) => {
  const bulkImportSubjects = useAppStore((state) => state.bulkImportSubjects);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ImportResult<SubjectImportRow> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);

  const existingKeys = new Set(
    existingSubjects
      .map((s) => `${(s.subjectCode || '').trim().toUpperCase()}:::${(s.subjectName || '').trim().toLowerCase()}`)
      .filter(Boolean)
  );

  // Auto-dismiss download confirmation after 5 seconds
  React.useEffect(() => {
    if (downloadMsg) {
      const t = setTimeout(() => setDownloadMsg(null), 5000);
      return () => clearTimeout(t);
    }
  }, [downloadMsg]);

  const handleDownloadTemplate = async () => {
    try {
      setDownloadMsg(await excelService.downloadSubjectTemplate());
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
      const res = await excelService.parseSubjectsFile(file, existingKeys);
      setParseResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.validRecords.length === 0) return;

    const subjectsToImport = parseResult.validRecords.map((r) => ({
      subjectCode: r.subjectCode,
      subjectName: r.subjectName,
      active: true,
    }));

    const importedCount = bulkImportSubjects(departmentId, subjectsToImport);
    onImportSuccess(importedCount);
    onClose();
  };

  const handleReset = () => {
    setParseResult(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <KalyaniModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title="Bulk Import Subjects via Excel"
      subtitle="Upload institutional subject lists directly into the department master"
    >
      <div className="space-y-6">
        {downloadMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadMsg}</span>
          </div>
        )}
        {/* Step 1: Download Template */}
        <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-[#180E1C] border border-rose-200 dark:border-rose-900/50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-rose-800 dark:text-rose-200">
              Step 1: Download Official Excel Template
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Includes formatted columns for Subject Code and Subject Name.
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
            className="border-2 border-dashed border-rose-300 dark:border-rose-800/40 hover:border-rose-400 rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 bg-rose-50/40 hover:bg-rose-50/70 dark:bg-rose-950/20 dark:hover:bg-rose-950/40"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto mb-3">
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
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 3: Preview Parsed Results */}
        {parseResult && (
          <div className="space-y-4 animate-in fade-in">
            {/* Summary Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-[#180E1C] border border-rose-200 dark:border-rose-900/40">
                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Total Rows</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{parseResult.totalProcessed}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30">
                <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Ready to Import</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{parseResult.validCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-500/30">
                <p className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">Duplicates / Skipped</p>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{parseResult.duplicateCount + parseResult.errorCount}</p>
              </div>
            </div>

            {/* Preview List */}
            <div className="max-h-48 overflow-y-auto border border-rose-200 dark:border-rose-900/40 rounded-xl bg-white dark:bg-[#180E1C]/60 p-2 divide-y divide-rose-100 dark:divide-white/5">
              {parseResult.validRecords.map((item, idx) => (
                <div key={idx} className="py-2 px-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded font-bold bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300">
                      {item.subjectCode || '—'}
                    </span>
                    <span className="text-slate-700 dark:text-slate-200">{item.subjectName}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Error Report if any */}
            {parseResult.errors.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-300">
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Validation Notes ({parseResult.errors.length} rows excluded):
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

            {/* Footer Actions */}
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
