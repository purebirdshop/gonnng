# Gonnng React Native Mobile Application

This directory (`/mobile`) contains the React Native (Expo) app for the Gonnng platform, located alongside the main web application directory (`/src`).

## 🚀 Features

- **Authentication**: Sign in against the Gonnng REST API backend (`/api/auth/login`).
- **Creator Feed**: View live creator activity, recipes, and project updates.
- **Project Workspaces**: Browse user projects, categories, and progress statuses.
- **Profile Management**: View creator details and app environment connection status.

## 🛠️ Quick Start

### 1. Navigate to Mobile Directory
```bash
cd mobile
```

### 2. Install Mobile Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
# Start Expo dev server
npm start

# Or launch directly on iOS Simulator / Android Emulator
npm run ios
npm run android
```

## ⚙️ Configuration

The mobile app points to the Gonnng backend API via `/mobile/src/services/api.ts`.
To point the app to a custom domain or local development server, update `API_BASE_URL` or call `setApiBaseUrl('https://your-api-domain.com')`.
