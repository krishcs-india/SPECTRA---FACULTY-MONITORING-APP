import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/user';
import { ShieldAlert } from 'lucide-react';
import { KalyaniButton } from '../common/KalyaniButton';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  onRedirectToDefault?: () => void;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  onRedirectToDefault,
}) => {
  const { currentUser, isAuthenticated } = useAuth();

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <ShieldAlert className="w-12 h-12 text-rose-400 mb-3" />
        <h2 className="text-xl font-bold text-slate-100">Authentication Required</h2>
        <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
          Please authenticate with your college Google account to access Kalyani.
        </p>
      </div>
    );
  }

  // Check if role is authorized (AHOD is a faculty with Assistant HOD title and cannot access HOD-only sections)
  const isAuthorized = () => {
    if (currentUser.role === 'ADMIN') return true;
    if (allowedRoles.includes('HOD') && !allowedRoles.includes('FACULTY')) {
      return currentUser.role === 'HOD' && currentUser.hodType !== 'AHOD';
    }
    return allowedRoles.includes(currentUser.role);
  };

  if (!isAuthorized()) {
    const roleLabel = currentUser.hodType === 'AHOD' ? 'Assistant HOD' : currentUser.role;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Access Restricted</h2>
        <p className="text-xs text-slate-400 max-w-md mt-1 mb-6 leading-relaxed">
          Your current account role (<span className="text-kalyani-gold-300 font-semibold">{roleLabel}</span>) does not have authorization to view this section. Only the designated Head of Department (HOD) or Administrator may access this portal.
        </p>
        {onRedirectToDefault && (
          <KalyaniButton variant="gold" size="sm" onClick={onRedirectToDefault}>
            Return to Authorized Workspace
          </KalyaniButton>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
