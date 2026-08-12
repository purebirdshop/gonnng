import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { supabase, formatMediaUrl } from './supabase.js';

export interface UserSession {
  id: string;
  publicId?: string;
  username?: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
  goals?: string | null;
  privacyDefault?: string | null;
  isOnboarded?: boolean;
  allowedEnvironments?: string[];
}

/**
 * Multi-environment access verification helper.
 * Enforces:
 * 1. Email domain whitelisting for non-live environments (Dev, Test, Demo, etc.).
 * 2. User-specific allowed_environments database column permissions check.
 */
export function checkEnvironmentAccess(email: string, userAllowedEnvs?: string[] | string | null): { allowed: boolean; reason?: string; currentEnv: string } {
  const currentEnv = (process.env.APP_ENV || process.env.VITE_APP_ENV || (process.env.NODE_ENV === 'production' ? 'Live' : 'Dev')).trim();
  const normalizedCurrentEnv = currentEnv.toLowerCase();

  // 1. Whitelisted email domain verification for non-live environments
  // ONLY enforced when ALLOWED_EMAIL_DOMAINS is explicitly set and non-empty, AND environment is not Live/Production
  const isLiveOrProd = ['live', 'production', 'prod'].includes(normalizedCurrentEnv);
  const rawAllowedDomainsSetting = process.env.ALLOWED_EMAIL_DOMAINS ? process.env.ALLOWED_EMAIL_DOMAINS.trim() : '';

  if (!isLiveOrProd && rawAllowedDomainsSetting) {
    const allowedDomains = rawAllowedDomainsSetting
      .split(',')
      .map(d => d.trim().toLowerCase())
      .filter(Boolean);

    if (allowedDomains.length > 0) {
      const emailDomain = email.includes('@') ? email.split('@')[1].toLowerCase().trim() : '';
      const isWhitelisted = allowedDomains.some(domain =>
        emailDomain === domain || emailDomain.endsWith('.' + domain)
      );

      if (!isWhitelisted) {
        return {
          allowed: false,
          reason: `Access denied: Email domain '@${emailDomain}' is not whitelisted for access to non-live environments (${currentEnv}). Allowed domains: ${allowedDomains.map(d => '@' + d).join(', ')}.`,
          currentEnv
        };
      }
    }
  }

  // 2. User allowed environments check from database column
  let envList: string[] = [];
  if (Array.isArray(userAllowedEnvs)) {
    envList = userAllowedEnvs.map(e => String(e).trim().toLowerCase());
  } else if (typeof userAllowedEnvs === 'string') {
    envList = userAllowedEnvs.split(',').map(e => e.trim().toLowerCase());
  } else {
    // If column is unpopulated in DB, default to granting access
    envList = ['live', 'dev', 'test', 'demo', 'all'];
  }

  const hasAccess = envList.includes('all') || envList.includes(normalizedCurrentEnv);

  if (!hasAccess) {
    return {
      allowed: false,
      reason: `Access denied: Your user account is not authorized to access the '${currentEnv}' environment.`,
      currentEnv
    };
  }

  return { allowed: true, currentEnv };
}

export interface ServerSession {
  token: string;
  userId: string;
  user: UserSession;
  createdAt: string;
  expiresAt: string | null; // null for session-only cookie, ISO date string for remember-me
  lastUsedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

// In-memory session table for web application authentication cookies.
// NOTE: On Vercel serverless functions, each invocation may run in a fresh
// container, so this Map is *not* a reliable source of truth across requests.
// getOrRestoreSession() falls back to re-verifying the signed token and
// reloading the user from Supabase whenever the in-memory entry is missing,
// which is what makes auth work at all in a serverless environment. Treat
// this Map purely as a warm-instance cache, not persistent storage.
export const userSessions = new Map<string, ServerSession>();

export const SESSION_SECRET = process.env.SESSION_SECRET || 'gonnng_secret_cookie_key_2026';
export const DEFAULT_SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days standard web session duration

export function generateSessionToken(userId: string, expiresAtMs: number): string {
  const payload = `${userId}:${expiresAtMs}`;
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `gon_sess.${userId}.${expiresAtMs}.${hmac}`;
}

export function verifySessionToken(token: string): { valid: boolean; userId?: string; expiresAtMs?: number } {
  if (!token || typeof token !== 'string' || !token.startsWith('gon_sess.')) {
    return { valid: false };
  }
  const parts = token.split('.');
  if (parts.length !== 4) return { valid: false };
  const [, userId, expiresAtStr, signature] = parts;
  const expiresAtMs = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAtMs) || expiresAtMs < Date.now()) {
    return { valid: false };
  }
  const payload = `${userId}:${expiresAtMs}`;
  const expectedHmac = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');

  if (!signature || signature.length !== expectedHmac.length) return { valid: false };
  try {
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac))) {
      return { valid: true, userId, expiresAtMs };
    }
  } catch {
    return { valid: false };
  }
  return { valid: false };
}

