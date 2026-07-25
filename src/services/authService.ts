/// <reference types="vite/client" />
import { Creator } from '../types';

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
    id: 'user-current',
    publicId: 'U91XkQa7Z',
    username: 'jasonburns',
    email: 'test@gonnng.com',
    name: 'Jason Tyler',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    isOnboarded: true
  },
  'qa@gonnng.com': {
    id: 'creator-qa',
    publicId: 'Q83LmQa9Y',
    username: 'qa_lead',
    email: 'qa@gonnng.com',
    name: 'Quinton Adams',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    isOnboarded: true
  },
  'creator@gonnng.com': {
    id: 'creator-clara',
    publicId: 'C72PzKb1W',
    username: 'creator_clara',
    email: 'creator@gonnng.com',
    name: 'Clara Monet',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
    isOnboarded: true
  },
  'dev@gonnng.com': {
    id: 'creator-dev',
    publicId: 'D51VnJc3R',
    username: 'dev_david',
    email: 'dev@gonnng.com',
    name: 'David Vance',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    isOnboarded: true
  },
  'product@gonnng.com': {
    id: 'creator-product',
    publicId: 'P49MkWd2S',
    username: 'product_penelope',
    email: 'product@gonnng.com',
    name: 'Penelope Reed',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
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

  login(email: string, pass: string): { success: boolean; user?: UserSession; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    
    // Check against predefined test accounts
    if (DEMO_ACCOUNTS[cleanEmail]) {
      if (pass === 'test1234') {
        const session: UserSession = DEMO_ACCOUNTS[cleanEmail];
        localStorage.setItem(AUTH_KEY, JSON.stringify(session));
        return { success: true, user: session };
      } else {
        return { success: false, error: 'Incorrect password. Try "test1234" for the test account.' };
      }
    }

    // Check registered users in local storage
    try {
      const registeredStr = localStorage.getItem('gonnng_registered_users');
      if (registeredStr) {
        const registered = JSON.parse(registeredStr);
        const match = registered.find((u: any) => u.email.toLowerCase() === cleanEmail);
        if (match) {
          if (match.password === pass) {
            const session: UserSession = {
              id: match.id,
              publicId: match.publicId,
              username: match.username || match.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
              email: match.email,
              name: match.name,
              avatarUrl: match.avatarUrl,
              isOnboarded: match.isOnboarded ?? false
            };
            localStorage.setItem(AUTH_KEY, JSON.stringify(session));
            return { success: true, user: session };
          } else {
            return { success: false, error: 'Incorrect password. Try "test1234" for the test account.' };
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    return { success: false, error: 'Account not found. Valid test logins: qa@gonnng.com, creator@gonnng.com, dev@gonnng.com, product@gonnng.com, test@gonnng.com (password: test1234).' };
  },

  register(name: string, email: string, pass: string): { success: boolean; user?: UserSession; error?: string } {
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
  }
};
