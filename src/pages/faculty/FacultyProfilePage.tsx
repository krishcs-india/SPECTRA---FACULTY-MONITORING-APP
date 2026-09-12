import React, { useState, useEffect } from 'react';
import { KalyaniPageHeader } from '../../components/common/KalyaniPageHeader';
import { KalyaniCard } from '../../components/common/KalyaniCard';
import { KalyaniButton } from '../../components/common/KalyaniButton';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/useAuthStore';
import { User, Mail, Building, Briefcase, Shield, CheckCircle2, Lock, Edit2, Save, X } from 'lucide-react';

export const FacultyProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const updateCurrentUserName = useAuthStore((state) => state.updateCurrentUserName);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser?.name || '');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.name) {
      setNameInput(currentUser.name);
    }
  }, [currentUser?.name]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  if (!currentUser) return null;

  const isHod = currentUser.role === 'HOD' && currentUser.hodType !== 'AHOD';
  const isAdmin = currentUser.role === 'ADMIN';
  const roleLabel = isAdmin ? 'Administrator' : isHod ? 'HOD' : currentUser.hodType === 'AHOD' ? 'Assistant HOD' : 'Faculty';

  const pageTitle = isAdmin
    ? 'System Administrator Profile'
    : isHod
    ? 'Head of Department Profile'
    : currentUser.hodType === 'AHOD'
    ? 'Assistant HOD Profile'
    : 'Faculty Academic Profile';

  const pageSubtitle = isAdmin
    ? 'Root institutional credentials, system governance, and administrative authorization record.'
    : 'Your institutional credentials, departmental leadership, and academic authorization record.';

  const handleSaveName = () => {
    const cleanName = nameInput.trim();
    if (!cleanName) return;

    updateCurrentUserName(cleanName);
    setIsEditingName(false);
    setSuccessMsg('Your name has been updated and synchronized across all portals.');
  };

  const handleCancelName = () => {
    setNameInput(currentUser.name);
    setIsEditingName(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <KalyaniPageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        breadcrumbs={[{ label: roleLabel }, { label: 'Profile' }]}
      />

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Avatar Card */}
        <KalyaniCard
          variant="elevated"
          className="h-full flex flex-col justify-center"
          bodyClassName="p-8 sm:p-10 flex flex-col items-center justify-center text-center my-auto min-h-[380px]"
        >
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-rose-600 border-2 border-rose-300/80 p-1 shadow-[0_0_35px_rgba(244,63,94,0.35)] mb-5 flex items-center justify-center mx-auto">
            <div className="w-full h-full rounded-[22px] bg-white dark:bg-[#0F0912] flex items-center justify-center text-center p-0 m-0">
              <span className="text-4xl font-bold font-marcellus text-gold-radiant leading-none flex items-center justify-center select-none">
                {currentUser.name.charAt(0)}
              </span>
            </div>
          </div>

          <h2 className={`font-semibold font-marcellus text-slate-900 dark:text-slate-100 tracking-wide break-words max-w-full px-2 ${
            currentUser.name.length > 10 ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'
          }`}>
            {currentUser.name}
          </h2>
          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1.5">
            {currentUser.hodType === 'AHOD' ? 'Assistant HOD' : currentUser.designation}
          </p>

          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300">
              Role: {isAdmin ? 'SYSTEM ADMINISTRATOR' : currentUser.hodType === 'AHOD' ? 'Assistant HOD' : currentUser.role}
            </span>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active
            </span>
          </div>
        </KalyaniCard>

        {/* Right: Detailed Fields */}
        <div className="lg:col-span-2 space-y-4">
          <KalyaniCard
            variant="glass"
            title={isAdmin ? 'Administrator Identity & Governance' : 'Academic Record & Identity'}
            subtitle={
              isAdmin
                ? 'You can directly edit and customize your administrator display name. System root privileges apply across all institutional portals.'
                : 'You can directly edit and customize your institutional name. Other core academic attributes require administrative approval.'
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Editable Name Field */}
              <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-[#180E1C] border border-rose-200 dark:border-rose-900/50 shadow-sm sm:col-span-2">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-[10px] uppercase font-bold text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-rose-500" /> Full Name (Editable)
                  </p>
                  {!isEditingName && (
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 font-semibold px-2 py-0.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Change Name</span>
                    </button>
                  )}
                </div>

                {isEditingName ? (
                  <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Enter your updated full name"
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#201026] border border-rose-300 dark:border-rose-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-rose-500 shadow-sm"
                      autoFocus
                    />
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <KalyaniButton
                        variant="gold"
                        size="sm"
                        leftIcon={<Save className="w-3.5 h-3.5" />}
                        onClick={handleSaveName}
                        disabled={!nameInput.trim() || nameInput.trim() === currentUser.name}
                      >
                        Save Name
                      </KalyaniButton>
                      <KalyaniButton
                        variant="ghost"
                        size="sm"
                        leftIcon={<X className="w-3.5 h-3.5" />}
                        onClick={handleCancelName}
                      >
                        Cancel
                      </KalyaniButton>
                    </div>
                  </div>
                ) : (
                  <p className="text-base font-semibold text-slate-800 dark:text-slate-100 font-marcellus mt-0.5">
                    {currentUser.name}
                  </p>
                )}
              </div>

              {/* Locked Email Field */}
              <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-[#180E1C]/50 border border-rose-200/80 dark:border-rose-900/40 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-rose-400" /> College Email ID
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 font-mono">{currentUser.email}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  {isAdmin ? 'Master administrator identifier' : 'Institutional login identifier'}
                </p>
              </div>

              {/* Department Field */}
              <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-[#180E1C]/50 border border-rose-200/80 dark:border-rose-900/40 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-rose-400" /> Assigned Department
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  {currentUser.departmentName || (isAdmin ? 'Institutional Administration' : 'Computer Science & Engineering')}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  {isAdmin ? 'Root Institutional Governance' : 'Managed by Administrator'}
                </p>
              </div>

              {/* Designation Field */}
              <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-[#180E1C]/50 border border-rose-200/80 dark:border-rose-900/40 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-rose-400" /> Academic Designation
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  {currentUser.hodType === 'AHOD' ? 'Assistant HOD' : currentUser.designation}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  {isAdmin ? 'Chief Administrative Authority' : 'Official Academic Position'}
                </p>
              </div>

              {/* System Role Field */}
              <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-[#180E1C]/50 border border-rose-200/80 dark:border-rose-900/40 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-rose-400" /> System Authorization
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  {isAdmin ? 'FULL SYSTEM ADMINISTRATOR' : currentUser.hodType === 'AHOD' ? 'Assistant HOD' : currentUser.role}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  {isAdmin ? 'Root Access (All Portals & System Data)' : 'Managed by Administrator'}
                </p>
              </div>
            </div>

            {isAdmin ? (
              <div className="mt-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2.5 shadow-sm">
                <Shield className="w-4 h-4 text-rose-500 shrink-0" />
                <span>The System Administrator maintains sovereign root authority across all institutional departments, faculty rosters, period structures, and system configurations.</span>
              </div>
            ) : (
              <div className="mt-5 p-3 rounded-xl bg-rose-50/50 dark:bg-white/[0.03] border border-rose-200/60 dark:border-white/5 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                <span>To update your college email, department mapping, or official designation, please contact the System Administrator.</span>
              </div>
            )}
          </KalyaniCard>
        </div>
      </div>
    </div>
  );
};
