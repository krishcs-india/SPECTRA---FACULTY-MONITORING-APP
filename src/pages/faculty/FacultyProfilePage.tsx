import React from 'react';
import { KalyaniPageHeader } from '../../components/common/KalyaniPageHeader';
import { KalyaniCard } from '../../components/common/KalyaniCard';
import { KalyaniBadge } from '../../components/common/KalyaniBadge';
import { useAuth } from '../../hooks/useAuth';
import { User, Mail, Building, Briefcase, Shield, CheckCircle2, Lock } from 'lucide-react';

export const FacultyProfilePage: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const isHod = currentUser.role === 'HOD' && currentUser.hodType !== 'AHOD';
  const isAdmin = currentUser.role === 'ADMIN';
  const roleLabel = isAdmin ? 'Administrator' : isHod ? 'HOD' : currentUser.hodType === 'AHOD' ? 'Assistant HOD' : 'Faculty';

  const pageTitle = isAdmin
    ? 'Administrator Profile'
    : isHod
    ? 'Head of Department Profile'
    : currentUser.hodType === 'AHOD'
    ? 'Assistant HOD Profile'
    : 'Faculty Academic Profile';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <KalyaniPageHeader
        title={pageTitle}
        subtitle="Your institutional credentials, departmental leadership, and academic authorization record."
        breadcrumbs={[{ label: roleLabel }, { label: 'Profile' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Avatar Card */}
        <KalyaniCard
          variant="elevated"
          bodyClassName="p-8 flex flex-col items-center justify-center text-center"
        >
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-kalyani-crimson-800 via-kalyani-gold-600 to-kalyani-gold-400 border-2 border-kalyani-gold-300/80 p-1 shadow-[0_0_35px_rgba(212,175,55,0.35)] mb-4 flex items-center justify-center mx-auto">
            <div className="w-full h-full rounded-[22px] bg-kalyani-crimson-950 flex items-center justify-center text-center p-0 m-0">
              <span className="text-4xl font-bold font-marcellus text-gold-radiant leading-none flex items-center justify-center select-none">
                {currentUser.name.charAt(0)}
              </span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-normal font-cursive text-slate-100 tracking-wide">
            {currentUser.name}
          </h2>
          <p className="text-xs text-kalyani-gold-300 font-semibold mt-1">
            {currentUser.hodType === 'AHOD' ? 'Assistant HOD' : currentUser.designation}
          </p>

          <div className="mt-5 flex flex-wrap gap-2 justify-center">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-kalyani-gold-500/20 border border-kalyani-gold-500/40 text-kalyani-gold-300">
              Role: {currentUser.hodType === 'AHOD' ? 'Assistant HOD' : currentUser.role}
            </span>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active
            </span>
          </div>
        </KalyaniCard>

        {/* Right: Detailed Fields */}
        <div className="lg:col-span-2 space-y-4">
          <KalyaniCard variant="glass" title="Academic Record & Identity">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-2xl bg-kalyani-crimson-950/60 border border-kalyani-gold-500/15">
                <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-kalyani-gold-400" /> Full Name
                </p>
                <p className="text-sm font-semibold text-slate-100 mt-1">{currentUser.name}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-kalyani-crimson-950/60 border border-kalyani-gold-500/15">
                <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-kalyani-gold-400" /> College Email ID
                </p>
                <p className="text-sm font-semibold text-slate-100 mt-1">{currentUser.email}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-kalyani-crimson-950/60 border border-kalyani-gold-500/15">
                <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-kalyani-gold-400" /> Assigned Department
                </p>
                <p className="text-sm font-semibold text-slate-100 mt-1">
                  {currentUser.departmentName || 'Computer Science & Engineering'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-kalyani-crimson-950/60 border border-kalyani-gold-500/15">
                <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-kalyani-gold-400" /> Academic Designation
                </p>
                <p className="text-sm font-semibold text-slate-100 mt-1">
                  {currentUser.hodType === 'AHOD' ? 'Assistant HOD' : currentUser.designation}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-kalyani-crimson-950/60 border border-kalyani-gold-500/15 sm:col-span-2">
                <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-kalyani-gold-400" /> System Authorization
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  System Role:{' '}
                  <span className="text-kalyani-gold-300 font-semibold">
                    {currentUser.hodType === 'AHOD' ? 'Assistant HOD' : currentUser.role}
                  </span>
                  . Departmental assignments, designations, and permissions are managed centrally by the Academic Administrator.
                </p>
              </div>
            </div>

            <div className="mt-5 p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-400 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-500 shrink-0" />
              <span>To update your academic designation or department mapping, please submit a request to the Chief Administrator.</span>
            </div>
          </KalyaniCard>
        </div>
      </div>
    </div>
  );
};
