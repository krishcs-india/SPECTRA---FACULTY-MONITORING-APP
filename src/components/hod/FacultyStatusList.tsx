import React, { useState, useEffect } from 'react';
import { DayAvailabilityOverview, ScheduleStatus } from '../../types/schedule';
import { Period } from '../../types/period';
import { Subject } from '../../types/subject';
import { KalyaniUser } from '../../types/user';
import { KalyaniTable } from '../common/KalyaniTable';
import { KalyaniBadge } from '../common/KalyaniBadge';
import { KalyaniFilterBar } from '../common/KalyaniFilterBar';
import { KalyaniButton } from '../common/KalyaniButton';
import { KalyaniConfirmDialog } from '../common/KalyaniConfirmDialog';
import { FacultyDetailModal } from './FacultyDetailModal';
import { excelService } from '../../services/excelService';
import { formatTimeDisplay } from '../../utils/dateUtils';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../hooks/useAuth';
import { FileSpreadsheet, Eye, Power, Trash2, CheckCircle2 } from 'lucide-react';

interface FacultyStatusListProps {
  overview: DayAvailabilityOverview;
  activePeriods: Period[];
  departmentName?: string;
  departmentSubjects?: Subject[];
  /** When changed by the parent (e.g. stat-card clicks), syncs the status filter */
  statusFilterSignal?: 'ALL' | ScheduleStatus;
  /**
   * When false, hides faculty deactivate/delete actions — view-only mode
   * used on the Live Dashboard & History pages. Management stays in the
   * Faculty Directory page.
   */
  allowManagement?: boolean;
}

