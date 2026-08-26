import React from 'react';
import { KalyaniCard } from '../../components/common/KalyaniCard';
import { KalyaniButton } from '../../components/common/KalyaniButton';
import { KalyaniMandalaBackground } from '../../components/common/KalyaniMandalaBackground';
import { KalyaniLogo } from '../../components/common/KalyaniLogo';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface UnauthorizedPageProps {
  onBackToLogin?: () => void;
}

export const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({ onBackToLogin }) => {
  const { logout } = useAuth();

  const handleReturn = () => {
    logout();
    if (onBackToLogin) onBackToLogin();
  };

  return (
    <div className="min-h-screen bg-kalyani-crimson-950 flex flex-col justify-center items-center p-4 relative overflow-hidden text-slate-100 font-sans">
      <KalyaniMandalaBackground />

      <div className="relative z-10 max-w-md w-full text-center">
        <KalyaniCard variant="elevated" className="border-rose-500/30 p-8 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-slate-100 mb-2">Unauthorized Account</h2>
          <p className="text-xs text-slate-300 leading-relaxed mb-6">
            This college account is not registered in the Kalyani authorized user directory. Please contact your department HOD or system administrator to obtain access credentials.
          </p>

          <KalyaniButton
            variant="gold"
            size="md"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={handleReturn}
            className="w-full"
          >
            Return to Login
          </KalyaniButton>
        </KalyaniCard>
      </div>
    </div>
  );
};
