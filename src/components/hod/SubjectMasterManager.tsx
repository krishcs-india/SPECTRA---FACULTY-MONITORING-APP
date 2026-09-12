import React, { useState, useEffect } from 'react';
import { Subject } from '../../types/subject';
import { KalyaniCard } from '../common/KalyaniCard';
import { KalyaniButton } from '../common/KalyaniButton';
import { KalyaniInput } from '../common/KalyaniInput';
import { KalyaniModal } from '../common/KalyaniModal';
import { KalyaniConfirmDialog } from '../common/KalyaniConfirmDialog';
import { KalyaniTable } from '../common/KalyaniTable';
import { ExcelSubjectImportModal } from './ExcelSubjectImportModal';
import { useSubjects } from '../../hooks/useSubjects';
import { BookOpen, Plus, Search, FileSpreadsheet, Edit2, Trash2, Power, CheckCircle2, Download, X, CheckSquare } from 'lucide-react';
import { excelService } from '../../services/excelService';

interface SubjectMasterManagerProps {
  departmentId: string;
}

export const SubjectMasterManager: React.FC<SubjectMasterManagerProps> = ({ departmentId }) => {
  const {
    subjects,
    addSubject,
    updateSubject,
    deleteSubject,
    toggleSubjectActive,
    bulkDeleteSubjects,
    bulkImportSubjects
  } = useSubjects(departmentId);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [subjectToToggle, setSubjectToToggle] = useState<Subject | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (notificationMsg) {
      const timer = setTimeout(() => setNotificationMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notificationMsg]);

  // Form states for Add / Edit
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const filteredSubjects = subjects.filter(
    (s) =>
      s.subjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredSubjects.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSubjects.map((s) => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const openAddModal = () => {
    setSubjectCode('');
    setSubjectName('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (s: Subject) => {
    setEditingSubject(s);
    setSubjectCode(s.subjectCode);
    setSubjectName(s.subjectName);
    setFormError(null);
  };

  const handleSaveSubject = () => {
    if (!subjectCode.trim() || !subjectName.trim()) {
      setFormError('Subject Code and Subject Name are required fields.');
      return;
    }

    const cleanCode = subjectCode.trim().toUpperCase();

    if (editingSubject) {
      const duplicate = subjects.find((s) => s.subjectCode.toUpperCase() === cleanCode && s.id !== editingSubject.id);
      if (duplicate) {
        setFormError(`Subject Code ${cleanCode} already exists in this department.`);
        return;
      }
      updateSubject(editingSubject.id, {
        subjectCode: cleanCode,
        subjectName: subjectName.trim(),
      });
      setEditingSubject(null);
      setNotificationMsg(`Subject ${cleanCode} updated successfully.`);
    } else {
      // Check duplicate code
      if (subjects.some((s) => s.subjectCode.toUpperCase() === cleanCode)) {
        setFormError(`Subject Code ${cleanCode} already exists in this department.`);
        return;
      }

      addSubject({
        departmentId,
        subjectCode: cleanCode,
        subjectName: subjectName.trim(),
        active: true,
      });
      setIsAddModalOpen(false);
      setNotificationMsg(`Subject ${cleanCode} created successfully.`);
    }
  };

  const handleConfirmPermanentDelete = () => {
    if (subjectToDelete) {
      deleteSubject(subjectToDelete.id);
      setSelectedIds((prev) => prev.filter((id) => id !== subjectToDelete.id));
      setNotificationMsg(`Subject ${subjectToDelete.subjectCode} permanently deleted from Firebase & Catalog.`);
      setSubjectToDelete(null);
    }
  };

  const handleConfirmToggleActive = () => {
    if (subjectToToggle) {
      const nextActive = !subjectToToggle.active;
      toggleSubjectActive(subjectToToggle.id, nextActive);
      setNotificationMsg(`Subject ${subjectToToggle.subjectCode} is now ${nextActive ? 'Active' : 'Disabled'}.`);
      setSubjectToToggle(null);
    }
  };

  const handleConfirmBulkDelete = () => {
    if (selectedIds.length > 0) {
      bulkDeleteSubjects(selectedIds);
      setNotificationMsg(`Permanently deleted ${selectedIds.length} selected subjects from Cloud Firestore.`);
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
    }
  };

  const handleExcelImport = (importedCount: number) => {
    setNotificationMsg(`Successfully imported ${importedCount} subjects via Excel.`);
  };

  const columns = [
    {
      header: (
        <input
          type="checkbox"
          checked={filteredSubjects.length > 0 && selectedIds.length === filteredSubjects.length}
          onChange={handleToggleSelectAll}
          className="w-4 h-4 rounded border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-rose-500 focus:ring-rose-400 cursor-pointer"
          title="Select / Deselect All Visible Subjects"
        />
      ),
      className: 'w-10 text-center',
      headerClassName: 'w-10 text-center',
      accessor: (row: Subject) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={(e) => {
            e.stopPropagation();
            handleToggleSelect(row.id);
          }}
          className="w-4 h-4 rounded border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-rose-500 focus:ring-rose-400 cursor-pointer"
        />
      ),
    },
    {
      header: 'Code',
      accessor: (row: Subject) => (
        <span className="px-2.5 py-1 rounded font-bold text-xs bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-400/30 text-rose-700 dark:text-rose-300">
          {row.subjectCode}
        </span>
      ),
    },
    {
      header: 'Subject Name',
      accessor: (row: Subject) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">{row.subjectName}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row: Subject) => (
        <span
          className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
            row.active
              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
              : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/30'
          }`}
        >
          {row.active ? 'Active' : 'Disabled'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: Subject) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-300 transition-colors"
            title="Edit Subject"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSubjectToToggle(row)}
            className={`p-1.5 rounded-lg transition-colors ${
              row.active
                ? 'hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-500'
                : 'hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-500'
            }`}
            title={row.active ? 'Disable Subject' : 'Enable Subject'}
          >
            <Power className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSubjectToDelete(row)}
            className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-500 transition-colors"
            title="Delete Subject"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500/80 z-10 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search subjects by code or title…"
            className="w-full h-11 bg-white dark:bg-[#180E1C] border border-rose-200 dark:border-rose-900/50 text-slate-800 dark:text-slate-100 text-sm rounded-2xl pl-10 pr-4 py-2.5 outline-none focus:border-rose-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <KalyaniButton
            variant="glass"
            className="h-11 px-4 text-xs font-semibold rounded-2xl flex items-center"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={async () => {
              try {
                setNotificationMsg(await excelService.downloadSubjectTemplate());
              } catch (e: any) {
                setNotificationMsg(`Template download failed: ${e?.message || 'unknown error'}`);
              }
            }}
          >
            Template
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
            Add Subject
          </KalyaniButton>
        </div>
      </div>

      {/* Batch Selection Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#201026] border border-rose-200 dark:border-rose-900/50 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 text-white shadow-sm">
              {selectedIds.length} Selected
            </span>
            <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">
              Apply bulk operations to selected department subjects
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <KalyaniButton
              variant="ruby"
              size="sm"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => setIsBulkDeleteModalOpen(true)}
            >
              Delete Selected ({selectedIds.length})
            </KalyaniButton>
            <KalyaniButton
              variant="ghost"
              size="sm"
              leftIcon={<X className="w-3.5 h-3.5" />}
              onClick={() => setSelectedIds([])}
            >
              Deselect All
            </KalyaniButton>
          </div>
        </div>
      )}

      {notificationMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Subjects Table */}
      <KalyaniTable
        columns={columns}
        data={filteredSubjects}
        keyExtractor={(row) => row.id}
        emptyMessage="No subjects found in official master."
      />

      {/* Add / Edit Modal */}
      {(isAddModalOpen || editingSubject) && (
        <KalyaniModal
          isOpen={isAddModalOpen || Boolean(editingSubject)}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingSubject(null);
          }}
          maxWidth="md"
          title={editingSubject ? 'Edit Official Subject' : 'Add New Department Subject'}
          subtitle="Department Subject Master Record"
          footer={
            <>
              <KalyaniButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingSubject(null);
                }}
              >
                Cancel
              </KalyaniButton>
              <KalyaniButton variant="gold" size="sm" onClick={handleSaveSubject}>
                {editingSubject ? 'Save Changes' : 'Create Subject'}
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
              label="Subject Code"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
              placeholder="e.g. CS501"
              required
            />

            <KalyaniInput
              label="Official Subject Name"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. Database Management Systems (DBMS)"
              required
            />
          </div>
        </KalyaniModal>
      )}

      {/* Single Subject Permanent Delete Confirm Dialog */}
      <KalyaniConfirmDialog
        isOpen={Boolean(subjectToDelete)}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={handleConfirmPermanentDelete}
        variant="danger"
        title="Permanently Delete Subject"
        message={`Are you sure you want to permanently delete "${subjectToDelete?.subjectCode} - ${subjectToDelete?.subjectName}"? This will permanently rip this record from Cloud Firestore and the institution catalog.`}
        confirmText="Delete Permanently"
      />

      {/* Bulk Delete Confirm Dialog */}
      <KalyaniConfirmDialog
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        variant="danger"
        title="Bulk Delete Subjects"
        message={`Are you sure you want to permanently delete all ${selectedIds.length} selected subjects? This action is irreversible and will purge these documents entirely from Cloud Firestore.`}
        confirmText={`Delete ${selectedIds.length} Subjects`}
      />

      {/* Single Subject Toggle Active/Disabled Confirm Dialog */}
      <KalyaniConfirmDialog
        isOpen={Boolean(subjectToToggle)}
        onClose={() => setSubjectToToggle(null)}
        onConfirm={handleConfirmToggleActive}
        variant={subjectToToggle?.active ? 'danger' : 'teal'}
        title={subjectToToggle?.active ? 'Deactivate Subject' : 'Activate Subject'}
        message={
          subjectToToggle?.active
            ? `Deactivating ${subjectToToggle.subjectCode} will hide it from future faculty schedule selectors, but retain existing records.`
            : `Activating ${subjectToToggle?.subjectCode} will make it immediately selectable by faculty.`
        }
        confirmText={subjectToToggle?.active ? 'Deactivate' : 'Activate'}
      />

      {/* Excel Bulk Import Modal */}
      <ExcelSubjectImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        departmentId={departmentId}
        existingSubjects={subjects}
        onImportSuccess={handleExcelImport}
      />
    </div>
  );
};
