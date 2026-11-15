---
name: spectra-intelligent-ui
description: >-
  Comprehensive guide and design standards for SPECTRA's Intelligent UI & UX Architecture.
  Use whenever creating, updating, auditing, or refactoring UI components, forms, modals,
  period allocation, calendar date pickers, animations, or touch interactions in SPECTRA.
---

# SPECTRA Intelligent UI & UX Architecture

This skill defines the design language, motion choreography, data integrity rules, and user experience standards established for **SPECTRA (Kalyani Faculty Scheduling & Monitoring System)**. Every segment of the application must adhere to these guidelines to ensure an intelligent, delightful, and error-free user experience across mobile (Capacitor Android) and desktop web.

---

## 1. Core Architectural Principles

1. **Adaptive Motion & Contextual Auto-Scrolling**: The UI must anticipate the user's next action and guide their attention smoothly through viewport scrolling rather than forcing manual scrolling.
2. **State-Driven Affirmative Hierarchy**: Every entity state (Free, Subject, On Duty, Leave, Custom) must have unmistakable visual differentiation: color-coded borders, soft background tints, dot indicators, and dedicated secondary status labels.
3. **Height Uniformity & Alignment**: All grid items within the same container must maintain identical physical height and baseline alignment regardless of content length or state.
4. **Single-Action Persistence (Zero Redundant Clicks)**: Modal operations must persist synchronously to Cloud Firestore upon saving, updating store state and triggering immediate affirmative feedback (toasts, confetti) without requiring a second "Update & Save" click on the parent page.
5. **Collision-Proof Data Integrity**: Entity IDs must use deterministic cryptographic/hash slugs rather than naive string truncation, guaranteeing that variant items (e.g. `- MAIN` vs `- ASSISTANT`) never overwrite each other.
6. **Mobile Touch & Keyboard Resilience**: Forms and modals must gracefully handle virtual keyboard intrusion and thumb-driven touch targets (minimum 44px height, anchored bottom action bars, touch feedback).

---

## 2. Segment-by-Segment Implementation Standards

### Segment A: Dynamic & Contextual Viewport Steering

When a user interacts with options or controls that reveal subsequent sections, the application must intelligently glide the viewport to the relevant segment.

#### Standard Patterns:
1. **Option Expansion / Step Progression**:
   - Selecting a sub-option (e.g. Forenoon `FN` or Afternoon `AN` in Half-Day Leave/OD) must automatically glide down to the Classification & Reason inputs:
     ```typescript
     setTimeout(() => {
       classificationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
     }, 120);
     ```
2. **Reset / Mode Switch to Top**:
   - Switching back to higher-level scopes (e.g., clicking `Full Day` or `Half Day` again, or clicking `Reset / Clear Selection`) must glide the container back to the top:
     ```typescript
     const el = modalBodyRef.current;
     if (el && typeof el.scrollTo === 'function') {
       el.scrollTo({ top: 0, behavior: 'smooth' });
     }
     ```
3. **Search Input & Virtual Keyboard Accommodation**:
   - Focusing a search input or switching to a search-driven tab (e.g., Official Subjects) must pull the input into the upper viewport before the mobile keyboard opens:
     ```typescript
     const handleSearchFocus = () => {
       scrollToTopView(searchContainerRef.current);
     };
     ```

---

### Segment B: Schedule & Period Allocation Cards (Grid & List)

Periods can exist in one of five distinct states. Every state must maintain structural parity and affirmative styling:

| State | Border & Ring | Background Tint | Dot Indicator | Label Underneath |
| :--- | :--- | :--- | :--- | :--- |
| **FREE (Available)** | `border-emerald-400 dark:border-emerald-600/70 ring-1 ring-emerald-400/30` | `bg-emerald-50/50 dark:bg-emerald-950/25` | `w-2 h-2 bg-emerald-500` | Bold `FREE` (`text-emerald-700 dark:text-emerald-400`) |
| **SUBJECT** | `border-rose-300 dark:border-rose-800/40` | `bg-rose-50/50 dark:bg-rose-950/20` | `w-2 h-2 bg-rose-400` | `{subjectCode} — {subjectName}` |
| **ON DUTY (OD)** | `border-amber-300 dark:border-amber-700/50` | `bg-amber-50/90 dark:bg-amber-950/40` | `w-2 h-2 bg-amber-500` | `OD: {onDutyCategory}` |
| **ON LEAVE** | `border-rose-300 dark:border-rose-800/50` | `bg-rose-50/70 dark:bg-rose-950/40` | `w-2 h-2 bg-rose-500` | `Leave: {leaveReason}` |
| **CUSTOM DUTY** | `border-purple-300 dark:border-purple-800/40` | `bg-purple-50/50 dark:bg-purple-950/20` | `w-2 h-2 bg-purple-400` | `{customText}` |
| **SELECTED (Multi-select)** | `border-rose-500 ring-2 ring-rose-400/50` | `bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600` | White checkmark in circle | `text-white/90` |

#### Parity Rule:
- **Never leave the subtext empty.** Even when a period is FREE, display `FREE` in the secondary text line. This ensures every card in the grid has exactly 2 lines of content and perfectly equal heights.

---

### Segment C: Typography & Baseline Alignment

