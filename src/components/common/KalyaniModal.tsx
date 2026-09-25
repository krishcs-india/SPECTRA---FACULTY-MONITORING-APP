import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface KalyaniModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const KalyaniModal: React.FC<KalyaniModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-3xl',
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Deep Backdrop Blur Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-2xl transition-opacity animate-in fade-in duration-300"
      />

      {/* Centering Viewport Container with Balanced Responsive Padding */}
      <div className="min-h-full flex items-center justify-center p-4 sm:p-10 md:p-14 text-center">
        {/* Compact Floating Modal Dialog Card Container */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full ${maxWidths[maxWidth]} text-left bg-white/95 dark:bg-[#180E1C]/95 border border-rose-200 dark:border-rose-900/50 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] sm:max-h-[88vh]`}
        >
          {/* Top Rose Gradient Accent Line */}
          <div className="h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent shrink-0" />

          {/* Fixed Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-rose-200/80 dark:border-rose-900/40 bg-rose-50/70 dark:bg-[#201026]/90 backdrop-blur-xl shrink-0">
            <div>
              {title && (
                <h2 className="text-xl sm:text-2xl font-bold font-marcellus text-rose-950 dark:text-rose-100 flex items-center gap-2">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-marcellus">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-rose-100/80 dark:hover:bg-rose-950/50 transition-colors shrink-0 ml-2"
              title="Close Popup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Smooth Scrollable Modal Body Inside */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 overscroll-contain text-slate-800 dark:text-slate-200">
            {children}
          </div>

          {/* Fixed Modal Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-rose-200/80 dark:border-rose-900/40 bg-rose-50/50 dark:bg-[#201026]/70 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
