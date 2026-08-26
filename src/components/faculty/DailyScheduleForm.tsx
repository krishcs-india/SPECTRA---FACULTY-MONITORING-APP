import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import { Period } from '../../types/period';
import { PeriodEntry, ScheduleStatus } from '../../types/schedule';
import { Subject } from '../../types/subject';
import { PeriodSelectorRow } from './PeriodSelectorRow';
import { SubjectPickerModal } from './SubjectPickerModal';
import { KalyaniButton } from '../common/KalyaniButton';
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
  const departmentId = currentUser?.departmentId || 'dept_cse';

  const activePeriods = useAppStore((state) => state.getActivePeriods(departmentId));
  const subjects = useAppStore((state) => state.getDepartmentSubjects(departmentId));
  const deptConfig = useAppStore((state) => state.getDepartmentConfig(departmentId));
  const getSchedule = useAppStore((state) => state.getSchedule);
  const submitSchedule = useAppStore((state) => state.submitSchedule);
  const submitFullDayFree = useAppStore((state) => state.submitFullDayFree);

  const existingSchedule = getSchedule(facultyId, date);

  // Local editable periods state
  const [periodsState, setPeriodsState] = useState<Record<string, PeriodEntry>>({});
  const [selectedPeriodForPicker, setSelectedPeriodForPicker] = useState<Period | null>(null);
  const [showFullDayFreeConfirm, setShowFullDayFreeConfirm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPast = isPastDate(date);
  const isToday = isTodayDate(date);
  const isFuture = isFutureDate(date);
  const maxAllowedPeriods = deptConfig.maxAssignedPeriodsPerDay || 3;
  const futureEditingAllowed = deptConfig.allowFutureEditing !== false;
  const submissionBlocked = isPast || (isFuture && !futureEditingAllowed);

  // Signature of the persisted schedule content (stable across store snapshot rebuilds)
  const existingScheduleSignature = useMemo(
    () =>
      existingSchedule
        ? JSON.stringify({ p: existingSchedule.periods || {}, s: existingSchedule.status })
        : '',
    [existingSchedule]
  );
  const syncedSignatureRef = useRef<string | null>(null);

  // Reset form + messages only when switching date or user
  useEffect(() => {
    syncedSignatureRef.current = null;
    setSubmitError(null);
    setSubmitSuccessMsg(null);
  }, [date, facultyId]);

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

  // Track if user has modified anything that needs saving
  const hasUnsavedChanges = useMemo(() => {
    if (isPast) return false;
    if (!existingSchedule) {
      // If never submitted, any non-free period counts as unsaved work
      return Object.values(periodsState).some((p) => p && p.type !== 'FREE');
    }
    // If schedule was previously submitted, compare with previous state
    const prevPeriods = existingSchedule.periods || {};
    return activePeriods.some((p) => {
      const curr = periodsState[p.id];
      const prev = prevPeriods[p.id];
      if (!curr && !prev) return false;
      if (!curr || !prev) return true;
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

  // Synchronize local form state with the persisted schedule,
  // but never overwrite edits the user has not saved yet
  useEffect(() => {
    if (hasUnsavedChanges) return;
    if (existingSchedule) {
      if (syncedSignatureRef.current !== existingScheduleSignature) {
        syncedSignatureRef.current = existingScheduleSignature;
        setPeriodsState(existingSchedule.periods || {});
      }
    } else if (syncedSignatureRef.current !== 'EMPTY') {
      syncedSignatureRef.current = 'EMPTY';
      // Default to empty / all free
      const initial: Record<string, PeriodEntry> = {};
      activePeriods.forEach((p) => {
        initial[p.id] = { type: 'FREE' };
      });
      setPeriodsState(initial);
    }
  }, [existingSchedule, existingScheduleSignature, hasUnsavedChanges, date]);

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
    const validation = validateSchedulePeriods(periodsState, maxAllowedPeriods);
    if (!validation.isValid) {
      setSubmitError(validation.error || 'Validation error');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const result = submitSchedule(facultyId, date, periodsState);
    setIsSubmitting(false);

    if (result.success) {
      setSubmitSuccessMsg('Your schedule has been successfully synchronized and saved!');
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.85 },
          colors: ['#D4AF37', '#FFF5D1', '#9B1A39', '#10B981'],
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
      {/* Top Banner Status Bar */}
      <div className="p-4 sm:p-5 rounded-3xl kalyani-glass-elevated flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-slate-100">
              {formatDateDisplay(date)}
            </h3>
            <KalyaniBadge status={currentStatus} size="md" />

            {/* Glowing Unsaved Changes Badge */}
            {hasUnsavedChanges && (
              <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                <AlertTriangle className="w-3 h-3" /> UNSAVED CHANGES
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-1">
            {isFuture ? (
              !futureEditingAllowed ? (
                <span className="text-amber-300">
                  Future schedule entries are currently disabled by your HOD for this department.
                </span>
              ) : existingSchedule?.submittedAt ? (
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
                <span className="text-rose-300 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping inline-block shrink-0" />
                  You have not updated today's periods yet. Please set your periods and click "Update &amp; Save Schedule" or "Full Day Free".
                </span>
              )
            ) : (
              <span className="text-slate-400">Archived Historical Schedule • Read Only</span>
            )}
          </p>
        </div>

        {/* Assigned Period Counter & Equal-Height Actions */}
        <div className="flex items-stretch gap-3 self-stretch sm:self-auto">
          <div className="px-4 py-2 rounded-2xl border bg-kalyani-crimson-900/70 border-kalyani-gold-500/30 text-kalyani-gold-200 text-center shadow-gold-sm flex flex-col justify-center min-h-[54px] min-w-[120px] shrink-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 leading-none mb-1">
              Assigned Load
            </p>
            <p className="text-base font-bold text-kalyani-gold-300 leading-none">
              {assignedCount} <span className="text-xs font-normal text-slate-300">{assignedCount === 1 ? 'Period' : 'Periods'}</span>
            </p>
          </div>

          {!submissionBlocked && (
            <button
              type="button"
              onClick={() => setShowFullDayFreeConfirm(true)}
              title="1-Tap Mark entire day as free"
              className="px-5 py-2 rounded-2xl font-semibold text-xs transition-all duration-200 border bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-600 hover:to-teal-700 text-white border-teal-500/40 shadow-[0_4px_14px_rgba(20,184,166,0.3)] hover:shadow-[0_6px_20px_rgba(20,184,166,0.45)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 min-h-[54px] shrink-0"
            >
              <Coffee className="w-4 h-4 text-teal-200" />
              <span>Full Day Free</span>
            </button>
          )}
        </div>
      </div>

      {/* PROMINENT UNSAVED CHANGES BANNER BEFORE PERIODS LIST */}
      {hasUnsavedChanges && (
        <div className="p-4 sm:p-4.5 rounded-3xl bg-gradient-to-r from-amber-950/80 via-kalyani-crimson-950/90 to-amber-950/80 border-2 border-amber-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_25px_rgba(245,158,11,0.2)] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-200 flex items-center gap-2 uppercase tracking-wide">
                <span>Unsaved Changes Detected</span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              </h4>
              <p className="text-xs text-slate-200 mt-0.5">
                You have updated period assignments that are not yet saved. Click <strong className="text-kalyani-gold-200">Update &amp; Save Schedule</strong> below to sync with your HOD.
              </p>
            </div>
          </div>

          <KalyaniButton
            variant="gold"
            size="sm"
            leftIcon={<Save className="w-4 h-4" />}
            onClick={handleSubmitSchedule}
            isLoading={isSubmitting}
            className="shrink-0 w-full sm:w-auto shadow-gold-md"
          >
            Update &amp; Save Schedule
          </KalyaniButton>
        </div>
      )}

      {/* Success Notification */}
      {submitSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{submitSuccessMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {submitError && (
        <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Past Date Locked Alert */}
      {isPast && (
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700 text-slate-300 text-xs flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          <span>This past schedule is archived in read-only mode and cannot be modified.</span>
        </div>
      )}

      {/* Future Entries Disabled Alert */}
      {isFuture && !futureEditingAllowed && (
        <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Advance (future-date) schedule entries are disabled by your HOD. You can submit on the day itself.</span>
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

        {activePeriods.map((period) => (
          <PeriodSelectorRow
            key={period.id}
            period={period}
            entry={periodsState[period.id]}
            isReadOnly={isPast}
            onOpenPicker={() => setSelectedPeriodForPicker(period)}
            onQuickToggleFree={() => handleSelectFree(period.id)}
          />
        ))}
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

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <KalyaniButton
              variant="teal"
              size="md"
              leftIcon={<Coffee className="w-4 h-4" />}
              onClick={() => setShowFullDayFreeConfirm(true)}
              className="flex-1 sm:flex-initial"
            >
              Full Day Free
            </KalyaniButton>

            <KalyaniButton
              variant="gold"
              size="md"
              leftIcon={<Save className="w-4 h-4" />}
              onClick={handleSubmitSchedule}
              isLoading={isSubmitting}
              className={`flex-1 sm:flex-initial ${
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
          allowCustomSubjects={deptConfig.allowCustomSubjects}
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
