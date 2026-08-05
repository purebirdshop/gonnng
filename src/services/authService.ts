/// <reference types="vite/client" />
import { Creator } from '../types';
import { uploadService } from './uploadService';

export interface UserSession {
  id: string; // Internal System ID
  publicId?: string; // Public Identifier
  username?: string; // Unique username e.g. jasonburns
  email: string;
  name: string;
  avatarUrl?: string;
  isOnboarded?: boolean;
}

const AUTH_KEY = 'gonnng_auth_session';

export const isAuthFeatureEnabled = (): boolean => {
  // Defaults to true if VITE_ENABLE_AUTH is not explicitly 'false'
  return import.meta.env.VITE_ENABLE_AUTH !== 'false';
};

export const DEMO_ACCOUNTS: Record<string, UserSession> = {
  'test@gonnng.com': {
    id: '4c0ab90e-6ec5-4a14-bb46-f10d4dc7bcb2',
    publicId: '4c0ab90e-6ec5-4a14-bb46-f10d4dc7bcb2',
    username: 'gyro_gearloose',
    email: 'test@gonnng.com',
    name: 'Gyro Gearloose',
    isOnboarded: true
  },
  'qa@gonnng.com': {
    id: '546bf5b4-28cb-4501-a1a0-c2f57c98f1a0',
    publicId: '546bf5b4-28cb-4501-a1a0-c2f57c98f1a0',
    username: 'darkwing_duck',
    email: 'qa@gonnng.com',
    name: 'Darkwing Duck',
    isOnboarded: true
  },
  'creator@gonnng.com': {
    id: '0dfeeb75-c15d-4825-9d94-0b6d66c7bb01',
    publicId: '0dfeeb75-c15d-4825-9d94-0b6d66c7bb01',
    username: 'scrooge_mcduck',
    email: 'creator@gonnng.com',
    name: 'Scrooge Mcduck',
    isOnboarded: true
  },
  'dev@gonnng.com': {
    id: '5a44d547-08db-4702-92b3-2d0f8c13a301',
    publicId: '5a44d547-08db-4702-92b3-2d0f8c13a301',
    username: 'mario',
    email: 'dev@gonnng.com',
    name: 'Mario',
    isOnboarded: true
  },
  'product@gonnng.com': {
    id: 'f0f68338-8933-48d8-8f1d-9eb3aaf4f902',
    publicId: 'f0f68338-8933-48d8-8f1d-9eb3aaf4f902',
    username: 'luigi',
    email: 'product@gonnng.com',
    name: 'Luigi',
    isOnboarded: true
  }
};

export const DEMO_USER: UserSession = DEMO_ACCOUNTS['test@gonnng.com'];

export const authService = {
  getCurrentSession(): UserSession | null {
    if (!isAuthFeatureEnabled()) {
      return DEMO_USER; // Bypassed if auth feature flag is disabled
    }
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  // Verify server session cookie on app initialization (FR-101, FR-104)
  async checkServerSession(): Promise<UserSession | null> {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          localStorage.setItem(AUTH_KEY, JSON.stringify(data.user));
          return data.user;
        }
      }
    } catch (err) {
      console.warn('Server session check fallback:', err);
    }
    return this.getCurrentSession();
  },

  // Login user and establish HttpOnly secure cookie
  login(email: string, pass: string, rememberMe = true): { success: boolean; user?: UserSession; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    let targetSession: UserSession | null = null;
    let authError: string | null = null;
    
    // Check against predefined test accounts
    if (DEMO_ACCOUNTS[cleanEmail]) {
      if (pass === 'test1234') {
        targetSession = DEMO_ACCOUNTS[cleanEmail];
      } else {
        authError = 'Incorrect password. Try "test1234" for the test account.';
      }
    } else {
      // Check registered users in local storage
      try {
        const registeredStr = localStorage.getItem('gonnng_registered_users');
        if (registeredStr) {
          const registered = JSON.parse(registeredStr);
          const match = registered.find((u: any) => u.email.toLowerCase() === cleanEmail);
          if (match) {
            if (match.password === pass) {
              targetSession = {
                id: match.id,
                publicId: match.publicId,
                username: match.username || match.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
                email: match.email,
                name: match.name,
                avatarUrl: match.avatarUrl,
                isOnboarded: match.isOnboarded ?? false
              };
            } else {
              authError = 'Incorrect password. Try "test1234" for the test account.';
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (!targetSession && !authError) {
      authError = 'Account not found. Valid test logins: qa@gonnng.com, creator@gonnng.com, dev@gonnng.com, product@gonnng.com, test@gonnng.com (password: test1234).';
    }

    if (targetSession) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(targetSession));

      // Asynchronously trigger server login to issue HttpOnly gonnng_session cookie
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetSession.email,
          rememberMe,
          customUser: targetSession
        })
      }).then(r => r.json()).then(data => {
        console.log('✅ [Auth Cookie Established]: gonnng_session set for', data.user?.email);
      }).catch(err => {
        console.warn('Backend cookie setup warning:', err);
      });

      return { success: true, user: targetSession };
    }

    return { success: false, error: authError || 'Authentication failed' };
  },

  async register(name: string, email: string, pass: string, rememberMe = true): Promise<{ success: boolean; user?: UserSession; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = name.toLowerCase().replace(/[^a-z0-9_]/g, '');
    
    try {
      const registeredStr = localStorage.getItem('gonnng_registered_users');
      const registered = registeredStr ? JSON.parse(registeredStr) : [];
      
      if (registered.some((u: any) => u.email.toLowerCase() === cleanEmail) || DEMO_ACCOUNTS[cleanEmail]) {
        return { success: false, error: 'An account with this email already exists.' };
      }

      const newUser = {
        id: `usr_int_${Date.now()}`,
        publicId: Math.random().toString(36).substring(2, 11).toUpperCase(),
        username: cleanUsername,
        name,
        email: cleanEmail,
        password: pass,
        avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400`,
        isOnboarded: false
      };

      registered.push(newUser);
      localStorage.setItem('gonnng_registered_users', JSON.stringify(registered));

      const session: UserSession = {
        id: newUser.id,
        publicId: newUser.publicId,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        avatarUrl: newUser.avatarUrl,
        isOnboarded: false
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));

      // Asynchronously trigger server login to set secure HttpOnly authentication cookie
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session.email,
          rememberMe,
          customUser: session
        })
      }).catch(() => {});

      return { success: true, user: session };
    } catch (e) {
      return { success: false, error: 'Failed to complete registration.' };
    }
  },

  completeOnboarding(): void {
    const session = this.getCurrentSession();
    if (session) {
      session.isOnboarded = true;
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    }
  },

  logout(): void {
    localStorage.removeItem(AUTH_KEY);
    fetch('/api/auth/logout', { method: 'POST' })
      .then(() => console.log('✅ [Auth Cookie Cleared]: Logged out from backend session'))
      .catch(() => {});
  }
};
