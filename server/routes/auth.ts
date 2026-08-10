import { Router, type Request, type Response, type CookieOptions } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { supabase, formatMediaUrl } from '../lib/supabase';
import {
  type UserSession,
  type ServerSession,
  checkEnvironmentAccess,
  generateSessionToken,
  getOrRestoreSession,
  userSessions,
  DEFAULT_SESSION_DURATION_MS
} from '../lib/sessions';
import { emailService } from '../emailService';

const router = Router();

// GET /api/auth/me - Validate session cookie & return current authenticated user
router.get('/api/auth/me', async (req: Request, res: Response) => {
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
router.post('/api/auth/login', async (req: Request, res: Response) => {
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

      const cookieOptions: CookieOptions = {
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
router.post('/api/auth/check-username', async (req: Request, res: Response) => {
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
router.post('/api/auth/check-email', async (req: Request, res: Response) => {
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
router.post('/api/auth/register', async (req: Request, res: Response) => {
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
router.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
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

// POST /api/auth/reset-password - Verify reset token & update password hash in database
router.post('/api/auth/reset-password', async (req: Request, res: Response) => {
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

// POST /api/auth/logout - Invalidate session & clear cookie
router.post('/api/auth/logout', (req: Request, res: Response) => {
    const token = req.cookies?.gonnng_session;
    if (token) {
      userSessions.delete(token);
    }
    res.clearCookie('gonnng_session', { path: '/' });
    return res.json({ success: true, authenticated: false, message: 'Logged out successfully.' });
  });

export default router;
