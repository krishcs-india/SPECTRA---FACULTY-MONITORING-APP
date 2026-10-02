import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import { Period } from '../../types/period';
import { PeriodEntry, ScheduleStatus } from '../../types/schedule';
import { Subject } from '../../types/subject';
import { PeriodSelectorRow } from './PeriodSelectorRow';
import { SubjectPickerModal } from './SubjectPickerModal';
import { KalyaniButton } from '../common/KalyaniButton';
import { KalyaniCard } from '../common/KalyaniCard';
import { KalyaniBadge } from '../common/KalyaniBadge';
import { KalyaniConfirmDialog } from '../common/KalyaniConfirmDialog';
import { isPastDate, isTodayDate, isFutureDate, formatDateDisplay, formatTimeDisplay } from '../../utils/dateUtils';
import { validateSchedulePeriods, countAssignedPeriods } from '../../utils/validation';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Coffee,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
  Calendar,
  AlertTriangle,
  X,
  CalendarX,
  Briefcase
} from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { LeaveOnDutyModal } from './LeaveOnDutyModal';

interface DailyScheduleFormProps {
  date: string;
}

export const DailyScheduleForm: React.FC<DailyScheduleFormProps> = ({ date }) => {
  const { currentUser } = useAuth();
  const facultyId = currentUser?.uid || '';
  const departmentId = currentUser?.departmentId || 'CSE';

  const periodsInStore = useAppStore((state) => state.periods);
  const subjectsInStore = useAppStore((state) => state.subjects);
  const activePeriods = useMemo(
    () => useAppStore.getState().getActivePeriods(departmentId),
    [periodsInStore, departmentId]
  );
  const subjects = useMemo(
    () => useAppStore.getState().getDepartmentSubjects(departmentId),
    [subjectsInStore, departmentId]
  );
  const submitSchedule = useAppStore((state) => state.submitSchedule);
  const submitFullDayFree = useAppStore((state) => state.submitFullDayFree);
  const submitLeave = useAppStore((state) => state.submitLeave);
  const submitOnDuty = useAppStore((state) => state.submitOnDuty);

  // Directly subscribe to reactive schedule in store (supporting both UID key and email matching)
  const existingSchedule = useAppStore((state) => {
    if (!currentUser || !date) return null;
    const directKey = `${currentUser.uid}_${date}`;
    if (state.schedules[directKey]) return state.schedules[directKey];
    const cleanEmail = (currentUser.email || '').toLowerCase().trim();
    if (cleanEmail) {
      const byEmail = Object.values(state.schedules).find(
        (s) => (s.facultyEmail || '').toLowerCase().trim() === cleanEmail && s.date === date
      );
      if (byEmail) return byEmail;
    }
    return null;
  });

  // Local editable periods state
  const [periodsState, setPeriodsState] = useState<Record<string, PeriodEntry>>({});
  const [selectedPeriodForPicker, setSelectedPeriodForPicker] = useState<Period | null>(null);
  const [leaveOnDutyMode, setLeaveOnDutyMode] = useState<'LEAVE' | 'ON_DUTY' | null>(null);
  const [showFullDayFreeConfirm, setShowFullDayFreeConfirm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hodChangedNotification, setHodChangedNotification] = useState<string | null>(null);
  const [isDismissedMismatched, setIsDismissedMismatched] = useState<boolean>(false);

  // Tracks if user has explicitly interacted with form fields
  const userTouchedRef = useRef<boolean>(false);
  const prevPeriodCountRef = useRef<number>(activePeriods.length);

  const isPast = isPastDate(date);
  const isToday = isTodayDate(date);
  const isFuture = isFutureDate(date);
  const submissionBlocked = isPast;

  // Detect when HOD updates the period count in real-time and show the in-app card
  useEffect(() => {
    if (prevPeriodCountRef.current !== activePeriods.length) {
      prevPeriodCountRef.current = activePeriods.length;
      if (!isPast) {
        setHodChangedNotification(
          `The Head of Department (HOD) updated the period allocation structure (${activePeriods.length} active periods). Please review the updated period slots and submit your schedule.`
        );
        setIsDismissedMismatched(false);
        userTouchedRef.current = false;
      }
    }
  }, [activePeriods.length, isPast]);

  // Check if existing schedule has outdated period count compared to latest HOD setup
  const isPeriodCountMismatched = useMemo(() => {
    if (!existingSchedule?.periods || isPast || isDismissedMismatched) return false;
    const existingKeys = Object.keys(existingSchedule.periods);
    return existingKeys.length > 0 && existingKeys.length !== activePeriods.length;
  }, [existingSchedule, activePeriods.length, isPast, isDismissedMismatched]);

  // Reset form + messages when switching date or user
  useEffect(() => {
    userTouchedRef.current = false;
    setSubmitError(null);
    setSubmitSuccessMsg(null);
    setHodChangedNotification(null);
    setIsDismissedMismatched(false);
  }, [date, facultyId]);

  // Synchronize local form state with the reactive persisted schedule from Firestore
  useEffect(() => {
    if (userTouchedRef.current) return;
    const initial: Record<string, PeriodEntry> = {};

    activePeriods.forEach((p, idx) => {
      const pSeq = p.sequence ?? (idx + 1);
      // 1. Direct ID match
      if (existingSchedule?.periods?.[p.id]) {
        initial[p.id] = existingSchedule.periods[p.id];
        return;
      }
      // 2. Numeric sequence / index match against existing keys
      if (existingSchedule?.periods) {
        const bySeq = Object.entries(existingSchedule.periods).find(([k]) => {
          const num = parseInt(k.replace(/\D/g, ''), 10);
          return num === pSeq;
        });
        if (bySeq && bySeq[1]) {
          initial[p.id] = bySeq[1];
          return;
        }
      }
      // 3. Default to Free
      initial[p.id] = { type: 'FREE' };
    });

    setPeriodsState(initial);
  }, [existingSchedule, date, facultyId, activePeriods]);

  // Auto-dismiss success notification after 5 seconds
  useEffect(() => {
    if (submitSuccessMsg) {
      const timer = setTimeout(() => {
        setSubmitSuccessMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccessMsg]);

  // Auto-dismiss error notification after 6 seconds
  useEffect(() => {
    if (submitError) {
      const timer = setTimeout(() => {
        setSubmitError(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [submitError]);

  // Track if user has modified anything compared to persisted state
  const hasUnsavedChanges = useMemo(() => {
    if (isPast || !userTouchedRef.current) return false;
    const prevPeriods = existingSchedule?.periods || {};
    return activePeriods.some((p) => {
      const curr = periodsState[p.id] || { type: 'FREE' };
      const prev = prevPeriods[p.id] || { type: 'FREE' };
      if (curr.type !== prev.type) return true;
      if (curr.type === 'SUBJECT') {
        return curr.subjectId !== prev.subjectId || curr.subjectName !== prev.subjectName;
      }
      if (curr.type === 'CUSTOM') {
        return curr.customText !== prev.customText;
      }
      if (curr.type === 'LEAVE') {
        return curr.leaveReason !== prev.leaveReason || curr.leaveType !== prev.leaveType;
      }
      if (curr.type === 'ON_DUTY') {
        return curr.onDutyCategory !== prev.onDutyCategory || curr.onDutyReason !== prev.onDutyReason;
      }
      return false;
    });
  }, [periodsState, existingSchedule, activePeriods, isPast]);

  // Warn on tab/browser close if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const assignedCount = Object.values(periodsState).filter((p) => p && (p.type === 'SUBJECT' || p.type === 'CUSTOM')).length;
  const onDutyCount = Object.values(periodsState).filter((p) => p && p.type === 'ON_DUTY').length;
  const leaveCount = Object.values(periodsState).filter((p) => p && p.type === 'LEAVE').length;
  const freeCount = activePeriods.length - assignedCount - onDutyCount - leaveCount;
  const currentStatus: ScheduleStatus = existingSchedule?.status || 'NOT_SUBMITTED';

  const handleSelectSubject = (periodId: string, subject: Subject) => {
    userTouchedRef.current = true;
    setPeriodsState((prev) => ({
      ...prev,
      [periodId]: {
        type: 'SUBJECT',
        subjectId: subject.id,
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
      },
    }));
    setSubmitError(null);
    setSubmitSuccessMsg(null);
  };

  const handleSelectCustom = (periodId: string, customText: string) => {
    userTouchedRef.current = true;
    setPeriodsState((prev) => ({
      ...prev,
      [periodId]: {
        type: 'CUSTOM',
        customText,
      },
    }));
    setSubmitError(null);
    setSubmitSuccessMsg(null);
  };

  const handleSelectFree = (periodId: string) => {
    userTouchedRef.current = true;
    setPeriodsState((prev) => ({
      ...prev,
      [periodId]: {
        type: 'FREE',
      },
    }));
    setSubmitError(null);
    setSubmitSuccessMsg(null);
  };

  const handleSubmitSchedule = () => {
    if (submissionBlocked) return;

    // Prune periodsState strictly to activePeriods so no stale/deleted period keys linger
    const sanitizedPeriods: Record<string, PeriodEntry> = {};
    activePeriods.forEach((p) => {
      sanitizedPeriods[p.id] = periodsState[p.id] || { type: 'FREE' };
    });

    // Validate
    const validation = validateSchedulePeriods(sanitizedPeriods);
    if (!validation.isValid) {
      setSubmitError(validation.error || 'Validation error');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const result = submitSchedule(facultyId, date, sanitizedPeriods);
    setIsSubmitting(false);

    if (result.success) {
      userTouchedRef.current = false;
      // DYNAMICALLY DISMISS THE HOD CARD:
      setHodChangedNotification(null);
      setIsDismissedMismatched(true);
      prevPeriodCountRef.current = activePeriods.length;
      setPeriodsState(sanitizedPeriods);

      const isAllFree = assignedCount === 0 && onDutyCount === 0 && leaveCount === 0;
      setSubmitSuccessMsg(
        isAllFree
          ? 'Full day marked as Free! All periods are set to available for substitution.'
          : leaveCount > 0 && assignedCount === 0 && onDutyCount === 0
          ? `Leave schedule recorded successfully (${leaveCount} period(s)).`
          : onDutyCount > 0 && assignedCount === 0 && leaveCount === 0
          ? `On Duty schedule recorded successfully (${onDutyCount} period(s)).`
          : 'Your schedule has been successfully synchronized and saved!'
      );
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.85 },
          colors: isAllFree ? ['#10B981', '#F43F5E', '#FDA4AF'] : ['#F43F5E', '#EC4899', '#FB7185', '#10B981'],
        });
      } catch {}
    } else {
      setSubmitError(result.error || 'Failed to submit schedule.');
    }
  };

  const handleConfirmFullDayFree = () => {
    if (submissionBlocked) return;

    setIsSubmitting(true);
    setShowFullDayFreeConfirm(false);
    const result = submitFullDayFree(facultyId, date);
    setIsSubmitting(false);

    if (result.success) {
      userTouchedRef.current = false;
      // DYNAMICALLY DISMISS THE HOD CARD:
      setHodChangedNotification(null);
      setIsDismissedMismatched(true);
      prevPeriodCountRef.current = activePeriods.length;

      // Update local periodsState to all free matching current activePeriods
      const freePeriods: Record<string, PeriodEntry> = {};
      activePeriods.forEach((p) => {
        freePeriods[p.id] = { type: 'FREE' };
      });
      setPeriodsState(freePeriods);

      setSubmitSuccessMsg('Full day marked as Free! Available for substitution.');
      try {
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.85 },
          colors: ['#10B981', '#F43F5E', '#FB7185'],
        });
      } catch {}
    } else {
      setSubmitError(result.error || 'Failed to mark full day free.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Schedule Header Card */}
      <KalyaniCard
        variant="elevated"
        bodyClassName="p-4 sm:p-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDateDisplay(date)}</span>
            {isToday && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                TODAY
              </span>
            )}
            {isPast && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                <Lock className="w-2.5 h-2.5" /> PAST / READ-ONLY
              </span>
            )}
            {isFuture && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-400/30">
                ADVANCE ENTRY
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <KalyaniBadge status={currentStatus} size="md" />

            {/* Glowing Unsaved Changes Badge */}
            {hasUnsavedChanges && (
              <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1 shadow-sm">
                <AlertTriangle className="w-3 h-3" /> UNSAVED CHANGES
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 pt-3 border-t border-rose-200/50 dark:border-rose-900/30">
          {isFuture ? (
            existingSchedule?.submittedAt ? (
              <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                ✓ Scheduled in Advance • Last synchronized at {formatTimeDisplay(existingSchedule.submittedAt)} (You can update anytime)
              </span>
            ) : (
              <span className="text-rose-700 dark:text-rose-300">
                Not updated yet — You can update and save in advance today itself for {formatDateDisplay(date)}!
              </span>
            )
          ) : isToday ? (
            existingSchedule?.submittedAt ? (
              <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                ✓ Today's Schedule Active • Synchronized at {formatTimeDisplay(existingSchedule.submittedAt)}
              </span>
            ) : (
              <span className="text-rose-700 dark:text-rose-300 font-medium">
                ⚠️ Schedule pending for today. Select your subjects or click "Full Day Free".
              </span>
            )
          ) : (
            <span className="text-slate-600 dark:text-slate-400">
              Historical record for {formatDateDisplay(date)} • Status: {currentStatus}
            </span>
          )}
        </p>
      </KalyaniCard>

      {/* Success Notification Banner */}
      {submitSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">{submitSuccessMsg}</span>
        </div>
      )}

      {/* Error Notification Banner */}
      {submitError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* HOD Period Count Modification Alert */}
      {!(isPast || isDismissedMismatched) && (isPeriodCountMismatched || hodChangedNotification) && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-500/50 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start justify-between gap-3 animate-in fade-in shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 dark:text-amber-300">Department Period Allocation Revised by HOD</p>
              <p className="mt-0.5 text-slate-700 dark:text-slate-200 leading-relaxed">
                The Head of Department (HOD) updated the period allocation structure to <span className="font-bold text-rose-700 dark:text-rose-300">{activePeriods.length} periods</span>. Please review the updated period slots below and submit your schedule.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setHodChangedNotification(null);
              setIsDismissedMismatched(true);
            }}
            className="p-1 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-200/50 dark:text-amber-300 dark:hover:text-amber-100 transition-colors shrink-0"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Past Date Locked Alert */}
      {isPast && (
        <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
          <span>This past schedule is archived in read-only mode and cannot be modified.</span>
        </div>
      )}

      {/* Quick Status Shortcuts (Leave | On Duty | Full Day Free) - Placed BEFORE Period Wise Allocation */}
      {!submissionBlocked && (
        <div className="p-3.5 sm:p-4 rounded-3xl bg-white/80 dark:bg-[#180E1C]/80 border border-rose-200/80 dark:border-rose-900/40 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 font-serif flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              Quick Status Shortcuts
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              One-tap status for full schedule
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setLeaveOnDutyMode('LEAVE')}
              className="w-full h-11 min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-sky-400 via-sky-400 to-blue-400 hover:from-sky-300 hover:to-blue-300 text-slate-950 flex items-center justify-center gap-2 shadow-sm transition-all apple-hover border border-sky-300/80"
            >
              <CalendarX className="w-4 h-4 shrink-0 text-slate-950" />
              <span>Leave</span>
            </button>

            <button
              type="button"
              onClick={() => setLeaveOnDutyMode('ON_DUTY')}
              className="w-full h-11 min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-105 text-slate-950 flex items-center justify-center gap-2 shadow-sm transition-all apple-hover border border-amber-600/30"
            >
              <Briefcase className="w-4 h-4 shrink-0 text-slate-950" />
              <span>On Duty</span>
            </button>

            <button
              type="button"
              onClick={() => setShowFullDayFreeConfirm(true)}
              className="w-full h-11 min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:brightness-105 text-white flex items-center justify-center gap-2 shadow-sm transition-all apple-hover border border-emerald-400/40"
            >
              <Coffee className="w-4 h-4 shrink-0 text-white" />
              <span className="truncate">Full Day Free</span>
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Period Rows */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 font-serif leading-tight">
            <span>Period Wise Allocation</span>
            <span className="block text-[11px] font-normal text-rose-600/90 dark:text-rose-400/90 whitespace-nowrap mt-0.5">
              ({activePeriods.length} Active Periods)
            </span>
          </h4>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Click any period to select subject or custom activity
          </span>
        </div>

        {activePeriods.map((period) => {
          const entry = periodsState[period.id] ||
            (typeof period.sequence === 'number'
              ? Object.entries(periodsState).find(([k]) => {
                  const num = parseInt(k.replace(/\D/g, ''), 10);
                  return num === period.sequence;
                })?.[1]
              : undefined);

          return (
            <PeriodSelectorRow
              key={period.id}
              period={period}
              entry={entry}
              isReadOnly={isPast}
              onOpenPicker={() => setSelectedPeriodForPicker(period)}
              onQuickToggleFree={() => handleSelectFree(period.id)}
            />
          );
        })}
      </div>

      {/* Submit / Action Footer - Only Save and Submit at the bottom */}
      {!submissionBlocked && (
        <div className={`p-4 sm:p-5 rounded-3xl border transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-4 ${
          hasUnsavedChanges
            ? 'border-amber-400 dark:border-amber-500/50 bg-amber-50/90 dark:bg-amber-950/40 shadow-md'
            : 'bg-white/90 dark:bg-[#180E1C]/90 border-rose-200/80 dark:border-rose-900/30 shadow-sm'
        }`}>
          <div className="text-xs text-slate-600 dark:text-slate-300 w-full sm:w-auto">
            {hasUnsavedChanges ? (
              <span className="text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Pending unsaved changes — click Save &amp; Submit Schedule.
              </span>
            ) : leaveCount > 0 ? (
              <span className="text-sky-700 dark:text-sky-300 font-semibold flex items-center gap-1.5">
                <CalendarX className="w-3.5 h-3.5 text-sky-500" /> {leaveCount} period(s) marked on Leave.
              </span>
            ) : onDutyCount > 0 ? (
              <span className="text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-amber-500" /> {onDutyCount} period(s) marked on On Duty (OD).
              </span>
            ) : assignedCount > 0 ? (
              <span>
                {assignedCount} teaching period(s) • {freeCount} free period(s)
              </span>
            ) : null}
          </div>

          <div className="w-full sm:w-auto flex justify-end">
            <KalyaniButton
              variant="gold"
              size="md"
              leftIcon={<Save className="w-4 h-4 shrink-0" />}
              onClick={handleSubmitSchedule}
              isLoading={isSubmitting}
              className={`w-full sm:w-auto h-11 min-h-[44px] px-6 flex items-center justify-center text-xs sm:text-sm font-bold ${
                hasUnsavedChanges ? 'ring-2 ring-rose-400/50 shadow-md' : 'shadow-sm'
              }`}
            >
              {hasUnsavedChanges || existingSchedule ? 'Update & Save Schedule' : 'Save & Submit Schedule'}
            </KalyaniButton>
          </div>
        </div>
      )}

      {/* Subject Picker Modal */}
      {selectedPeriodForPicker && (
        <SubjectPickerModal
          isOpen={Boolean(selectedPeriodForPicker)}
          onClose={() => setSelectedPeriodForPicker(null)}
          periodName={selectedPeriodForPicker.name}
          subjects={subjects}
          currentEntry={periodsState[selectedPeriodForPicker.id]}
          allowCustomSubjects={true}
          onSelectSubject={(sub) => handleSelectSubject(selectedPeriodForPicker.id, sub)}
          onSelectCustom={(txt) => handleSelectCustom(selectedPeriodForPicker.id, txt)}
          onSelectFree={() => handleSelectFree(selectedPeriodForPicker.id)}
        />
      )}

      {/* Leave and On Duty Unified Pop-up */}
      {leaveOnDutyMode && (
        <LeaveOnDutyModal
          isOpen={Boolean(leaveOnDutyMode)}
          onClose={() => setLeaveOnDutyMode(null)}
          mode={leaveOnDutyMode}
          activePeriods={activePeriods}
          date={date}
          currentPeriods={periodsState}
          onSaveLeave={(scope, reason, halfDaySlot, selectedIds) => {
            const res = submitLeave(facultyId, date, scope, reason, halfDaySlot, selectedIds, periodsState);
            if (res.success) {
              setHodChangedNotification(null);
              setIsDismissedMismatched(true);
              userTouchedRef.current = false;
              const savedPeriods = useAppStore.getState().getSchedule(facultyId, date)?.periods;
              if (savedPeriods) setPeriodsState(savedPeriods);
              setSubmitSuccessMsg(
                `Leave declared successfully (${scope === 'FULL_DAY' ? 'Full Day Leave' : scope === 'HALF_DAY' ? 'Half Day Leave' : 'Period-Wise Leave'}).`
              );
              try {
                confetti({
                  particleCount: 50,
                  spread: 50,
                  origin: { y: 0.85 },
                  colors: ['#BE123C', '#FB7185', '#F43F5E']
                });
              } catch {}
            } else {
              setSubmitError(res.error || 'Failed to submit leave.');
            }
          }}
          onSaveOnDuty={(scope, category, reason, halfDaySlot, selectedIds) => {
            const res = submitOnDuty(facultyId, date, scope, category, reason, halfDaySlot, selectedIds, periodsState);
            if (res.success) {
              setHodChangedNotification(null);
              setIsDismissedMismatched(true);
              userTouchedRef.current = false;
              const savedPeriods = useAppStore.getState().getSchedule(facultyId, date)?.periods;
              if (savedPeriods) setPeriodsState(savedPeriods);
              setSubmitSuccessMsg(
                `On Duty recorded successfully: ${category} (${scope === 'FULL_DAY' ? 'Full Day' : scope === 'HALF_DAY' ? 'Half Day' : 'Period-Wise'}).`
              );
              try {
                confetti({
                  particleCount: 50,
                  spread: 50,
                  origin: { y: 0.85 },
                  colors: ['#F59E0B', '#D97706', '#FBBF24']
                });
              } catch {}
            } else {
              setSubmitError(res.error || 'Failed to submit On Duty.');
            }
          }}
        />
      )}

      {/* Full Day Free Confirmation Dialog */}
      <KalyaniConfirmDialog
        isOpen={showFullDayFreeConfirm}
        onClose={() => setShowFullDayFreeConfirm(false)}
        onConfirm={handleConfirmFullDayFree}
        variant="teal"
        title="Confirm Full Day Free Declaration"
        message="Are you sure you want to mark the entire day as Free? All active periods will be automatically marked as available for substitution and department duty."
        confirmText="Yes, Mark Full Day Free"
      />
    </div>
  );
};
