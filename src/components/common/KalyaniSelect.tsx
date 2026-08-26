import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

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
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

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

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-kalyani-gold-200 mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Curved Glassmorphic Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-11 flex items-center justify-between text-left kalyani-glass rounded-2xl px-4 text-sm text-slate-100 transition-all duration-200 apple-hover ${
          isOpen
            ? 'border-kalyani-gold-400 bg-kalyani-crimson-900/80 shadow-gold-sm ring-1 ring-kalyani-gold-400/40'
            : error
            ? 'border-rose-500'
            : 'border-kalyani-gold-500/20 hover:border-kalyani-gold-400'
        } ${className}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : <span className="text-slate-400">{placeholder}</span>}
        </span>

        <ChevronDown
          className={`w-4 h-4 text-kalyani-gold-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-kalyani-gold-300' : ''
          }`}
        />
      </button>

      {/* Curved Glowing Options Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 inset-x-0 z-50 max-h-60 overflow-y-auto rounded-2xl kalyani-glass-elevated border border-kalyani-gold-500/40 p-1.5 shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 fade-in duration-150 ${dropdownClassName}`}
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
                    ? 'bg-gradient-to-r from-kalyani-gold-600 to-kalyani-gold-500 text-kalyani-crimson-950 font-bold shadow-gold-sm'
                    : 'text-slate-200 hover:bg-kalyani-gold-500/20 hover:text-kalyani-gold-100 hover:shadow-[0_0_12px_rgba(212,175,55,0.25)]'
                } ${opt.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div>
                  <p className="font-semibold">{opt.label}</p>
                  {opt.sublabel && (
                    <p className={`text-[10px] ${isSelected ? 'text-kalyani-crimson-900' : 'text-slate-400'}`}>
                      {opt.sublabel}
                    </p>
                  )}
                </div>

                {isSelected && <Check className="w-4 h-4 shrink-0 text-kalyani-crimson-950 ml-2" />}
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
