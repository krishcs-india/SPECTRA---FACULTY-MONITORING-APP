import React from 'react';
import { KalyaniPageHeader } from '../../components/common/KalyaniPageHeader';
import { UserManager } from '../../components/admin/UserManager';

export const AdminUsersPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <KalyaniPageHeader
        title="Institutional User Directory & XLS Import"
        subtitle="Manage faculty accounts, system roles (Admin, HOD, Faculty), designations, and bulk Excel imports."
        breadcrumbs={[{ label: 'Admin' }, { label: 'User Directory' }]}
      />

      <UserManager />
    </div>
  );
};
