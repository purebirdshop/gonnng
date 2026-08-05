# Gonnng - Process Blueprint & Project Execution Studio

Gonnng is a process blueprint studio and social progress tracker that empowers users to create, sequence, and execute complex project blueprints with circle feedback and camera log progress capture.

---

## 🛠️ Third-Party Account Setup & Prerequisites

Follow these steps to configure external services and launch the application locally or in production.

### Step 1: Clone Repository & Install Dependencies
Clone the repository and install all required node modules:
```bash
npm install
```

---

### Step 2: Set Up Supabase Account (Database & Storage)
1. Visit [Supabase.com](https://supabase.com) and create a free account.
2. Click **New Project**, enter a project name, database password, and choose your preferred region.
3. Once provisioned, navigate to **Project Settings -> API** and copy:
   - **Project URL** (`SUPABASE_URL`)
   - **Project API Key / Anon Key** (`VITE_SUPABASE_ANON_KEY`)
4. Open the **SQL Editor** in your Supabase Dashboard.
5. Execute the SQL migration and seed scripts found in the project directory:
   - Execute `/logs/supabase/01_schema.sql` to initialize tables and security rules.
   - Execute `/logs/supabase/02_seed.sql` to populate initial demo data.

---

### Step 3: Set Up Resend Account (Transactional Email Delivery)
Resend handles email notifications for account authentication and security events.

1. Visit [Resend.com](https://resend.com) and sign up for a free account.
2. Go to **Domains** and verify your domain (or use `onboarding@resend.dev` for local test deliveries).
3. Go to **API Keys** in the sidebar and click **Create API Key**.
4. Set permission to **Full Access** or **Sending Access** and copy the generated key (`VITE_RESEND_API_KEY`).

---

### Step 4: Configure Environment Variables
Copy `.env.example` to `.env` and fill in your service credentials:

```bash
cp .env.example .env
```

Set the values in `.env`:
```env
APP_URL="http://localhost:3000"

# Supabase Credentials
VITE_ENABLE_SUPABASE="true"
SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"

# Resend Email Key
VITE_RESEND_API_KEY="re_123456789_your_key"

# Feature Flags
VITE_ENABLE_AUTH="true"
VITE_ENABLE_FILE_UPLOADS="true"
```

---

### Step 5: Start Development Server
Run the local development server on port 3000:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📧 Transactional Email Touchpoints (Resend)

Gonnng uses Resend across the following authentication & user account workflows:

1. **Verify Email Address**: Delivers an account verification link when registering a new account.
2. **Reset Password**: Delivers a password reset link for forgotten credentials.
3. **Welcome Onboarding Email**: Delivers getting-started instructions upon account activation.
4. **Email Address Change Confirmation**: Delivers a dual-verification link when updating primary email.
5. **Magic Link / Passwordless Sign-In**: Delivers instant sign-in access links.
6. **Security & Login Alerts**: Delivers immediate security warnings on new device logins or password updates.

---

## 📁 Project Structure
- `/src/components`: UI views (CreateHub, UserProfile, Feed, SandEngine, etc.)
- `/src/services`: API handlers (`authService.ts`, `emailService.ts`, `dataService.ts`, `uploadService.ts`)
- `/logs/supabase`: Database schemas (`01_schema.sql`, `02_seed.sql`)
