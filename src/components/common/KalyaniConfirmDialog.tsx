import React from 'react';
import { KalyaniModal } from './KalyaniModal';
import { KalyaniButton } from './KalyaniButton';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface KalyaniConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'teal' | 'gold';
  isLoading?: boolean;
}

export const KalyaniConfirmDialog: React.FC<KalyaniConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'gold',
  isLoading = false,
}) => {
  const icons = {
    danger: <AlertTriangle className="w-6 h-6 text-rose-400" />,
    warning: <AlertTriangle className="w-6 h-6 text-amber-400" />,
    teal: <CheckCircle2 className="w-6 h-6 text-teal-400" />,
    gold: <Info className="w-6 h-6 text-kalyani-gold-300" />,
  };

  const buttonVariants = {
    danger: 'ruby' as const,
    warning: 'gold' as const,
    teal: 'teal' as const,
    gold: 'gold' as const,
  };

  return (
    <KalyaniModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      footer={
        <>
          <KalyaniButton variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </KalyaniButton>
          <KalyaniButton
            variant={buttonVariants[variant]}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </KalyaniButton>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 shrink-0">
          {icons[variant]}
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-100">{title}</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{message}</p>
        </div>
      </div>
    </KalyaniModal>
  );
};
