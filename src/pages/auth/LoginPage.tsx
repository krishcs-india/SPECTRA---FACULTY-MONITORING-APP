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
import { ThemeToggle } from '../../components/common/ThemeToggle';

export const LoginPage: React.FC = () => {
  const { loginWithEmail, loginWithAdminCredentials, error, clearError, isLoading } = useAuth();
  const [inputEmail, setInputEmail] = useState('');
  
  // Admin Credentials Dialog State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrefix = inputEmail.trim().toLowerCase().replace(/@.*$/, '');
    if (!cleanPrefix) return;
    if (cleanPrefix === 'admin') {
      setAdminEmail('admin');
      setAdminError(null);
      setIsAdminModalOpen(true);
      return;
    }
    const finalEmail = `${cleanPrefix}@krce.ac.in`;
    await loginWithEmail(finalEmail);
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrefix = adminEmail.trim().toLowerCase().replace(/@.*$/, '');
    if (!cleanPrefix) {
      setAdminError('Please enter administrator username.');
      return;
    }
    if (!adminPassword.trim()) {
      setAdminError('Please enter the administrator password.');
      return;
    }

    const finalAdminEmail = `${cleanPrefix}@krce.ac.in`;
    setAdminError(null);
    setIsAdminLoading(true);

    const result = await loginWithAdminCredentials(finalAdminEmail, adminPassword);
    setIsAdminLoading(false);

    if (!result.success) {
      setAdminError(result.error || 'Invalid administrator credentials. Access Denied.');
    } else {
      setIsAdminModalOpen(false);
      setAdminEmail('');
      setAdminPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F0912] flex flex-col justify-between relative overflow-hidden text-slate-800 dark:text-slate-100 font-sans select-none">
      <KalyaniMandalaBackground />

      {/* Top Bar Header */}
      <header className="relative z-10 px-6 py-6 flex items-center justify-between max-w-6xl mx-auto w-full">
        <KalyaniLogo size="md" showSubtitle={true} />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-700 dark:text-rose-300 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-sm shadow-rose-400/50" />
            Institutional Edition
          </div>
        </div>
      </header>

      {/* Center Hero Authentication Card */}
      <div className="relative z-10 max-w-md w-full mx-auto px-4 py-6 sm:py-8">
        <KalyaniCard variant="elevated" className="border-rose-200/80 dark:border-rose-950/60 shadow-2xl p-6 sm:p-8">
          {/* Card Branding */}
          <div className="text-center mb-6">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-rose-50 dark:bg-[#1A1020] border-2 border-rose-200 dark:border-rose-800/40 flex items-center justify-center mx-auto mb-3 shadow-md p-1 overflow-hidden">
              <img
                src="/assets/app-icon-spectra-logo.png"
                alt="SPECTRA Logo"
                draggable={false}
                className="w-full h-full object-cover rounded-2xl select-none"
              />
            </div>

            <h2
              className="text-3xl sm:text-4xl font-normal text-gold-gradient font-marcellus tracking-wide leading-normal pb-1"
              style={{ fontFamily: "'Marcellus', serif" }}
            >
              Sign In to SPECTRA
            </h2>
            <p className="text-xs sm:text-sm text-rose-700/80 dark:text-rose-300/80 font-marcellus mt-0.5 tracking-wide leading-relaxed">
              Faculty Period &amp; Schedule Management
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
            {/* Direct Institutional Email Login Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-rose-800 dark:text-rose-200 uppercase tracking-wider text-left">
                  Faculty / HOD Email
                </label>

                <div className="relative flex items-center group">
                  <input
                    type="text"
                    placeholder="e.g. spectra or spectra.cse"
                    value={inputEmail}
                    onChange={(e) => {
                      let val = e.target.value.trim().toLowerCase();
                      if (val.includes('@')) {
                        val = val.split('@')[0];
                      }
                      setInputEmail(val);
                      if (error) clearError();
                    }}
                    className="w-full h-12 bg-white dark:bg-[#180E1C] border border-rose-200 dark:border-rose-900/50 text-slate-800 dark:text-slate-100 text-sm font-sans rounded-2xl pl-4 pr-32 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all shadow-sm"
                    required
                    autoFocus
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900/40 text-xs font-bold text-rose-700 dark:text-rose-300 pointer-events-none select-none tracking-wide shadow-sm">
                    @krce.ac.in
                  </div>
                </div>
              </div>

              <KalyaniButton
                type="submit"
                variant="gold"
                size="md"
                className="w-full h-12 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm tracking-wide"
                isLoading={isLoading}
              >
                <span>Sign In to Faculty Portal</span>
              </KalyaniButton>
            </form>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-rose-200 dark:border-rose-900/40 w-full" />
              <span className="bg-white dark:bg-[#180E1C] px-3 text-[10px] uppercase font-bold text-rose-700 dark:text-rose-300 shrink-0 tracking-wider">
                System Administrator
              </span>
            </div>

            {/* Dedicated Login as Administrator Button */}
            <KalyaniButton
              type="button"
              variant="outline-gold"
              size="md"
              className="w-full h-11 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2"
              leftIcon={<ShieldCheck className="w-4 h-4 text-rose-500" />}
              onClick={() => {
                setAdminError(null);
                setAdminEmail('');
                setAdminPassword('');
                setIsAdminModalOpen(true);
              }}
            >
              <span>Login as Administrator</span>
            </KalyaniButton>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center flex items-center justify-center gap-1 mt-2">
              <Lock className="w-3 h-3 text-rose-400" />
              <span>Authorized institutional account required</span>
            </p>
          </div>
        </KalyaniCard>
      </div>

      {/* Admin Credentials Authorization Modal */}
      <KalyaniModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        maxWidth="md"
        title={
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-marcellus">
            <ShieldCheck className="w-5 h-5 text-rose-500" />
            <span>Administrator Login</span>
          </div>
        }
        subtitle="Sign in with your registered administrator email and password"
      >
        <form onSubmit={handleAdminLoginSubmit} className="space-y-5 py-2">
          {adminError && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-200 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{adminError}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-rose-800 dark:text-rose-200 uppercase tracking-wider text-left">
              Admin Email
            </label>
            <div className="relative flex items-center">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />
              <input
                type="text"
                value={adminEmail}
                onChange={(e) => {
                  let val = e.target.value.trim().toLowerCase();
                  if (val.includes('@')) {
                    val = val.split('@')[0];
                  }
                  setAdminEmail(val);
                  if (adminError) setAdminError(null);
                }}
                placeholder="e.g. admin"
                className="w-full h-11 bg-white dark:bg-[#180E1C] border border-rose-200 dark:border-rose-900/50 text-slate-800 dark:text-slate-100 text-sm rounded-2xl pl-10 pr-32 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all shadow-sm"
                autoFocus
                required
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900/40 text-xs font-bold text-rose-700 dark:text-rose-300 pointer-events-none select-none tracking-wide shadow-sm">
                @krce.ac.in
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-rose-800 dark:text-rose-200 uppercase tracking-wider text-left">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />
              <input
                type={showSecret ? 'text' : 'password'}
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  if (adminError) setAdminError(null);
                }}
                placeholder="Enter administrator password"
                className="w-full h-11 bg-white dark:bg-[#180E1C] border border-rose-200 dark:border-rose-900/50 text-slate-800 dark:text-slate-100 text-sm rounded-2xl pl-10 pr-10 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all shadow-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors p-1"
                title={showSecret ? 'Hide password' : 'Show password'}
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-left">
              Verified securely by Firebase Authentication — the password is never stored in the app.
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
              size="sm"
              isLoading={isAdminLoading}
            >
              Authorize Administrator
            </KalyaniButton>
          </div>
        </form>
      </KalyaniModal>

      {/* Clean Modern Institutional Footer */}
      <footer className="relative z-10 py-4 px-6 text-center border-t border-rose-200 dark:border-rose-950/40 text-xs text-slate-500">
        <p className="font-marcellus tracking-wider">
          SPECTRA • K. Ramakrishnan College of Engineering • Faculty Period System
        </p>
      </footer>
    </div>
  );
};
