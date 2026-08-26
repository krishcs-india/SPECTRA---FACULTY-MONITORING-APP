import React, { useState, useEffect } from 'react';
import { KalyaniCard } from '../common/KalyaniCard';
import { KalyaniButton } from '../common/KalyaniButton';
import { KalyaniInput } from '../common/KalyaniInput';
import { KalyaniSelect } from '../common/KalyaniSelect';
import { KalyaniConfirmDialog } from '../common/KalyaniConfirmDialog';
import { useAppStore } from '../../store/useAppStore';
import { ShieldCheck, Save, CheckCircle2, Globe, Building, Trash2, AlertTriangle } from 'lucide-react';

export const GlobalSettingsPanel: React.FC = () => {
  const systemSettings = useAppStore((state) => state.systemSettings);
  const updateSystemSettings = useAppStore((state) => state.updateSystemSettings);
  const purgeDatabaseToCleanSlate = useAppStore((state) => state.purgeDatabaseToCleanSlate);

  const [collegeName, setCollegeName] = useState(systemSettings.collegeName);
  const [collegeDomain, setCollegeDomain] = useState(systemSettings.collegeDomain);
  const [enforceDomain, setEnforceDomain] = useState(systemSettings.enforceDomainCheck);
  const [academicYear, setAcademicYear] = useState(systemSettings.academicYear);
  const [currentSemester, setCurrentSemester] = useState<'ODD' | 'EVEN'>(systemSettings.currentSemester);
  const [defaultMaxPeriods, setDefaultMaxPeriods] = useState<number>(systemSettings.defaultMaxPeriods || 3);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (systemSettings) {
      setCollegeName(systemSettings.collegeName);
      setCollegeDomain(systemSettings.collegeDomain);
      setEnforceDomain(systemSettings.enforceDomainCheck);
      setAcademicYear(systemSettings.academicYear);
      setCurrentSemester(systemSettings.currentSemester);
      setDefaultMaxPeriods(systemSettings.defaultMaxPeriods || 3);
    }
  }, [systemSettings]);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const handleSave = () => {
    updateSystemSettings({
      collegeName,
      collegeDomain,
      enforceDomainCheck: enforceDomain,
      academicYear,
      currentSemester,
      defaultMaxPeriods: Number(defaultMaxPeriods),
    });
    setSuccessMsg('Global system settings updated successfully.');
  };

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <KalyaniCard
          variant="glass"
          title="Institution & Domain Authorization"
          subtitle="Google Sign-In authentication criteria and institution profile."
        >
          <div className="space-y-4">
            <KalyaniInput
              label="College / Institution Name"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              placeholder="e.g. Kalyani Institute of Technology"
            />

            <KalyaniInput
              label="College Authorized Domain"
              value={collegeDomain}
              onChange={(e) => setCollegeDomain(e.target.value)}
              placeholder="e.g. college.edu.in"
            />

            <div className="p-4 rounded-2xl bg-kalyani-crimson-950/70 border border-kalyani-gold-500/20 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-100">
                  Enforce College Domain Whitelist on Google Sign-In
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Restricts Google authentication strictly to @{collegeDomain || 'college.edu.in'} emails.
                </p>
              </div>
              <input
                type="checkbox"
                checked={enforceDomain}
                onChange={(e) => setEnforceDomain(e.target.checked)}
                className="w-5 h-5 accent-kalyani-gold-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </KalyaniCard>

        <KalyaniCard
          variant="glass"
          title="Academic Calendar & Timetable Defaults"
          subtitle="Academic year cycle and baseline period capacity."
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <KalyaniInput
                label="Academic Year"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g. 2026-2027"
              />

              <KalyaniSelect
                label="Current Semester Cycle"
                value={currentSemester}
                onChange={(val) => setCurrentSemester(val as 'ODD' | 'EVEN')}
                options={[
                  { value: 'ODD', label: 'Odd Semester (I, III, V, VII)' },
                  { value: 'EVEN', label: 'Even Semester (II, IV, VI, VIII)' },
                ]}
              />
            </div>

            <div className="p-4 rounded-2xl bg-kalyani-crimson-950/70 border border-kalyani-gold-500/20">
              <label className="block text-xs font-bold text-kalyani-gold-300 uppercase tracking-wider mb-2">
                System Default Max Assigned Periods (Current: {defaultMaxPeriods})
              </label>
              <input
                type="range"
                min={1}
                max={8}
                value={defaultMaxPeriods}
                onChange={(e) => setDefaultMaxPeriods(Number(e.target.value))}
                className="w-full accent-kalyani-gold-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                New departments will inherit this limit as their default maximum teaching periods per day.
              </p>
            </div>
          </div>
        </KalyaniCard>
      </div>

      {/* Save Settings Bar */}
      <div className="p-5 rounded-3xl kalyani-glass-elevated flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-slate-400">
          Changes take effect globally and sync in real-time across all mobile and web clients.
        </p>
        <KalyaniButton
          variant="gold"
          size="md"
          leftIcon={<Save className="w-4 h-4" />}
          onClick={handleSave}
        >
          Save Global Settings
        </KalyaniButton>
      </div>

      {/* Database Maintenance & Production Purge Section */}
      <KalyaniCard
        variant="elevated"
        title={
          <span className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            Database Maintenance &amp; Test Data Cleanup
          </span>
        }
        subtitle="Remove sample/test faculty records and reset rosters for fresh production entry."
      >
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-slate-100">Purge Stale Test Data &amp; Start Fresh</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              This operation clears all sample faculty schedules and test accounts from Cloud Firestore and local cache, retaining only the Master Administrator (<span className="text-kalyani-gold-300 font-semibold">Dr. K. S. Rajan</span>, <span className="text-kalyani-gold-300 font-semibold">admin@krce.ac.in</span>) and standard academic departments. Use this to prepare a clean database for official faculty onboarding.
            </p>
          </div>

          <KalyaniButton
            variant="glass"
            className="shrink-0 bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/25 text-rose-300 text-xs font-semibold"
            leftIcon={<Trash2 className="w-4 h-4 text-rose-400" />}
            onClick={() => setIsPurgeModalOpen(true)}
          >
            Purge Stale Data
          </KalyaniButton>
        </div>
      </KalyaniCard>

      {/* Purge Confirm Dialog */}
      <KalyaniConfirmDialog
        isOpen={isPurgeModalOpen}
        onClose={() => setIsPurgeModalOpen(false)}
        onConfirm={() => {
          purgeDatabaseToCleanSlate();
          setIsPurgeModalOpen(false);
          setSuccessMsg('Database purged successfully. Ready for clean institutional data entry.');
        }}
        variant="danger"
        title="Purge Test Database Records"
        message="Are you sure you want to purge all test faculty, schedules, and leadership assignments? All test records in Cloud Firestore will be deleted permanently, leaving only the Administrator account so you can insert new records from scratch."
        confirmText="Confirm & Purge"
      />
    </div>
  );
};
