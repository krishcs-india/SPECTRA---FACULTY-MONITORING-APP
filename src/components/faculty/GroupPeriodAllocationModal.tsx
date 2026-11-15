import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { KalyaniModal } from '../common/KalyaniModal';
import { KalyaniButton } from '../common/KalyaniButton';
import { KalyaniInput } from '../common/KalyaniInput';
import { Period } from '../../types/period';
import { Subject } from '../../types/subject';
import { PeriodEntry } from '../../types/schedule';
import { scrollToTopView } from '../../utils/scrollUtils';
import {
  Layers,
  Search,
  Check,
  CheckCircle2,
  Coffee,
  Sparkles,
  PlusCircle,
  AlertCircle,
  X,
  BookOpen,
  RotateCcw,
} from 'lucide-react';

const QUICK_ACADEMIC_DUTIES = [
  'Final Year Project Review',
  'Department Faculty Meeting',
  'NBA / NAAC Accreditation Work',
  'Central Valuation Duty',
  'Semester Exam Invigilation',
  'Campus Placement Drive / Training',
  'Laboratory Maintenance',
  'Guest Lecture Coordination',
  'Faculty Development Program (FDP)',
  'Research Seminar & Workshop',
  'Hackathon & Coding Review',
  'Cultural Event & Symposium',
  'Class Committee Meeting',
  'Internal Academic Audit',
  'Remedial / Coaching Class',
  'Student Mentoring Session',
];

interface GroupPeriodAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePeriods: Period[];
  subjects: Subject[];
  currentPeriods: Record<string, PeriodEntry>;
  onSaveBatch: (updatedPeriods: Record<string, PeriodEntry>) => void;
  onAssignSubject?: (periodIds: string[], subject: Subject) => void;
  onAssignCustom?: (periodIds: string[], customText: string) => void;
  onAssignFree?: (periodIds: string[]) => void;
}

