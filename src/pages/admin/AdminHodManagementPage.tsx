import React from 'react';
import { KalyaniPageHeader } from '../../components/common/KalyaniPageHeader';
import { HodAssignmentManager } from '../../components/admin/HodAssignmentManager';

export const AdminHodManagementPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <KalyaniPageHeader
        title="Department Leadership & HOD Management"
        subtitle="Appoint Heads of Department (HOD) and Assistant HODs (AHOD) for each academic department."
        breadcrumbs={[{ label: 'Admin' }, { label: 'HOD Assignments' }]}
      />

      <HodAssignmentManager />
    </div>
  );
};
