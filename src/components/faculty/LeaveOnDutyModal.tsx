import React, { useState, useMemo } from 'react';
import { KalyaniModal } from '../common/KalyaniModal';
import { KalyaniButton } from '../common/KalyaniButton';
import { KalyaniSelect } from '../common/KalyaniSelect';
import { Period } from '../../types/period';
import { formatDateDisplay } from '../../utils/dateUtils';
import {
  CalendarX,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sun,
  Sunset,
  Layers,
} from 'lucide-react';

interface LeaveOnDutyModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'LEAVE' | 'ON_DUTY';
  activePeriods: Period[];
  date: string;
  onSaveLeave: (
    scope: 'FULL_DAY' | 'HALF_DAY' | 'PERIOD_WISE',
    reason: string,
    halfDaySlot?: 'FN' | 'AN',
    selectedPeriodIds?: string[]
  ) => void;
  onSaveOnDuty: (
    scope: 'FULL_DAY' | 'HALF_DAY' | 'PERIOD_WISE',
    category: string,
    reason: string,
    halfDaySlot?: 'FN' | 'AN',
    selectedPeriodIds?: string[]
  ) => void;
}

const ON_DUTY_CATEGORIES = [
  'Exam Duty',
  'Placement Drive / Training',
  'Cultural Event / Symposium',
  'Coding Event / Hackathon',
  'Faculty Development Program (FDP / Workshop)',
  'Other Duty'
];

const LEAVE_PRESET_REASONS = [
  'Casual Leave (CL)',
  'Medical / Sick Leave',
  'Personal Work',
  'Family Emergency',
  'Special Permission'
];

