import React from 'react';
import { Search, X } from 'lucide-react';
import { ScheduleStatus } from '../../types/schedule';
import { KalyaniSelect, SelectOption } from './KalyaniSelect';

interface KalyaniFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'ALL' | ScheduleStatus;
  onStatusFilterChange: (status: 'ALL' | ScheduleStatus) => void;
  selectedPeriodId?: string;
  onPeriodChange?: (periodId: string) => void;
  periods?: { id: string; shortName: string; name: string; startTime?: string; endTime?: string }[];
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
    { id: 'SUBMITTED', label: 'Submitted' },
    { id: 'FULL_DAY_FREE', label: 'Full Day Free' },
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
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-11 bg-kalyani-crimson-950/70 border border-kalyani-gold-500/20 text-slate-100 text-sm rounded-2xl pl-10 pr-9 py-2.5 outline-none focus:border-kalyani-gold-400 focus:ring-2 focus:ring-kalyani-gold-500/20 transition-all placeholder:text-slate-500 backdrop-blur-md"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
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
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-200 apple-hover ${
                isActive
                  ? 'bg-gradient-to-r from-kalyani-gold-600 to-kalyani-gold-500 text-kalyani-crimson-950 shadow-gold-sm font-bold'
                  : 'kalyani-glass text-slate-400 hover:text-slate-200 hover:border-kalyani-gold-500/30'
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
