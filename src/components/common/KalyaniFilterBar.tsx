import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { ScheduleStatus } from '../../types/schedule';
import { KalyaniSelect, SelectOption } from './KalyaniSelect';
import { scrollToTopView } from '../../utils/scrollUtils';

interface KalyaniFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'ALL' | ScheduleStatus;
  onStatusFilterChange: (status: 'ALL' | ScheduleStatus) => void;
  selectedPeriodId?: string;
  onPeriodChange?: (periodId: string) => void;
  periods?: { id: string; shortName: string; name: string }[];
  searchPlaceholder?: string;
  extraActions?: React.ReactNode;
}

export const KalyaniFilterBar: React.FC<KalyaniFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedPeriodId,
  onPeriodChange,
  periods = [],
  searchPlaceholder = 'Search faculty, subjects, designations…',
  extraActions,
}) => {
  const statusTabs: { id: 'ALL' | ScheduleStatus; label: string; countBadge?: string }[] = [
    { id: 'ALL', label: 'All Faculty' },
    { id: 'SUBMITTED', label: 'Teaching' },
    { id: 'FULL_DAY_FREE', label: 'Full Day Free' },
    { id: 'ON_DUTY', label: 'On Duty' },
    { id: 'LEAVE', label: 'On Leave' },
    { id: 'NOT_SUBMITTED', label: 'Not Submitted' },
  ];

  const periodOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Periods (Entire Day)' },
    ...periods.map((p) => ({
      value: p.id,
      label: p.name || p.shortName,
    }))
  ];

  return (
    <div className="flex flex-col gap-3.5 mb-6">
      {/* Top Search & Actions Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500/80 z-10 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onFocus={(e) => scrollToTopView(e.currentTarget)}
            onClick={(e) => scrollToTopView(e.currentTarget)}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-11 bg-white dark:bg-[#180E1C] border border-rose-200 dark:border-rose-900/50 text-slate-800 dark:text-slate-100 text-sm rounded-2xl pl-10 pr-9 py-2.5 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm backdrop-blur-md"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Custom Curved Period Selector Dropdown with glowing options */}
        {periods.length > 0 && onPeriodChange && (
          <div className="w-full sm:w-64 shrink-0">
            <KalyaniSelect
              options={periodOptions}
              value={selectedPeriodId || 'ALL'}
              onChange={onPeriodChange}
            />
          </div>
        )}

        {extraActions && <div className="shrink-0 flex items-center gap-2">{extraActions}</div>}
      </div>

      {/* Status Segmented Pill Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {statusTabs.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onStatusFilterChange(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 text-white shadow-sm font-bold'
                  : 'bg-white/80 dark:bg-[#180E1C]/80 border border-rose-200/80 dark:border-rose-900/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 hover:border-rose-300'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
