import React, { useState, useMemo, useRef, useEffect } from 'react';
import { KalyaniModal } from '../common/KalyaniModal';
import { KalyaniButton } from '../common/KalyaniButton';
import { Period } from '../../types/period';
import { formatDateDisplay } from '../../utils/dateUtils';
import { scrollToTopView } from '../../utils/scrollUtils';
import {
  CalendarX,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sun,
  Sunset,
  Layers,
  Search,
  ArrowLeft,
  Check,
  ChevronDown,
  GraduationCap,
  FileCheck2,
  Sparkles,
  Code2,
  BookOpen,
  MoreHorizontal,
  Coffee,
  Stethoscope,
  Calendar,
  AlertTriangle,
  ShieldCheck,
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

interface ClassificationItem {
  value: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ON_DUTY_ITEMS: ClassificationItem[] = [
  {
    value: 'Exam Duty',
    label: 'Exam Duty',
    description: 'Semester exams, university invigilation & exam control duties',
    icon: GraduationCap,
  },
  {
    value: 'Valuation Duty',
    label: 'Valuation Duty',
    description: 'Central paper valuation, evaluation camp & board duties',
    icon: FileCheck2,
  },
  {
    value: 'Placement Drive / Training',
    label: 'Placement Drive / Training',
    description: 'Campus recruitment, student mock interviews & company drives',
    icon: Briefcase,
  },
  {
    value: 'Cultural Event / Symposium',
    label: 'Cultural Event / Symposium',
    description: 'College fest, department symposium & student activities',
    icon: Sparkles,
  },
  {
    value: 'Coding Event / Hackathon',
    label: 'Coding Event / Hackathon',
    description: 'Hackathons, coding contests & technical project reviews',
    icon: Code2,
  },
  {
    value: 'Faculty Development Program (FDP / Workshop)',
    label: 'Faculty Development Program (FDP / Workshop)',
    description: 'Workshops, research seminars, conferences & pedagogy training',
    icon: BookOpen,
  },
  {
    value: 'Other Duty',
    label: 'Other Duty',
    description: 'Specific institutional work, lab maintenance, or committee tasks',
    icon: MoreHorizontal,
  },
];

const LEAVE_ITEMS: ClassificationItem[] = [
  {
    value: 'Casual Leave (CL)',
    label: 'Casual Leave (CL)',
    description: 'Standard casual leave for personal affairs',
    icon: Coffee,
  },
  {
    value: 'Medical / Sick Leave',
    label: 'Medical / Sick Leave',
    description: 'Illness, health checkup, doctor visit or medical recovery',
    icon: Stethoscope,
  },
  {
    value: 'Earned Leave (EL)',
    label: 'Earned Leave (EL)',
    description: 'Official academic privilege earned leave',
    icon: Calendar,
  },
  {
    value: 'Personal Work',
    label: 'Personal Work',
    description: 'Personal commitments, family matters or domestic work',
    icon: Briefcase,
  },
  {
    value: 'Family Emergency',
    label: 'Family Emergency',
    description: 'Urgent domestic, emergency or family assistance',
    icon: AlertTriangle,
  },
  {
    value: 'Special Permission',
    label: 'Special Permission',
    description: 'Authorized institutional special permission or on-premise absence',
    icon: ShieldCheck,
  },
  {
    value: 'Other Leave Reason',
    label: 'Other Leave Reason',
    description: 'Specify custom leave details in reason note',
    icon: MoreHorizontal,
  },
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
  const [onDutyCategory, setOnDutyCategory] = useState<string>(ON_DUTY_ITEMS[0].value);
  const [leavePreset, setLeavePreset] = useState<string>(LEAVE_ITEMS[0].value);
  const [customReason, setCustomReason] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // In-modal front-facing classification picker state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset or initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('QUICK');
      setQuickScope('FULL_DAY');
      setHalfDaySlot('FN');
      setSelectedPeriodIds(sortedPeriods.slice(0, 1).map((p) => p.id));
      setValidationError(null);
      setCustomReason('');
      setOnDutyCategory(ON_DUTY_ITEMS[0].value);
      setLeavePreset(LEAVE_ITEMS[0].value);
      setIsPickerOpen(false);
      setSearchQuery('');
    }
  }, [isOpen, sortedPeriods]);

  // Focus search input and scroll to top of modal when picker view opens
  useEffect(() => {
    if (isPickerOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        if (searchInputRef.current) {
          scrollToTopView(searchInputRef.current);
        }
      }, 100);
    }
  }, [isPickerOpen]);

  const togglePeriodSelection = (periodId: string) => {
    setSelectedPeriodIds((prev) =>
      prev.includes(periodId) ? prev.filter((id) => id !== periodId) : [...prev, periodId]
    );
    setValidationError(null);
  };

  // Filter classification list based on search input
  const currentItems = isLeave ? LEAVE_ITEMS : ON_DUTY_ITEMS;
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentItems;
    return currentItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.value.toLowerCase().includes(q)
    );
  }, [currentItems, searchQuery]);

  // Find currently active item for trigger badge icon
  const currentSelectedValue = isLeave ? leavePreset : onDutyCategory;
  const currentSelectedItem = currentItems.find((item) => item.value === currentSelectedValue);
  const SelectedIcon = currentSelectedItem ? currentSelectedItem.icon : isLeave ? CalendarX : Briefcase;

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

      if (leavePreset === 'Other Leave Reason' && !customReason.trim()) {
        setValidationError('Please specify the details for "Other Leave Reason".');
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
        isPickerOpen ? (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsPickerOpen(false)}
              className="p-1.5 -ml-1 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 transition-colors"
              title="Back to Form"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="font-marcellus text-xl sm:text-2xl text-slate-900 dark:text-slate-100 font-semibold tracking-wide">
                {isLeave ? 'Select Leave Classification' : 'Select On Duty Classification'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans font-normal">
                Touch any classification to apply
              </p>
            </div>
          </div>
        ) : (
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
        )
      }
    >
      {/* View 1: When Classification Picker is Open (Brought to the top/front of the popup) */}
      {isPickerOpen ? (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          {/* Search Box Header */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 z-10 pointer-events-none text-rose-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={(e) => scrollToTopView(e.currentTarget)}
              onClick={(e) => scrollToTopView(e.currentTarget)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isLeave
                  ? 'Search leave type (e.g. Sick, Casual, Emergency)…'
                  : 'Search duty type (e.g. Exam, Valuation, FDP)…'
              }
              className="w-full bg-white dark:bg-[#180E1C] border border-rose-200 dark:border-rose-900/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm rounded-xl pl-10 pr-10 py-3 outline-none transition-all shadow-sm"
            />
            {searchQuery.trim().length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold transition-all"
              >
                ✕
              </button>
            )}
          </div>

          {/* List of Available Classifications */}
          <div className="max-h-[55vh] overflow-y-auto overflow-x-hidden space-y-2 p-0.5">
            {filteredOptions.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">
                No matching classifications found for "{searchQuery}".
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = isLeave ? leavePreset === opt.value : onDutyCategory === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      if (isLeave) {
                        setLeavePreset(opt.value);
                      } else {
                        setOnDutyCategory(opt.value);
                      }
                      setValidationError(null);
                      setIsPickerOpen(false);
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-gradient-to-r from-pink-500/10 via-rose-500/15 to-rose-600/15 border-rose-500 text-rose-900 dark:text-rose-100 shadow-sm ring-1 ring-rose-400'
                        : 'bg-white dark:bg-[#201026] hover:bg-rose-50/50 dark:hover:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/40 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          isSelected
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                          {opt.label}
                        </p>
                        {opt.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {opt.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Bottom Back Button */}
          <div className="pt-2 flex justify-end">
            <KalyaniButton
              variant="ghost"
              size="sm"
              onClick={() => setIsPickerOpen(false)}
              className="text-xs"
            >
              Back to Form
            </KalyaniButton>
          </div>
        </div>
      ) : (
        /* View 2: Main Modal Form */
        <div className="space-y-5 animate-in fade-in duration-150">
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

              <div className="p-1.5 -m-1.5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto overflow-x-hidden p-1.5">
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
                            ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-400/50'
                            : 'bg-white/90 dark:bg-[#180E1C]/90 border-rose-200/80 dark:border-rose-900/40 text-slate-700 dark:text-slate-300 hover:border-rose-400'
                        }`}
                      >
                        <span className="truncate">{periodLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Reason Section - Strictly 'On Duty Classification & Reason' or 'Leave Classification & Reason' */}
          <div className="p-4 rounded-2xl bg-rose-50/40 dark:bg-[#180E1C]/60 border border-rose-200/80 dark:border-rose-900/40 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-200 block font-marcellus">
              {isLeave ? 'Leave Classification & Reason' : 'On Duty Classification & Reason'}
            </label>

            {/* Classification Trigger Button (Brings the list to the top of the popup when touched) */}
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setIsPickerOpen(true);
              }}
              className="w-full min-h-[48px] h-12 flex items-center justify-between text-left bg-white dark:bg-[#180E1C] border border-rose-200 dark:border-rose-900/50 hover:border-rose-400 rounded-xl px-4 text-xs sm:text-sm text-slate-800 dark:text-slate-100 shadow-sm transition-all group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                  <SelectedIcon className="w-4 h-4" />
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                  {currentSelectedValue}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-rose-500 font-medium text-xs shrink-0 ml-2">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Change</span>
                <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
              </div>
            </button>

            {/* Extra Reason / Purpose Input (Smooth auto-scroll into view when keyboard opens) */}
            <input
              type="text"
              value={customReason}
              onChange={(e) => {
                setCustomReason(e.target.value);
                setValidationError(null);
              }}
              onFocus={(e) => {
                scrollToTopView(e.currentTarget);
              }}
              onClick={(e) => {
                scrollToTopView(e.currentTarget);
              }}
              placeholder={
                (!isLeave && onDutyCategory === 'Other Duty') || (isLeave && leavePreset === 'Other Leave Reason')
                  ? 'Enter specific details / purpose (Required)...'
                  : isLeave
                  ? 'Optional leave notes / details (e.g. Health checkup, Out of station)...'
                  : 'Optional duty notes / details...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#201026] border border-rose-200 dark:border-rose-900/50 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm transition-all"
            />
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
      )}
    </KalyaniModal>
  );
};
