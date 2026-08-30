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
      s.subjectCode.toLowerCase().includes(cleanSearch.toLowerCase()) ||
      s.subjectName.toLowerCase().includes(cleanSearch.toLowerCase())
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
          <div className="flex items-center gap-2 p-1 bg-kalyani-crimson-950/60 rounded-xl border border-kalyani-gold-500/15 animate-in fade-in duration-200">
            <button
              onClick={() => setActiveTab('OFFICIAL')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'OFFICIAL'
                  ? 'bg-kalyani-gold-500 text-kalyani-crimson-950 shadow-gold-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Subject Search ({subjects.length})
            </button>

            {allowCustomSubjects && (
              <button
                onClick={() => setActiveTab('CUSTOM')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'CUSTOM'
                    ? 'bg-kalyani-gold-500 text-kalyani-crimson-950 shadow-gold-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                + Other Academic Duties
              </button>
            )}
          </div>
        )}

        {/* Option to Mark as FREE directly - Collapses gracefully during active search */}
        {!isSearchActive && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-teal-950/40 border border-teal-500/30 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-teal-300">Mark this Period as Free</p>
                <p className="text-[10px] text-teal-400/80">Available for substitution / duties</p>
              </div>
            </div>
            <KalyaniButton variant="teal" size="sm" onClick={handleMarkFree}>
              Set Free
            </KalyaniButton>
          </div>
        )}

        {activeTab === 'OFFICIAL' ? (
          <div className="space-y-3">
            {/* Sticky Top Search Box */}
            <div className={`transition-all duration-200 ${isSearchActive ? 'sticky -top-1 z-30 pt-1 pb-1 bg-kalyani-crimson-950/95 backdrop-blur-md' : ''}`}>
              <div className="relative">
                <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 z-10 pointer-events-none transition-colors ${
                  isSearchFocused ? 'text-kalyani-gold-400' : 'text-kalyani-gold-400/70'
                }`} />
                <input
                  type="text"
                  value={search}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => {
                    // Small timeout to allow clicking on subject result
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
                  className={`w-full bg-kalyani-crimson-950/90 border text-slate-100 text-xs sm:text-sm rounded-xl pl-10 pr-10 py-3 outline-none transition-all ${
                    isSearchActive
                      ? 'border-kalyani-gold-400 ring-2 ring-kalyani-gold-500/25 shadow-gold-sm'
                      : 'border-kalyani-gold-500/20 focus:border-kalyani-gold-400 focus:ring-2 focus:ring-kalyani-gold-500/20'
                  }`}
                />
                {cleanSearch.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center text-xs font-bold transition-all"
                  >
                    ✕
                  </button>
                )}
              </div>

              {isSearchActive && (
                <div className="flex items-center justify-between mt-1 px-1 text-[11px] text-kalyani-gold-300/80">
                  <span>Showing {filteredSubjects.length} of {subjects.length} subjects</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setIsSearchFocused(false);
                    }}
                    className="text-slate-400 hover:text-slate-200 underline"
                  >
                    View All Options
                  </button>
                </div>
              )}
            </div>

            {/* 1. List of Available / Matching Official Subjects */}
            <div className={`overflow-y-auto space-y-1.5 pr-1 transition-all duration-200 ${
              isSearchActive ? 'max-h-[55vh]' : 'max-h-60'
            }`}>
              {filteredSubjects.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
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
                      onClick={() => handleSelectOfficial(sub)}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-kalyani-gold-500/20 border-kalyani-gold-400 text-kalyani-gold-100 font-semibold'
                          : 'kalyani-glass hover:bg-white/5 hover:border-kalyani-gold-500/30 text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          {sub.subjectCode && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-kalyani-crimson-900 border border-kalyani-gold-400/40 text-kalyani-gold-300">
                              {sub.subjectCode}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm font-medium mt-1 text-slate-100">
                          {sub.subjectName}
                        </p>
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-kalyani-gold-400 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* 2. UNLISTED SUBJECT CALLOUT AT THE BOTTOM (If user searches something not in the list) */}
            {cleanSearch.length > 0 && !hasExactMatch && (
              <div className="pt-2 border-t border-white/5">
                <div className="p-3.5 rounded-2xl bg-kalyani-crimson-900/60 border border-kalyani-gold-400/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-gold-sm animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Not in official list
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-kalyani-gold-200">
                        "{cleanSearch}"
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Can't find your subject? Add this as a custom unlisted subject.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddUnlistedSubject(cleanSearch)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-kalyani-gold-600 to-kalyani-gold-500 text-kalyani-crimson-950 font-bold text-xs flex items-center gap-1.5 shadow-gold-sm hover:brightness-110 transition-all shrink-0"
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
            <div className="p-3.5 rounded-2xl bg-kalyani-crimson-950/60 border border-kalyani-gold-500/20 text-xs text-slate-300 leading-relaxed">
              <p className="font-semibold text-kalyani-gold-300 flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-kalyani-gold-400" />
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
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">
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
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-white/5 hover:bg-kalyani-gold-500/20 border border-white/10 hover:border-kalyani-gold-400/40 text-slate-300 hover:text-kalyani-gold-200 transition-colors"
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
