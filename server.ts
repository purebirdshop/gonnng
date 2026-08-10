import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import { emailService } from './server/emailService';
import { setupSwagger } from './server/swagger';

const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });

interface UserSession {
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
function checkEnvironmentAccess(email: string, userAllowedEnvs?: string[] | string | null): { allowed: boolean; reason?: string; currentEnv: string } {
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

interface ServerSession {
  token: string;
  userId: string;
  user: UserSession;
  createdAt: string;
  expiresAt: string | null; // null for session-only cookie, ISO date string for remember-me
  lastUsedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

// In-memory session table for web application authentication cookies
const userSessions = new Map<string, ServerSession>();

// ---------------------------------------------------------------------------
// Supabase client (server-side, trusted). Use the SERVICE ROLE key here if available,
// or fallback to ANON key.
// Never throw if environment variables are missing -- fallback gracefully.
// ---------------------------------------------------------------------------
function normalizeDataUrl(url?: string): string {
  if (!url) return '';
  let cleaned = url.trim().replace(/\/+$/, '');
  cleaned = cleaned.replace('.storage.supabase.co', '.supabase.co');
  cleaned = cleaned.replace(/\/storage\/v1.*$/, '');
  return cleaned;
}

function normalizeStorageUrl(url?: string): string {
  if (!url) return '';
  let cleaned = url.trim().replace(/\/+$/, '');
  cleaned = cleaned.replace(/\/storage\/v1.*$/, '');
  return cleaned;
}

function formatMediaUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  let clean = storagePath.trim();
  clean = clean.replace(/^\/+/, '');
  while (clean.startsWith('media/')) {
    clean = clean.substring(6).replace(/^\/+/, '');
  }
  return `/media/${clean}`;
}

const rawDataUrl = process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL || '';
const supabaseUrl = normalizeDataUrl(rawDataUrl);
const rawStorageUrl = process.env.SUPABASE_STORAGE_URL || process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL || '';
const storageUrl = normalizeStorageUrl(rawStorageUrl);
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

const SESSION_SECRET = process.env.SESSION_SECRET || 'gonnng_secret_cookie_key_2026';
const DEFAULT_SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days standard web session duration

function generateSessionToken(userId: string, expiresAtMs: number): string {
  const payload = `${userId}:${expiresAtMs}`;
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `gon_sess.${userId}.${expiresAtMs}.${hmac}`;
}

function verifySessionToken(token: string): { valid: boolean; userId?: string; expiresAtMs?: number } {
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

async function getOrRestoreSession(token: string): Promise<ServerSession | null> {
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
async function ensureAuthColumnsExist(): Promise<void> {
  if (!supabase) return;
  try {
    // Check user table structure or ping it
    const { error } = await supabase.from('users').select('id, email, password_hash').limit(1);
    if (error) {
      console.warn('⚠️ Supabase users table query warning:', error.message);
    } else {
      console.log('✅ Supabase connected & users table verified.');
    }
  } catch (err) {
    console.error('Error verifying database connection:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser('gonnng_secret_cookie_key_2026'));

  await ensureAuthColumnsExist();

  // Authentication Middleware
  const authenticateSession = async (req: Request, res: Response, next: NextFunction) => {
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

  // Mount Swagger UI Documentation
  setupSwagger(app);

  // --- API ROUTES ---

  // GET /api/health - Public API health status endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // GET /api/auth/me - Validate session cookie & return current authenticated user
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    const token = req.cookies?.gonnng_session;
    if (!token) {
      return res.json({ authenticated: false, user: null });
    }

    const session = await getOrRestoreSession(token);
    if (!session) {
      res.clearCookie('gonnng_session', { path: '/' });
      return res.json({ authenticated: false, user: null });
    }

    // Refresh active user details from database if available
    if (supabase) {
      try {
        const { data: dbUser } = await supabase
          .from('users')
          .select('id, public_id, username, email, first_name, last_name, avatar_storage_path, is_onboarded, profile_visibility, about, goal, allowed_environments')
          .eq('id', session.userId)
          .maybeSingle();

        if (dbUser) {
          const envCheck = checkEnvironmentAccess(dbUser.email, dbUser.allowed_environments);
          if (!envCheck.allowed) {
            userSessions.delete(token);
            res.clearCookie('gonnng_session', { path: '/' });
            return res.json({ authenticated: false, user: null, error: envCheck.reason });
          }

          const resolvedName = [dbUser.first_name, dbUser.last_name].filter(Boolean).join(' ') || dbUser.username || 'Creator';
          const allowedEnvs = Array.isArray(dbUser.allowed_environments)
            ? dbUser.allowed_environments
            : (typeof dbUser.allowed_environments === 'string' ? dbUser.allowed_environments.split(',') : ['Live', 'Dev', 'Test', 'Demo']);

          session.user = {
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
        }
      } catch (err) {
        console.warn('Could not refresh session user from Supabase:', err);
      }
    }

    session.lastUsedAt = new Date().toISOString();
    return res.json({ authenticated: true, user: session.user, sessionToken: session.token });
  });

  // POST /api/auth/login - Authenticate user against database & issue HttpOnly cookie
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, password, rememberMe = true } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, authenticated: false, error: 'Email and password are required.' });
    }

    const cleanInput = String(email || '').trim();
    const cleanEmail = cleanInput.toLowerCase();

    if (!supabase) {
      return res.status(500).json({
        success: false,
        authenticated: false,
        error: 'Database connection is not configured. Please check SUPABASE_DATA_URL / SUPABASE_URL.'
      });
    }

    try {
      let dbUser: any = null;

      // Query users table by email (case-insensitive) or username (case-insensitive)
      const { data: userMatches, error } = await supabase
        .from('users')
        .select('*')
        .or(`email.ilike.${cleanEmail},username.ilike.${cleanInput}`);

      if (userMatches && userMatches.length > 0) {
        dbUser = userMatches[0];
      } else {
        // Fallback: try direct eq query by email or ID
        const { data: fallbackUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();
        dbUser = fallbackUser;
      }

      if (error && !dbUser) {
        console.warn('[AUTH LOGIN FAIL] Supabase query error:', error.message);
      }

      if (!dbUser) {
        console.warn(`[AUTH LOGIN FAIL] No user record found matching '${cleanInput}'`);
        return res.status(401).json({
          success: false,
          authenticated: false,
          error: 'Invalid email address or password.'
        });
      }

      // Check password
      let passwordValid = false;
      const storedHash = String(dbUser.password_hash || '').trim().replace(/^['"]|['"]$/g, '');
      const inputPassword = String(password).trim();

      if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
        try {
          passwordValid = bcrypt.compareSync(inputPassword, storedHash);
          if (!passwordValid) {
            passwordValid = bcrypt.compareSync(String(password), storedHash);
          }
        } catch (bErr) {
          console.error('[AUTH LOGIN FAIL] Bcrypt compare error:', bErr);
        }
      }

      if (!passwordValid && storedHash) {
        if (storedHash === inputPassword || storedHash === String(password)) {
          passwordValid = true;
          // Support legacy/plain text password and upgrade it to bcrypt
          try {
            const upgradedHash = bcrypt.hashSync(inputPassword, 10);
            await supabase.from('users').update({ password_hash: upgradedHash }).eq('id', dbUser.id);
          } catch (uErr) {
            console.warn('Failed to upgrade plain password hash:', uErr);
          }
        }
      }

      if (!passwordValid) {
        console.warn(`[AUTH LOGIN FAIL] Password mismatch for user '${dbUser.email || dbUser.id}'`);
        return res.status(401).json({
          success: false,
          authenticated: false,
          error: 'Invalid email address or password.'
        });
      }

      // Check multi-environment permissions & domain whitelist safety checks
      const envCheck = checkEnvironmentAccess(dbUser.email, dbUser.allowed_environments);
      if (!envCheck.allowed) {
        console.warn(`[AUTH LOGIN DENIED] Multi-environment access denied for '${dbUser.email}': ${envCheck.reason}`);
        return res.status(403).json({
          success: false,
          authenticated: false,
          error: envCheck.reason
        });
      }

      const resolvedName = [dbUser.first_name, dbUser.last_name].filter(Boolean).join(' ') || dbUser.username || 'Creator';
      const allowedEnvs = Array.isArray(dbUser.allowed_environments)
        ? dbUser.allowed_environments
        : (typeof dbUser.allowed_environments === 'string' ? dbUser.allowed_environments.split(',') : ['Live', 'Dev', 'Test', 'Demo']);

      const targetUser: UserSession = {
        id: dbUser.id,
        publicId: dbUser.public_id || dbUser.id,
        username: dbUser.username || cleanEmail.split('@')[0],
        email: dbUser.email,
        name: resolvedName,
        avatarUrl: formatMediaUrl(dbUser.avatar_storage_path) || undefined,
        bio: dbUser.about || undefined,
        goals: dbUser.goal || '',
        privacyDefault: dbUser.profile_visibility || 'public',
        isOnboarded: dbUser.is_onboarded ?? true,
        allowedEnvironments: allowedEnvs
      };

      const now = new Date();
      // Modern session standards: 30 days default session lifetime
      const sessionDuration = rememberMe === false ? 14 * 24 * 60 * 60 * 1000 : DEFAULT_SESSION_DURATION_MS;
      const expiresAtMs = now.getTime() + sessionDuration;
      const expiresAt = new Date(expiresAtMs).toISOString();
      const token = generateSessionToken(targetUser.id, expiresAtMs);

      const sessionRecord: ServerSession = {
        token,
        userId: targetUser.id,
        user: targetUser,
        createdAt: now.toISOString(),
        expiresAt,
        lastUsedAt: now.toISOString(),
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Gonnng Web Client'
      };

      userSessions.set(token, sessionRecord);

      const cookieOptions: express.CookieOptions = {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: sessionDuration
      };

      res.cookie('gonnng_session', token, cookieOptions);

      return res.json({
        success: true,
        authenticated: true,
        user: targetUser,
        sessionToken: token,
        expiresAt
      });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, authenticated: false, error: err?.message || 'Login failed.' });
    }
  });