export async function getOrRestoreSession(token: string): Promise<ServerSession | null> {
  if (!token) return null;

  // 1. Check in-memory session map first
  const existing = userSessions.get(token);
  if (existing) {
    if (existing.expiresAt && new Date(existing.expiresAt) < new Date()) {
      userSessions.delete(token);
      return null;
    }
    return existing;
  }

  // 2. Verify HMAC signed token format if server restarted or container recycled
  const verification = verifySessionToken(token);
  if (!verification.valid || !verification.userId) {
    return null;
  }

  // 3. Re-instantiate session from database user record
  if (!supabase) return null;

  try {
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, public_id, username, email, first_name, last_name, avatar_storage_path, is_onboarded, profile_visibility, about, goal, allowed_environments')
      .eq('id', verification.userId)
      .maybeSingle();

    if (!dbUser) return null;

    const envCheck = checkEnvironmentAccess(dbUser.email, dbUser.allowed_environments);
    if (!envCheck.allowed) return null;

    const resolvedName = [dbUser.first_name, dbUser.last_name].filter(Boolean).join(' ') || dbUser.username || 'Creator';
    const allowedEnvs = Array.isArray(dbUser.allowed_environments)
      ? dbUser.allowed_environments
      : (typeof dbUser.allowed_environments === 'string' ? dbUser.allowed_environments.split(',') : ['Live', 'Dev', 'Test', 'Demo']);

    const userObj: UserSession = {
      id: dbUser.id,
      publicId: dbUser.public_id || dbUser.id,
      username: dbUser.username || dbUser.email.split('@')[0],
      email: dbUser.email,
      name: resolvedName,
      avatarUrl: formatMediaUrl(dbUser.avatar_storage_path),
      bio: dbUser.about || null,
      goals: dbUser.goal || '',
      privacyDefault: dbUser.profile_visibility || 'public',
      isOnboarded: dbUser.is_onboarded ?? true,
      allowedEnvironments: allowedEnvs
    };

    const restoredSession: ServerSession = {
      token,
      userId: dbUser.id,
      user: userObj,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(verification.expiresAtMs!).toISOString(),
      lastUsedAt: new Date().toISOString()
    };

    userSessions.set(token, restoredSession);
    return restoredSession;
  } catch (err) {
    console.warn('Error restoring server session:', err);
    return null;
  }
}

// Ensure required auth and reset token columns exist in Supabase database
export async function ensureAuthColumnsExist(): Promise<void> {
  if (!supabase) return;
  try {
    // Check user table structure or ping it
    const { error } = await supabase.from('users').select('id, email, password_hash').limit(1);
    if (error) {
      console.warn('⚠️ Supabase users table query warning:', error.message);
    } else {
      console.log('📀 Supabase connected & users table verified.');
    }
  } catch (err) {
    console.error('Error verifying database connection:', err);
  }
}

// Authentication Middleware
export const authenticateSession = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.gonnng_session;
  if (!token) {
    return res.status(401).json({ authenticated: false, error: 'Unauthorized: Session cookie missing or expired.' });
  }

  const session = await getOrRestoreSession(token);
  if (!session) {
    res.clearCookie('gonnng_session', { path: '/' });
    return res.status(401).json({ authenticated: false, error: 'Unauthorized: Invalid session token.' });
  }

  // Update last used timestamp
  session.lastUsedAt = new Date().toISOString();
  (req as any).user = session.user;
  (req as any).sessionToken = token;
  next();
};
