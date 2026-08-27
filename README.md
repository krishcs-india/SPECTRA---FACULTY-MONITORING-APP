# 👑 KALYANI — Faculty Availability & Period Management System

> **Institutional Academic Load Tracking, Real-Time Period Allocation, and Dynamic Substitution Matrix for Higher Education Institutions.**

---

## 📖 Overview

**KALYANI** is a real-time institutional academic operations and faculty period-availability tracking system built for colleges and universities. It replaces slow paper registers and fragmented communication groups with a centralized, real-time Cloud Firestore platform.

- **Faculty Members** allocate their daily teaching load or declare themselves as **Full Day Free** with a single tap.
- **Department Heads (HODs & AHODs)** monitor a **Live Real-Time Dashboard** to identify available free faculty for instant substitution dispatching in any period.
- **Institutional Administrators** govern users, departments, dynamic period configurations, and system-wide policies with one-click production reset capabilities.

---

## 🏛️ Distinctive Design System & Aesthetic

KALYANI combines a **Royal Indian Heritage** theme with **Apple-inspired fluid ergonomics**:

- **Curated Color Palette**: Deep Royal Crimson Velvet (`#4A0404`, `#7B1113`, `#9B1A39`), Warm Lustrous Gold (`#D4AF37`, `#F3E5AB`, `#996515`), and Emerald/Teal operational badges.
- **Modern Typography**: Luxury serif headings (**Marcellus**, **Playfair Display**) combined with elegant script lettering for faculty signatures and crisp UI sans-serif (**Inter**, **Outfit**).
- **Glassmorphism & Depth**: Multi-layer frosted glass (`backdrop-blur-2xl`), ambient gold glows, and subtle border accents.
- **Dynamic Micro-Interactions**: Rotating gold emblem, tactile tap responses (`active:scale-[0.98]`), confetti bursts on schedule submission, and live pulsing status dots.
- **Auto-Dismiss Notification Architecture**: All success messages display for 5 seconds and smoothly vanish automatically.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 18](https://react.dev/) with [TypeScript 5.6](https://www.typescriptlang.org/) |
| **Build & Bundler** | [Vite 6](https://vitejs.dev/) |
| **Styling (CSS)** | [Tailwind CSS 3.4](https://tailwindcss.com/) with Custom Design Tokens & Glassmorphism Utilities |
| **State Management** | [Zustand 4.5](https://github.com/pmndrs/zustand) with Real-Time Firestore Sync & Offline Cache |
| **Database & Cloud Backend** | [Google Firebase 12](https://firebase.google.com/) (Cloud Firestore Real-Time DB & Firebase Auth) |
| **Mobile App Engine** | [Capacitor 8](https://capacitorjs.com/) (Native Android APK & iOS Container) |
| **Spreadsheet Engine** | [SheetJS (XLSX)](https://sheetjs.com/) (Excel Roster Import, Subject Import & Report Export) |
| **Date & Calendar** | [date-fns 3.6](https://date-fns.org/) |
| **Iconography** | [Lucide React](https://lucide.dev/) |
| **Visual FX** | [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) |

---

## ⚡ Single Canonical Strategy (Zero-Inconsistency Architecture)

To guarantee 100% data consistency across Cloud Firestore, web browsers, and mobile devices, the system strictly enforces a **Single Canonical Data Strategy**:

```
┌─────────────────────────┬────────────────────────────────────────────────────────┬───────────────────────────┐
│ Entity                  │ Single Canonical Strategy                              │ Concrete Example          │
├─────────────────────────┼────────────────────────────────────────────────────────┼───────────────────────────┤
│ Period IDs              │ `P_${departmentId}_${sequence}`                        │ `P_CSE_1`, `P_CSE_2`...   │
│ Schedule Period Keys    │ Strictly indexed by `period.id`                        │ `periods['P_CSE_1']`      │
│ Schedule Document IDs   │ `${facultyId}_${date}`                                 │ `usr_123_2026-08-27`      │
│ Subject IDs             │ `sub_${departmentId.toLowerCase()}_${cleanCode}`       │ `sub_cse_cs501`           │
│ Assigned Load Counter   │ Strictly `count(entry.type !== 'FREE')`                │ 3 subjects = 3 Periods    │
│ Period Deletion Rule    │ Auto-renumbers remaining periods (`1, 2, ...`)         │ Writes clean batch to DB  │
└─────────────────────────┴────────────────────────────────────────────────────────┴───────────────────────────┘
```

- **Strict Ascending Sorting**: All period views (Live Dashboard, Timeline Modals, Period Management, and Faculty History) always render top-to-bottom in numerical order: **Period 1 $\rightarrow$ Period 2 $\rightarrow$ Period 3 $\rightarrow$ Period 4 $\dots$**
- **Live Reactive Modals**: Detail popups (Faculty Timeline Modal and Period Drilldown Modal) are bound to dynamic entity IDs (`selectedFacultyId`, `selectedPeriodId`). If a faculty submits or modifies their schedule while the HOD has the popup open, the modal updates live in real time on-screen.

---

## 👥 Role-Based Access Control & User Workflows

```
                               ┌─────────────────────────────┐
                               │  System Administrator       │
                               │  (Institutional Governance) │
                               └──────────────┬──────────────┘
                                              │
                       ┌──────────────────────┴──────────────────────┐
                       ▼                                             ▼
        ┌─────────────────────────────┐               ┌─────────────────────────────┐
        │  Head of Department (HOD)   │               │  Teaching Faculty           │
        │  (Live Monitoring & Matrix) │               │  (Daily Availability & Log) │
        └─────────────────────────────┘               └─────────────────────────────┘
```

---

### 1. 🛡️ System Administrator (`ADMIN`)
The Administrator maintains root governance over the entire institution:

- **User Directory & XLS Import (`/admin/users`)**:
  - Add individual faculty, AHODs, and HODs.
  - Download official Excel template and bulk import entire college rosters with automatic email validation and role classification.
  - Activate, deactivate, or permanently delete user accounts (with safeguard preventing accidental deletion of the root administrator).
- **Department Leadership (`/admin/hod-assignment`)**:
  - Appoint or re-assign Main HODs and Assistant HODs (AHODs) per department with real-time sync.
- **Department Management (`/admin/departments`)**:
  - Create and configure academic departments (e.g. `CSE`, `AIDS`, `ECE`, `MECH`).
- **Global Settings & Clean-Slate Purge (`/admin/settings`)**:
  - Set institutional name, academic year, semester, and allowed email domains.
  - **Clean Slate & Production Reset**: One-click purge that clears previous test schedules and seeds canonical baseline periods (`P_CSE_1`–`P_CSE_8`, `P_AIDS_1`–`P_AIDS_8`) directly into Cloud Firestore.
- **Sovereign Profile (`/admin/profile`)**:
  - Independent root administrative profile.

---

### 2. 👑 Head of Department (`HOD` & `AHOD`)
The HOD monitors and manages daily departmental operations in real time:

- **Live Real-Time Dashboard (`/hod/dashboard`)**:
  - **Live Availability Matrix**: Interactive cards for each period showing real-time counts of *Free* vs *Busy* faculty. Clicking any card opens the drilldown modal showing available substitution candidates.
  - **Faculty Submissions Table**: Displays every faculty member's submission status (**Submitted**, **Full Day Free**, or **Pending**), exact **Assigned Load** count (e.g. `3 Periods`), and submission timestamp.
  - **Schedule Timeline Modal**: Clicking **View** on any faculty displays their full chronological period breakdown (**Period 1 to Period 8**), updating live if the faculty changes entries.
  - **Excel Export**: Export the live daily availability roster to a formatted `.xlsx` spreadsheet.
- **Subject Master (`/hod/subjects`)**:
  - Manage official departmental course codes and subject titles.
  - Download Excel template and bulk import curriculum courses with deterministic IDs (`sub_cse_cs501`).
- **Department Staff Directory (`/hod/staff`)**:
  - View and manage department teaching staff, activate/deactivate accounts, and import faculty rosters.
- **Period Management (`/hod/periods`)**:
  - Add new periods or delete periods. When a period is removed, remaining periods are automatically renumbered (`Period 1`, `Period 2`...) and synchronized to Cloud Firestore in a single batch.
- **Reports & History (`/hod/reports`)**:
  - View historical availability, period utilization heatmaps, and workload distribution across custom date ranges.

---

### 3. 🎓 Teaching Faculty (`FACULTY`)
Faculty members submit their daily availability and track past schedules:

- **Daily Schedule Submission (`/faculty/schedule`)**:
  - **Interactive Date Ribbon**: Navigate between dates. Past dates are locked in read-only archive mode; today and future dates are editable.
  - **Period-by-Period Selection**: Click any period row to assign an official department subject (searchable by code or title) or enter custom academic duties (Lab, Exam Duty, Valuation, Mentorship, Meeting).
  - **One-Tap "Full Day Free"**: Instantly mark all periods as Free with confirmation dialog.
  - **Unsaved Changes Sentinel**: Visual warnings and browser-close guards prevent accidental navigation before clicking **Update & Save Schedule**.
  - **Real-Time HOD Modification Alerts**: If the HOD changes the period structure, faculty receive an instant live notification to review and submit for the updated slots.
- **History & Records (`/faculty/history`)**:
  - Audit log and calendar view of all past submissions with chronological period breakdowns and CSV/Excel export.
- **Faculty Profile (`/faculty/profile`)**:
  - View official designation, department affiliation, college email ID, and edit display name.

---

## 📊 Excel Bulk Import & Export Specifications

### 1. User Roster Excel Format
| Full Name | Email Address | Department | Designation | Role |
| :--- | :--- | :--- | :--- | :--- |
| Dr. Rajesh Kumar | rajesh@krce.ac.in | CSE | Professor & Head | HOD |
| Dr. Priya Sharma | priya@krce.ac.in | CSE | Associate Professor | AHOD |
| Prof. Arun V | arun@krce.ac.in | CSE | Assistant Professor | FACULTY |

### 2. Subject Master Excel Format
| Subject Code | Subject Name | Department | Short Name |
| :--- | :--- | :--- | :--- |
| CS501 | Database Management Systems | CSE | DBMS |
| CS502 | Operating Systems | CSE | OS |
| CS503 | Theory of Computation | CSE | TOC |

---

## 📱 Mobile App Container (Capacitor)

KALYANI is fully optimized for responsive mobile browsers and native mobile app compilation:

- **Touch Ergonomics**: All interactive buttons maintain a minimum height of 48px–54px with tactile scale animations (`active:scale-[0.98]`).
- **Off-Canvas Drawer**: Mobile navigation sidebar slides over smoothly with glassmorphism backdrop blur and auto-closes on route change.
- **Horizontal Ribbon Navigation**: Date strip and tables feature momentum touch-scrolling.

### Android Build Commands
```bash
# 1. Build the production web assets
npm run build

# 2. Sync web bundle to Android container
npx cap sync android

# 3. Open project in Android Studio to build APK / AAB
npx cap open android
```

### iOS Build Commands
```bash
# 1. Build the production web assets
npm run build

# 2. Sync web bundle to iOS container
npx cap sync ios

# 3. Open project in Xcode to build iOS App
npx cap open ios
```

---

## 🚀 Setup & Deployment Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Clone Repository & Install
```bash
git clone https://github.com/Krish-CS/KALYANI-FACULTY-PERIOD-MONTIORING-SYSTEM.git
cd KALYANI
npm install
```

### 2. Configure Firebase Credentials
Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Launch Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## 📂 Project Directory Structure

```
d:/KALYANI/
├── src/
│   ├── components/
│   │   ├── admin/               # UserManager, DepartmentManager, GlobalSettings, HodAssignment
│   │   ├── common/              # KalyaniButton, Card, Table, Modal, Badge, DatePicker, Logo
│   │   ├── faculty/             # DailyScheduleForm, PeriodSelectorRow, SubjectPickerModal
│   │   ├── hod/                 # SubjectMasterManager, PeriodAvailabilityGrid, FacultyStatusList, FacultyDetailModal
│   │   └── layout/              # AppNavbar, AppSidebar, AppLayout, RoleGuard
│   ├── hooks/                   # useAuth, usePeriods, useSubjects, useAcademicConfiguration
│   ├── pages/
│   │   ├── admin/               # AdminDashboardPage, AdminUsersPage, AdminDepartmentsPage, AdminSettingsPage
│   │   ├── auth/                # LoginPage (Institutional Credentials & Admin Access)
│   │   ├── faculty/             # FacultySchedulePage, FacultyHistoryPage, FacultyProfilePage
│   │   └── hod/                 # HodDashboardPage, HodPeriodsPage, HodSubjectsPage, HodStaffPage, HodReportsPage
│   ├── services/                # authService, firestoreService, excelService, seedDataService
│   ├── store/                   # useAppStore (Zustand state & Firestore sync), useAuthStore
│   ├── types/                   # user.ts, period.ts, subject.ts, schedule.ts, department.ts
│   ├── utils/                   # dateUtils.ts, validation.ts, exportUtils.ts
│   ├── App.tsx                  # Root application router & real-time sync listeners
│   └── main.tsx                 # Vite entry point
├── firestore.rules              # Cloud Firestore security rules
├── tailwind.config.js           # Royal Crimson & Gold theme tokens
└── package.json                 # Project configuration & scripts
```

---

## 📄 Institutional License & Rights

Designed and maintained for **Higher Education Institutional Operations**. All rights reserved.
