import React from 'react';
import { KalyaniPageHeader } from '../../components/common/KalyaniPageHeader';
import { KalyaniStatCard } from '../../components/common/KalyaniStatCard';
import { KalyaniCard } from '../../components/common/KalyaniCard';
import { KalyaniButton } from '../../components/common/KalyaniButton';
import { useAppStore } from '../../store/useAppStore';
import { Users, Building2, Clock, BookOpen, ShieldCheck, ArrowRight } from 'lucide-react';

interface AdminDashboardPageProps {
  onNavigate: (path: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const users = useAppStore((state) => state.users);
  const departments = useAppStore((state) => state.departments);
  const periods = useAppStore((state) => state.periods);
  const subjects = useAppStore((state) => state.subjects);

  const activeUsers = users.filter((u) => u.active).length;
  const activeDepts = departments.filter((d) => d.active).length;
  const activePeriods = periods.filter((p) => p.active).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <KalyaniPageHeader
        title="Institutional System Administration"
        subtitle="Global administrative control, institutional directories, department configurations, and access security."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Overview' }]}
        badge={
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300">
            System Administrator
          </span>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KalyaniStatCard
          title="Active Users"
          value={activeUsers}
          subtitle="Faculty &amp; Administrators"
          variant="gold"
          icon={<Users className="w-6 h-6 text-kalyani-gold-300" />}
          onClick={() => onNavigate('/admin/users')}
        />

        <KalyaniStatCard
          title="Departments"
          value={activeDepts}
          subtitle="Configured Faculties"
          variant="emerald"
          icon={<Building2 className="w-6 h-6 text-emerald-400" />}
          onClick={() => onNavigate('/admin/departments')}
        />

        <KalyaniStatCard
          title="Active Periods"
          value={activePeriods}
          subtitle="Dynamic Timetable Slots"
          variant="teal"
          icon={<Clock className="w-6 h-6 text-teal-400" />}
          onClick={() => onNavigate('/admin/periods')}
        />

        <KalyaniStatCard
          title="Subject Master"
          value={subjects.filter((s) => s.active).length}
          subtitle="Official Courses"
          variant="ruby"
          icon={<BookOpen className="w-6 h-6 text-rose-400" />}
          onClick={() => onNavigate('/hod/subjects')}
        />
      </div>

      {/* Quick Launchpad Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <KalyaniCard
          variant="glass"
          title="User Directory & XLS"
          subtitle="Manage institutional accounts, roles, and Excel bulk user imports."
          action={
            <KalyaniButton
              variant="outline-gold"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => onNavigate('/admin/users')}
            >
              Open
            </KalyaniButton>
          }
        >
          <p className="text-xs text-slate-300 leading-relaxed">
            Register new faculty members, activate/deactivate accounts, and import entire college faculties with duplicate email detection.
          </p>
        </KalyaniCard>

        <KalyaniCard
          variant="glass"
          title="HOD & AHOD Leadership"
          subtitle="Designate departmental heads and assistant managers."
          action={
            <KalyaniButton
              variant="outline-gold"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => onNavigate('/admin/hod-management')}
            >
              Open
            </KalyaniButton>
          }
        >
          <p className="text-xs text-slate-300 leading-relaxed">
            Assign HODs and AHODs for each academic department. Designated users automatically receive department monitoring authority.
          </p>
        </KalyaniCard>

        <KalyaniCard
          variant="glass"
          title="Global Configuration"
          subtitle="Domain whitelist & academic defaults."
          action={
            <KalyaniButton
              variant="outline-gold"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => onNavigate('/admin/settings')}
            >
              Open
            </KalyaniButton>
          }
        >
          <p className="text-xs text-slate-300 leading-relaxed">
            Configure Google Sign-In domain enforcement, institution branding name, academic semester cycles, and cloud synchronization settings.
          </p>
        </KalyaniCard>
      </div>
    </div>
  );
};
