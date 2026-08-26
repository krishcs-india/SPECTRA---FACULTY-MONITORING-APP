import React from 'react';
import { KalyaniPageHeader } from '../../components/common/KalyaniPageHeader';
import { GlobalSettingsPanel } from '../../components/admin/GlobalSettingsPanel';

export const AdminSettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <KalyaniPageHeader
        title="Global Institutional & System Settings"
        subtitle="Configure institution credentials, Google account domain restrictions, and academic parameters."
        breadcrumbs={[{ label: 'Admin' }, { label: 'System Settings' }]}
      />

      <GlobalSettingsPanel />
    </div>
  );
};
