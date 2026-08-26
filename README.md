# 👑 KALYANI — Faculty Availability & Period Management System

> **Institutional Academic Load Tracking, Real-Time Period Allocation, and Dynamic Substitution Matrix for Higher Education Institutions.**

---

## 📖 Overview

**KALYANI** is an institutional academic operations and faculty availability management platform designed for colleges and universities. It replaces slow paper registers and fragmented messaging groups with a synchronized cloud system.

Faculty members can allocate their daily subject teaching loads or mark themselves as **Full Day Free** with a single tap. Department Heads (HODs) gain real-time visibility into available substitution faculty for every teaching period, while institutional Administrators retain centralized governance over users, departments, and dynamic timetable configurations.

---

## 🏛️ Distinctive Design System & Aesthetic

KALYANI is built with a **Royal Indian Heritage** aesthetic combined with **Apple-inspired fluid micro-interactions**:

- **Color Palette**: Deep Royal Velvet Crimson (`#4A0404`, `#7B1113`, `#9B1A39`) paired with Warm Lustrous Gold (`#D4AF37`, `#F3E5AB`, `#996515`) and Emerald/Teal operational indicators.
- **Typography**: Classic serif headings (**Marcellus**, **Playfair Display**) combined with modern sans-serif readability (**Inter**, **Outfit**).
- **Glassmorphism & Depth**: Multi-layered backdrop blurs (`backdrop-blur-2xl`), ambient glow drop-shadows, and luxury gold border framing.
- **Dynamic Micro-Interactions**: Continuous 360° swirling logo emblem, tactile scale effects on touch, pulsing operational indicators, and celebratory confetti particles upon schedule submission.
- **Auto-Dismiss Notification Architecture**: All success confirmation cards display for 5 seconds and smoothly vanish automatically without requiring manual dismissal.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 18](https://react.dev/) with [TypeScript 5.6](https://www.typescriptlang.org/) |
| **Build & Bundler** | [Vite 6](https://vitejs.dev/) |
| **Styling & Design** | [Tailwind CSS 3.4](https://tailwindcss.com/) with Custom HSL Tokens & Glassmorphism |
| **State Management** | [Zustand 4.5](https://github.com/pmndrs/zustand) with Persistent Local Storage & Snapshot Caching |
| **Backend & Cloud DB** | [Google Firebase 12](https://firebase.google.com/) (Cloud Firestore Real-Time DB & Google Workspace SSO) |
| **Mobile App Engine** | [Capacitor 8](https://capacitorjs.com/) (Native Android & iOS Hybrid Container, Local Push Notifications) |
| **Spreadsheet Engine** | [SheetJS (XLSX)](https://sheetjs.com/) (Zero-latency Excel Bulk Import & Matrix Exports) |
| **Date & Calendar** | [date-fns 3.6](https://date-fns.org/) |
| **Iconography** | [Lucide React](https://lucide.dev/) |
| **Visual FX** | [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) |

---

## 👥 Role-Based Access Control (RBAC)

KALYANI defines four distinct institutional roles with strictly compartmentalized authorization:

```
┌────────────────────────────────────────────────────────┐
│               ADMINISTRATOR (Super-Admin)              │
│  Central Directory • Departments • Global Timetables   │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌─────────────────────────┐  ┌─────────────────────────┐
│     HEAD OF DEPT (HOD)  │  │  ASSISTANT HOD (AHOD)    │
│  Live Availability Roster│  │  Co-Leadership &        │
│  Subject Master & Rules │  │  Teaching Availability   │
└────────────┬────────────┘  └───────────┬─────────────┘
             │                           │
             └─────────────┬─────────────┘
                           ▼
             ┌───────────────────────────┐
             │    FACULTY (Professors)   │
             │ Daily Period Allocations  │
             │ Full Day Free One-Tap     │
             └───────────────────────────┘
```

### 1. 🛡️ Administrator (`ADMIN`)
- **Central User Directory**: Create, edit, toggle active status, or permanently delete user accounts. Includes protective guards preventing accidental deletion or deactivation of the master administrator.
- **Excel User Bulk Import**: One-click upload of institutional faculty rosters with automatic duplicate email detection.
- **Department Leadership Management**: Appoint or re-assign HODs and multiple Assistant HODs (AHODs) across departments.
- **Dynamic Period Configurator**: Define, rename, enable, or disable institution-wide teaching periods (e.g. `Period 1` to `Period 8`).
- **Global Settings & Database Purge**: Configure institutional domain verification, academic year, and execute clean production database resets.

### 2. 👑 Head of Department (`HOD`)
- **Live Operations Dashboard (`/hod/dashboard`)**: Real-time period-by-period matrix displaying free vs. busy faculty members for immediate substitution dispatching.
- **Subject Master Management (`/hod/subjects`)**: Simplified institutional catalog (Subject Code & Official Name). Supports manual entry, multi-select batch deletion, single permanent deletion from Cloud Firestore, and Excel bulk importing.
- **Department Faculty Monitoring (`/hod/faculty`)**: Tracks individual submissions with search by faculty name, subject code, or designation. *The Main HOD and Administrator are automatically excluded from the faculty submission roster to maintain operational focus.*
- **Academic Rules Configurator (`/hod/rules`)**: Sets maximum assigned teaching periods per day and toggles future-date advance submission permissions.
- **Historical Availability Matrix (`/hod/history`)**: Audit past allocations by date and export comprehensive daily rosters directly to formatted Excel spreadsheets.
- **HOD My Profile (`/hod/profile`)**: Dedicated personal profile and departmental badge hub.

### 3. 🎖️ Assistant Head of Department (`AHOD`)
- Departmental co-leadership access with full faculty availability submission capabilities.

### 4. 🎓 Faculty Member (`FACULTY`)
- **Interactive Daily Schedule Form (`/faculty/schedule`)**: Fast period-by-period allocation selecting official department subjects or custom academic duties.
- **One-Tap "Full Day Free"**: Instantly signals total availability for the entire day with equal-height tactile button ergonomics.
- **Unsaved Changes Sentinel**: Real-time warning card and browser unload guards to prevent accidental data loss before clicking *Update & Save Schedule*.
- **Visual Status Feedback**: Clear badges and pulsing indicators notifying faculty when today's schedule is pending submission.
- **Submission History (`/faculty/history`)**: Chronological audit log of past daily allocations.
- **Faculty Profile (`/faculty/profile`)**: Personal details, designation, and department affiliation.

---

## 📱 Mobile App Design & Ergonomics

KALYANI has been built from the ground up to operate seamlessly both as a high-resolution desktop web application and as an **installed mobile app** (Android APK & iOS IPA via Capacitor):

1. **Touch-Friendly Controls**: Minimum touch targets of 48px to 54px. The `Assigned Load` counter and `Full Day Free` button maintain identical 54px heights with tactile tap animations (`active:scale-[0.98]`).
2. **Off-Canvas Navigation Drawer**: Smooth slide-over sidebar drawer on mobile screens (`< 1024px`) with frosted glass backdrop blur and auto-closing on route navigation.
3. **Adaptive Date Ribbon & Popup Calendar**: Interactive horizontal date scroll strip accompanied by a full-screen responsive calendar popup with direct Month and Year selectors that never overflow narrow mobile viewports.
4. **Responsive Horizontal Scrolling Tables**: All tabular data is wrapped in smooth momentum-scrolling containers (`overflow-x-auto`) with sticky headers.
5. **Auto-Vanishing Alerts**: All green confirmation banners vanish after 5 seconds, preventing notification clutter on small screens.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-institution/kalyani-faculty-system.git
cd kalyani-faculty-system

# Install dependencies
npm install
```

### 2. Configure Firebase Environment
Create a `.env` file in the project root with your Google Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> **Note**: If Firebase environment variables are not provided, KALYANI automatically runs in **Offline Demo Mode** with local storage snapshot persistence.

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production Web
```bash
npm run build
```
Generates optimized static bundles in the `dist/` directory.

---

## 📲 Mobile App Build Workflow (Capacitor)

KALYANI includes Capacitor integration for building native mobile packages:

### Android Build
```bash
# 1. Build the production web bundle
npm run build

# 2. Add Android platform (first-time only)
npx cap add android

# 3. Sync web assets with native project
npx cap sync android

# 4. Open in Android Studio to build APK / AAB
npx cap open android
```

### iOS Build
```bash
# 1. Build the production web bundle
npm run build

# 2. Add iOS platform (first-time only)
npx cap add ios

# 3. Sync web assets with native project
npx cap sync ios

# 4. Open in Xcode to build iOS App
npx cap open ios
```

---

## 📂 Project Structure

```
d:/KALYANI/
├── public/
│   └── assets/                  # Institutional logos, top-text emblem, & icons
├── src/
│   ├── components/
│   │   ├── admin/               # UserManager, DepartmentManager, GlobalSettings, HodAssignment
│   │   ├── common/              # KalyaniButton, Card, Table, Modal, DatePicker, Logo, SplashScreen
│   │   ├── faculty/             # DailyScheduleForm, PeriodSelectorRow, SubjectPickerModal
│   │   ├── hod/                 # SubjectMasterManager, PeriodAvailabilityGrid, FacultyStatusList
│   │   └── layout/              # AppNavbar, AppSidebar, AppLayout
│   ├── hooks/                   # useAuth, usePeriods, useSubjects, useAcademicConfiguration
│   ├── pages/
│   │   ├── admin/               # AdminDashboardPage, AdminPeriodsPage, AdminUsersPage, etc.
│   │   ├── auth/                # LoginPage (Google Workspace SSO & Administrator Key entry)
│   │   ├── faculty/             # FacultySchedulePage, FacultyHistoryPage, FacultyProfilePage
│   │   └── hod/                 # HodDashboardPage, HodPeriodsPage, HodFacultyPage, HodHistoryPage
│   ├── routes/                  # Route definitions & Role-based route protection
│   ├── services/                # authService, firestoreService, excelService, seedDataService
│   ├── store/                   # useAppStore (Zustand central state), useAuthStore
│   ├── styles/                  # index.css (Custom Tailwind animations, glassmorphism, fonts)
│   ├── types/                   # user.ts, period.ts, subject.ts, schedule.ts, department.ts
│   ├── utils/                   # dateUtils, validation, exportUtils
│   ├── App.tsx                  # Root Application Component
│   └── main.tsx                 # Vite entry point
├── capacitor.config.ts          # Mobile app container configuration
├── tailwind.config.js           # Custom Royal Crimson & Gold theme configuration
├── package.json                 # Project dependencies & scripts
└── tsconfig.json                # TypeScript compiler configuration
```

---

## 📄 License & Institutional Rights

Designed and maintained for **Higher Education Institutional Operations**. All rights reserved.
