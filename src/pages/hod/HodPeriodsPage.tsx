import React, { useState, useEffect } from 'react';
import { KalyaniPageHeader } from '../../components/common/KalyaniPageHeader';
import { KalyaniButton } from '../../components/common/KalyaniButton';
import { KalyaniInput } from '../../components/common/KalyaniInput';
import { KalyaniModal } from '../../components/common/KalyaniModal';
import { KalyaniConfirmDialog } from '../../components/common/KalyaniConfirmDialog';
import { KalyaniTable } from '../../components/common/KalyaniTable';
import { usePeriods } from '../../hooks/usePeriods';
import { useAuth } from '../../hooks/useAuth';
import { Period } from '../../types/period';
import { Plus, Edit2, Trash2, CheckCircle2, Info } from 'lucide-react';

export const HodPeriodsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const departmentId = currentUser?.departmentId || 'CSE';
  const { activePeriods, addPeriod, updatePeriod, deletePeriod } = usePeriods(departmentId);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [periodToDelete, setPeriodToDelete] = useState<Period | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (notificationMsg) {
      const timer = setTimeout(() => setNotificationMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notificationMsg]);

  // Form State
  const [name, setName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const openAddModal = () => {
    setName(`Period ${activePeriods.length + 1}`);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: Period) => {
    setEditingPeriod(p);
    setName(p.name);
    setFormError(null);
  };

  const handleSavePeriod = () => {
    if (!name.trim()) {
      setFormError('Period Name is required.');
      return;
    }

    const cleanName = name.trim();

    if (editingPeriod) {
      updatePeriod(editingPeriod.id, {
        name: cleanName,
        shortName: cleanName,
        departmentId: departmentId,
      });
      setEditingPeriod(null);
      setNotificationMsg(`${cleanName} updated successfully.`);
    } else {
      addPeriod({
        name: cleanName,
        shortName: cleanName,
        sequence: activePeriods.reduce((max, p) => Math.max(max, p.sequence), 0) + 1,
        active: true,
        departmentId: departmentId,
      });
      const newCount = activePeriods.length + 1;
      setIsAddModalOpen(false);
      setNotificationMsg(`${cleanName} added. Total periods: ${newCount}.`);
    }
  };

  const handleConfirmDelete = () => {
    if (periodToDelete) {
      deletePeriod(periodToDelete.id);
      const newCount = Math.max(0, activePeriods.length - 1);
      setNotificationMsg(`Period removed. Remaining periods (${newCount}) renumbered automatically.`);
      setPeriodToDelete(null);
    }
  };

  const columns = [
    {
      header: 'Period Number',
      accessor: (row: Period, _idx: number) => (
        <span className="font-bold text-xs text-rose-700 dark:text-rose-300">Period {row.sequence}</span>
      ),
    },
    {
      header: 'Period Name',
      accessor: (row: Period) => <span className="font-semibold text-slate-800 dark:text-slate-100">{row.name}</span>,
    },
    {
      header: 'Actions',
      accessor: (row: Period) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors"
            title="Edit Period"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPeriodToDelete(row)}
            className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-500 transition-colors"
            title="Delete Period"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <KalyaniPageHeader
        title="Department Period Manager"
        subtitle="Add, edit, or delete periods for your department. Deleting a period automatically renumbers the remaining ones — past submissions are never modified."
        breadcrumbs={[{ label: 'HOD' }, { label: 'Period Manager' }]}
        actions={
          <KalyaniButton
            variant="gold"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={openAddModal}
          >
            Add Period
          </KalyaniButton>
        }
      />

      {notificationMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
        <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
        <span>
          Periods are managed purely by number. If you delete a period, the periods after it shift up
          (e.g. deleting Period 3 makes Period 4 become Period 3). Changes apply to future submissions only —
          archived historical records stay exactly as submitted.
        </span>
      </div>

      {/* Table */}
      <KalyaniTable
        columns={columns}
        data={activePeriods}
        keyExtractor={(row) => row.id}
        emptyMessage="No periods configured."
      />

      {/* Add / Edit Modal */}
      {(isAddModalOpen || editingPeriod) && (
        <KalyaniModal
          isOpen={isAddModalOpen || Boolean(editingPeriod)}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingPeriod(null);
          }}
          maxWidth="md"
          title={editingPeriod ? 'Edit Period' : 'Add New Academic Period'}
          subtitle={`Will be numbered as Period ${editingPeriod ? editingPeriod.sequence : activePeriods.length + 1}`}
          footer={
            <>
              <KalyaniButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingPeriod(null);
                }}
              >
                Cancel
              </KalyaniButton>
              <KalyaniButton variant="gold" size="sm" onClick={handleSavePeriod}>
                {editingPeriod ? 'Save Period' : 'Create Period'}
              </KalyaniButton>
            </>
          }
        >
          <div className="space-y-4">
            {formError && (
              <p className="text-xs text-rose-400 p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/30">
                {formError}
              </p>
            )}

            <KalyaniInput
              label="Period Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Period 1"
              required
            />
          </div>
        </KalyaniModal>
      )}

      {/* Delete Confirm */}
      <KalyaniConfirmDialog
        isOpen={Boolean(periodToDelete)}
        onClose={() => setPeriodToDelete(null)}
        onConfirm={handleConfirmDelete}
        variant="danger"
        title="Delete Period"
        message={
          `Deleting "${periodToDelete?.name}" will remove it and renumber the remaining periods so they stay aligned ` +
          `(e.g. deleting Period 3 makes Period 4 become Period 3). Past submitted schedules are NOT modified — ` +
          `the change applies to future submissions only.`
        }
        confirmText="Yes, Delete & Renumber"
      />
    </div>
  );
};
