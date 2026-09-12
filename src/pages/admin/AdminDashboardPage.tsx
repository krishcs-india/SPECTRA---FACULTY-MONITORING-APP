import React from 'react';
import { KalyaniPageHeader } from '../../components/common/KalyaniPageHeader';
import { KalyaniStatCard } from '../../components/common/KalyaniStatCard';
import { KalyaniCard } from '../../components/common/KalyaniCard';
import { KalyaniButton } from '../../components/common/KalyaniButton';
import { useAppStore } from '../../store/useAppStore';
import { Users, Building2, Sparkles, ArrowRight } from 'lucide-react';

interface AdminDashboardPageProps {
  onNavigate: (path: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const users = useAppStore((state) => state.users || []);
  const departments = useAppStore((state) => state.departments || []);

  const activeUsers = (users || []).filter(
    (u) => u && u.active !== false && u.role !== 'ADMIN' && u.uid !== 'usr_admin'
  ).length;
  const activeDepts = (departments || []).filter((d) => d && d.active !== false).length;
  const hodCount = (departments || []).filter((d) => d && Boolean(d.hodUid || d.hodName)).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <KalyaniPageHeader
        title="Institutional System Administration"
        subtitle="Global administrative control, institutional directories, department configurations, and access security."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Overview' }]}
        badge={
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300">
            System Administrator
          </span>
        }
      />

      {/* 3 Core Admin Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <KalyaniStatCard
          title="Active Users"
          value={activeUsers}
          subtitle="Faculty &amp; Staff"
          variant="gold"
          icon={<Users className="w-6 h-6 text-rose-500" />}
          onClick={() => onNavigate('/admin/users')}
        />

        <KalyaniStatCard
          title="Departments"
          value={activeDepts}
          subtitle="Academic Branches"
          variant="emerald"
          icon={<Building2 className="w-6 h-6 text-emerald-400" />}
          onClick={() => onNavigate('/admin/departments')}
        />

        <KalyaniStatCard
          title="Appointed HODs"
          value={hodCount}
          subtitle="Department Leaders"
          variant="teal"
          icon={<Sparkles className="w-6 h-6 text-teal-400" />}
          onClick={() => onNavigate('/admin/hod-management')}
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
            Configure college branding, official email domain, and cloud database maintenance.
          </p>
        </KalyaniCard>
      </div>
    </div>
  );
};
