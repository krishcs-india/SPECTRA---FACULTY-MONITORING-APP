import React from 'react';
import { KalyaniPageHeader } from '../../components/common/KalyaniPageHeader';
import { SubjectMasterManager } from '../../components/hod/SubjectMasterManager';
import { useAuth } from '../../hooks/useAuth';

export const HodSubjectsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const departmentId = currentUser?.departmentId || 'CSE';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <KalyaniPageHeader
        title="Department Subject Master"
        subtitle="Manage official courses and subjects offered by the department. Upload institutional curricula via Excel."
        breadcrumbs={[{ label: 'HOD' }, { label: 'Subject Master' }]}
      />

      <SubjectMasterManager departmentId={departmentId} />
    </div>
  );
};
