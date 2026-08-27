import React, { useState, useEffect } from 'react';
import { Department } from '../../types/department';
import { KalyaniCard } from '../common/KalyaniCard';
import { KalyaniButton } from '../common/KalyaniButton';
import { KalyaniInput } from '../common/KalyaniInput';
import { KalyaniModal } from '../common/KalyaniModal';
import { KalyaniConfirmDialog } from '../common/KalyaniConfirmDialog';
import { KalyaniTable } from '../common/KalyaniTable';
import { useAppStore } from '../../store/useAppStore';
import { Building2, Plus, Edit2, Power, Trash2, CheckCircle2 } from 'lucide-react';

export const DepartmentManager: React.FC = () => {
  const departments = useAppStore((state) => state.departments);
  const users = useAppStore((state) => state.users);
  const addDepartment = useAppStore((state) => state.addDepartment);
  const updateDepartment = useAppStore((state) => state.updateDepartment);
  const deleteDepartment = useAppStore((state) => state.deleteDepartment);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptToToggle, setDeptToToggle] = useState<Department | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (notificationMsg) {
      const timer = setTimeout(() => setNotificationMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notificationMsg]);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const openAddModal = () => {
    setName('');
    setCode('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (d: Department) => {
    setEditingDept(d);
    setName(d.name);
    setCode(d.code);
    setFormError(null);
  };

  const handleSaveDept = () => {
    if (!name.trim() || !code.trim()) {
      setFormError('Department Name and Code are required.');
      return;
    }

    const cleanCode = code.trim().toUpperCase();

    if (editingDept) {
      updateDepartment(editingDept.id, {
        name: name.trim(),
        code: cleanCode,
      });
      setEditingDept(null);
      setNotificationMsg(`Department ${cleanCode} updated successfully.`);
    } else {
      if (departments.some((d) => d.code.toUpperCase() === cleanCode || d.id.toUpperCase() === cleanCode)) {
        setFormError(`Department Code ${cleanCode} already exists.`);
        return;
      }

      addDepartment({
        name: name.trim(),
        code: cleanCode,
        active: true,
      });
      setIsAddModalOpen(false);
      setNotificationMsg(`Department ${cleanCode} created successfully.`);
    }
  };

  const handleConfirmToggle = () => {
    if (deptToToggle) {
      updateDepartment(deptToToggle.id, { active: !deptToToggle.active });
      setNotificationMsg(`Department ${deptToToggle.code} status updated.`);
      setDeptToToggle(null);
    }
  };

  const handleConfirmDelete = () => {
    if (deptToDelete) {
      deleteDepartment(deptToDelete.id);
      setNotificationMsg(`Department ${deptToDelete.code} deleted permanently.`);
      setDeptToDelete(null);
    }
  };

  const columns = [
    {
      header: 'Code',
      accessor: (row: Department) => (
        <span className="px-2 py-0.5 rounded font-bold text-xs bg-kalyani-crimson-900 border border-kalyani-gold-500/30 text-kalyani-gold-300">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Department Full Title',
      accessor: (row: Department) => <span className="font-semibold text-slate-100">{row.name}</span>,
    },
    {
      header: 'Head of Dept (HOD)',
      accessor: (row: Department) => {
        const hodUser = users.find((u) => u.uid === row.hodUid) || 
                        users.find((u) => (u.departmentId === row.id || u.departmentId === row.code) && u.role === 'HOD' && u.hodType !== 'AHOD' && u.active);
        return (
          <span className="text-xs text-slate-300 font-medium">
            {hodUser ? hodUser.name : row.hodName || '—'}
          </span>
        );
      },
    },
    {
      header: 'Assistant HODs (AHODs)',
      accessor: (row: Department) => {
        const ahodUsers = users.filter((u) => (u.departmentId === row.id || u.departmentId === row.code) && u.hodType === 'AHOD' && u.active);
        const dynamicNames = ahodUsers.map((u) => u.name);
        const ahodList = dynamicNames.length > 0
          ? dynamicNames
          : (row.ahodUids || (row.ahodUid ? [row.ahodUid] : []))
              .map(id => users.find(u => u.uid === id)?.name)
              .filter(Boolean) as string[];

        if (ahodList.length === 0) return <span className="text-xs text-slate-500 italic">None</span>;

        return (
          <div className="flex flex-wrap gap-1">
            {ahodList.map((name, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-500/30 text-amber-300 text-[11px]">
                {name}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: (row: Department) => (
        <span
          className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
            row.active
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900 border-slate-700 text-slate-400'
          }`}
        >
          {row.active ? 'Active' : 'Disabled'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: Department) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 rounded-lg hover:bg-kalyani-gold-500/20 text-kalyani-gold-300 transition-colors"
            title="Edit Department"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeptToToggle(row)}
            className={`p-1.5 rounded-lg transition-colors ${
              row.active
                ? 'hover:bg-rose-500/20 text-rose-400'
                : 'hover:bg-emerald-500/20 text-emerald-400'
            }`}
            title={row.active ? 'Disable' : 'Enable'}
          >
            <Power className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeptToDelete(row)}
            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors"
            title="Delete Department"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Institutional departments configured in the Kalyani system.
        </p>

        <KalyaniButton
          variant="gold"
          className="h-11 px-4 text-xs font-semibold rounded-2xl flex items-center shadow-gold-sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={openAddModal}
        >
          Add Department
        </KalyaniButton>
      </div>

      {notificationMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      <KalyaniTable
        columns={columns}
        data={departments}
        keyExtractor={(row) => row.id}
        emptyMessage="No departments configured."
      />

      {(isAddModalOpen || editingDept) && (
        <KalyaniModal
          isOpen={isAddModalOpen || Boolean(editingDept)}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingDept(null);
          }}
          maxWidth="md"
          title={editingDept ? 'Edit Department' : 'Register New Department'}
          subtitle="Academic Department Record"
          footer={
            <>
              <KalyaniButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingDept(null);
                }}
              >
                Cancel
              </KalyaniButton>
              <KalyaniButton variant="gold" size="sm" onClick={handleSaveDept}>
                {editingDept ? 'Save Changes' : 'Create Department'}
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
              label="Department Code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. CSE or AIDS or ECE"
              required
            />

            <KalyaniInput
              label="Full Department Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Computer Science & Engineering"
              required
            />
          </div>
        </KalyaniModal>
      )}

      <KalyaniConfirmDialog
        isOpen={Boolean(deptToToggle)}
        onClose={() => setDeptToToggle(null)}
        onConfirm={handleConfirmToggle}
        variant={deptToToggle?.active ? 'danger' : 'teal'}
        title={deptToToggle?.active ? 'Disable Department' : 'Enable Department'}
        message={`Are you sure you want to change the status of ${deptToToggle?.name}?`}
        confirmText={deptToToggle?.active ? 'Disable' : 'Enable'}
      />

      <KalyaniConfirmDialog
        isOpen={Boolean(deptToDelete)}
        onClose={() => setDeptToDelete(null)}
        onConfirm={handleConfirmDelete}
        variant="danger"
        title="Delete Department"
        message={`Are you sure you want to permanently delete ${deptToDelete?.name} (${deptToDelete?.code})? This action will remove it from Firebase.`}
        confirmText="Delete Department"
      />
    </div>
  );
};
