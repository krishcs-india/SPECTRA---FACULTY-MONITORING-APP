import React, { useState, useEffect } from 'react';
import { KalyaniCard } from '../common/KalyaniCard';
import { KalyaniButton } from '../common/KalyaniButton';
import { KalyaniSelect } from '../common/KalyaniSelect';
import { KalyaniModal } from '../common/KalyaniModal';
import { useAppStore } from '../../store/useAppStore';
import { Department } from '../../types/department';
import { UserCheck, Sparkles, Plus, Trash2, CheckCircle2, Shield, Users } from 'lucide-react';

export const HodAssignmentManager: React.FC = () => {
  const departments = useAppStore((state) => state.departments);
  const users = useAppStore((state) => state.users);
  const assignHod = useAppStore((state) => state.assignHod);
  const removeAhod = useAppStore((state) => state.removeAhod);

  const [selectedDeptForAssign, setSelectedDeptForAssign] = useState<Department | null>(null);
  const [assignType, setAssignType] = useState<'HOD' | 'AHOD'>('HOD');
  const [selectedUserUid, setSelectedUserUid] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const openAssignModal = (dept: Department, type: 'HOD' | 'AHOD') => {
    setSelectedDeptForAssign(dept);
    setAssignType(type);
    setSelectedUserUid('');
  };

  const handleSaveAssignment = () => {
    if (!selectedDeptForAssign || !selectedUserUid) return;

    assignHod(selectedDeptForAssign.id, selectedUserUid, assignType);
    const user = users.find((u) => u.uid === selectedUserUid);
    setSuccessMsg(
      `Successfully appointed ${user?.name || 'faculty'} as ${assignType} for ${selectedDeptForAssign.name}.`
    );
    setSelectedDeptForAssign(null);
  };

  const handleRemoveAhod = (deptId: string, userUid: string, userName?: string) => {
    removeAhod(deptId, userUid);
    setSuccessMsg(`Removed ${userName || 'AHOD'} from department leadership.`);
  };

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {departments.map((dept) => {
          const hodUser =
            users.find((u) => u.uid === dept.hodUid && u.active) ||
            users.find((u) => u.departmentId === dept.id && u.role === 'HOD' && u.hodType !== 'AHOD' && u.active);

          // Resolve all multiple AHODs for this department dynamically
          const directAhodUsers = users.filter((u) => u.departmentId === dept.id && u.hodType === 'AHOD' && u.active);
          const ahodUids = dept.ahodUids || (dept.ahodUid ? [dept.ahodUid] : []);
          const mappedAhodUsers = ahodUids
            .map((uid) => users.find((u) => u.uid === uid && u.active))
            .filter(Boolean);

          const ahodUsers = directAhodUsers.length > 0 ? directAhodUsers : mappedAhodUsers;

          return (
            <KalyaniCard
              key={dept.id}
              variant="card"
              title={`${dept.name} (${dept.code})`}
              subtitle="Department Leadership Assignments"
            >
              <div className="space-y-4">
                {/* Head of Department (HOD) Section */}
                <div className="p-4 rounded-2xl bg-kalyani-crimson-950/70 border border-kalyani-gold-500/25 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-kalyani-gold-500/10 border border-kalyani-gold-500/20 text-kalyani-gold-400 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-kalyani-gold-300 tracking-wider">
                        Head of Department (HOD)
                      </p>
                      <p className="text-sm font-bold text-slate-100 mt-0.5 font-marcellus">
                        {hodUser ? (
                          <span className="font-marcellus text-base text-gold-gradient font-bold">{hodUser.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Not Assigned</span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400">{hodUser?.email || '—'}</p>
                    </div>
                  </div>

                  <KalyaniButton
                    variant="outline-gold"
                    size="sm"
                    onClick={() => openAssignModal(dept, 'HOD')}
                  >
                    {hodUser ? 'Reassign' : 'Assign HOD'}
                  </KalyaniButton>
                </div>

                {/* Assistant HODs (AHODs) Section - MULTIPLE AHODs SUPPORT */}
                <div className="p-4 rounded-2xl bg-kalyani-crimson-950/70 border border-kalyani-gold-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-teal-500/10 text-teal-300">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-teal-300 tracking-wider flex items-center gap-1.5">
                          <span>Assistant HODs (AHOD)</span>
                          <span className="px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-200 text-[9px]">
                            {ahodUsers.length} Appointed
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-400">Multiple AHODs can be appointed per department</p>
                      </div>
                    </div>

                    <KalyaniButton
                      variant="glass"
                      size="sm"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                      onClick={() => openAssignModal(dept, 'AHOD')}
                    >
                      Add AHOD
                    </KalyaniButton>
                  </div>

                  {/* List of currently appointed AHODs */}
                  {ahodUsers.length === 0 ? (
                    <div className="p-3 rounded-xl bg-black/20 border border-white/5 text-center text-xs text-slate-400 italic">
                      No Assistant HODs currently appointed for {dept.code}. Click "Add AHOD" to appoint.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {ahodUsers.map((ahod) => {
                        if (!ahod) return null;
                        return (
                          <div
                            key={ahod.uid}
                            className="p-3 rounded-xl bg-kalyani-crimson-900/60 border border-teal-500/25 flex items-center justify-between gap-3 animate-in fade-in"
                          >
                            <div>
                              <p className="text-sm font-semibold font-marcellus text-slate-100">
                                {ahod.name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {ahod.designation} • {ahod.email}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveAhod(dept.id, ahod.uid, ahod.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all text-xs flex items-center gap-1"
                              title="Remove AHOD"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Remove</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </KalyaniCard>
          );
        })}
      </div>

      {/* Assignment Modal */}
      {selectedDeptForAssign && (
        <KalyaniModal
          isOpen={Boolean(selectedDeptForAssign)}
          onClose={() => setSelectedDeptForAssign(null)}
          maxWidth="md"
          title={
            assignType === 'HOD'
              ? `Assign Head of Department (HOD) — ${selectedDeptForAssign.code}`
              : `Appoint Assistant HOD (AHOD) — ${selectedDeptForAssign.code}`
          }
          subtitle={`Designate academic leadership for ${selectedDeptForAssign.name}`}
          footer={
            <>
              <KalyaniButton variant="ghost" size="sm" onClick={() => setSelectedDeptForAssign(null)}>
                Cancel
              </KalyaniButton>
              <KalyaniButton
                variant="gold"
                size="sm"
                onClick={handleSaveAssignment}
                disabled={!selectedUserUid}
              >
                Confirm Appointment
              </KalyaniButton>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              {assignType === 'HOD'
                ? `Select a registered faculty member to serve as the Head of Department:`
                : `Select a faculty member to appoint as an Assistant HOD (AHOD) for ${selectedDeptForAssign.name}:`}
            </p>

            <KalyaniSelect
              label="Select Faculty Member"
              value={selectedUserUid}
              onChange={(val) => setSelectedUserUid(val)}
              placeholder="— Choose faculty member —"
              options={[
                { value: '', label: '— Select Faculty —' },
                ...users
                  .filter((u) => u.active && u.role !== 'ADMIN')
                  .map((u) => ({
                    value: u.uid,
                    label: `${u.name} (${u.designation})`,
                    sublabel: u.email,
                  })),
              ]}
            />

            {assignType === 'AHOD' && (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 text-[11px] text-amber-200 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  This faculty member will be designated with the Assistant HOD title and submit daily availability schedules.
                </span>
              </div>
            )}
          </div>
        </KalyaniModal>
      )}
    </div>
  );
};