1. **Font Hierarchy**:
   - **Headers, Modals, Brand**: Use `font-marcellus` (Marcellus serif) for page headings, modal titles, and section dividers.
   - **Body, Inputs, Badges, Data**: Use `font-sans` (Inter) for buttons, labels, grid text, and inputs.
2. **Numeric Baseline Alignment**:
   - Dates, period numbers, and counts must use OpenType lining numerals to prevent uneven baseline jumping:
     ```css
     font-variant-numeric: lining-nums proportional-nums;
     font-feature-settings: "lnum" 1;
     ```

---

### Segment D: Multi-Period Floating Action Bar

When multi-select mode is activated (via button click or long-press on any period):
1. **Generous Spacing**:
   - Give the floating toolbar a generous bottom margin (`mb-5 sm:mb-6`) and wrap the parent section in `space-y-4 sm:space-y-5`.
   - Never use tight margins like `my-2.5` that cause floating toolbars to crowd section headers.
2. **Internal Padding**:
   - Use `p-4 sm:p-5 rounded-2xl sm:rounded-3xl` with backdrop blur (`backdrop-blur-xl`).
   - Separate action button rows with `pt-3 sm:pt-3.5 mt-0.5 border-t border-rose-200/70`.
3. **Isolated Period Container**:
   - Enclose the list of period rows in their own child container (`<div className="space-y-3 pt-0.5">`) so that spacing between individual period cards remains independent of toolbar margins.

---

### Segment E: Modal Action Footers & Mobile Ergonomics

1. **Fixed Footer Architecture**:
   - Use `KalyaniModal`'s `footer` prop to anchor buttons permanently at the bottom of the modal.
   - Avoid inline "Done" or "Confirm" buttons inside input wrappers that collide with input placeholders or error messages.
2. **Direct Synchronous Cloud Persistence**:
   - When a user clicks "Save" or "Confirm" inside a modal, immediately invoke the store submission method:
     ```typescript
     const result = submitSchedule(facultyId, date, sanitizedPeriods);
     if (result.success) {
       userTouchedRef.current = false;
       setPeriodsState(sanitizedPeriods);
       setSubmitSuccessMsg('Schedule saved and synchronized successfully!');
       confetti({ particleCount: 60, spread: 55, origin: { y: 0.85 } });
     }
     ```
   - Do not require users to separately click the bottom "Update & Save Schedule" button on the main page.

---

### Segment F: Data Ingestion & Deterministic ID Generation

1. **Collision-Proof Subject ID Generation**:
   - **Never truncate entity names with arbitrary limits like `.slice(0, 30)`**. Laboratory courses often share the first 30+ characters (e.g., `Engineering Physics Laboratory (EP Lab) - MAIN` vs `ASSISTANT`).
   - Use deterministic 32-bit FNV-1a hashing appended to a clean alphanumeric slug:
     ```typescript
     export function generateSubjectId(departmentId: string, subjectCode?: string, subjectName?: string): string {
       const cleanDept = normalizeDepartmentId(departmentId).toLowerCase() || 'cse';
       const cleanCode = (subjectCode || '').trim().toUpperCase();
       const cleanName = (subjectName || '').trim();

       const key = `${cleanCode}:::${cleanName.toLowerCase()}`;
       let hash = 0x811c9dc5;
       for (let i = 0; i < key.length; i++) {
         hash ^= key.charCodeAt(i);
         hash = Math.imul(hash, 0x01000193);
       }
       const hashStr = (hash >>> 0).toString(36);

       const safeCode = cleanCode.replace(/[^A-Z0-9]/g, '_').toLowerCase();
       const safeName = cleanName
         .replace(/[^a-zA-Z0-9]/g, '_')
         .toLowerCase()
         .replace(/_+/g, '_')
         .replace(/^_|_$/g, '')
         .slice(0, 50);

       if (safeCode && safeName) return `sub_${cleanDept}_${safeCode}_${safeName}_${hashStr}`;
       if (safeCode) return `sub_${cleanDept}_${safeCode}_${hashStr}`;
       if (safeName) return `sub_${cleanDept}_${safeName}_${hashStr}`;
       return `sub_${cleanDept}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
     }
     ```
2. **Legacy ID Preservation**:
   - When updating existing items, retain their existing `id` to prevent orphaned documents in Cloud Firestore.
3. **Firestore Batch Limits**:
   - Chunk all bulk deletion or bulk write operations into batches of at most 400 operations to strictly stay under Firestore's 500-write limit.
4. **Stable Secondary Sorting**:
   - Sort lists primarily by `code` and secondarily by `name` (`localeCompare`) to prevent visual jumping when multiple entries share the same code.

---

## 3. UI/UX Verification Checklist for New Features

Before committing any UI change in SPECTRA, verify:
- [ ] Are touch targets at least 44px tall with `active:scale-[0.98]` feedback?
- [ ] Does selecting options auto-scroll the user to the next logical action?
- [ ] Does switching back or resetting scroll back to the top of the container?
- [ ] Do cards of all states have consistent height, outline, dot, and subtext?
- [ ] Does the modal save button persist directly to Firebase and show feedback?
- [ ] Does multi-select floating toolbar have ample margin above and below?
- [ ] Are entity IDs deterministic and immune to truncation collisions?
- [ ] Are bulk operations chunked under 400 operations for Firestore limits?
- [ ] Does the Android release build compile cleanly (`assembleRelease`)?