export const FacultyStatusList: React.FC<FacultyStatusListProps> = ({
  overview,
  activePeriods,
  departmentName = 'Computer Science & Engineering',
  statusFilterSignal,
  allowManagement = true,
}) => {
  const { currentUser } = useAuth();
  const users = useAppStore((state) => state.users);
  const updateUser = useAppStore((state) => state.updateUser);
  const deleteUser = useAppStore((state) => state.deleteUser);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ScheduleStatus>('ALL');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('ALL');
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  const [facultyToToggle, setFacultyToToggle] = useState<KalyaniUser | null>(null);
  const [facultyToDelete, setFacultyToDelete] = useState<KalyaniUser | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const activeModalFaculty = React.useMemo(
    () => overview.facultyStatuses.find((f) => f.facultyId === selectedFacultyId),
    [overview.facultyStatuses, selectedFacultyId]
  );

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (actionSuccessMsg) {
      const timer = setTimeout(() => setActionSuccessMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccessMsg]);

  // Sync filter when parent signals a change (e.g. stat card clicked)
  useEffect(() => {
    if (statusFilterSignal !== undefined) {
      setStatusFilter(statusFilterSignal);
    }
  }, [statusFilterSignal]);

  // Filtered rows with unified subject code & subject name search
  const filteredFaculty = overview.facultyStatuses.filter((f) => {
    const term = searchTerm.trim().toLowerCase();

    // 1. Comprehensive Search: matches faculty name, designation, email, subject code, subject name, or custom duties
    if (term) {
      const matchesFacultyDetails =
        f.facultyName.toLowerCase().includes(term) ||
        f.facultyDesignation.toLowerCase().includes(term) ||
        f.email.toLowerCase().includes(term);

      const matchesPeriodAssignments = Boolean(
        f.schedule?.periods &&
        Object.values(f.schedule.periods).some((p) => {
          if (!p) return false;
          if (p.type === 'SUBJECT') {
            return (
              (p.subjectCode && p.subjectCode.toLowerCase().includes(term)) ||
              (p.subjectName && p.subjectName.toLowerCase().includes(term))
            );
          }
          if (p.type === 'CUSTOM') {
            return p.customText && p.customText.toLowerCase().includes(term);
          }
          if (p.type === 'FREE') {
            return term === 'free' || term === 'available';
          }
          return false;
        })
      );

      if (!matchesFacultyDetails && !matchesPeriodAssignments) {
        return false;
      }
    }

    // 2. Status filter (All, Submitted, Full Day Free, Not Submitted)
    if (statusFilter !== 'ALL' && f.status !== statusFilter) {
      return false;
    }

    // 3. Period filter (Inspect who is available / free in a specific period)
    if (selectedPeriodId !== 'ALL') {
      if (f.status === 'NOT_SUBMITTED') return false;
      if (f.status === 'FULL_DAY_FREE') {
        return true;
      }
      const entry = f.schedule?.periods?.[selectedPeriodId];
      if (entry && entry.type !== 'FREE') {
        return false;
      }
    }

    return true;
  });

  const handleExportExcel = async () => {
    try {
      const message = await excelService.exportAvailabilityReport(overview, departmentName);
      setActionSuccessMsg(message);
    } catch (err: any) {
      setActionSuccessMsg(`Excel export failed: ${err?.message || 'unknown error'}`);
    }
  };


  const handleConfirmToggleActive = () => {
    if (facultyToToggle) {
      if (facultyToToggle.role === 'ADMIN' || facultyToToggle.uid === currentUser?.uid) {
        setActionSuccessMsg('Cannot deactivate this account.');
        setFacultyToToggle(null);
        return;
      }
      updateUser(facultyToToggle.uid, { active: !facultyToToggle.active });
      setActionSuccessMsg(`Faculty ${facultyToToggle.name} is now ${facultyToToggle.active ? 'deactivated' : 'activated'}.`);
      setFacultyToToggle(null);
    }
  };

  const handleConfirmDelete = () => {
    if (facultyToDelete) {
      if (facultyToDelete.role === 'ADMIN' || facultyToDelete.uid === currentUser?.uid) {
        setActionSuccessMsg('Cannot delete this account.');
        setFacultyToDelete(null);
        return;
      }
      deleteUser(facultyToDelete.uid);
      setActionSuccessMsg(`Faculty account for ${facultyToDelete.name} was permanently deleted.`);
      setFacultyToDelete(null);
    }
  };

  const columns = [
    {
      header: 'Faculty Member',
      accessor: (row: any) => {
        const userObj = users.find((u) => u.uid === row.facultyId);
        const isActive = userObj?.active ?? true;
        return (
          <div>
            <div className="flex items-center gap-2">
              <p className="font-marcellus text-base text-slate-800 dark:text-slate-100 tracking-wide font-semibold leading-tight">
                {row.facultyName}
              </p>
              {!isActive && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30">
                  Disabled
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-marcellus">{row.facultyDesignation}</p>
          </div>
        );
      },
    },
    {
      header: 'College Email',
      accessor: (row: any) => <span className="text-xs text-slate-600 dark:text-slate-300">{row.email}</span>,
    },
    {
      header: 'Status',
      accessor: (row: any) => <KalyaniBadge status={row.status} size="sm" />,
    },
    {
      header: 'Assigned Load',
      accessor: (row: any) => (
        <span className="text-xs font-semibold">
          {row.status === 'SUBMITTED' ? (
            <span className="text-rose-600 dark:text-rose-400 font-semibold">{row.assignedPeriodsCount} Periods</span>
          ) : row.status === 'FULL_DAY_FREE' ? (
            <span className="text-teal-600 dark:text-teal-400 font-semibold">0 (Full Free)</span>
          ) : (
            <span className="text-rose-500 font-semibold">Pending</span>
          )}
        </span>
      ),
    },
    {
      header: 'Sync Time',
      accessor: (row: any) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {formatTimeDisplay(row.submittedAt)}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: any) => {
        const userObj = users.find((u) => u.uid === row.facultyId);
        const isSelfOrAdmin = userObj?.uid === currentUser?.uid || userObj?.role === 'ADMIN';
        const isActive = userObj?.active ?? true;

        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <KalyaniButton
              variant="outline-gold"
              size="sm"
              leftIcon={<Eye className="w-3.5 h-3.5" />}
              onClick={() => setSelectedFacultyId(row.facultyId)}
              title="View Schedule Timeline"
            >
              View
            </KalyaniButton>

            {allowManagement && userObj && !isSelfOrAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setFacultyToToggle(userObj)}
                  className={`p-1.5 rounded-lg transition-colors border ${
                    isActive
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20'
                  }`}
                  title={isActive ? 'Deactivate Faculty Account' : 'Activate Faculty Account'}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setFacultyToDelete(userObj)}
                  className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
                  title="Delete Faculty Account Permanently"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Main Filter Bar with Unified Search */}
      <KalyaniFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        selectedPeriodId={selectedPeriodId}
        onPeriodChange={setSelectedPeriodId}
        periods={activePeriods}
        searchPlaceholder="Search by faculty, subject (e.g. DBMS, CS501, OS), or designation…"
        extraActions={
          <KalyaniButton
            variant="glass"
            className="h-11 px-4 text-xs font-semibold rounded-2xl flex items-center shrink-0 border-rose-200 dark:border-rose-900/50 hover:border-rose-400"
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-500" />}
            onClick={handleExportExcel}
            title="Download Excel Availability Report"
          >
            Export to Excel
          </KalyaniButton>
        }
      />

      {/* Faculty Submissions Table */}
      <KalyaniTable
        columns={columns}
        data={filteredFaculty}
        keyExtractor={(row) => row.facultyId}
        emptyMessage="No faculty match the specified search or subject query."
        onRowClick={(row) => setSelectedFacultyId(row.facultyId)}
      />

      {/* Detail Modal - Reactively bound to live incoming schedule updates */}
      {activeModalFaculty && (
        <FacultyDetailModal
          isOpen={Boolean(activeModalFaculty)}
          onClose={() => setSelectedFacultyId(null)}
          facultyName={activeModalFaculty.facultyName}
          facultyDesignation={activeModalFaculty.facultyDesignation}
          facultyEmail={activeModalFaculty.email}
          date={overview.date}
          schedule={activeModalFaculty.schedule}
          activePeriods={activePeriods}
        />
      )}

      {/* Toggle Confirm Dialog */}
      <KalyaniConfirmDialog
        isOpen={Boolean(facultyToToggle)}
        onClose={() => setFacultyToToggle(null)}
        onConfirm={handleConfirmToggleActive}
        variant={facultyToToggle?.active ? 'danger' : 'teal'}
        title={facultyToToggle?.active ? 'Deactivate Faculty Account' : 'Activate Faculty Account'}
        message={
          facultyToToggle?.active
            ? `Are you sure you want to deactivate ${facultyToToggle.name}? They will not be able to log in or submit period schedules.`
            : `Re-activating ${facultyToToggle?.name} will restore their login and period submission access.`
        }
        confirmText={facultyToToggle?.active ? 'Deactivate' : 'Activate'}
      />

      {/* Delete Confirm Dialog */}
      <KalyaniConfirmDialog
        isOpen={Boolean(facultyToDelete)}
        onClose={() => setFacultyToDelete(null)}
        onConfirm={handleConfirmDelete}
        variant="danger"
        title="Delete Faculty Account Permanently"
        message={`Are you sure you want to permanently delete ${facultyToDelete?.name} (${facultyToDelete?.email})? This action cannot be undone and will remove their profile and records from the college database.`}
        confirmText="Delete Account"
      />
    </div>
  );
};
