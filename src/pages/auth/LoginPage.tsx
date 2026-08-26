import React, { useState } from 'react';
import { KalyaniLogo } from '../../components/common/KalyaniLogo';
import { KalyaniButton } from '../../components/common/KalyaniButton';
import { KalyaniCard } from '../../components/common/KalyaniCard';
import { KalyaniInput } from '../../components/common/KalyaniInput';
import { KalyaniModal } from '../../components/common/KalyaniModal';
import { KalyaniMandalaBackground } from '../../components/common/KalyaniMandalaBackground';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { AlertCircle, Lock, ShieldCheck, KeyRound, Eye, EyeOff, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithEmail, loginWithAdminSecret, error, clearError, isLoading } = useAuth();
  const [inputEmail, setInputEmail] = useState('');
  
  // Admin Secret Dialog State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminSecret, setAdminSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    clearError();
    await authService.signInWithGoogle();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.trim()) return;
    await loginWithEmail(inputEmail.trim());
  };

  const handleAdminSecretSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSecret.trim()) {
      setAdminError('Please enter the Administrator Secret Key.');
      return;
    }

    setAdminError(null);
    setIsAdminLoading(true);

    const result = await loginWithAdminSecret(adminSecret.trim());
    setIsAdminLoading(false);

    if (!result.success) {
      setAdminError(result.error || 'Invalid Administrator Secret Key. Access Denied.');
    } else {
      setIsAdminModalOpen(false);
      setAdminSecret('');
    }
  };

  return (
    <div className="min-h-screen bg-kalyani-crimson-950 flex flex-col justify-between relative overflow-hidden text-slate-100 font-sans">
      <KalyaniMandalaBackground />

      {/* Top Bar Header */}
      <header className="relative z-10 px-6 py-6 flex items-center justify-between max-w-6xl mx-auto w-full">
        <KalyaniLogo size="md" showSubtitle={true} />
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-kalyani-gold-500/10 border border-kalyani-gold-500/30 text-xs font-semibold text-kalyani-gold-300">
          <span className="w-1.5 h-1.5 rounded-full bg-kalyani-gold-400 animate-pulse" />
          Institutional Edition
        </div>
      </header>

      {/* Center Hero Authentication Card */}
      <div className="relative z-10 max-w-md w-full mx-auto px-4 py-6 sm:py-8">
        <KalyaniCard variant="elevated" className="border-kalyani-gold-500/35 shadow-2xl p-6 sm:p-8">
          {/* Card Branding */}
          <div className="text-center mb-6">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl p-1 bg-gradient-to-br from-kalyani-crimson-800 via-kalyani-crimson-900 to-kalyani-gold-600 border border-kalyani-gold-400/50 flex items-center justify-center mx-auto mb-3 shadow-[0_0_25px_rgba(212,175,55,0.4)] overflow-hidden">
              <img
                src="/assets/app-icon-logo.png"
                alt="Kalyani App Logo"
                className="w-full h-full object-contain drop-shadow-[0_2px_12px_rgba(212,175,55,0.6)]"
              />
            </div>

            <h2
              className="text-3xl sm:text-4xl font-normal text-gold-gradient font-marcellus tracking-wide leading-normal pb-1.5"
              style={{ fontFamily: "'Marcellus', serif" }}
            >
              Sign In to Kalyani
            </h2>
            <p className="text-sm sm:text-base text-kalyani-gold-300 font-cursive mt-0.5 tracking-wider leading-relaxed pb-1.5">
              Faculty Availability &amp; Period Management
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Access Denied</p>
                <p className="text-[11px] text-rose-300/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Direct Sign-In Section */}
          <div className="space-y-4">
            {/* Dedicated Login as Administrator Button */}
            <KalyaniButton
              type="button"
              variant="gold"
              size="md"
              className="w-full h-12 rounded-2xl font-bold shadow-gold-md flex items-center justify-center gap-2.5 text-sm tracking-wide"
              leftIcon={<ShieldCheck className="w-5 h-5 text-kalyani-crimson-950" />}
              onClick={() => {
                setAdminError(null);
                setAdminSecret('');
                setIsAdminModalOpen(true);
              }}
            >
              <span>Login as Administrator</span>
            </KalyaniButton>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-kalyani-gold-500/20 w-full" />
              <span className="bg-kalyani-crimson-900/90 px-3 text-[10px] uppercase font-bold text-kalyani-gold-300/80 shrink-0 tracking-wider">
                Or HOD / AHOD / Faculty Sign-In
              </span>
            </div>

            {/* Primary Google Workspace SSO Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl apple-hover disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Email direct verification sign-in */}
            <form onSubmit={handleEmailSubmit} className="space-y-3 pt-1">
              <KalyaniInput
                type="email"
                placeholder="Enter college email (e.g. arun.cse@krce.ac.in)"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                required
              />
              <KalyaniButton
                type="submit"
                variant="outline-gold"
                size="md"
                className="w-full h-11 rounded-2xl text-xs font-semibold"
                isLoading={isLoading}
              >
                Verify &amp; Sign In
              </KalyaniButton>
            </form>

            <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1 mt-3">
              <Lock className="w-3 h-3 text-kalyani-gold-400" />
              <span>Authorized institutional college account required</span>
            </p>
          </div>
        </KalyaniCard>
      </div>

      {/* Admin Secret Authorization Modal */}
      <KalyaniModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        maxWidth="md"
        title={
          <div className="flex items-center gap-2 text-kalyani-gold-300">
            <ShieldCheck className="w-5 h-5 text-kalyani-gold-400" />
            <span>Administrator Passkey Verification</span>
          </div>
        }
        subtitle="Enter the master administrator secret key to authorize full system control"
      >
        <form onSubmit={handleAdminSecretSubmit} className="space-y-5 py-2">
          {adminError && (
            <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{adminError}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-kalyani-gold-200 uppercase tracking-wider text-left">
              Admin Secret Key
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-kalyani-gold-400" />
              <input
                type={showSecret ? 'text' : 'password'}
                value={adminSecret}
                onChange={(e) => {
                  setAdminSecret(e.target.value);
                  if (adminError) setAdminError(null);
                }}
                placeholder="Enter Administrator Secret Key"
                className="w-full h-11 bg-kalyani-crimson-950/80 border border-kalyani-gold-500/30 text-slate-100 text-sm rounded-2xl pl-10 pr-10 outline-none focus:border-kalyani-gold-400 focus:ring-2 focus:ring-kalyani-gold-500/20 transition-all font-mono"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-kalyani-gold-300 transition-colors p-1"
                title={showSecret ? 'Hide secret' : 'Show secret'}
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-left">
              Secured master administrative credential for institutional management.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <KalyaniButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAdminModalOpen(false)}
            >
              Cancel
            </KalyaniButton>

            <KalyaniButton
              type="submit"
              variant="gold"
              size="md"
              className="px-6 h-11 rounded-2xl font-bold"
              isLoading={isAdminLoading}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Authorize &amp; Enter Admin Portal
            </KalyaniButton>
          </div>
        </form>
      </KalyaniModal>

      {/* Footer */}
      <footer className="relative z-10 py-4 px-6 text-center border-t border-kalyani-gold-500/10 text-xs text-slate-500">
        <p>KALYANI Faculty Availability &amp; Period Management System • Higher Education Operations</p>
      </footer>
    </div>
  );
};
