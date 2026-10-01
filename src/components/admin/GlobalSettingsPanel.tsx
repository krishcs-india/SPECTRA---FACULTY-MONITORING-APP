import React, { useState, useEffect } from 'react';
import { KalyaniCard } from '../common/KalyaniCard';
import { KalyaniButton } from '../common/KalyaniButton';
import { KalyaniInput } from '../common/KalyaniInput';
import { KalyaniConfirmDialog } from '../common/KalyaniConfirmDialog';
import { useAppStore } from '../../store/useAppStore';
import { Save, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';

export const GlobalSettingsPanel: React.FC = () => {
  const systemSettings = useAppStore((state) => state.systemSettings);
  const updateSystemSettings = useAppStore((state) => state.updateSystemSettings);
  const purgeDatabaseToCleanSlate = useAppStore((state) => state.purgeDatabaseToCleanSlate);

  const [collegeName, setCollegeName] = useState(systemSettings.collegeName);
  const [collegeDomain, setCollegeDomain] = useState(systemSettings.collegeDomain);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (systemSettings) {
      setCollegeName(systemSettings.collegeName);
      setCollegeDomain(systemSettings.collegeDomain);
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
      collegeName: collegeName.trim(),
      collegeDomain: collegeDomain.trim().toLowerCase(),
    });
    setSuccessMsg('College settings updated successfully.');
  };

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* College Profile Settings */}
      <KalyaniCard
        variant="glass"
        title="College & Institutional Identity"
        subtitle="Manage official college name and institutional email domain."
      >
        <div className="space-y-4 max-w-xl">
          <KalyaniInput
            label="College / Institution Name"
            value={collegeName}
            onChange={(e) => setCollegeName(e.target.value)}
            placeholder="e.g. K. Ramakrishnan College of Engineering"
          />

          <KalyaniInput
            label="Official College Email Domain"
            value={collegeDomain}
            onChange={(e) => setCollegeDomain(e.target.value)}
            placeholder="e.g. krce.ac.in"
          />

          <div className="pt-2 flex justify-start">
            <KalyaniButton
              variant="gold"
              size="md"
              leftIcon={<Save className="w-4 h-4" />}
              onClick={handleSave}
            >
              Save College Settings
            </KalyaniButton>
          </div>
        </div>
      </KalyaniCard>

      {/* Database Maintenance & Production Purge Section */}
      <KalyaniCard
        variant="elevated"
        title={
          <span className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            Database Maintenance &amp; Clean Slate Purge
          </span>
        }
        subtitle="Reset application database to pristine baseline ready for official onboarding."
      >
        <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Purge Stale Data &amp; Reset to Pristine Baseline</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
              This operation clears all faculty schedules, curriculum subjects, and user accounts from Cloud Firestore, leaving only the Administrator (<span className="text-rose-700 dark:text-rose-300 font-semibold">admin@krce.ac.in</span>) and departments.
            </p>
          </div>

          <KalyaniButton
            variant="glass"
            className="shrink-0 w-full sm:w-auto justify-center bg-rose-500/10 border-rose-300 dark:border-rose-500/30 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 text-xs font-semibold"
            leftIcon={<Trash2 className="w-4 h-4 text-rose-500" />}
            onClick={() => setIsPurgeModalOpen(true)}
          >
            Purge All Data
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
        title="Purge All Data & Reset Database"
        message="Are you sure you want to purge all faculty, schedules, and subjects? All records in Cloud Firestore will be deleted permanently, leaving only the Administrator account and departments."
        confirmText="Confirm & Purge"
      />
    </div>
  );
};
