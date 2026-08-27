import React from 'react';
import { KalyaniPageHeader } from '../../components/common/KalyaniPageHeader';
import { GlobalSettingsPanel } from '../../components/admin/GlobalSettingsPanel';

export const AdminSettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <KalyaniPageHeader
        title="Global Institutional & System Settings"
        subtitle="Configure college branding, authorized institutional email domain, and system maintenance."
        breadcrumbs={[{ label: 'Admin' }, { label: 'System Settings' }]}
      />

      <GlobalSettingsPanel />
    </div>
  );
};
