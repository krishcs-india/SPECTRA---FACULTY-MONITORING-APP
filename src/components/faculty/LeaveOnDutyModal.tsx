import React, { useState, useMemo, useRef, useEffect } from 'react';
import { KalyaniModal } from '../common/KalyaniModal';
import { KalyaniButton } from '../common/KalyaniButton';
import { Period } from '../../types/period';
import { PeriodEntry } from '../../types/schedule';
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
  currentPeriods?: Record<string, PeriodEntry>;
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

const LEAVE_SUGGESTIONS = [
  'Doctor Visit / Medical',
  'Health Checkup',
  'Out of Station',
  'Family Function',
  'Personal Work',
  'Family Emergency',
];

const ON_DUTY_SUGGESTIONS = [
  'Anna University Exam Duty',
  'Central Valuation Camp',
  'Campus Placement Drive',
  'Department Symposium',
  'FDP Workshop / Training',
  'NAAC / NBA Work',
];

export const LeaveOnDutyModal: React.FC<LeaveOnDutyModalProps> = ({
  isOpen,
  onClose,
  mode,
  activePeriods,
  date,
  currentPeriods,
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

  // Focus & mobile smooth scroll refs for notes / reason section
  const [isNotesFocused, setIsNotesFocused] = useState(false);
  const reasonSectionRef = useRef<HTMLDivElement>(null);
  const customReasonInputRef = useRef<HTMLInputElement>(null);

  const handleNotesFocus = () => {
    setIsNotesFocused(true);
    if (reasonSectionRef.current) {
      scrollToTopView(reasonSectionRef.current, {
        offset: 12,
        force: true,
        behavior: 'smooth',
      });
      // Handle mobile soft keyboard transition timing
      setTimeout(() => {
        if (reasonSectionRef.current) {
          scrollToTopView(reasonSectionRef.current, {
            offset: 12,
            force: true,
            behavior: 'smooth',
          });
        }
      }, 180);
      setTimeout(() => {
        if (reasonSectionRef.current) {
          scrollToTopView(reasonSectionRef.current, {
            offset: 12,
            force: true,
            behavior: 'smooth',
          });
        }
      }, 360);
    }
  };

  const handleDoneNotes = () => {
    customReasonInputRef.current?.blur();
    setIsNotesFocused(false);
  };

  const handleSelectSuggestion = (sug: string) => {
    setCustomReason(sug);
    setValidationError(null);
  };

  // Period Helpers for Session-wise quick multi-select (Floor value for odd periods)
  const fnCount = Math.floor(sortedPeriods.length / 2);
  const fnPeriodIds = useMemo(() => {
    return sortedPeriods.slice(0, fnCount).map((p) => p.id);
  }, [sortedPeriods, fnCount]);

  const anPeriodIds = useMemo(() => {
    return sortedPeriods.slice(fnCount).map((p) => p.id);
  }, [sortedPeriods, fnCount]);

  const isAllSelected = sortedPeriods.length > 0 && selectedPeriodIds.length === sortedPeriods.length;
  const isFnSelected =
    fnPeriodIds.length > 0 &&
    fnPeriodIds.length === selectedPeriodIds.length &&
    fnPeriodIds.every((id) => selectedPeriodIds.includes(id));
  const isAnSelected =
    anPeriodIds.length > 0 &&
    anPeriodIds.length === selectedPeriodIds.length &&
    anPeriodIds.every((id) => selectedPeriodIds.includes(id));

  // Reset or initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('QUICK');
      setQuickScope('FULL_DAY');
      setHalfDaySlot('FN');
      setSelectedPeriodIds([]);
      setValidationError(null);
      setCustomReason('');
      setOnDutyCategory(ON_DUTY_ITEMS[0].value);
      setLeavePreset(LEAVE_ITEMS[0].value);
      setIsPickerOpen(false);
      setSearchQuery('');
      setIsNotesFocused(false);
    }
  }, [isOpen]);

  // Focus search input and scroll to top of modal when picker view opens
  useEffect(() => {
    if (isPickerOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        if (searchInputRef.current) {
          scrollToTopView(searchInputRef.current, { force: true, offset: 12 });
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
                      if (opt.value === 'Other Leave Reason' || opt.value === 'Other Duty') {
                        setTimeout(() => {
                          customReasonInputRef.current?.focus();
                          handleNotesFocus();
                        }, 200);
                      }
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
        <div
          className="space-y-4 sm:space-y-5 animate-in fade-in duration-150 transition-all duration-200 pb-2"
        >
          {/* Navigation Tabs (Quick Scope vs Period Wise) */}
          <div className="flex p-1 rounded-2xl bg-rose-50/60 dark:bg-[#180E1C] border border-rose-200/80 dark:border-rose-900/40">
            <button
              type="button"
              onClick={() => {
                setActiveTab('QUICK');
                if (isNotesFocused) handleDoneNotes();
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'QUICK'
                  ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Full / Half Day</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('PERIOD_WISE');
                if (isNotesFocused) handleDoneNotes();
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'PERIOD_WISE'
                  ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 text-white shadow-md'
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
                      className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold border flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all apple-hover ${
                        halfDaySlot === 'FN'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm font-bold'
                          : 'bg-white dark:bg-[#201026] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Sun className="w-4 h-4 shrink-0" />
                        <span>Forenoon</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHalfDaySlot('AN')}
                      className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold border flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all apple-hover ${
                        halfDaySlot === 'AN'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm font-bold'
                          : 'bg-white dark:bg-[#201026] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Sunset className="w-4 h-4 shrink-0" />
                        <span>Afternoon</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Period Wise Selection - No nested scroll trap, smart session shortcuts */}
          {activeTab === 'PERIOD_WISE' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs px-1 text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Select Period(s):
                </span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {selectedPeriodIds.length} of {totalPeriods} selected
                </span>
              </div>

              {/* Quick Multi-Select Filter Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPeriodIds(sortedPeriods.map((p) => p.id));
                    setValidationError(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    isAllSelected
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm font-bold'
                      : 'bg-white dark:bg-[#180E1C] border-rose-200 dark:border-rose-900/40 text-slate-700 dark:text-slate-300 hover:border-rose-400'
                  }`}
                >
                  All ({totalPeriods})
                </button>

                {fnPeriodIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPeriodIds(fnPeriodIds);
                      setValidationError(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      isFnSelected
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm font-bold'
                        : 'bg-white dark:bg-[#180E1C] border-rose-200 dark:border-rose-900/40 text-slate-700 dark:text-slate-300 hover:border-rose-400'
                    }`}
                  >
                    Morning FN ({fnCount})
                  </button>
                )}

                {anPeriodIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPeriodIds(anPeriodIds);
                      setValidationError(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      isAnSelected
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm font-bold'
                        : 'bg-white dark:bg-[#180E1C] border-rose-200 dark:border-rose-900/40 text-slate-700 dark:text-slate-300 hover:border-rose-400'
                    }`}
                  >
                    Afternoon AN ({totalPeriods - fnCount})
                  </button>
                )}

                {selectedPeriodIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedPeriodIds([])}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-auto"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Seamless Period Grid without nested scroll trapping */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-0.5">
                {sortedPeriods.map((period, idx) => {
                  const isSelected = selectedPeriodIds.includes(period.id);
                  const periodLabel = period.name || period.shortName || `Period ${period.sequence || idx + 1}`;
                  const existingEntry = currentPeriods?.[period.id];
                  const hasExistingOD = existingEntry?.type === 'ON_DUTY';
                  const hasExistingLeave = existingEntry?.type === 'LEAVE';
                  const hasExistingSubject = existingEntry?.type === 'SUBJECT';
                  const hasExistingCustom = existingEntry?.type === 'CUSTOM';

                  return (
                    <button
                      key={period.id}
                      type="button"
                      onClick={() => togglePeriodSelection(period.id)}
                      className={`min-h-[58px] py-2 px-3 rounded-2xl border text-center transition-all duration-150 touch-manipulation active:scale-[0.97] flex flex-col justify-center gap-0.5 font-bold text-xs sm:text-sm ${
                        isSelected
                          ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-400/50'
                          : hasExistingOD
                          ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/50 text-slate-800 dark:text-slate-200 hover:border-amber-400 shadow-xs'
                          : hasExistingLeave
                          ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/50 text-slate-800 dark:text-slate-200 hover:border-rose-400 shadow-xs'
                          : 'bg-white dark:bg-[#201026] border-rose-200/80 dark:border-rose-900/40 text-slate-700 dark:text-slate-300 hover:border-rose-400 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate flex-1 text-left">{periodLabel}</span>
                        {isSelected ? (
                          <span className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center shrink-0 ml-1">
                            <Check className="w-3 h-3 stroke-[3] text-white" />
                          </span>
                        ) : hasExistingOD ? (
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 ml-1" />
                        ) : hasExistingLeave ? (
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 ml-1" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0 ml-1" />
                        )}
                      </div>

                      {/* Status / Override Tag */}
                      <div className="w-full text-left truncate">
                        {isSelected ? (
                          existingEntry && existingEntry.type !== 'FREE' ? (
                            <span className="text-[10px] text-white/90 font-medium block truncate">
                              Replaces {hasExistingOD ? 'OD' : hasExistingLeave ? 'Leave' : 'Class'}
                            </span>
                          ) : null
                        ) : hasExistingOD ? (
                          <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold block truncate">
                            OD: {existingEntry.onDutyCategory || 'On Duty'}
                          </span>
                        ) : hasExistingLeave ? (
                          <span className="text-[10px] text-rose-700 dark:text-rose-300 font-semibold block truncate">
                            Leave: {existingEntry.leaveReason || 'On Leave'}
                          </span>
                        ) : hasExistingSubject ? (
                          <span className="text-[10px] text-teal-700 dark:text-teal-300 font-medium block truncate">
                            {existingEntry.subjectCode || existingEntry.subjectName}
                          </span>
                        ) : hasExistingCustom ? (
                          <span className="text-[10px] text-purple-700 dark:text-purple-300 font-medium block truncate">
                            {existingEntry.customText}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reason Section - Strictly 'On Duty Classification & Reason' or 'Leave Classification & Reason' */}
          <div
            ref={reasonSectionRef}
            className={`p-4 rounded-2xl border transition-all duration-200 space-y-3 ${
              isNotesFocused
                ? 'bg-white dark:bg-[#201026] border-rose-400 dark:border-rose-500 shadow-lg ring-2 ring-rose-500/25'
                : 'bg-rose-50/40 dark:bg-[#180E1C]/60 border-rose-200/80 dark:border-rose-900/40 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-200 block font-marcellus">
                {isLeave ? 'Leave Classification & Reason' : 'On Duty Classification & Reason'}
              </label>

              {isNotesFocused && (
                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Typing Notes
                </span>
              )}
            </div>

            {/* Classification Trigger Button (Brings the list to the top of the popup when touched) */}
            <button
              type="button"
              onClick={() => {
                if (isNotesFocused) handleDoneNotes();
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

            {/* Extra Reason / Purpose Input with Smooth Auto-Scroll & Typing Controls */}
            <div className="space-y-2">
              <div className="relative flex items-center">
                <input
                  ref={customReasonInputRef}
                  type="text"
                  value={customReason}
                  onChange={(e) => {
                    setCustomReason(e.target.value);
                    setValidationError(null);
                  }}
                  onFocus={handleNotesFocus}
                  onClick={handleNotesFocus}
                  placeholder={
                    (!isLeave && onDutyCategory === 'Other Duty') || (isLeave && leavePreset === 'Other Leave Reason')
                      ? 'Enter specific details / purpose (Required)...'
                      : isLeave
                      ? 'Optional leave notes / details (e.g. Health checkup, Out of station)...'
                      : 'Optional duty notes / details...'
                  }
                  className={`w-full px-3.5 py-3 rounded-xl bg-white dark:bg-[#180E1C] border text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all shadow-sm ${
                    isNotesFocused
                      ? 'border-rose-500 ring-2 ring-rose-500/20 pr-20'
                      : 'border-rose-200 dark:border-rose-900/50 hover:border-rose-400'
                  }`}
                />

                {/* Done & Clear Actions inside the input during active focus */}
                {isNotesFocused && (
                  <div className="absolute right-2 flex items-center gap-1">
                    {customReason.length > 0 && (
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setCustomReason('');
                          customReasonInputRef.current?.focus();
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Clear text"
                      >
                        ✕
                      </button>
                    )}
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleDoneNotes}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Done</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Suggestion Chips (Visible during typing/focus for instantaneous 1-tap entry) */}
              {isNotesFocused && (
                <div className="pt-1 space-y-1.5 animate-in fade-in duration-150">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Quick suggestions (tap to fill):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(isLeave ? LEAVE_SUGGESTIONS : ON_DUTY_SUGGESTIONS).map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectSuggestion(sug)}
                        className="px-2.5 py-1 rounded-lg text-xs bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 hover:bg-rose-100 hover:border-rose-300 transition-all font-medium active:scale-95"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
