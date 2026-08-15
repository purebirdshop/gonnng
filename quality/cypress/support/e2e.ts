// Cypress support/e2e.ts file
import './commands';

const defaultTestUser = {
  id: 'user-current',
  publicId: 'c-current',
  username: 'jasonburns',
  email: 'qa_tester@gonnng.test',
  name: 'Jason Burns',
  avatarUrl: '',
  isOnboarded: true,
  allowedEnvironments: ['development', 'test', 'production']
};

const defaultTestCreator = {
  id: 'user-current',
  publicId: 'c-current',
  name: 'Jason Burns',
  handle: '@jasonburns',
  avatarUrl: '',
  bannerUrl: '',
  bio: 'Creative technologist & product builder.',
  goals: 'Finish high-impact projects and inspire builders.',
  privacyDefault: 'public',
  followerIds: [],
  followingIds: [],
  followersCount: 0,
  followingCount: 0,
  email: 'qa_tester@gonnng.test'
};

beforeEach(() => {
  cy.setCookie('gonnng_session', JSON.stringify(defaultTestUser));
});

// Seed localStorage before each page load to ensure clean tests without modal overlays
Cypress.on('window:before:load', (win) => {
  win.localStorage.setItem('gonnng_auth_session', JSON.stringify(defaultTestUser));
  win.localStorage.setItem('gonnng_current_user', JSON.stringify(defaultTestCreator));
  win.localStorage.setItem('gonnng_philosophy_seen', 'true');
  win.localStorage.setItem('gonnng_tutorial_done', 'true');
  win.localStorage.setItem('gonnng_cookie_preferences', JSON.stringify({
    strictlyNecessary: true,
    analytics: false,
    marketing: false,
    userPreferences: false,
    timestamp: new Date().toISOString()
  }));
});

// Hide uncaught exception logs that are benign during UI tests
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('ResizeObserver') || err.message.includes('WebSocket')) {
    return false;
  }
  return true;
});
