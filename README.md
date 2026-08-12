# Gonnng - Process Blueprint & Project Execution Studio

Gonnng is a process blueprint studio and social progress tracker that empowers creators to create, sequence, and execute complex project blueprints with circle feedback, camera log progress capture, and team collaboration.

---

## 🚀 Quick Start: Installation, Build & Execution

### 1. Install Dependencies
Clone the repository and install all required Node modules:
```bash
npm install
```

### 2. Development Server
Start the local development server with live reload on port 3000 (`tsx server.ts`):
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build & Execution
Compile the React frontend with Vite and bundle the Node/Express server into CommonJS (`dist/server.cjs`) using esbuild:
```bash
npm run build
npm run start
```

### 4. Clean Build Artifacts
Remove build outputs (`dist/`) and leftover server files:
```bash
npm run clean
```

---

## ⚙️ Environment Variable Configuration (`.env`)

Copy `.env.example` to `.env` and fill in your service credentials:

```bash
cp .env.example .env
```

### `.env` File Reference
```env
# App Deployment URL
APP_URL="http://localhost:3000"

# Supabase Integration (Database & Storage)
VITE_ENABLE_SUPABASE="true"
SUPABASE_DATA_URL=""
SUPABASE_STORAGE_URL=""
SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_STORAGE_BUCKET="post-media"
VITE_SUPABASE_PUBLIC_MEDIA_URL="/media"

# Resend Transactional Email Service
RESEND_API_KEY="re_123456789_your_key"
RESEND_FROM_EMAIL="Gonnng <onboarding@resend.dev>"
VITE_RESEND_API_KEY="re_123456789_your_key"

# Authentication & Feature Flags
VITE_ENABLE_AUTH="true"
VITE_ENABLE_FILE_UPLOADS="true"

# Multi-Environment Configuration (Trunk/Canary Model)
APP_ENV="Dev"
ALLOWED_EMAIL_DOMAINS="gonnng.app,gmail.com"
```

---

## 🗄️ Database Setup & Operations (Supabase)

Database migrations, row-level security (RLS) policies, triggers, seed data, and data repair backfills are maintained in `/logs/supabase/`.

### Step 1: Create Supabase Project
1. Sign in to [Supabase.com](https://supabase.com) and create a project.
2. Under **Project Settings -> API**, retrieve your `SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### Step 2: Initialize Database Schema & Seed Data
Execute the master SQL initialization script in the **Supabase Dashboard SQL Editor** or via `psql`:

```bash
psql "$SUPABASE_DB_URL" -f logs/supabase/setup_all.sql
```

This runs the full suite in topological order:
1. **Migrations**: Extensions, users, creators, recipes, projects, posts, follows, cookies.
2. **Functions & Views**: Triggers, environment helpers, circles and notification views.
3. **RLS Policies**: Row-level security for users, recipes, projects, posts, and system tables.
4. **Backfills**: Name splits, filepath public_id conversions, auth credential repairs.
5. **Seeds**: Core demo accounts (all use password `test1234`), blueprints, collections, posts, and announcements.

To completely reset and rebuild the development database:
```bash
psql "$SUPABASE_DB_URL" -f logs/supabase/reset_dev.sql
```

For detailed schema documentation, see `/logs/supabase/README.md` and `/logs/supabase/policies/README.md`.

---

## 📧 Transactional Email Touchpoints (Resend)

Resend handles account security and notification emails:

1. **Verify Email Address**: Account registration verification link.
2. **Reset Password**: Password reset access token link.
3. **Welcome Onboarding**: Getting-started guide upon activation.
4. **Email Address Change**: Dual-verification link for primary email updates.
5. **Magic Link / Passwordless Sign-In**: Instant passwordless sign-in link.
6. **Security Alerts**: Login notifications for new devices or security events.

---

## 🧪 Testing & Quality Assurance Suites

The project includes an automated testing suite covering static types, API service layer integration, and functional UI layouts.

### 1. Static Type Checking
```bash
npm run lint
```
Runs `tsc --noEmit` to verify type safety across frontend and backend code.

### 2. API Service Layer Tests (Newman & Postman)
```bash
npm run test:api
```
Executes the Postman collection (`quality/postman/service_layer_tests.postman_collection.json`) via Newman against `/api/health`, `/api/cookie-governance`, `/api/auth/*`, and `/api/projects`.

### 3. Functional E2E UI Tests (Cypress)
```bash
npm run test:e2e
```
Runs Cypress end-to-end functional tests across Desktop (1280x800) and Mobile (375x812, 390x844) viewports.

For full QA specifications and test case matrices, see `/quality/README.md` and `/quality/test_cases.csv`.

---

## 📱 Native Mobile App Integration (Capacitor for iOS & Android)

Gonnng uses **Capacitor** to wrap the web application in a native iOS and Android shell with native device API integration.

### 1. Capacitor Prerequisites
Ensure you have the required native platform developer tools installed on your computer:
- **iOS**: macOS with Xcode 15+ and CocoaPods installed.
- **Android**: Android Studio with Android SDK (API 33+).

### 2. Capacitor Commands & Scripts
The following npm scripts manage mobile builds:

```bash
# 1. Build the web dist assets and sync them into iOS & Android projects
npm run cap:build

# 2. Sync web assets and plugins to native platforms
npm run cap:sync

# 3. Open iOS project in Xcode
npm run cap:open:ios

# 4. Open Android project in Android Studio
npm run cap:open:android
```

### 3. Adding Platforms (First-Time Setup)
If adding iOS or Android native projects for the first time on a new machine:

```bash
# Add iOS platform folder
npx cap add ios

# Add Android platform folder
npx cap add android

# Copy web build & sync native dependencies
npx cap sync
```

### 4. Configuration & Native Plugins
- **Config File**: `/capacitor.config.json` sets `appId` (`com.gonnng.app`), `appName` (`Gonnng`), dark status bar, and keyboard behavior.
- **Installed Native Plugins**:
  - `@capacitor/core`: Native runtime bridge.
  - `@capacitor/status-bar`: Configures dark/light system status bars.
  - `@capacitor/keyboard`: Handles keyboard resize and focus styling.
  - `@capacitor/haptics`: Tactile vibration feedback for buttons and Gong celebrations.
  - `@capacitor/app`: App lifecycle, hardware back button handling, and deep links.

---

## 📁 Directory Structure

```text
.
├── .env.example                               # Environment variable template
├── package.json                               # Dependencies and build/test scripts
├── server.ts                                  # Express server with Vite middleware integration
├── src/                                       # React SPA application source
│   ├── components/                            # UI views (CreateHub, UserProfile, Feed, etc.)
│   └── services/                              # Client services (authService, emailService, dataService)
├── logs/
│   ├── supabase/                              # Active database migrations, RLS policies, seeds, and setup scripts
│   └── old_odl_sql/                           # Legacy database schema archives
└── quality/                                   # QA suite (Postman API tests, Cypress E2E tests, CSV test matrix)
```