export const LeaveOnDutyModal: React.FC<LeaveOnDutyModalProps> = ({
  isOpen,
  onClose,
  mode,
  activePeriods,
  date,
  onSaveLeave,
  onSaveOnDuty,
}) => {
  const isLeave = mode === 'LEAVE';
  const sortedPeriods = useMemo(
    () => [...activePeriods].sort((a, b) => (a.sequence || 0) - (b.sequence || 0)),
    [activePeriods]
  );
  const totalPeriods = sortedPeriods.length;

  // Tab State: 'QUICK' (Full Day / Half Day) vs 'PERIOD_WISE'
  const [activeTab, setActiveTab] = useState<'QUICK' | 'PERIOD_WISE'>('QUICK');
  const [quickScope, setQuickScope] = useState<'FULL_DAY' | 'HALF_DAY'>('FULL_DAY');
  const [halfDaySlot, setHalfDaySlot] = useState<'FN' | 'AN'>('FN');

  // Period-wise selection state
  const [selectedPeriodIds, setSelectedPeriodIds] = useState<string[]>([]);

  // Reason States
  const [onDutyCategory, setOnDutyCategory] = useState<string>(ON_DUTY_CATEGORIES[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [leavePreset, setLeavePreset] = useState<string>(LEAVE_PRESET_REASONS[0]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset or initialize when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab('QUICK');
      setQuickScope('FULL_DAY');
      setHalfDaySlot('FN');
      setSelectedPeriodIds(sortedPeriods.slice(0, 1).map((p) => p.id));
      setValidationError(null);
      setCustomReason('');
      setOnDutyCategory(ON_DUTY_CATEGORIES[0]);
      setLeavePreset(LEAVE_PRESET_REASONS[0]);
    }
  }, [isOpen, sortedPeriods]);

  const togglePeriodSelection = (periodId: string) => {
    setSelectedPeriodIds((prev) =>
      prev.includes(periodId) ? prev.filter((id) => id !== periodId) : [...prev, periodId]
    );
    setValidationError(null);
  };

  const handleSave = () => {
    setValidationError(null);

    // 1. Validation for Period-Wise
    if (activeTab === 'PERIOD_WISE' && selectedPeriodIds.length === 0) {
      setValidationError('Please select at least one period.');
      return;
    }

    if (isLeave) {
      // Reason validation for Leave
      const finalLeaveReason = customReason.trim()
        ? `${leavePreset}: ${customReason.trim()}`
        : leavePreset;

      if (!finalLeaveReason) {
        setValidationError('Please specify a brief reason for your leave.');
        return;
      }

      const scope = activeTab === 'QUICK' ? quickScope : 'PERIOD_WISE';
      onSaveLeave(scope, finalLeaveReason, halfDaySlot, selectedPeriodIds);
      onClose();
    } else {
      // Reason validation for On Duty
      const finalCategory = onDutyCategory;
      const finalReason = customReason.trim();

      if (onDutyCategory === 'Other Duty' && !finalReason) {
        setValidationError('Please specify the duty details for "Other Duty".');
        return;
      }

      const scope = activeTab === 'QUICK' ? quickScope : 'PERIOD_WISE';
      onSaveOnDuty(scope, finalCategory, finalReason || finalCategory, halfDaySlot, selectedPeriodIds);
      onClose();
    }
  };

  return (
    <KalyaniModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl border bg-rose-500/10 border-rose-500/30 text-rose-500">
            {isLeave ? <CalendarX className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-marcellus text-xl sm:text-2xl text-slate-900 dark:text-slate-100 font-semibold tracking-wide">
              {isLeave ? 'Mark Faculty Leave' : 'Mark On Duty (OD)'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans font-normal">
              {formatDateDisplay(date)} • {totalPeriods} active periods configured
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Navigation Tabs (Quick Scope vs Period Wise) */}
        <div className="flex p-1 rounded-2xl bg-rose-50/60 dark:bg-[#180E1C] border border-rose-200/80 dark:border-rose-900/40">
          <button
            type="button"
            onClick={() => setActiveTab('QUICK')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'QUICK'
                ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 text-white font-bold shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Full / Half Day</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PERIOD_WISE')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'PERIOD_WISE'
                ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 text-white font-bold shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Select Period-Wise</span>
          </button>
        </div>

        {/* Tab 1: Quick Scope (Full Day / Half Day) */}
        {activeTab === 'QUICK' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Full Day Card */}
              <button
                type="button"
                onClick={() => setQuickScope('FULL_DAY')}
                className={`p-4 rounded-2xl border text-left transition-all apple-hover flex flex-col justify-between min-h-[90px] ${
                  quickScope === 'FULL_DAY'
                    ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 dark:border-rose-500/60 shadow-sm ring-1 ring-rose-400'
                    : 'bg-white/80 dark:bg-[#180E1C]/80 border-rose-200/70 dark:border-rose-900/30 hover:border-rose-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-marcellus">
                    Full Day {isLeave ? 'Leave' : 'On Duty'}
                  </span>
                  {quickScope === 'FULL_DAY' && (
                    <CheckCircle2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-sans">
                  Applies to the entire day's schedule.
                </p>
              </button>

              {/* Half Day Card */}
              <button
                type="button"
                onClick={() => setQuickScope('HALF_DAY')}
                className={`p-4 rounded-2xl border text-left transition-all apple-hover flex flex-col justify-between min-h-[90px] ${
                  quickScope === 'HALF_DAY'
                    ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 dark:border-rose-500/60 shadow-sm ring-1 ring-rose-400'
                    : 'bg-white/80 dark:bg-[#180E1C]/80 border-rose-200/70 dark:border-rose-900/30 hover:border-rose-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-marcellus">
                    Half Day {isLeave ? 'Leave' : 'On Duty'}
                  </span>
                  {quickScope === 'HALF_DAY' && (
                    <CheckCircle2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-sans">
                  Select Forenoon or Afternoon session.
                </p>
              </button>
            </div>

            {/* Half Day Session Picker - Strictly Forenoon or Afternoon alone */}
            {quickScope === 'HALF_DAY' && (
              <div className="p-3.5 rounded-2xl bg-rose-50/40 dark:bg-[#180E1C]/60 border border-rose-200 dark:border-rose-900/40 space-y-2.5 animate-in fade-in">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Select Session:
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setHalfDaySlot('FN')}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold border flex items-center justify-center gap-2 transition-all apple-hover ${
                      halfDaySlot === 'FN'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm font-bold'
                        : 'bg-white dark:bg-[#201026] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-rose-300'
                    }`}
                  >
                    <Sun className="w-4 h-4 shrink-0" />
                    <span>Forenoon</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHalfDaySlot('AN')}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold border flex items-center justify-center gap-2 transition-all apple-hover ${
                      halfDaySlot === 'AN'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm font-bold'
                        : 'bg-white dark:bg-[#201026] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-rose-300'
                    }`}
                  >
                    <Sunset className="w-4 h-4 shrink-0" />
                    <span>Afternoon</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Period Wise Selection - No Timings, No Checkmarks, Pure Pink on Selection */}
        {activeTab === 'PERIOD_WISE' && (
          <div className="space-y-2.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs px-1 text-slate-600 dark:text-slate-400">
              <span>Select periods configured by HOD:</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                {selectedPeriodIds.length} period(s) selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {sortedPeriods.map((period, idx) => {
                const isSelected = selectedPeriodIds.includes(period.id);
                const periodLabel = period.name || period.shortName || `Period ${period.sequence || idx + 1}`;
                return (
                  <button
                    key={period.id}
                    type="button"
                    onClick={() => togglePeriodSelection(period.id)}
                    className={`h-12 min-h-[48px] px-3 rounded-xl border text-center transition-all apple-hover flex items-center justify-center font-bold text-xs sm:text-sm ${
                      isSelected
                        ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-400/40 scale-[1.02]'
                        : 'bg-white/90 dark:bg-[#180E1C]/90 border-rose-200/80 dark:border-rose-900/40 text-slate-700 dark:text-slate-300 hover:border-rose-400'
                    }`}
                  >
                    <span className="truncate">{periodLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Reason Section (Mandatory) */}
        <div className="p-4 rounded-2xl bg-rose-50/40 dark:bg-[#180E1C]/60 border border-rose-200/80 dark:border-rose-900/40 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-200 block font-marcellus">
            {isLeave ? 'Reason for Leave (Required)' : 'On Duty Classification & Reason (Required)'}
          </label>

          {/* On Duty Dropdown with curved KalyaniSelect & Pink Theme */}
          {!isLeave ? (
            <div className="space-y-3">
              <KalyaniSelect
                label="On Duty Classification"
                options={ON_DUTY_CATEGORIES.map((cat) => ({
                  value: cat,
                  label: cat,
                }))}
                value={onDutyCategory}
                onChange={(val) => {
                  setOnDutyCategory(val);
                  setValidationError(null);
                }}
              />

              <input
                type="text"
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  setValidationError(null);
                }}
                placeholder={
                  onDutyCategory === 'Other Duty'
                    ? 'Enter specific duty details / hall / purpose (Required)...'
                    : 'Optional duty notes / details...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#201026] border border-rose-200 dark:border-rose-900/50 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm transition-all"
              />
            </div>
          ) : (
            /* Leave Quick Reasons + Custom Note */
            <div className="space-y-2.5">
              <div className="flex flex-wrap gap-1.5">
                {LEAVE_PRESET_REASONS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setLeavePreset(preset);
                      setValidationError(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all apple-hover border ${
                      leavePreset === preset
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white dark:bg-[#201026] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-rose-300'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  setValidationError(null);
                }}
                placeholder="Brief reason note (e.g. Health checkup, Out of station)..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#201026] border border-rose-200 dark:border-rose-900/50 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm transition-all"
              />
            </div>
          )}
        </div>

        {/* Validation Error Alert */}
        {validationError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-500/50 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <KalyaniButton
            variant="ghost"
            size="md"
            onClick={onClose}
            className="text-xs"
          >
            Cancel
          </KalyaniButton>

          <KalyaniButton
            variant="gold"
            size="md"
            onClick={handleSave}
            className="text-xs font-bold px-6 shadow-sm"
          >
            {isLeave ? 'Confirm & Save Leave' : 'Confirm & Save On Duty'}
          </KalyaniButton>
        </div>
      </div>
    </KalyaniModal>
  );
};
