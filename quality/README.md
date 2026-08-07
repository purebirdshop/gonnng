# Quality Assurance & Automation Suite

This directory contains the Quality Assurance (QA) artifacts, API Service Layer Test Automation Suite (Postman & Newman), Functional Test Automation Suite (Cypress), and the master Test Cases specification CSV.

---

## Directory Overview

```text
quality/
├── test_cases.csv                            # Master CSV test matrix (Title, Description, Steps, Validation, Results)
├── postman/
│   ├── service_layer_tests.postman_collection.json # API Postman test collection with status & payload assertions
│   └── environment.postman_environment.json        # Postman environment config (baseUrl, auth variables)
├── cypress/
│   ├── cypress.config.ts                     # Cypress configuration file (baseUrl, viewport settings)
│   ├── support/
│   │   ├── e2e.ts                            # Global Cypress hooks & exception handlers
│   │   └── commands.ts                       # Custom Cypress assertions (mobile viewport, touch target size)
│   └── e2e/
│       ├── desktop-layout.cy.ts              # Desktop layout & navigation functional tests (1280x800)
│       └── mobile-layout.cy.ts               # Mobile layout & responsive touch functional tests (375x812, 390x844)
└── README.md                                 # Documentation & Execution commands
```

---

## Test Execution Commands

### 1. Service Layer Tests (Newman & Postman)

Run the Postman collection against the active application backend via Newman CLI:

```bash
npx newman run quality/postman/service_layer_tests.postman_collection.json -e quality/postman/environment.postman_environment.json
```

Or using npm script:
```bash
npm run test:api
```

### 2. Functional E2E Tests (Cypress)

Run headless functional tests across Desktop and Mobile viewports:

```bash
npx cypress run --config-file quality/cypress/cypress.config.ts
```

Or using npm script:
```bash
npm run test:e2e
```

To open Cypress Interactive Test Runner UI:
```bash
npx cypress open --config-file quality/cypress/cypress.config.ts
```

---

## Test Coverage Summary

- **Service Layer (API)**: `/api/health`, `/api/cookie-governance`, `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/projects`, `/api/auth/logout`.
- **Desktop Functional Layout**: Header controls, gear icon settings drawer, search button styling, desktop modal dialogues, session persistence on page reload.
- **Mobile Functional Layout**: Fluid mobile header, responsive touch target sizes (>= 32/44px), mobile Circle search view, mobile settings drawer, orientation adaptation.
- **Test Matrix (`test_cases.csv`)**: Full traceability table including Title, Description, Type, Viewport, Steps, Validation, and Results.
