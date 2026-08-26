import React, { useState, useEffect } from 'react';
import { KalyaniPageHeader } from '../../components/common/KalyaniPageHeader';
import { KalyaniCard } from '../../components/common/KalyaniCard';
import { KalyaniButton } from '../../components/common/KalyaniButton';
import { KalyaniInput } from '../../components/common/KalyaniInput';
import { useAuth } from '../../hooks/useAuth';
import { useAcademicConfiguration } from '../../hooks/useAcademicConfiguration';
import { Settings, Save, CheckCircle2, Sliders, Bell, Shield, Sparkles } from 'lucide-react';

export const HodConfigurationPage: React.FC = () => {
  const { currentUser } = useAuth();
  const departmentId = currentUser?.departmentId || 'dept_cse';

  const { config, updateConfig } = useAcademicConfiguration(departmentId);

  const [maxPeriods, setMaxPeriods] = useState<number>(config.maxAssignedPeriodsPerDay || 3);
  const [allowCustom, setAllowCustom] = useState<boolean>(config.allowCustomSubjects ?? true);
  const [allowFuture, setAllowFuture] = useState<boolean>(config.allowFutureEditing ?? true);
  const [reminderInterval, setReminderInterval] = useState<number>(config.reminderIntervalMinutes || 30);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setMaxPeriods(config.maxAssignedPeriodsPerDay || 3);
      setAllowCustom(config.allowCustomSubjects ?? true);
      setAllowFuture(config.allowFutureEditing ?? true);
      setReminderInterval(config.reminderIntervalMinutes || 30);
    }
  }, [config]);

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const handleSave = () => {
    updateConfig({
      maxAssignedPeriodsPerDay: Number(maxPeriods),
      allowCustomSubjects: allowCustom,
      allowFutureEditing: allowFuture,
      reminderIntervalMinutes: Number(reminderInterval),
    });
    setSuccessMsg('Academic configuration saved and live-synchronized across all faculty devices.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <KalyaniPageHeader
        title="Department Academic Rules & Configuration"
        subtitle="Dynamic academic load constraints, submission reminders, and faculty entry policies."
        breadcrumbs={[{ label: 'HOD' }, { label: 'Academic Rules' }]}
      />

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maximum Teaching Load Card */}
        <KalyaniCard
          variant="glass"
          title="Daily Period Allocation Limit"
          subtitle="Governs maximum assigned teaching periods a faculty can submit per day."
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-kalyani-crimson-950/70 border border-kalyani-gold-500/20">
              <label className="block text-xs font-bold text-kalyani-gold-300 uppercase tracking-wider mb-2">
                Maximum Assigned Periods Per Day (Current: {maxPeriods})
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={maxPeriods}
                  onChange={(e) => setMaxPeriods(Number(e.target.value))}
                  className="flex-1 accent-kalyani-gold-500 cursor-pointer"
                />
                <div className="w-12 h-10 rounded-xl bg-kalyani-crimson-900 border border-kalyani-gold-400/40 flex items-center justify-center font-bold text-lg text-kalyani-gold-200">
                  {maxPeriods}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Example: If set to 3, any faculty attempting to assign 4 or more periods will receive a real-time validation error asking them to mark additional periods as Free.
              </p>
            </div>

            {/* Custom Subjects Allowed Toggle */}
            <div className="p-4 rounded-2xl bg-kalyani-crimson-950/70 border border-kalyani-gold-500/20 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-100">
                  Allow "+ Other" Custom Activity Entries
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Allows faculty to enter manual activity descriptions (e.g. Project Review, Meetings) without creating official courses.
                </p>
              </div>
              <input
                type="checkbox"
                checked={allowCustom}
                onChange={(e) => setAllowCustom(e.target.checked)}
                className="w-5 h-5 accent-kalyani-gold-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </KalyaniCard>

        {/* Reminder & Notification Rules */}
        <KalyaniCard
          variant="glass"
          title="Submission Reminders & Future Dates"
          subtitle="Notification interval and timeline submission parameters."
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-kalyani-crimson-950/70 border border-kalyani-gold-500/20">
              <label className="block text-xs font-bold text-kalyani-gold-300 uppercase tracking-wider mb-2">
                Periodic Reminder Interval (Minutes)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={10}
                  max={120}
                  step={5}
                  value={reminderInterval}
                  onChange={(e) => setReminderInterval(Number(e.target.value))}
                  className="w-28 bg-kalyani-crimson-900 border border-kalyani-gold-500/30 text-slate-100 text-sm rounded-xl px-3 py-2 outline-none focus:border-kalyani-gold-400"
                />
                <span className="text-xs text-slate-300">Minutes between prompts</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Targeted alerts are dispatched every {reminderInterval} minutes to unsubmitted faculty until they submit schedule or choose Full Day Free.
              </p>
            </div>

            {/* Future date editing */}
            <div className="p-4 rounded-2xl bg-kalyani-crimson-950/70 border border-kalyani-gold-500/20 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-100">
                  Allow Advance / Future Schedule Entries
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Allows faculty to declare upcoming schedules in advance. Past dates always remain locked.
                </p>
              </div>
              <input
                type="checkbox"
                checked={allowFuture}
                onChange={(e) => setAllowFuture(e.target.checked)}
                className="w-5 h-5 accent-kalyani-gold-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </KalyaniCard>
      </div>

      {/* Save Action */}
      <div className="p-5 rounded-3xl kalyani-glass-elevated flex items-center justify-end">
        <KalyaniButton
          variant="gold"
          size="md"
          leftIcon={<Save className="w-4 h-4" />}
          onClick={handleSave}
        >
          Save Academic Configuration
        </KalyaniButton>
      </div>
    </div>
  );
};
