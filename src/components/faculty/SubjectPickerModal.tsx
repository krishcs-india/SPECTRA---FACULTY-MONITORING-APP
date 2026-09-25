import React, { useState } from 'react';
import { KalyaniModal } from '../common/KalyaniModal';
import { KalyaniInput } from '../common/KalyaniInput';
import { KalyaniButton } from '../common/KalyaniButton';
import { Subject } from '../../types/subject';
import { PeriodEntry } from '../../types/schedule';
import { Search, PlusCircle, CheckCircle2, Sparkles, Coffee, AlertCircle } from 'lucide-react';

interface SubjectPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodName: string;
  subjects: Subject[];
  currentEntry?: PeriodEntry;
  allowCustomSubjects?: boolean;
  onSelectSubject: (subject: Subject) => void;
  onSelectCustom: (customText: string) => void;
  onSelectFree: () => void;
}

export const SubjectPickerModal: React.FC<SubjectPickerModalProps> = ({
  isOpen,
  onClose,
  periodName,
  subjects,
  currentEntry,
  allowCustomSubjects = true,
  onSelectSubject,
  onSelectCustom,
  onSelectFree,
}) => {
  const [search, setSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [customText, setCustomText] = useState(currentEntry?.customText || '');
  const [activeTab, setActiveTab] = useState<'OFFICIAL' | 'CUSTOM'>('OFFICIAL');

  const cleanSearch = search.trim();
  const isSearchActive = isSearchFocused || cleanSearch.length > 0;

  const filteredSubjects = subjects.filter(
    (s) =>
      (s.subjectCode || '').toLowerCase().includes(cleanSearch.toLowerCase()) ||
      (s.subjectName || '').toLowerCase().includes(cleanSearch.toLowerCase())
  );

  const hasExactMatch = subjects.some(
    (s) =>
      s.subjectName.toLowerCase() === cleanSearch.toLowerCase() ||
      (s.subjectCode && s.subjectCode.toLowerCase() === cleanSearch.toLowerCase())
  );

  const handleSelectOfficial = (s: Subject) => {
    onSelectSubject(s);
    onClose();
  };

  const handleAddUnlistedSubject = (name: string) => {
    if (!name.trim()) return;
    const unlistedSub: Subject = {
      id: `unlisted_${Date.now()}`,
      subjectCode: '',
      subjectName: name.trim(),
      departmentId: subjects[0]?.departmentId || 'CSE',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onSelectSubject(unlistedSub);
    onClose();
  };

  const handleApplyCustom = () => {
    if (!customText.trim()) return;
    onSelectCustom(customText.trim());
    onClose();
  };

  const handleMarkFree = () => {
    onSelectFree();
    onClose();
  };

  return (
    <KalyaniModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={`Select Assignment — ${periodName}`}
      subtitle="Period Assignment Selection"
    >
      <div className="space-y-3.5">
        {/* Quick Tabs Bar - Collapses gracefully during active search to give maximum space */}
        {!isSearchActive && (
          <div className="flex items-center gap-2 p-1 bg-rose-50/70 dark:bg-[#180E1C] rounded-xl border border-rose-200 dark:border-rose-900/50 animate-in fade-in duration-200">
            <button
              onClick={() => setActiveTab('OFFICIAL')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'OFFICIAL'
                  ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300'
              }`}
            >
              Subject Search ({subjects.length})
            </button>

            {allowCustomSubjects && (
              <button
                onClick={() => setActiveTab('CUSTOM')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'CUSTOM'
                    ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300'
                }`}
              >
                + Other Academic Duties
              </button>
            )}
          </div>
        )}

        {/* Option to Mark as FREE directly - Collapses gracefully during active search */}
        {!isSearchActive && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-500/30 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-teal-800 dark:text-teal-300">Mark this Period as Free</p>
                <p className="text-[10px] text-teal-600 dark:text-teal-400/80">Available for substitution / duties</p>
              </div>
            </div>
            <KalyaniButton variant="teal" size="sm" onClick={handleMarkFree}>
              Set Free
            </KalyaniButton>
          </div>
        )}

        {activeTab === 'OFFICIAL' ? (
          <div className="space-y-3">
            {/* Search Box Header */}
            <div className="relative">
              <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 z-10 pointer-events-none transition-colors ${
                isSearchFocused ? 'text-rose-500' : 'text-rose-400'
              }`} />
              <input
                type="text"
                value={search}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                  setTimeout(() => setIsSearchFocused(false), 200);
                }}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && cleanSearch && !hasExactMatch) {
                    e.preventDefault();
                    handleAddUnlistedSubject(cleanSearch);
                  }
                }}
                placeholder="Search subject code or name…"
                className="w-full bg-white dark:bg-[#180E1C] border border-rose-200 dark:border-rose-900/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm rounded-xl pl-10 pr-10 py-3 outline-none transition-all shadow-sm"
              />
              {cleanSearch.length > 0 && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold transition-all"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 1. List of Available / Matching Official Subjects - Confined strictly to its own scroll container */}
            <div className="max-h-60 sm:max-h-72 overflow-y-auto overflow-x-hidden space-y-1.5 pr-1.5 rounded-xl">
              {filteredSubjects.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">
                  {cleanSearch
                    ? `No matching official subjects found for "${cleanSearch}".`
                    : 'No subjects available in department master.'}
                </div>
              ) : (
                filteredSubjects.map((sub) => {
                  const isSelected =
                    currentEntry?.type === 'SUBJECT' &&
                    (currentEntry?.subjectId === sub.id ||
                      (currentEntry?.subjectName === sub.subjectName && currentEntry?.subjectCode === sub.subjectCode));

                  return (
                    <button
                      key={sub.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectOfficial(sub)}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-400 text-rose-800 dark:text-rose-200 font-semibold shadow-sm'
                          : 'bg-white dark:bg-[#201026] hover:bg-rose-50/40 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 hover:border-rose-400 text-slate-700 dark:text-slate-200 shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          {sub.subjectCode && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300">
                              {sub.subjectCode}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm font-medium mt-1 text-slate-800 dark:text-slate-100">
                          {sub.subjectName}
                        </p>
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* 2. UNLISTED SUBJECT CALLOUT AT THE BOTTOM (If user searches something not in the list) */}
            {cleanSearch.length > 0 && !hasExactMatch && (
              <div className="pt-2 border-t border-rose-100 dark:border-white/5">
                <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-[#201026] border border-rose-200 dark:border-rose-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Not in official list
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-rose-800 dark:text-rose-200">
                        "{cleanSearch}"
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Can't find your subject? Add this as a custom unlisted subject.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddUnlistedSubject(cleanSearch)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:brightness-110 transition-all shrink-0"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add to List & Assign</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Custom / Other Activity Form */
          <div className="space-y-4 pt-1">
            <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-[#180E1C] border border-rose-200 dark:border-rose-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed shadow-sm">
              <p className="font-semibold text-rose-800 dark:text-rose-200 flex items-center gap-1.5 mb-1 font-marcellus">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                Custom Activity Entry
              </p>
              Custom entries represent specific academic duties (e.g. Project Review, Department Meeting, Lab Supervision, NAAC/NBA Work) without altering the official subject master.
            </div>

            <KalyaniInput
              label="Activity / Duty Description"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="e.g. Final Year Major Project Review / NBA Meeting"
              autoFocus
            />

            {/* Quick suggestions */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1.5 tracking-wider">
                Quick Suggestions:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Final Year Project Review',
                  'Department Faculty Meeting',
                  'NBA / NAAC Accreditation Work',
                  'Guest Lecture Coordination',
                  'Central Valuation Duty',
                  'Laboratory Maintenance',
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setCustomText(sug)}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-rose-50/60 dark:bg-white/5 hover:bg-rose-100 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-white/10 hover:border-rose-400 text-slate-700 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-200 transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <KalyaniButton variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </KalyaniButton>
              <KalyaniButton
                variant="gold"
                size="sm"
                onClick={handleApplyCustom}
                disabled={!customText.trim()}
              >
                Apply Custom Entry
              </KalyaniButton>
            </div>
          </div>
        )}
      </div>
    </KalyaniModal>
  );
};
