import React from 'react';
import { KalyaniPageHeader } from '../../components/common/KalyaniPageHeader';
import { DepartmentManager } from '../../components/admin/DepartmentManager';

export const AdminDepartmentsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <KalyaniPageHeader
        title="Academic Department Management"
        subtitle="Configure institution academic faculties, departments, and active department codes."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Departments' }]}
      />

      <DepartmentManager />
    </div>
  );
};