  // POST /api/auth/check-username - Validate username availability
  app.post('/api/auth/check-username', async (req: Request, res: Response) => {
    try {
      const { username } = req.body;
      if (!username || !String(username).trim()) {
        return res.json({ available: false, error: 'Username is required' });
      }
      const cleanUsername = String(username).trim().toLowerCase();
      if (!supabase) {
        return res.json({ available: true });
      }
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .ilike('username', cleanUsername)
        .maybeSingle();

      return res.json({ available: !existingUser });
    } catch (err: any) {
      console.warn('Check username error:', err);
      return res.json({ available: true });
    }
  });

  // POST /api/auth/check-email - Validate email availability
  app.post('/api/auth/check-email', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email || !String(email).trim()) {
        return res.json({ available: false, error: 'Email is required' });
      }
      const cleanEmail = String(email).trim().toLowerCase();
      if (!supabase) {
        return res.json({ available: true });
      }
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .ilike('email', cleanEmail)
        .maybeSingle();

      return res.json({ available: !existingUser });
    } catch (err: any) {
      console.warn('Check email error:', err);
      return res.json({ available: true });
    }
  });

  // POST /api/auth/register - Create account in database & send welcome email
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    const { name, fullName, email, password, username, about, interests, rememberMe = true } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    const derivedUsername = (username || cleanEmail.split('@')[0] || `user_${Date.now()}`).trim();
    const rawFullName = String(name || fullName || derivedUsername || '').trim();

    // Parse Full Name on first space character into first_name and last_name
    let firstName = String(req.body.first_name || '').trim();
    let lastName = String(req.body.last_name || '').trim();

    if (!firstName && rawFullName) {
      const spaceIdx = rawFullName.indexOf(' ');
      if (spaceIdx === -1) {
        firstName = rawFullName;
        lastName = '';
      } else {
        firstName = rawFullName.substring(0, spaceIdx);
        lastName = rawFullName.substring(spaceIdx + 1).trim();
      }
    }

    const resolvedDisplayName = [firstName, lastName].filter(Boolean).join(' ') || rawFullName || derivedUsername;

    // Check multi-environment permissions & domain whitelist for registration
    const envCheck = checkEnvironmentAccess(cleanEmail, ['Live', 'Dev', 'Test', 'Demo']);
    if (!envCheck.allowed) {
      return res.status(403).json({ success: false, error: envCheck.reason });
    }

    if (!supabase) {
      return res.status(500).json({ success: false, error: 'Database connection is not configured.' });
    }

    try {
      // Check existing email
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingUser) {
        return res.status(400).json({ success: false, error: 'An account with this email address already exists.' });
      }

      // Check existing username if provided
      if (derivedUsername) {
        const { data: existingUsernameUser } = await supabase
          .from('users')
          .select('id')
          .ilike('username', derivedUsername)
          .maybeSingle();

        if (existingUsernameUser) {
          return res.status(400).json({ success: false, error: 'Username is already taken. Please choose another.' });
        }
      }

      const passwordHash = bcrypt.hashSync(String(password), 10);
      const userId = crypto.randomUUID();
      const publicId = Math.random().toString(36).substring(2, 11).toUpperCase();

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          public_id: publicId,
          username: derivedUsername,
          first_name: firstName,
          last_name: lastName,
          email: cleanEmail,
          password_hash: passwordHash,
          is_onboarded: true,
          email_verified: true,
          about: about || null,
          avatar_storage_path: null,
          profile_visibility: 'public',
          allowed_environments: ['Live', 'Dev', 'Test', 'Demo']
        })
        .select()
        .single();

      if (insertError) {
        console.error('User registration insert error:', insertError);
        return res.status(400).json({ success: false, error: insertError.message || 'Failed to create user account.' });
      }

      // Sync user into creators table as well
      try {
        await supabase.from('creators').insert({
          id: userId,
          public_id: publicId,
          username: derivedUsername,
          name: resolvedDisplayName,
          email: cleanEmail,
          avatar_storage_path: null,
          bio: about || null,
          goals: null,
          privacy_default: 'public'
        });
      } catch (e) {
        // Safe fallback if creator record exists
      }

      // Generate email verification token with 24-hour time delay expiration
      const verificationToken = `vtf_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      try {
        await supabase
          .from('users')
          .update({
            reset_token: verificationToken,
            reset_token_expires: verificationExpires
          })
          .eq('id', userId);
      } catch (e) {
        // Safe fallback
      }

      // Send Welcome Email with verification link via Resend API
      await emailService.sendWelcomeEmail(cleanEmail, resolvedDisplayName, derivedUsername, verificationToken);

      const sessionUser: UserSession = {
        id: newUser.id,
        publicId: newUser.public_id || newUser.id,
        username: newUser.username,
        email: newUser.email,
        name: resolvedDisplayName,
        avatarUrl: null,
        bio: null,
        goals: null,
        privacyDefault: 'public',
        isOnboarded: true
      };

      const now = new Date();
      const sessionDuration = rememberMe === false ? 14 * 24 * 60 * 60 * 1000 : DEFAULT_SESSION_DURATION_MS;
      const expiresAtMs = now.getTime() + sessionDuration;
      const expiresAt = new Date(expiresAtMs).toISOString();
      const token = generateSessionToken(sessionUser.id, expiresAtMs);

      userSessions.set(token, {
        token,
        userId: sessionUser.id,
        user: sessionUser,
        createdAt: now.toISOString(),
        expiresAt,
        lastUsedAt: now.toISOString(),
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Gonnng Web Client'
      });

      res.cookie('gonnng_session', token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: sessionDuration
      });

      return res.json({
        success: true,
        authenticated: true,
        user: sessionUser,
        sessionToken: token
      });
    } catch (err: any) {
      console.error('Registration exception:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Failed to complete registration.' });
    }
  });

  // POST /api/auth/forgot-password - Generate reset token & send recovery email via Resend
  app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    if (!supabase) {
      return res.status(500).json({ success: false, error: 'Database connection is not configured.' });
    }

    try {
      const { data: dbUser } = await supabase
        .from('users')
        .select('id, first_name, last_name, username, email')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (dbUser) {
        const resetToken = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
        const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hr

        await supabase
          .from('users')
          .update({
            reset_token: resetToken,
            reset_token_expires: resetTokenExpires
          })
          .eq('id', dbUser.id);

        const resolvedName = [dbUser.first_name, dbUser.last_name].filter(Boolean).join(' ') || dbUser.username || 'Creator';

        await emailService.sendPasswordResetEmail(
          cleanEmail,
          resolvedName,
          resetToken
        );
      }

      // Return success regardless of whether email existed for privacy/security
      return res.json({
        success: true,
        message: `If an account with ${cleanEmail} exists in our database, we have emailed password reset instructions.`
      });
    } catch (err: any) {
      console.error('Forgot password error:', err);
      return res.status(500).json({ success: false, error: 'Failed to process password reset request.' });
    }
  });

  // POST /api/email/send - Proxy email dispatches via server-side Resend service
  app.post('/api/email/send', async (req: Request, res: Response) => {
    try {
      const { to, subject, html, text, from } = req.body;
      if (!to || !subject || !html) {
        return res.status(400).json({ success: false, error: 'Recipient, subject, and html content are required.' });
      }

      const result = await emailService.sendEmail({
        to,
        subject,
        html,
        text,
        from
      });

      return res.json(result);
    } catch (err: any) {
      console.error('API /api/email/send error:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Failed to send email.' });
    }
  });

  // POST /api/auth/reset-password - Verify reset token & update password hash in database
  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: 'Reset token and new password are required.' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    if (!supabase) {
      return res.status(500).json({ success: false, error: 'Database connection is not configured.' });
    }

    try {
      const { data: dbUser, error } = await supabase
        .from('users')
        .select('id, reset_token_expires')
        .eq('reset_token', String(token))
        .single();

      if (error || !dbUser) {
        return res.status(400).json({ success: false, error: 'Invalid or expired password reset link.' });
      }

      if (dbUser.reset_token_expires && new Date(dbUser.reset_token_expires) < new Date()) {
        return res.status(400).json({ success: false, error: 'Password reset link has expired. Please request a new one.' });
      }

      const newHash = bcrypt.hashSync(String(newPassword), 10);

      await supabase
        .from('users')
        .update({
          password_hash: newHash,
          reset_token: null,
          reset_token_expires: null
        })
        .eq('id', dbUser.id);

      return res.json({
        success: true,
        message: 'Password reset successfully. You can now sign in with your new password.'
      });
    } catch (err: any) {
      console.error('Reset password error:', err);
      return res.status(500).json({ success: false, error: 'Failed to reset password.' });
    }
  });

  // Helper to resolve all database identifiers for a user
  async function getUserIdentifiers(identifier: string): Promise<string[]> {
    const ids = new Set<string>([identifier]);
    if (supabase && identifier) {
      try {
        const { data } = await supabase
          .from('users')
          .select('id, public_id, username')
          .or(`id.eq.${identifier},public_id.eq.${identifier},username.eq.${identifier}`);
        if (data && data.length > 0) {
          data.forEach(u => {
            if (u.id) ids.add(u.id);
            if (u.public_id) ids.add(u.public_id);
            if (u.username) ids.add(u.username);
          });
        }
      } catch (e) {
        // Fallback
      }
    }
    return Array.from(ids);
  }

  // GET /api/messages/:userId - Fetch all direct messages involving userId
  app.get('/api/messages/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required.' });
      }

      const identifiers = await getUserIdentifiers(userId);

      if (supabase) {
        const idListStr = identifiers.map(i => `"${i}"`).join(',');
        const { data, error } = await supabase
          .from('direct_messages')
          .select('*')
          .or(`sender_id.in.(${idListStr}),recipient_id.in.(${idListStr})`)
          .order('created_at', { ascending: true });

        if (!error && data) {
          const formatted = data.map(row => {
            const createdAt = new Date(row.created_at).getTime();
            const diffSec = Math.floor((Date.now() - createdAt) / 1000);
            let timestamp = 'Just now';
            if (diffSec >= 60 && diffSec < 3600) timestamp = `${Math.floor(diffSec / 60)}m ago`;
            else if (diffSec >= 3600 && diffSec < 86400) timestamp = `${Math.floor(diffSec / 3600)}h ago`;
            else if (diffSec >= 86400) timestamp = `${Math.floor(diffSec / 86400)}d ago`;

            return {
              id: row.id,
              senderId: row.sender_id,
              recipientId: row.recipient_id,
              text: row.text,
              isRead: Boolean(row.is_read),
              status: row.status || 'accepted',
              postThumbnail: row.post_thumbnail || undefined,
              postId: row.post_id || undefined,
              createdAt,
              timestamp
            };
          });

          return res.json({ success: true, messages: formatted });
        }
      }

      return res.json({ success: true, messages: [] });
    } catch (err: any) {
      console.error('Fetch direct messages error:', err);
      return res.status(500).json({ success: false, error: 'Failed to fetch messages.' });
    }
  });

  // POST /api/messages - Send a new direct message
  app.post('/api/messages', async (req: Request, res: Response) => {
    try {
      const { senderId, recipientId, text, postThumbnail, postId, status = 'accepted' } = req.body;
      if (!senderId || !recipientId || !text || !String(text).trim()) {
        return res.status(400).json({ success: false, error: 'senderId, recipientId, and text are required.' });
      }

      const trimmedText = String(text).trim().slice(0, 1400);
      const createdAt = Date.now();

      if (supabase) {
        // Try inserting with status column
        let insertObj: any = {
          sender_id: senderId,
          recipient_id: recipientId,
          text: trimmedText,
          is_read: true,
          status,
          post_thumbnail: postThumbnail || null,
          post_id: postId || null
        };

        let { data, error } = await supabase
          .from('direct_messages')
          .insert(insertObj)
          .select('*')
          .single();

        // If status column is missing on server table, retry without status column
        if (error && (error.code === 'PGRST204' || error.message?.includes('status'))) {
          delete insertObj.status;
          const retryRes = await supabase
            .from('direct_messages')
            .insert(insertObj)
            .select('*')
            .single();
          data = retryRes.data;
          error = retryRes.error;
        }

        if (!error && data) {
          const msgObj = {
            id: data.id,
            senderId: data.sender_id,
            recipientId: data.recipient_id,
            text: data.text,
            isRead: Boolean(data.is_read),
            status: data.status || status,
            postThumbnail: data.post_thumbnail || undefined,
            postId: data.post_id || undefined,
            timestamp: 'Just now',
            createdAt
          };
          return res.json({ success: true, message: msgObj });
        } else if (error) {
          console.error('Supabase direct message insert error:', error);
        }
      }

      // Fallback message object if database was unconfigured
      const fallbackMsg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        senderId,
        recipientId,
        text: String(text).trim(),
        isRead: true,
        status,
        postThumbnail,
        postId,
        timestamp: 'Just now',
        createdAt
      };

      return res.json({ success: true, message: fallbackMsg });
    } catch (err: any) {
      console.error('Send message error:', err);
      return res.status(500).json({ success: false, error: 'Failed to send message.' });
    }
  });

  // PUT /api/messages/read - Mark messages as read
  app.put('/api/messages/read', async (req: Request, res: Response) => {
    try {
      const { currentUserId, partnerId } = req.body;
      if (supabase && currentUserId && partnerId) {
        const myIds = await getUserIdentifiers(currentUserId);
        const partnerIds = await getUserIdentifiers(partnerId);

        const myIdsStr = myIds.map(i => `"${i}"`).join(',');
        const partnerIdsStr = partnerIds.map(i => `"${i}"`).join(',');

        await supabase
          .from('direct_messages')
          .update({ is_read: true })
          .or(`and(recipient_id.in.(${myIdsStr}),sender_id.in.(${partnerIdsStr}))`);
      }

      return res.json({ success: true });
    } catch (err: any) {
      console.error('Mark messages read error:', err);
      return res.json({ success: true });
    }
  });

  // PUT /api/messages/accept - Accept message request
  app.put('/api/messages/accept', async (req: Request, res: Response) => {
    try {
      const { currentUserId, partnerId } = req.body;
      if (supabase && currentUserId && partnerId) {
        const myIds = await getUserIdentifiers(currentUserId);
        const partnerIds = await getUserIdentifiers(partnerId);

        const myIdsStr = myIds.map(i => `"${i}"`).join(',');
        const partnerIdsStr = partnerIds.map(i => `"${i}"`).join(',');

        try {
          await supabase
            .from('direct_messages')
            .update({ status: 'accepted' })
            .or(`and(sender_id.in.(${myIdsStr}),recipient_id.in.(${partnerIdsStr})),and(sender_id.in.(${partnerIdsStr}),recipient_id.in.(${myIdsStr}))`);
        } catch (e) {
          // Ignores if status column missing
        }
      }

      return res.json({ success: true });
    } catch (err: any) {
      console.error('Accept message request error:', err);
      return res.json({ success: true });
    }
  });

  // PUT /api/messages/decline - Decline/Delete message request
  app.put('/api/messages/decline', async (req: Request, res: Response) => {
    try {
      const { currentUserId, partnerId } = req.body;
      if (supabase && currentUserId && partnerId) {
        const myIds = await getUserIdentifiers(currentUserId);
        const partnerIds = await getUserIdentifiers(partnerId);

        const myIdsStr = myIds.map(i => `"${i}"`).join(',');
        const partnerIdsStr = partnerIds.map(i => `"${i}"`).join(',');

        try {
          await supabase
            .from('direct_messages')
            .delete()
            .or(`and(sender_id.in.(${myIdsStr}),recipient_id.in.(${partnerIdsStr})),and(sender_id.in.(${partnerIdsStr}),recipient_id.in.(${myIdsStr}))`);
        } catch (e) {
          // Ignores error
        }
      }

      return res.json({ success: true });
    } catch (err: any) {
      console.error('Decline message request error:', err);
      return res.json({ success: true });
    }
  });

  // POST /api/auth/logout - Invalidate session & clear cookie
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const token = req.cookies?.gonnng_session;
    if (token) {
      userSessions.delete(token);
    }
    res.clearCookie('gonnng_session', { path: '/' });
    return res.json({ success: true, authenticated: false, message: 'Logged out successfully.' });
  });

  // GET /api/projects - Sample API route validating session cookie (FR-105)
  app.get('/api/projects', authenticateSession, (req: Request, res: Response) => {
    const user = (req as any).user;
    return res.json({
      success: true,
      authenticatedUser: user.name,
      message: `Access granted for user ${user.username || user.email}`
    });
  });

  // --- STORAGE API STATUS ROUTE ---

  // GET /api/storage/status - Returns Supabase storage configuration status
  app.get('/api/storage/status', (_req: Request, res: Response) => {
    const isConfigured = !!supabase;
    return res.json({
      enabled: isConfigured,
      provider: 'Supabase Storage',
      buckets: ['Gonnng'],
      instructions: isConfigured
        ? 'Connected to Supabase Storage.'
        : 'Supabase Storage configuration pending. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY.'
    });
  });

  // Helper to ensure Supabase storage bucket exists before uploading
  const ensureBucketExists = async (bucketName: string) => {
    if (!supabase) return;
    try {
      const { data: bucketInfo, error: getErr } = await supabase.storage.getBucket(bucketName);
      if (getErr || !bucketInfo) {
        console.log(`Bucket '${bucketName}' not found on Supabase. Creating bucket...`);
        const { error: createErr } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 52428800 // 50MB
        });
        if (createErr && !createErr.message.includes('already exists')) {
          console.warn(`Note creating bucket '${bucketName}':`, createErr.message);
        }
      }
    } catch (err) {
      console.warn(`Bucket check exception for '${bucketName}':`, err);
    }
  };

  // POST /api/storage/upload - Uploads files directly to Supabase Storage bucket
  app.post('/api/storage/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, error: 'No file supplied in request.' });
      }

      const bucket = (req.body.bucket as string) || process.env.SUPABASE_STORAGE_BUCKET || 'post-media';
      const storagePath = (req.body.path as string) || `uploads/${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;

      if (!supabase) {
        return res.status(500).json({ success: false, error: 'Supabase server client not configured.' });
      }

      await ensureBucketExists(bucket);

      let { data, error } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype || 'application/octet-stream',
          cacheControl: '3600',
          upsert: true
        });

      if (error && (error.message?.toLowerCase().includes('bucket not found') || error.message?.toLowerCase().includes('not found'))) {
        console.warn(`Bucket '${bucket}' not found on upload attempt. Retrying after bucket creation...`);
        await supabase.storage.createBucket(bucket, { public: true, fileSizeLimit: 52428800 });
        const retry = await supabase.storage
          .from(bucket)
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype || 'application/octet-stream',
            cacheControl: '3600',
            upsert: true
          });
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error('Server-side Supabase Storage upload error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
      }

      const finalPath = data?.path || storagePath;
      let cleanPath = finalPath.replace(/^\/+/, '');
      while (cleanPath.startsWith('media/')) {
        cleanPath = cleanPath.substring(6).replace(/^\/+/, '');
      }
      const storageHost = normalizeStorageUrl(process.env.SUPABASE_STORAGE_URL || process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL);
      const dataHost = normalizeDataUrl(process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL);

      let s3PublicUrl = `/media/${cleanPath}`;
      if (storageHost) {
        s3PublicUrl = storageHost.includes('.storage.supabase.co')
          ? `${storageHost}/v1/s3/object/public/${bucket}/${cleanPath}`
          : `${storageHost}/storage/v1/s3/object/public/${bucket}/${cleanPath}`;
      } else if (dataHost) {
        s3PublicUrl = `${dataHost}/storage/v1/s3/object/public/${bucket}/${cleanPath}`;
      }

      return res.json({
        success: true,
        bucket,
        path: finalPath,
        publicUrl: `/media/${cleanPath}`,
        s3PublicUrl
      });
    } catch (err: any) {
      console.error('Server storage upload endpoint exception:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Server upload failed.' });
    }
  });

  // --- MEDIA PROXY ROUTE FOR SUPABASE STORAGE ---
  // Serves /media/{path} through Express using server credentials
  app.get(['/media/*', '/storage/v1/s3/object/public/Gonnng/*', '/storage/v1/s3/object/public/post-media/*'], async (req: Request, res: Response) => {
    try {
      let relativePath = (req.params as any)[0] || req.path.replace(/^\/(media|storage\/v1\/s3\/object\/public\/(Gonnng|post-media))\//, '');
      relativePath = relativePath.replace(/^\/+/, '');
      while (relativePath.startsWith('media/')) {
        relativePath = relativePath.substring(6).replace(/^\/+/, '');
      }

      if (!relativePath) {
        return res.status(400).send('Media path required.');
      }

      // 1. Download via Supabase client using server keys across post-media & Gonnng buckets
      if (supabase) {
        for (const bucket of ['post-media', 'Gonnng']) {
          const { data, error } = await supabase.storage.from(bucket).download(relativePath);
          if (!error && data) {
            const buffer = Buffer.from(await data.arrayBuffer());
            const contentType = data.type || 'image/jpeg';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            return res.send(buffer);
          }
        }
      }

      // 2. Direct HTTP fetch fallback to Supabase public object store
      const storageHost = normalizeStorageUrl(process.env.SUPABASE_STORAGE_URL || process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL);
      const dataHost = normalizeDataUrl(process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL);

      const hostCandidates: string[] = [];
      if (storageHost) {
        if (storageHost.includes('.storage.supabase.co')) {
          hostCandidates.push(`${storageHost}/v1/s3/object/public`);
          hostCandidates.push(`${storageHost}/storage/v1/s3/object/public`);
        } else {
          hostCandidates.push(`${storageHost}/storage/v1/s3/object/public`);
        }
      }
      if (dataHost) {
        const dataPrefix = `${dataHost}/storage/v1/s3/object/public`;
        if (!hostCandidates.includes(dataPrefix)) {
          hostCandidates.push(dataPrefix);
        }
      }

      for (const prefix of hostCandidates) {
        for (const bucket of ['post-media', 'Gonnng']) {
          const targetUrl = `${prefix}/${bucket}/${relativePath}`;
          try {
            const upstreamRes = await fetch(targetUrl);
            if (upstreamRes.ok) {
              const contentType = upstreamRes.headers.get('content-type') || 'application/octet-stream';
              const arrayBuffer = await upstreamRes.arrayBuffer();
              res.setHeader('Content-Type', contentType);
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
              return res.send(Buffer.from(arrayBuffer));
            }
          } catch (fetchErr) {
            console.warn(`Upstream media fetch note for ${targetUrl}:`, fetchErr);
          }
        }
      }

      return res.status(404).send('Media object not found.');
    } catch (err: any) {
      console.error('Media proxy route error:', err);
      return res.status(500).send('Failed to serve media.');
    }
  });

  // GET /api/cookie-governance - Public endpoint returning cookie standards documentation

  app.get('/api/cookie-governance', (_req: Request, res: Response) => {
    return res.json({
      title: 'Gonnng Platform Cookie Governance Standard',
      updatedAt: '2026-07-27',
      cookies: [
        {
          name: 'gonnng_cookie_preferences',
          purpose: 'Stores user cookie consent choices and category permissions',
          category: 'Strictly Necessary',
          requiredConsent: false,
          security: 'SameSite=Lax, Secure',
          expiration: '365 days',
          dataStored: 'JSON object with category opt-ins and timestamp'
        },
        {
          name: 'gonnng_session',
          purpose: 'Secure authentication session token for web app state and API security',
          category: 'Strictly Necessary',
          requiredConsent: false,
          security: 'HttpOnly, Secure, SameSite=Lax',
          expiration: 'Session or 30 days (Remember Me)',
          dataStored: 'Encrypted unique session identifier'
        },
        {
          name: 'gonnng_attribution',
          purpose: 'Tracks marketing channel origin (UTM parameters like TikTok, Twitter, Google)',
          category: 'Marketing Attribution',
          requiredConsent: true,
          security: 'SameSite=Lax',
          expiration: '90 days',
          dataStored: 'UTM source, medium, campaign, content'
        },
        {
          name: 'analytics_id',
          purpose: 'Monitors visitor navigation paths, feature engagement, and conversion funnels',
          category: 'Analytics',
          requiredConsent: true,
          security: 'SameSite=Lax',
          expiration: '180 days',
          dataStored: 'Anonymous visitor ID & page view event counters'
        },
        {
          name: 'gonnng_user_prefs',
          purpose: 'Saves user interface preferences like active theme, language, and dismissed alerts',
          category: 'User Preferences',
          requiredConsent: true,
          security: 'SameSite=Lax',
          expiration: '365 days',
          dataStored: 'UI customization settings'
        }
      ]
    });
  });

  // 404 and Error handling for API routes (prevents fallback to Vite index.html)
  app.all('/api/*', (_req: Request, res: Response) => {
    return res.status(404).json({ success: false, authenticated: false, error: 'API endpoint not found.' });
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/')) {
      console.error('API Server Error:', err);
      return res.status(500).json({ success: false, authenticated: false, error: err?.message || 'Internal server error.' });
    }
    next(err);
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();