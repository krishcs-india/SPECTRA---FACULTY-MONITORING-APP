import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { scrollToTopView } from '../../utils/scrollUtils';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}

interface KalyaniSelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  className?: string;
  dropdownClassName?: string;
  autoScrollOnOpen?: boolean;
}

export const KalyaniSelect: React.FC<KalyaniSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option…',
  error,
  helperText,
  className = '',
  dropdownClassName = '',
  autoScrollOnOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // When dropdown opens, gently ensure comfortable downward clearance
  useEffect(() => {
    if (isOpen && autoScrollOnOpen && containerRef.current) {
      scrollToTopView(containerRef.current);
    }
  }, [isOpen, autoScrollOnOpen]);

  const handleToggle = () => {
    if (!isOpen && autoScrollOnOpen && containerRef.current) {
      scrollToTopView(containerRef.current);
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-rose-800 dark:text-rose-200 mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Curved Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full h-11 flex items-center justify-between text-left bg-white dark:bg-[#180E1C] border rounded-xl px-4 text-sm text-slate-800 dark:text-slate-100 shadow-sm transition-all duration-200 ${
          isOpen
            ? 'border-rose-500 ring-2 ring-rose-500/20'
            : error
            ? 'border-rose-500'
            : 'border-rose-200 dark:border-rose-900/50 hover:border-rose-400'
        } ${className}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>}
        </span>

        <ChevronDown
          className={`w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Options Dropdown Menu - Strictly Downward Opening for Perfect UX */}
      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 inset-x-0 z-50 max-h-60 sm:max-h-64 overflow-y-auto overscroll-contain rounded-2xl bg-white dark:bg-[#180E1C] border border-rose-200 dark:border-rose-900/60 p-1.5 shadow-2xl backdrop-blur-3xl animate-in fade-in slide-in-from-top-1.5 duration-150 ${dropdownClassName}`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-left transition-all duration-150 mb-0.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 text-white font-bold shadow-sm'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-900 dark:hover:text-rose-100'
                } ${opt.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div>
                  <p className="font-semibold">{opt.label}</p>
                  {opt.sublabel && (
                    <p className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                      {opt.sublabel}
                    </p>
                  )}
                </div>

                {isSelected && <Check className="w-4 h-4 shrink-0 text-white ml-2" />}
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-400 mt-1">{helperText}</p>}
    </div>
  );
};
