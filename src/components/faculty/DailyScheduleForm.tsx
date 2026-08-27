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
  AlertTriangle
} from 'lucide-react';

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
  const [showFullDayFreeConfirm, setShowFullDayFreeConfirm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hodChangedNotification, setHodChangedNotification] = useState<string | null>(null);

  // Tracks if user has explicitly interacted with form fields
  const userTouchedRef = useRef<boolean>(false);
  const prevPeriodCountRef = useRef<number>(activePeriods.length);

  const isPast = isPastDate(date);
  const isToday = isTodayDate(date);
  const isFuture = isFutureDate(date);
  const submissionBlocked = isPast;

  // Detect when HOD updates the period count in real-time
  useEffect(() => {
    if (prevPeriodCountRef.current !== activePeriods.length) {
      prevPeriodCountRef.current = activePeriods.length;
      if (!isPast) {
        setHodChangedNotification(
          `The Head of Department (HOD) updated the period allocation structure (${activePeriods.length} active periods). Please review the updated period slots and submit your schedule.`
        );
        userTouchedRef.current = false;
      }
    }
  }, [activePeriods.length, isPast]);

  // Check if existing schedule has outdated period count compared to latest HOD setup
  const isPeriodCountMismatched = useMemo(() => {
    if (!existingSchedule?.periods || isPast) return false;
    const existingKeys = Object.keys(existingSchedule.periods);
    return existingKeys.length > 0 && existingKeys.length !== activePeriods.length;
  }, [existingSchedule, activePeriods.length, isPast]);

  // Reset form + messages when switching date or user
  useEffect(() => {
    userTouchedRef.current = false;
    setSubmitError(null);
    setSubmitSuccessMsg(null);
    setHodChangedNotification(null);
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

  const assignedCount = countAssignedPeriods(periodsState);
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

    // Validate
    const validation = validateSchedulePeriods(periodsState);
    if (!validation.isValid) {
      setSubmitError(validation.error || 'Validation error');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const result = submitSchedule(facultyId, date, periodsState);
    setIsSubmitting(false);

    if (result.success) {
      userTouchedRef.current = false;
      const isAllFree = assignedCount === 0;
      setSubmitSuccessMsg(
        isAllFree
          ? 'Full day marked as Free! All periods are set to available for substitution.'
          : 'Your schedule has been successfully synchronized and saved!'
      );
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.85 },
          colors: isAllFree ? ['#2DD4BF', '#D4AF37', '#10B981'] : ['#D4AF37', '#FFF5D1', '#9B1A39', '#10B981'],
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
      setSubmitSuccessMsg('Full day marked as Free! Available for substitution.');
      try {
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.85 },
          colors: ['#2DD4BF', '#D4AF37', '#10B981'],
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
          <div className="flex items-center gap-2 text-xs font-semibold text-kalyani-gold-300">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDateDisplay(date)}</span>
            {isToday && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                TODAY
              </span>
            )}
            {isPast && (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> PAST / READ-ONLY
              </span>
            )}
            {isFuture && (
              <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold">
                ADVANCE ENTRY
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <KalyaniBadge status={currentStatus} size="md" />

            {/* Glowing Unsaved Changes Badge */}
            {hasUnsavedChanges && (
              <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                <AlertTriangle className="w-3 h-3" /> UNSAVED CHANGES
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-white/5">
          {isFuture ? (
            existingSchedule?.submittedAt ? (
              <span className="text-teal-300 font-medium">
                ✓ Scheduled in Advance • Last synchronized at {formatTimeDisplay(existingSchedule.submittedAt)} (You can update anytime)
              </span>
            ) : (
              <span className="text-kalyani-gold-300">
                Not updated yet — You can update and save in advance today itself for {formatDateDisplay(date)}!
              </span>
            )
          ) : isToday ? (
            existingSchedule?.submittedAt ? (
              <span className="text-emerald-300 font-medium">
                ✓ Today's Schedule Active • Synchronized at {formatTimeDisplay(existingSchedule.submittedAt)}
              </span>
            ) : (
              <span className="text-rose-300 font-medium">
                ⚠️ Schedule pending for today. Select your subjects or click "Full Day Free".
              </span>
            )
          ) : (
            <span className="text-slate-400">
              Historical record for {formatDateDisplay(date)} • Status: {currentStatus}
            </span>
          )}
        </p>
      </KalyaniCard>

      {/* Success Notification Banner */}
      {submitSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{submitSuccessMsg}</span>
        </div>
      )}

      {/* Error Notification Banner */}
      {submitError && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in shadow-lg">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* HOD Period Count Modification Alert */}
      {(isPeriodCountMismatched || hodChangedNotification) && (
        <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in shadow-lg">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-300">Department Period Allocation Revised by HOD</p>
            <p className="mt-0.5 text-slate-200 leading-relaxed">
              The Head of Department (HOD) updated the period count to <span className="font-bold text-kalyani-gold-300">{activePeriods.length} periods</span>. Please review the latest period slots below and submit your schedule.
            </p>
          </div>
        </div>
      )}

      {/* Past Date Locked Alert */}
      {isPast && (
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700 text-slate-300 text-xs flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          <span>This past schedule is archived in read-only mode and cannot be modified.</span>
        </div>
      )}

      {/* Dynamic Period Rows */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-kalyani-gold-300">
            Period Wise Allocation ({activePeriods.length} Active Periods)
          </h4>
          <span className="text-[11px] text-slate-400">
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

      {/* Submit / Action Footer */}
      {!submissionBlocked && (
        <div className={`p-5 rounded-3xl kalyani-glass border transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-4 ${
          hasUnsavedChanges
            ? 'border-amber-500/50 bg-kalyani-crimson-950/90 shadow-[0_0_25px_rgba(245,158,11,0.15)]'
            : 'border-kalyani-gold-500/20'
        }`}>
          <div className="text-xs text-slate-400">
            {hasUnsavedChanges ? (
              <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Pending unsaved changes — click Update &amp; Save Schedule.
              </span>
            ) : assignedCount === 0 ? (
              <span className="text-teal-300 font-medium">All periods currently marked as Free.</span>
            ) : (
              <span>
                {assignedCount} period(s) assigned • {activePeriods.length - assignedCount} free period(s)
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <KalyaniButton
              variant="teal"
              size="md"
              leftIcon={<Coffee className="w-4 h-4" />}
              onClick={() => setShowFullDayFreeConfirm(true)}
              className="h-12 min-h-[48px] flex items-center justify-center flex-1 sm:flex-initial text-xs sm:text-sm font-bold shadow-teal-sm"
            >
              Full Day Free
            </KalyaniButton>

            <KalyaniButton
              variant="gold"
              size="md"
              leftIcon={<Save className="w-4 h-4" />}
              onClick={handleSubmitSchedule}
              isLoading={isSubmitting}
              className={`h-12 min-h-[48px] flex items-center justify-center flex-1 sm:flex-initial text-xs sm:text-sm font-bold ${
                hasUnsavedChanges ? 'shadow-gold-md ring-2 ring-kalyani-gold-400/50' : ''
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
