/// <reference types="vite/client" />

export interface UserSession {
  id: string; // Internal System ID
  publicId?: string; // Public Identifier
  username?: string; // Unique username e.g. jasonburns
  email: string;
  name: string;
  avatarUrl?: string;
  isOnboarded?: boolean;
  allowedEnvironments?: string[];
}

const AUTH_KEY = 'gonnng_auth_session';

export const isAuthFeatureEnabled = (): boolean => {
  return import.meta.env.VITE_ENABLE_AUTH !== 'false';
};

async function parseJsonResponse(res: Response): Promise<any> {
  const text = await res.text();
  if (!text || !text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    console.error('Received non-JSON response from server:', text.slice(0, 200));
    throw new Error(`Server returned non-JSON response (${res.status}).`);
  }
}

export const authService = {
  getCurrentSession(): UserSession | null {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  // Verify server session cookie on app initialization
  async checkServerSession(): Promise<UserSession | null> {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await parseJsonResponse(res);
        if (data.authenticated && data.user) {
          localStorage.setItem(AUTH_KEY, JSON.stringify(data.user));
          return data.user;
        } else if (data && data.authenticated === false) {
          localStorage.removeItem(AUTH_KEY);
          return null;
        }
      }
    } catch (err) {
      console.warn('Server session check error:', err);
    }
    return this.getCurrentSession();
  },

  // Login user with email and password via backend API
  async login(email: string, pass: string, rememberMe = true): Promise<{ success: boolean; user?: UserSession; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, password: pass, rememberMe })
      });

      let data: any = {};
      try {
        data = await parseJsonResponse(res);
      } catch {
        return { success: false, error: 'Invalid email address or password.' };
      }

      if (res.ok && data.success && data.user) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(data.user));
        return { success: true, user: data.user };
      } else {
        const fallbackMsg = (res.status === 403 || res.status === 401)
          ? 'Invalid email address or password.'
          : (data.error || 'Invalid email address or password.');
        return { success: false, error: data.error || fallbackMsg };
      }
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, error: 'Invalid email address or password.' };
    }
  },

  // Register user via backend database API
  async register(name: string, email: string, pass: string, rememberMe = true): Promise<{ success: boolean; user?: UserSession; error?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name, email, password: pass, rememberMe })
      });

      let data: any = {};
      try {
        data = await parseJsonResponse(res);
      } catch {
        return { success: false, error: 'Registration failed. Please check your details.' };
      }

      if (res.ok && data.success && data.user) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(data.user));
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Registration failed.' };
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      return { success: false, error: 'Registration failed. Please check your connection.' };
    }
  },

  // Request password reset email via Resend
  async forgotPassword(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await parseJsonResponse(res);
      if (res.ok && data.success) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error || 'Failed to request password reset.' };
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      return { success: false, error: 'Network error processing password reset request.' };
    }
  },

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });

      const data = await parseJsonResponse(res);
      if (res.ok && data.success) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error || 'Failed to reset password.' };
      }
    } catch (err: any) {
      console.error('Reset password error:', err);
      return { success: false, error: 'Network error resetting password.' };
    }
  },

  completeOnboarding(): void {
    const session = this.getCurrentSession();
    if (session) {
      session.isOnboarded = true;
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem(AUTH_KEY);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout network notice:', err);
    }
  }
};
