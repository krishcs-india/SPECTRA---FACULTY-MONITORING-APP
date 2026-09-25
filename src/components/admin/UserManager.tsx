import React, { useState, useEffect } from 'react';
import { KalyaniUser, UserRole, HodType } from '../../types/user';
import { KalyaniCard } from '../common/KalyaniCard';
import { KalyaniButton } from '../common/KalyaniButton';
import { KalyaniInput } from '../common/KalyaniInput';
import { KalyaniSelect } from '../common/KalyaniSelect';
import { KalyaniModal } from '../common/KalyaniModal';
import { KalyaniConfirmDialog } from '../common/KalyaniConfirmDialog';
import { KalyaniTable } from '../common/KalyaniTable';
import { ExcelUserImportModal } from './ExcelUserImportModal';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../hooks/useAuth';
import { excelService } from '../../services/excelService';
import { Users, Plus, Search, FileSpreadsheet, Download, Edit2, Power, Trash2, CheckCircle2, Shield } from 'lucide-react';

export const UserManager: React.FC = () => {
  const { currentUser } = useAuth();
  const users = useAppStore((state) => state.users);
  const departments = useAppStore((state) => state.departments);
  const addUser = useAppStore((state) => state.addUser);
  const updateUser = useAppStore((state) => state.updateUser);
  const deleteUser = useAppStore((state) => state.deleteUser);
  const bulkImportUsers = useAppStore((state) => state.bulkImportUsers);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<KalyaniUser | null>(null);
  const [userToToggle, setUserToToggle] = useState<KalyaniUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<KalyaniUser | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (notificationMsg) {
      const timer = setTimeout(() => setNotificationMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notificationMsg]);

  // Form states
  const defaultDeptId = departments[0]?.id || 'CSE';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState(defaultDeptId);
  const [designation, setDesignation] = useState('Assistant Professor');
  const [selectedRoleType, setSelectedRoleType] = useState<'FACULTY' | 'AHOD' | 'HOD'>('FACULTY');
  const [formError, setFormError] = useState<string | null>(null);

  const filteredUsers = (users || []).filter((u) => {
    // Admin is the system supervisor and must not be listed as a manageable directory user
    if (u.role === 'ADMIN') return false;

    const matchesSearch =
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.designation || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (roleFilter !== 'ALL') {
      if (roleFilter === 'HOD' && (u.role !== 'HOD' || u.hodType === 'AHOD')) return false;
      if (roleFilter === 'AHOD' && u.hodType !== 'AHOD') return false;
      if (roleFilter === 'FACULTY' && (u.role !== 'FACULTY' || u.hodType === 'AHOD')) return false;
    }

    if (deptFilter !== 'ALL' && (u.departmentId || '').toUpperCase() !== deptFilter.toUpperCase()) return false;

    return true;
  });

  const handleRoleTypeChange = (val: 'FACULTY' | 'AHOD' | 'HOD') => {
    setSelectedRoleType(val);
    if (val === 'HOD') {
      if (!designation || designation === 'Assistant Professor' || designation === 'Assistant HOD') {
        setDesignation('Professor & Head of Department');
      }
    } else if (val === 'AHOD') {
      if (!designation || designation === 'Assistant Professor' || designation.includes('Head of Department')) {
        setDesignation('Assistant HOD');
      }
    } else {
      if (designation === 'Assistant HOD' || designation.includes('Head of Department')) {
        setDesignation('Assistant Professor');
      }
    }
  };

  const openAddModal = () => {
    setName('');
    setEmail('');
    setDepartmentId(departments[0]?.id || 'CSE');
    setDesignation('Assistant Professor');
    setSelectedRoleType('FACULTY');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (u: KalyaniUser) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setDepartmentId(u.departmentId);
    setDesignation(u.designation);

    if (u.role === 'HOD' && u.hodType !== 'AHOD') {
      setSelectedRoleType('HOD');
    } else if (u.hodType === 'AHOD') {
      setSelectedRoleType('AHOD');
    } else {
      setSelectedRoleType('FACULTY');
    }

    setFormError(null);
  };

  const handleSaveUser = () => {
    if (!name.trim() || !email.trim()) {
      setFormError('Name and College Email are required.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    const finalRole: UserRole = selectedRoleType === 'HOD' ? 'HOD' : 'FACULTY';
    const finalHodType: HodType = selectedRoleType === 'HOD' ? 'HOD' : selectedRoleType === 'AHOD' ? 'AHOD' : null;
    const finalDepartmentId = departmentId;
    const finalDepartmentName = departments.find((d) => d.id === departmentId)?.name || '';
    const finalDesignation = selectedRoleType === 'AHOD' && (!designation.trim() || designation === 'Assistant Professor') ? 'Assistant HOD' : designation.trim();

    if (editingUser) {
      const duplicate = (users || []).find((u) => (u.email || '').toLowerCase() === cleanEmail && u.uid !== editingUser.uid);
      if (duplicate) {
        setFormError(`User with email ${cleanEmail} already exists.`);
        return;
      }
      updateUser(editingUser.uid, {
        name: name.trim(),
        email: cleanEmail,
        departmentId: finalDepartmentId,
        departmentName: finalDepartmentName,
        designation: finalDesignation,
        role: finalRole,
        hodType: finalHodType,
      });
      setEditingUser(null);
      setNotificationMsg(`User ${name} updated successfully.`);
    } else {
      if ((users || []).some((u) => (u.email || '').toLowerCase() === cleanEmail)) {
        setFormError(`User with email ${cleanEmail} already exists.`);
        return;
      }

      addUser({
        name: name.trim(),
        email: cleanEmail,
        departmentId: finalDepartmentId,
        departmentName: finalDepartmentName,
        designation: finalDesignation,
        role: finalRole,
        hodType: finalHodType,
        active: true,
      });
      setIsAddModalOpen(false);
      setNotificationMsg(`User ${name} registered successfully.`);
    }
  };

  const handleConfirmToggleActive = () => {
    if (userToToggle) {
      if (userToToggle.role === 'ADMIN' || userToToggle.uid === currentUser?.uid) {
        setNotificationMsg('Administrator account cannot be deactivated.');
        setUserToToggle(null);
        return;
      }
      updateUser(userToToggle.uid, { active: !userToToggle.active });
      setNotificationMsg(`User ${userToToggle.name} status updated.`);
      setUserToToggle(null);
    }
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      if (userToDelete.role === 'ADMIN' || userToDelete.uid === currentUser?.uid) {
        setNotificationMsg('Administrator account cannot be deleted.');
        setUserToDelete(null);
        return;
      }
      deleteUser(userToDelete.uid);
      setNotificationMsg(`User account ${userToDelete.name} deleted permanently.`);
      setUserToDelete(null);
    }
  };

  const handleBulkImport = (count: number) => {
    setNotificationMsg(`Successfully imported ${count} users into directory.`);
  };

  const columns = [
    {
      header: 'Full Name & Designation',
      accessor: (row: KalyaniUser) => (
        <div>
          <p className="font-bold text-slate-100">{row.name}</p>
          <p className="text-xs text-slate-400">{row.designation}</p>
        </div>
      ),
    },
    {
      header: 'College Email',
      accessor: (row: KalyaniUser) => <span className="text-xs text-slate-300">{row.email}</span>,
    },
    {
      header: 'Department',
      accessor: (row: KalyaniUser) => {
        if (row.role === 'ADMIN') {
          return <span className="text-xs text-slate-400 font-medium italic">Global (Institution)</span>;
        }
        const dept = departments.find((d) => d.id === row.departmentId);
        return (
          <span className="text-xs text-rose-700 dark:text-rose-300 font-semibold">
            {dept?.code || row.departmentId || '—'}
          </span>
        );
      },
    },
    {
      header: 'Role & Authorization',
      accessor: (row: KalyaniUser) => {
        let label = 'Faculty';
        let badgeStyle = 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';

        if (row.role === 'ADMIN') {
          label = 'Admin';
          badgeStyle = 'bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300';
        } else if (row.role === 'HOD' && row.hodType !== 'AHOD') {
          label = 'Head of Dept (HOD)';
          badgeStyle = 'bg-pink-50 dark:bg-pink-950/60 border-pink-300 dark:border-pink-500/40 text-pink-800 dark:text-pink-300';
        } else if (row.hodType === 'AHOD') {
          label = 'Assistant HOD (AHOD)';
          badgeStyle = 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300';
        }

        return (
          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${badgeStyle}`}>
            {label}
          </span>
        );
      },
    },
    {
      header: 'Status',
      accessor: (row: KalyaniUser) => (
        <span
          className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
            row.active
              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
              : 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30'
          }`}
        >
          {row.active ? 'Active' : 'Disabled'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: KalyaniUser) => {
        const isAdminAccount = row.role === 'ADMIN' || row.uid === currentUser?.uid || row.uid === 'usr_admin';

        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => openEditModal(row)}
              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 transition-colors"
              title="Edit User"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            {!isAdminAccount ? (
              <>
                <button
                  onClick={() => setUserToToggle(row)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    row.active
                      ? 'hover:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  }`}
                  title={row.active ? 'Deactivate User' : 'Activate User'}
                >
                  <Power className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setUserToDelete(row)}
                  className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
                  title="Delete User Permanently"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <span
                className="px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 rounded-md border border-rose-200 dark:border-rose-500/20 flex items-center gap-1"
                title="Institutional Administrator account is protected from deactivation and deletion."
              >
                <Shield className="w-3 h-3 text-rose-500" />
                Protected
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400 z-10 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, designation…"
              className="w-full h-11 bg-white dark:bg-[#180E1C] border border-rose-200 dark:border-rose-900/40 text-slate-800 dark:text-slate-100 text-xs sm:text-sm rounded-2xl pl-10 pr-4 py-2.5 outline-none focus:border-rose-400"
            />
          </div>

          <div className="w-36 sm:w-44 shrink-0">
            <KalyaniSelect
              value={roleFilter}
              onChange={(val) => setRoleFilter(val)}
              options={[
                { value: 'ALL', label: 'All Roles' },
                { value: 'HOD', label: 'Head of Dept (HOD)' },
                { value: 'AHOD', label: 'Assistant HOD (AHOD)' },
                { value: 'FACULTY', label: 'Faculty' },
              ]}
            />
          </div>

          <div className="w-36 sm:w-40 shrink-0">
            <KalyaniSelect
              value={deptFilter}
              onChange={(val) => setDeptFilter(val)}
              options={[
                { value: 'ALL', label: 'All Depts' },
                ...departments.map((d) => ({
                  value: d.id,
                  label: d.code,
                  sublabel: d.name,
                })),
              ]}
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <KalyaniButton
            variant="glass"
            className="h-11 px-4 text-xs font-semibold rounded-2xl flex items-center"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={async () => {
              try {
                const targetUsers = filteredUsers.length > 0 ? filteredUsers : (users || []).filter((u) => u.role !== 'ADMIN');
                const deptLabel = deptFilter !== 'ALL' ? deptFilter : 'All_Depts';
                const msg = await excelService.exportUserDirectory(targetUsers, `SPECTRA_Users_${deptLabel}`);
                setNotificationMsg(msg);
              } catch (e: any) {
                setNotificationMsg(`Export failed: ${e?.message || 'unknown error'}`);
              }
            }}
          >
            Export XLS
          </KalyaniButton>

          <KalyaniButton
            variant="outline-gold"
            className="h-11 px-4 text-xs font-semibold rounded-2xl flex items-center"
            leftIcon={<FileSpreadsheet className="w-4 h-4" />}
            onClick={() => setIsImportModalOpen(true)}
          >
            Excel Bulk Upload
          </KalyaniButton>

          <KalyaniButton
            variant="gold"
            className="h-11 px-4 text-xs font-semibold rounded-2xl flex items-center"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={openAddModal}
          >
            Add User
          </KalyaniButton>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Users Table */}
      <KalyaniTable
        columns={columns}
        data={filteredUsers}
        keyExtractor={(row) => row.uid}
        emptyMessage="No institutional users match specified filters."
      />

      {/* Add / Edit Modal */}
      {(isAddModalOpen || editingUser) && (
        <KalyaniModal
          isOpen={isAddModalOpen || Boolean(editingUser)}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingUser(null);
          }}
          maxWidth="md"
          title={editingUser ? 'Edit Institutional User' : 'Register New Institutional User'}
          subtitle="Identity & Role Authorization"
          footer={
            <>
              <KalyaniButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingUser(null);
                }}
              >
                Cancel
              </KalyaniButton>
              <KalyaniButton variant="gold" size="sm" onClick={handleSaveUser}>
                {editingUser ? 'Save User' : 'Create User'}
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
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Spectra"
              required
            />

            <KalyaniInput
              label="College Email ID"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. spectra.cse@krce.ac.in"
              required
            />

            <KalyaniSelect
              label="Department"
              value={departmentId}
              onChange={(val) => setDepartmentId(val)}
              options={departments.map((d) => ({
                value: d.id,
                label: `${d.code} - ${d.name}`,
              }))}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <KalyaniSelect
                label="System Role"
                value={selectedRoleType}
                onChange={(val) => handleRoleTypeChange(val as any)}
                options={[
                  { value: 'FACULTY', label: 'Faculty' },
                  { value: 'AHOD', label: 'Assistant HOD (AHOD)' },
                  { value: 'HOD', label: 'Head of Dept (HOD)' },
                ]}
              />

              <KalyaniInput
                label="Academic Designation"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Assistant HOD / Professor"
                required
              />
            </div>
          </div>
        </KalyaniModal>
      )}

      {/* Toggle Confirm Dialog */}
      <KalyaniConfirmDialog
        isOpen={Boolean(userToToggle)}
        onClose={() => setUserToToggle(null)}
        onConfirm={handleConfirmToggleActive}
        variant={userToToggle?.active ? 'danger' : 'teal'}
        title={userToToggle?.active ? 'Deactivate User' : 'Activate User'}
        message={
          userToToggle?.active
            ? `Are you sure you want to deactivate ${userToToggle.name}? They will no longer be able to log in or appear in active period rosters.`
            : `Re-activating ${userToToggle?.name} will restore their login access.`
        }
        confirmText={userToToggle?.active ? 'Deactivate' : 'Activate'}
      />

      {/* Delete User Confirm Dialog */}
      <KalyaniConfirmDialog
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
        variant="danger"
        title="Delete User Account"
        message={`Are you sure you want to permanently delete ${userToDelete?.name} (${userToDelete?.email})? This action cannot be undone and will remove the account from the directory and Firebase database.`}
        confirmText="Delete Account"
      />

      {/* Bulk Excel Modal */}
      <ExcelUserImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingUsers={users}
        onImportSuccess={handleBulkImport}
      />
    </div>
  );
};