export const GroupPeriodAllocationModal: React.FC<GroupPeriodAllocationModalProps> = ({
  isOpen,
  onClose,
  activePeriods,
  subjects,
  currentPeriods,
  onSaveBatch,
  onAssignSubject,
  onAssignCustom,
  onAssignFree,
}) => {
  const sortedPeriods = useMemo(
    () => [...activePeriods].sort((a, b) => (a.sequence || 0) - (b.sequence || 0)),
    [activePeriods]
  );
  const totalPeriods = sortedPeriods.length;

  // Staged local state inside modal — merged into schedule on Save
  const [localPeriods, setLocalPeriods] = useState<Record<string, PeriodEntry>>({ ...currentPeriods });
  const [selectedPeriodIds, setSelectedPeriodIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'OFFICIAL' | 'CUSTOM' | 'FREE'>('OFFICIAL');
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [customText, setCustomText] = useState('');
  const [inModalSuccess, setInModalSuccess] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // For scroll-to-top of modal content
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const modalTopRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const actionSectionRef = useRef<HTMLDivElement>(null);

  const scrollToModalTop = useCallback(() => {
    setTimeout(() => {
      const scrollContainer =
        modalContainerRef.current ||
        modalTopRef.current?.closest('.overflow-y-auto') ||
        (modalTopRef.current?.parentElement as HTMLElement | null);
      if (scrollContainer && typeof scrollContainer.scrollTo === 'function') {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        modalTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  }, []);

  // Synchronize state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalPeriods({ ...currentPeriods });
      setSelectedPeriodIds([]);
      setActiveTab('OFFICIAL');
      setSearch('');
      setSelectedSubject(null);
      setCustomText('');
      setInModalSuccess(null);
      setValidationError(null);
      setHasUnsavedChanges(false);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss success banner after 4 s
  useEffect(() => {
    if (inModalSuccess) {
      const timer = setTimeout(() => setInModalSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [inModalSuccess]);

  // Session split helpers
  const fnCount = Math.floor(sortedPeriods.length / 2);
  const fnPeriodIds = useMemo(() => sortedPeriods.slice(0, fnCount).map((p) => p.id), [sortedPeriods, fnCount]);
  const anPeriodIds = useMemo(() => sortedPeriods.slice(fnCount).map((p) => p.id), [sortedPeriods, fnCount]);

  const isAllSelected = sortedPeriods.length > 0 && selectedPeriodIds.length === sortedPeriods.length;
  const isFnSelected =
    fnPeriodIds.length > 0 &&
    fnPeriodIds.length === selectedPeriodIds.length &&
    fnPeriodIds.every((id) => selectedPeriodIds.includes(id));
  const isAnSelected =
    anPeriodIds.length > 0 &&
    anPeriodIds.length === selectedPeriodIds.length &&
    anPeriodIds.every((id) => selectedPeriodIds.includes(id));

  const togglePeriod = (pId: string) => {
    setSelectedPeriodIds((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]
    );
    setValidationError(null);
  };

  const cleanSearch = search.trim().toLowerCase();
  const filteredSubjects = useMemo(() => {
    if (!cleanSearch) return subjects;
    return subjects.filter(
      (s) =>
        (s.subjectCode || '').toLowerCase().includes(cleanSearch) ||
        (s.subjectName || '').toLowerCase().includes(cleanSearch)
    );
  }, [subjects, cleanSearch]);

  const hasExactMatch = subjects.some(
    (s) =>
      (s.subjectName || '').toLowerCase() === cleanSearch ||
      (s.subjectCode && s.subjectCode.toLowerCase() === cleanSearch)
  );

  // Returns true only when customText exactly matches a predefined quick duty
  const isCustomTextPredefined = useMemo(() => {
    if (!customText.trim()) return false;
    return QUICK_ACADEMIC_DUTIES.some(
      (d) => d.toLowerCase() === customText.trim().toLowerCase()
    );
  }, [customText]);

  // ── Intelligent auto-scroll for search and tabs ────────────────────────────
  const handleSearchFocus = () => {
    if (searchInputRef.current) {
      scrollToTopView(searchInputRef.current, {
        offset: 16,
        force: true,
        behavior: 'smooth',
      });
      setTimeout(() => {
        if (searchInputRef.current) {
          scrollToTopView(searchInputRef.current, {
            offset: 16,
            force: true,
            behavior: 'smooth',
          });
        }
      }, 150);
    }
  };

  // ── Tab switching ──────────────────────────────────────────────────────────
  const handleTabSwitch = (tab: 'OFFICIAL' | 'CUSTOM' | 'FREE') => {
    setActiveTab(tab);
    setValidationError(null);
    setTimeout(() => {
      if (tab === 'OFFICIAL') {
        searchInputRef.current?.focus();
        handleSearchFocus();
      } else if (tab === 'CUSTOM') {
        customInputRef.current?.focus();
        if (customInputRef.current) {
          scrollToTopView(customInputRef.current, {
            offset: 16,
            force: true,
            behavior: 'smooth',
          });
        }
      } else if (tab === 'FREE') {
        actionSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 120);
  };

  // ── Set Free ───────────────────────────────────────────────────────────────
  const handleSetFreeClick = () => {
    if (selectedPeriodIds.length === 0) {
      setActiveTab('FREE');
      setValidationError('Please select at least one period above first.');
      scrollToModalTop();
      return;
    }
    setLocalPeriods((prev) => {
      const next = { ...prev };
      selectedPeriodIds.forEach((pid) => {
        next[pid] = { type: 'FREE' };
      });
      return next;
    });
    setHasUnsavedChanges(true);
    setInModalSuccess('Selected periods have been marked free.');
    setSelectedPeriodIds([]);
    setActiveTab('FREE');
    scrollToModalTop();
  };

  // ── Subject click ──────────────────────────────────────────────────────────
  const handleSubjectClick = (sub: Subject) => {
    setValidationError(null);
    if (selectedPeriodIds.length === 0) {
      // Highlight selected subject but show error — do NOT keep it highlighted after error
      setValidationError('Please select at least one period above first.');
      scrollToModalTop();
      return; // Don't set selectedSubject — prevents persistent highlight
    }
    setLocalPeriods((prev) => {
      const next = { ...prev };
      selectedPeriodIds.forEach((pid) => {
        next[pid] = {
          type: 'SUBJECT',
          subjectId: sub.id,
          subjectCode: sub.subjectCode,
          subjectName: sub.subjectName,
        };
      });
      return next;
    });
    setHasUnsavedChanges(true);
    setInModalSuccess(`"${sub.subjectCode || sub.subjectName}" allocated. Click Save to apply.`);
    // Immediately clear selection state so nothing stays highlighted
    setSelectedPeriodIds([]);
    setSelectedSubject(null);
    setSearch('');
    scrollToModalTop();
  };

  // ── Quick academic duty suggestion ─────────────────────────────────────────
  const handleQuickSuggestionClick = (sug: string) => {
    setValidationError(null);
    if (selectedPeriodIds.length === 0) {
      setValidationError('Please select at least one period above first.');
      scrollToModalTop();
      // Important: do NOT call setCustomText(sug) — avoids persistent highlight
      return;
    }
    setLocalPeriods((prev) => {
      const next = { ...prev };
      selectedPeriodIds.forEach((pid) => {
        next[pid] = { type: 'CUSTOM', customText: sug };
      });
      return next;
    });
    setHasUnsavedChanges(true);
    setInModalSuccess(`"${sug}" allocated. Click Save to apply.`);
    // Clear everything so highlight and callout disappear
    setSelectedPeriodIds([]);
    setCustomText('');
    scrollToModalTop();
  };

  // ── Apply custom entry ─────────────────────────────────────────────────────
  const handleApplyCustom = () => {
    const dutyText = customText.trim();
    if (selectedPeriodIds.length === 0) {
      setValidationError('Please select at least one period above first.');
      scrollToModalTop();
      return;
    }
    if (!dutyText) {
      setValidationError('Please enter a description for the custom academic activity.');
      return;
    }
    setLocalPeriods((prev) => {
      const next = { ...prev };
      selectedPeriodIds.forEach((pid) => {
        next[pid] = { type: 'CUSTOM', customText: dutyText };
      });
      return next;
    });
    setHasUnsavedChanges(true);
    setInModalSuccess(`"${dutyText}" allocated. Click Save to apply.`);
    // Clear text field — removes callout and Apply button
    setSelectedPeriodIds([]);
    setCustomText('');
    scrollToModalTop();
  };

  // ── Add and assign unlisted subject ───────────────────────────────────────
  const handleAddAndAssignUnlisted = (name: string) => {
    if (!name.trim()) return;
    if (selectedPeriodIds.length === 0) {
      setValidationError('Please select at least one period above first.');
      scrollToModalTop();
      return;
    }
    setLocalPeriods((prev) => {
      const next = { ...prev };
      selectedPeriodIds.forEach((pid) => {
        next[pid] = {
          type: 'SUBJECT',
          subjectId: `unlisted_${Date.now()}`,
          subjectCode: '',
          subjectName: name.trim(),
        };
      });
      return next;
    });
    setHasUnsavedChanges(true);
    setInModalSuccess(`"${name.trim()}" allocated. Click Save to apply.`);
    setSelectedPeriodIds([]);
    setSelectedSubject(null);
    setSearch(''); // clears the unlisted callout immediately
    scrollToModalTop();
  };

  // ── Save & close ───────────────────────────────────────────────────────────
  const handleSaveModal = () => {
    setValidationError(null);
    let finalPeriods = { ...localPeriods };

    // If periods are selected with pending input in the active tab, flush them
    if (selectedPeriodIds.length > 0) {
      if (activeTab === 'OFFICIAL' && selectedSubject) {
        selectedPeriodIds.forEach((pid) => {
          finalPeriods[pid] = {
            type: 'SUBJECT',
            subjectId: selectedSubject.id,
            subjectCode: selectedSubject.subjectCode,
            subjectName: selectedSubject.subjectName,
          };
        });
      } else if (activeTab === 'CUSTOM' && customText.trim()) {
        selectedPeriodIds.forEach((pid) => {
          finalPeriods[pid] = { type: 'CUSTOM', customText: customText.trim() };
        });
      } else if (activeTab === 'FREE') {
        selectedPeriodIds.forEach((pid) => {
          finalPeriods[pid] = { type: 'FREE' };
        });
      }
      setLocalPeriods(finalPeriods);
      setSelectedPeriodIds([]);
    }

    if (onSaveBatch) {
      onSaveBatch(finalPeriods);
    } else {
      activePeriods.forEach((p) => {
        const updated = finalPeriods[p.id];
        const prev = currentPeriods[p.id];
        if (JSON.stringify(updated) !== JSON.stringify(prev)) {
          if (updated?.type === 'SUBJECT' && onAssignSubject) {
            onAssignSubject([p.id], {
              id: updated.subjectId || '',
              subjectCode: updated.subjectCode || '',
              subjectName: updated.subjectName || '',
              departmentId: '',
              active: true,
              createdAt: '',
              updatedAt: '',
            });
          } else if (updated?.type === 'CUSTOM' && onAssignCustom) {
            onAssignCustom([p.id], updated.customText || '');
          } else if (updated?.type === 'FREE' && onAssignFree) {
            onAssignFree([p.id]);
          }
        }
      });
    }

    setHasUnsavedChanges(false);
    onClose(); // close modal after save
  };

  const modalFooter = (
    <div className="flex items-center justify-end w-full">
      <KalyaniButton
        variant="gold"
        size="md"
        onClick={handleSaveModal}
        className="w-full sm:w-auto px-8 text-xs sm:text-sm font-bold shadow-sm"
      >
        Save
      </KalyaniButton>
    </div>
  );

  return (
    <KalyaniModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      bodyRef={modalContainerRef}
      footer={modalFooter}
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl border bg-rose-500/10 border-rose-500/30 text-rose-500">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-marcellus text-xl sm:text-2xl text-slate-900 dark:text-slate-100 font-semibold tracking-wide">
              Group Period Allocation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans font-normal">
              {totalPeriods} active periods configured • Select periods and assign subjects
            </p>
          </div>
        </div>
      }
    >
      <div ref={modalTopRef} className="space-y-4 pt-1.5 sm:pt-2 animate-in fade-in duration-150">

        {/* ── In-Modal Success Banner ── */}
        {inModalSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-2.5 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold">{inModalSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setInModalSuccess(null)}
              className="p-1 rounded-lg text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Validation Error Banner ── */}
        {validationError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-center gap-2.5 shadow-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* ── Period Selection ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs px-1 text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm font-marcellus">
              Select Period(s):
            </span>
            <span className="font-bold text-rose-600 dark:text-rose-400">
              {selectedPeriodIds.length} of {totalPeriods} selected
            </span>
          </div>

          {/* Quick multi-select filter chips + circular reset */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => { setSelectedPeriodIds(sortedPeriods.map((p) => p.id)); setValidationError(null); }}
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
                onClick={() => { setSelectedPeriodIds(fnPeriodIds); setValidationError(null); }}
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
                onClick={() => { setSelectedPeriodIds(anPeriodIds); setValidationError(null); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  isAnSelected
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm font-bold'
                    : 'bg-white dark:bg-[#180E1C] border-rose-200 dark:border-rose-900/40 text-slate-700 dark:text-slate-300 hover:border-rose-400'
                }`}
              >
                Afternoon AN ({totalPeriods - fnCount})
              </button>
            )}

            {/* Circular Reset — icon only, no text */}
            {selectedPeriodIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedPeriodIds([])}
                className="w-7 h-7 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/80 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800/60 flex items-center justify-center transition-all apple-hover ml-auto shrink-0 shadow-xs active:scale-95"
                title="Reset selected periods"
              >
                <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Period Grid — reads reactive localPeriods */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-0.5">
            {sortedPeriods.map((period, idx) => {
              const isSelected = selectedPeriodIds.includes(period.id);
              const periodLabel = period.name || period.shortName || `Period ${period.sequence || idx + 1}`;
              const existingEntry = localPeriods?.[period.id];
              const hasExistingOD = existingEntry?.type === 'ON_DUTY';
              const hasExistingLeave = existingEntry?.type === 'LEAVE';
              const hasExistingSubject = existingEntry?.type === 'SUBJECT';
              const hasExistingCustom = existingEntry?.type === 'CUSTOM';
              const isFree = !existingEntry || existingEntry.type === 'FREE';

              return (
                <button
                  key={period.id}
                  type="button"
                  onClick={() => togglePeriod(period.id)}
                  className={`min-h-[54px] py-2 px-3 rounded-2xl border text-center transition-all duration-150 touch-manipulation active:scale-[0.97] flex flex-col justify-center gap-0.5 font-bold text-xs sm:text-sm ${
                    isSelected
                      ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-400/50'
                      : hasExistingOD
                      ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/50 text-slate-800 dark:text-slate-200 hover:border-amber-400 shadow-xs'
                      : hasExistingLeave
                      ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/50 text-slate-800 dark:text-slate-200 hover:border-rose-400 shadow-xs'
                      : hasExistingSubject
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/40 text-slate-800 dark:text-slate-200 hover:border-rose-400 shadow-xs'
                      : hasExistingCustom
                      ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800/40 text-slate-800 dark:text-slate-200 hover:border-purple-400 shadow-xs'
                      : isFree
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/25 border-emerald-400 dark:border-emerald-600/70 ring-1 ring-emerald-400/30 dark:ring-emerald-500/20 text-slate-800 dark:text-slate-200 hover:border-emerald-500 shadow-xs'
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
                    ) : hasExistingSubject ? (
                      <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 ml-1" />
                    ) : hasExistingCustom ? (
                      <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0 ml-1" />
                    ) : isFree ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ml-1" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0 ml-1" />
                    )}
                  </div>

                  <div className="w-full text-left truncate">
                    {hasExistingOD ? (
                      <span className={`text-[10px] font-semibold block truncate ${isSelected ? 'text-white/90' : 'text-amber-700 dark:text-amber-300'}`}>
                        OD: {existingEntry?.onDutyCategory || 'On Duty'}
                      </span>
                    ) : hasExistingLeave ? (
                      <span className={`text-[10px] font-semibold block truncate ${isSelected ? 'text-white/90' : 'text-rose-700 dark:text-rose-300'}`}>
                        Leave: {existingEntry?.leaveReason || 'On Leave'}
                      </span>
                    ) : hasExistingSubject ? (
                      <span className={`text-[10px] font-medium block truncate ${isSelected ? 'text-white/90' : 'text-rose-700 dark:text-rose-300'}`}>
                        {existingEntry?.subjectCode ? `${existingEntry.subjectCode} — ` : ''}{existingEntry?.subjectName || 'Subject'}
                      </span>
                    ) : hasExistingCustom ? (
                      <span className={`text-[10px] font-medium block truncate ${isSelected ? 'text-white/90' : 'text-purple-700 dark:text-purple-300'}`}>
                        {existingEntry?.customText}
                      </span>
                    ) : (
                      <span className={`text-[10px] font-bold block truncate tracking-wide ${isSelected ? 'text-white/90' : 'text-emerald-700 dark:text-emerald-400'}`}>
                        FREE
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Action Tabs ── */}
        <div ref={actionSectionRef} className="pt-2 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Subject Tab */}
            <button
              type="button"
              onClick={() => handleTabSwitch('OFFICIAL')}
              className={`h-12 min-h-[48px] px-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all apple-hover shadow-sm ${
                activeTab === 'OFFICIAL'
                  ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-400/50'
                  : 'bg-white dark:bg-[#201026] border-rose-200/80 dark:border-rose-900/40 text-slate-800 dark:text-slate-200 hover:border-rose-400'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>Subject</span>
            </button>

            {/* Custom Duty Tab */}
            <button
              type="button"
              onClick={() => handleTabSwitch('CUSTOM')}
              className={`h-12 min-h-[48px] px-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all apple-hover shadow-sm ${
                activeTab === 'CUSTOM'
                  ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-400/50'
                  : 'bg-white dark:bg-[#201026] border-rose-200/80 dark:border-rose-900/40 text-slate-800 dark:text-slate-200 hover:border-rose-400'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Custom Duty</span>
            </button>

            {/* Set Free Tab */}
            <button
              type="button"
              onClick={handleSetFreeClick}
              className={`h-12 min-h-[48px] px-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all apple-hover shadow-sm ${
                activeTab === 'FREE'
                  ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400/50'
                  : 'bg-white dark:bg-[#201026] border-emerald-200/80 dark:border-emerald-900/40 text-slate-800 dark:text-slate-200 hover:border-emerald-400'
              }`}
            >
              <Coffee className="w-4 h-4 shrink-0" />
              <span>Set Free</span>
            </button>
          </div>

          {/* ── Mode A: Subject ── */}
          {activeTab === 'OFFICIAL' && (
            <div className="space-y-2.5 animate-in fade-in">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 z-10 pointer-events-none text-rose-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={handleSearchFocus}
                  onClick={handleSearchFocus}
                  placeholder="Search subject code or name (e.g. CS3401, Database)..."
                  className="w-full bg-white dark:bg-[#180E1C] border border-rose-200 dark:border-rose-900/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm rounded-xl pl-10 pr-10 py-3 outline-none transition-all shadow-sm"
                />
                {search.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Scrollable subject list */}
              <div className="max-h-52 sm:max-h-60 overflow-y-auto space-y-1.5 p-1 rounded-xl">
                {filteredSubjects.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400">
                    No matching subjects found for "{search}".
                  </div>
                ) : (
                  filteredSubjects.map((sub) => {
                    // Only highlight if selectedSubject is set AND matches — this is now only set
                    // when user has not yet clicked with periods selected
                    const isSubSelected = selectedSubject?.id === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSubjectClick(sub)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isSubSelected
                            ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-900 dark:text-rose-100 ring-1 ring-rose-400 shadow-sm'
                            : 'bg-white dark:bg-[#201026] hover:bg-rose-50/50 dark:hover:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/40 text-slate-800 dark:text-slate-200 hover:border-rose-400'
                        }`}
                      >
                        <div>
                          {sub.subjectCode && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 mr-2">
                              {sub.subjectCode}
                            </span>
                          )}
                          <span className="text-xs sm:text-sm font-medium">{sub.subjectName}</span>
                        </div>
                        {isSubSelected && (
                          <CheckCircle2 className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Unlisted subject callout — only shows when search has text and no exact match */}
              {cleanSearch.length > 0 && !hasExactMatch && (
                <div className="pt-2 border-t border-rose-100 dark:border-white/5">
                  <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-[#201026] border border-rose-200 dark:border-rose-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-in fade-in duration-150">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Not in official list
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-rose-800 dark:text-rose-200">
                          "{cleanSearch}"
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        Can't find your subject? Add this as a custom unlisted subject.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddAndAssignUnlisted(search.trim())}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:brightness-110 transition-all shrink-0"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Add to List &amp; Assign</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Mode B: Custom Duty ── */}
          {activeTab === 'CUSTOM' && (
            <div className="space-y-3 animate-in fade-in">
              <KalyaniInput
                ref={customInputRef}
                label="Custom Activity / Duty Name"
                value={customText}
                onChange={(e) => {
                  setCustomText(e.target.value);
                  setValidationError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyCustom();
                  }
                }}
                placeholder="Type custom duty or select from below..."
                autoScrollOnFocus={true}
              />

              {/* Custom Entry callout — only when text is non-empty AND not predefined */}
              {customText.trim().length > 0 && !isCustomTextPredefined && (
                <div className="pt-1">
                  <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-[#201026] border border-rose-200 dark:border-rose-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-in fade-in duration-150">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Custom Entry
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-rose-800 dark:text-rose-200 truncate">
                          "{customText.trim()}"
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        Assign this custom academic duty to selected periods.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCustom}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:brightness-110 transition-all shrink-0"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Apply Custom Entry</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Quick suggestions — only shown when NO custom text typed OR text is predefined */}
              <div>
                <p className="text-xs uppercase font-bold text-rose-800 dark:text-rose-300 mb-2 tracking-wider font-marcellus flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  Quick Academic Duty Suggestions:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-0.5">
                  {QUICK_ACADEMIC_DUTIES.map((sug) => {
                    // A quick suggestion is only "selected/highlighted" if the customText equals it exactly
                    // AND it was explicitly set (not just typed) — but since we clear on allocation,
                    // after allocation customText='', so isSelected will always be false post-click.
                    const isSelected = customText === sug;
                    return (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleQuickSuggestionClick(sug)}
                        className={`min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border text-left transition-all apple-hover flex items-center justify-between gap-2 shadow-xs ${
                          isSelected
                            ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-900 dark:text-rose-100 ring-1 ring-rose-400 font-bold'
                            : 'bg-white dark:bg-[#201026] hover:bg-rose-50/60 dark:hover:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/40 text-slate-800 dark:text-slate-200 hover:border-rose-400'
                        }`}
                      >
                        <span className="truncate">{sug}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Mode C: Set Free info panel ── */}
          {activeTab === 'FREE' && (
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 shrink-0">
                  <Coffee className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-teal-900 dark:text-teal-200 text-sm">Mark Selected Periods as Free</p>
                  <p className="text-[11px] text-teal-700 dark:text-teal-400/90 mt-0.5">
                    Resets the chosen periods to Free (available for substitution or other duties).
                  </p>
                </div>
              </div>
              {selectedPeriodIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleSetFreeClick}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Set Free Now</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </KalyaniModal>
  );
};
