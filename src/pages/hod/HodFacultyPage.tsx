import React, { useState, useMemo, useEffect } from 'react';
import { KalyaniPageHeader } from '../../components/common/KalyaniPageHeader';
import { KalyaniDatePicker } from '../../components/common/KalyaniDatePicker';
import { KalyaniButton } from '../../components/common/KalyaniButton';
import { KalyaniInput } from '../../components/common/KalyaniInput';
import { KalyaniModal } from '../../components/common/KalyaniModal';
import { KalyaniConfirmDialog } from '../../components/common/KalyaniConfirmDialog';
import { KalyaniTable } from '../../components/common/KalyaniTable';
import { FacultyStatusList } from '../../components/hod/FacultyStatusList';
import { ExcelDepartmentStaffImportModal } from '../../components/hod/ExcelDepartmentStaffImportModal';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import { KalyaniUser, UserRole } from '../../types/user';
import { getTodayDateString } from '../../utils/dateUtils';
import { excelService } from '../../services/excelService';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Download,
  CalendarDays,
  UploadCloud,
  Power
} from 'lucide-react';

export const HodFacultyPage: React.FC = () => {
  const { currentUser } = useAuth();
  const departmentId = currentUser?.departmentId || 'CSE';
  const departmentName = currentUser?.departmentName || 'Department';

  // Make Daily Submission & Substitution Tracker the first / default tab
  const [activeTab, setActiveTab] = useState<'SUBMISSIONS' | 'DIRECTORY'>('SUBMISSIONS');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  // Store bindings
  const users = useAppStore((state) => state.users);
  const periods = useAppStore((state) => state.periods);
  const subjectsState = useAppStore((state) => state.subjects);
  const schedules = useAppStore((state) => state.schedules);
  const addUser = useAppStore((state) => state.addUser);
  const updateUser = useAppStore((state) => state.updateUser);
  const deleteUser = useAppStore((state) => state.deleteUser);
  const getDepartmentAvailability = useAppStore((state) => state.getDepartmentAvailability);

  const activePeriods = useMemo(
    () => useAppStore.getState().getActivePeriods(departmentId),
    [periods, departmentId]
  );
  const subjects = useMemo(
    () => useAppStore.getState().getDepartmentSubjects(departmentId),
    [subjectsState, departmentId]
  );

  // Filter staff: strictly faculties and AHODs belonging to this HOD's department (excluding HOD himself and Admin)
  const deptStaff = useMemo(() => {
    return (users || []).filter((u) => {
      if ((u.departmentId || '').toUpperCase() !== departmentId.toUpperCase() || u.role === 'ADMIN') return false;
      const isMainHod = (u.role === 'HOD' || (u.designation || '').toLowerCase().includes('head of department')) && u.hodType !== 'AHOD';
      return !isMainHod && u.uid !== currentUser?.uid;
    });
  }, [users, departmentId, currentUser?.uid]);

  // Management UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'FACULTY' | 'AHOD'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<KalyaniUser | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<KalyaniUser | null>(null);
  const [staffToToggle, setStaffToToggle] = useState<KalyaniUser | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [staffRoleType, setStaffRoleType] = useState<'FACULTY' | 'AHOD'>('FACULTY');
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (notificationMsg) {
      const timer = setTimeout(() => setNotificationMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notificationMsg]);

  // Filtered staff list for search and tab filter
  const filteredStaff = useMemo(() => {
    return deptStaff.filter((u) => {
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.designation.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (roleFilter === 'AHOD' && u.hodType !== 'AHOD') return false;
      if (roleFilter === 'FACULTY' && (u.role !== 'FACULTY' || u.hodType === 'AHOD')) return false;

      return true;
    });
  }, [deptStaff, searchTerm, roleFilter]);

  const overview = useMemo(
    () => getDepartmentAvailability(departmentId, selectedDate),
    [getDepartmentAvailability, departmentId, selectedDate, schedules, users, periods]
  );

  const openAddModal = () => {
    setName('');
    setEmail('');
    setDesignation('Assistant Professor');
    setStaffRoleType('FACULTY');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (u: KalyaniUser) => {
    setEditingStaff(u);
    setName(u.name);
    setEmail(u.email);
    setDesignation(u.designation);
    setStaffRoleType(u.hodType === 'AHOD' ? 'AHOD' : 'FACULTY');
    setFormError(null);
  };

  const handleRoleTypeChange = (type: 'FACULTY' | 'AHOD') => {
    setStaffRoleType(type);
    if (type === 'AHOD') {
      if (designation === 'Assistant Professor' || designation === 'Associate Professor') {
        setDesignation('Assistant HOD');
      }
    } else {
      if (designation === 'Assistant HOD') {
        setDesignation('Assistant Professor');
      }
    }
  };

  const handleSaveStaff = () => {
    if (!name.trim()) {
      setFormError('Staff name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('A valid college email address is required.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check email uniqueness across the entire institutional directory (including Admin additions)
    const emailConflict = users.find(
      (u) => (u.email || '').toLowerCase() === cleanEmail && u.uid !== editingStaff?.uid
    );
    if (emailConflict) {
      setFormError(
        `Duplicate email detected: An account with email "${cleanEmail}" already exists in the directory (${emailConflict.departmentName || 'Institutional Directory'}). You can edit the existing account or use a different email.`
      );
      return;
    }

    if (editingStaff) {
      updateUser(editingStaff.uid, {
        name: name.trim(),
        email: cleanEmail,
        designation: designation.trim() || (staffRoleType === 'AHOD' ? 'Assistant HOD' : 'Assistant Professor'),
        role: 'FACULTY' as UserRole,
        hodType: staffRoleType === 'AHOD' ? 'AHOD' : null,
        departmentId: departmentId,
        departmentName: departmentName
      });
      setNotificationMsg(`${name.trim()} updated successfully.`);
      setEditingStaff(null);
    } else {
      addUser({
        name: name.trim(),
        email: cleanEmail,
        designation: designation.trim() || (staffRoleType === 'AHOD' ? 'Assistant HOD' : 'Assistant Professor'),
        role: 'FACULTY' as UserRole,
        hodType: staffRoleType === 'AHOD' ? 'AHOD' : null,
        departmentId: departmentId,
        departmentName: departmentName,
        active: true
      });
      setNotificationMsg(`Added ${name.trim()} to ${departmentName} directory.`);
      setIsAddModalOpen(false);
    }
  };

  const handleConfirmDelete = () => {
    if (staffToDelete) {
      deleteUser(staffToDelete.uid);
      setNotificationMsg(`Removed ${staffToDelete.name} from department roster.`);
      setStaffToDelete(null);
    }
  };

  const handleConfirmToggle = () => {
    if (staffToToggle) {
      const willBeActive = !staffToToggle.active;
      updateUser(staffToToggle.uid, { active: willBeActive });
      setNotificationMsg(
        `Staff account "${staffToToggle.name}" is now ${willBeActive ? 'Active' : 'Disabled'}.`
      );
      setStaffToToggle(null);
    }
  };

  const handleExportStaffExcel = async () => {
    try {
      const msg = await excelService.exportUserDirectory(deptStaff, `${departmentName.replace(/\s+/g, '_')}_Staff_Roster`);
      setNotificationMsg(msg);
    } catch (err: any) {
      setNotificationMsg(`Excel export failed: ${err?.message || 'unknown error'}`);
    }
  };

  const staffColumns = [
    {
      header: 'Staff Member',
      accessor: (row: KalyaniUser) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-kalyani-gold-500/10 border border-kalyani-gold-500/25 flex items-center justify-center text-kalyani-gold-300 font-bold text-xs shrink-0">
            {row.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-xs text-slate-100">{row.name}</p>
            <p className="text-[11px] text-slate-400 font-mono">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Position / Designation',
      accessor: (row: KalyaniUser) => (
        <span className="text-xs text-slate-300 font-medium">{row.designation}</span>
      ),
    },
    {
      header: 'Role Assignment',
      accessor: (row: KalyaniUser) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            row.hodType === 'AHOD'
              ? 'bg-teal-500/15 border-teal-500/30 text-teal-300'
              : 'bg-kalyani-gold-500/15 border-kalyani-gold-400/30 text-kalyani-gold-300'
          }`}
        >
          {row.hodType === 'AHOD' ? 'Assistant HOD' : 'Teaching Faculty'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: KalyaniUser) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 w-fit ${
            row.active
              ? 'bg-emerald-950/70 border border-emerald-500/30 text-emerald-300'
              : 'bg-slate-800 border border-slate-700 text-slate-400'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${row.active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          {row.active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: KalyaniUser) => (
        <div className="flex items-center gap-1.5">
          {/* Edit Button Box */}
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 rounded-lg bg-kalyani-gold-500/10 border border-kalyani-gold-500/30 hover:border-kalyani-gold-400 text-kalyani-gold-300 hover:bg-kalyani-gold-500/20 transition-colors shadow-sm"
            title="Edit Staff Details"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Disable / Enable Toggle Button Box */}
          <button
            type="button"
            onClick={() => setStaffToToggle(row)}
            className={`p-1.5 rounded-lg border transition-colors shadow-sm ${
              row.active
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400'
            }`}
            title={row.active ? 'Disable Staff Account' : 'Enable Staff Account'}
          >
            <Power className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button Box */}
          <button
            type="button"
            onClick={() => setStaffToDelete(row)}
            className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 hover:border-rose-400 transition-colors shadow-sm"
            title="Delete Staff Account"
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
        title="Department Faculty & AHOD Management"
        subtitle={`Appoint, edit, and oversee faculties and Assistant HODs in ${departmentName}. HOD holds complete departmental staff control and monitoring.`}
        breadcrumbs={[{ label: 'HOD' }, { label: 'Faculty Directory' }]}
        badge={
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-kalyani-gold-500/15 border border-kalyani-gold-400/40 text-kalyani-gold-300">
            {departmentName}
          </span>
        }
      />

      {notificationMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Navigation Tabs - Daily Submission Tracker is First */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-kalyani-crimson-950/80 border border-kalyani-gold-500/20 w-fit">
        <button
          onClick={() => setActiveTab('SUBMISSIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'SUBMISSIONS'
              ? 'bg-kalyani-gold-500 text-kalyani-crimson-950 shadow-gold-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Daily Submission &amp; Substitution Tracker</span>
        </button>

        <button
          onClick={() => setActiveTab('DIRECTORY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'DIRECTORY'
              ? 'bg-kalyani-gold-500 text-kalyani-crimson-950 shadow-gold-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Department Staff Directory</span>
        </button>
      </div>

      {activeTab === 'SUBMISSIONS' ? (
        <div className="space-y-6">
          <KalyaniDatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />

          {/* Daily Tracker with Inspection View only (no destructive deletes/disables here) */}
          <FacultyStatusList
            overview={overview}
            activePeriods={activePeriods}
            departmentName={departmentName}
            departmentSubjects={subjects}
            allowManagement={false}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Action Ribbon */}
          <div className="p-4 rounded-3xl kalyani-glass flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-kalyani-gold-400/80 absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search staff by name or email…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-kalyani-crimson-950/80 border border-kalyani-gold-500/20 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-kalyani-gold-400"
                />
              </div>

              <div className="flex items-center gap-1 bg-kalyani-crimson-950/80 p-1 rounded-xl border border-kalyani-gold-500/20 text-xs">
                {(['ALL', 'FACULTY', 'AHOD'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      roleFilter === r
                        ? 'bg-kalyani-gold-500/20 text-kalyani-gold-300 border border-kalyani-gold-400/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r === 'ALL' ? 'All Staff' : r === 'AHOD' ? 'Assistant HODs' : 'Faculties'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <KalyaniButton
                variant="glass"
                size="sm"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={handleExportStaffExcel}
              >
                Export XLS
              </KalyaniButton>

              <KalyaniButton
                variant="outline-gold"
                size="sm"
                leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
                onClick={() => setIsExcelModalOpen(true)}
              >
                Excel Bulk Upload
              </KalyaniButton>

              <KalyaniButton
                variant="gold"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={openAddModal}
              >
                Add Staff Member
              </KalyaniButton>
            </div>
          </div>

          {/* Staff Table */}
          <KalyaniTable
            columns={staffColumns}
            data={filteredStaff}
            keyExtractor={(row) => row.uid}
            emptyMessage="No faculties or Assistant HODs registered in this department yet. Click 'Add Staff Member' or 'Bulk Upload' to get started."
          />
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {(isAddModalOpen || editingStaff) && (
        <KalyaniModal
          isOpen={isAddModalOpen || Boolean(editingStaff)}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingStaff(null);
          }}
          maxWidth="md"
          title={editingStaff ? `Edit Staff — ${editingStaff.name}` : `Add New Staff Member — ${departmentName}`}
          subtitle="Manage faculty profile, academic position, and Assistant HOD designation"
          footer={
            <>
              <KalyaniButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStaff(null);
                }}
              >
                Cancel
              </KalyaniButton>
              <KalyaniButton variant="gold" size="sm" onClick={handleSaveStaff}>
                {editingStaff ? 'Save Changes' : 'Create Staff Member'}
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

            <div className="p-3 rounded-xl bg-kalyani-crimson-950/70 border border-kalyani-gold-500/20">
              <label className="block text-xs font-bold text-kalyani-gold-300 uppercase tracking-wider mb-2">
                Staff Role Designation
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleTypeChange('FACULTY')}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    staffRoleType === 'FACULTY'
                      ? 'bg-kalyani-gold-500/20 border-kalyani-gold-400 text-kalyani-gold-200'
                      : 'bg-black/20 border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Regular Teaching Faculty
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleTypeChange('AHOD')}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    staffRoleType === 'AHOD'
                      ? 'bg-teal-500/20 border-teal-400 text-teal-200'
                      : 'bg-black/20 border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Assistant HOD (AHOD)
                </button>
              </div>
            </div>

            <KalyaniInput
              label="Staff Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Kalyani"
              required
            />

            <KalyaniInput
              label="Institutional College Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. kalyani.cse@krce.ac.in"
              required
            />

            <KalyaniInput
              label="Academic Position / Designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder={staffRoleType === 'AHOD' ? 'Assistant HOD' : 'e.g. Assistant Professor / Associate Professor'}
              required
            />
          </div>
        </KalyaniModal>
      )}

      {/* Excel Bulk Upload Modal */}
      <ExcelDepartmentStaffImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        departmentId={departmentId}
        departmentName={departmentName}
        existingUsers={users}
        onImportSuccess={(count) =>
          setNotificationMsg(`Successfully imported ${count} staff members to ${departmentName}.`)
        }
      />

      {/* Toggle Staff Active/Disable Confirm Dialog */}
      <KalyaniConfirmDialog
        isOpen={Boolean(staffToToggle)}
        onClose={() => setStaffToToggle(null)}
        onConfirm={handleConfirmToggle}
        variant={staffToToggle?.active ? 'warning' : 'gold'}
        title={staffToToggle?.active ? 'Disable Staff Account' : 'Enable Staff Account'}
        message={
          staffToToggle?.active
            ? `Are you sure you want to disable "${staffToToggle?.name}"? They will temporarily not be able to log in or submit schedules.`
            : `Are you sure you want to re-activate "${staffToToggle?.name}"? They will regain access to the schedule system.`
        }
        confirmText={staffToToggle?.active ? 'Yes, Disable Account' : 'Yes, Activate Account'}
      />

      {/* Delete Staff Confirm Dialog */}
      <KalyaniConfirmDialog
        isOpen={Boolean(staffToDelete)}
        onClose={() => setStaffToDelete(null)}
        onConfirm={handleConfirmDelete}
        variant="danger"
        title="Remove Staff Member"
        message={`Are you sure you want to remove "${staffToDelete?.name}" (${staffToDelete?.designation}) from ${departmentName}? Their submission history and records will be permanently deleted.`}
        confirmText="Yes, Remove Staff"
      />
    </div>
  );
};
