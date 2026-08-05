import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });

interface UserSession {
  id: string;
  publicId?: string;
  username?: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isOnboarded?: boolean;
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

const rawDataUrl = process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL || '';
const supabaseUrl = normalizeDataUrl(rawDataUrl);
const rawStorageUrl = process.env.SUPABASE_STORAGE_URL || process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL || '';
const storageUrl = normalizeStorageUrl(rawStorageUrl);
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// Pre-seeded demo accounts fallback matching authService
const DEFAULT_FALLBACK_DEMO_ACCOUNTS: Record<string, UserSession> = {
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

// Demo login email -> real `users.id` in the database. Swap/add rows here to
// point a demo email at a different seeded user.
const DEMO_ACCOUNT_USER_IDS: Record<string, string> = {
  'test@gonnng.com': '4c0ab90e-6ec5-4a14-bb46-f10d4dc7bcb2',    // gyro_gearloose
  'qa@gonnng.com': '546bf5b4-28cb-4501-a1a0-c2f57c98f1a0',      // darkwing_duck
  'creator@gonnng.com': '0dfeeb75-c15d-4825-9d94-0b6d66c7bb01', // scrooge_mcduck
  'dev@gonnng.com': '5a44d547-08db-4702-92b3-2d0f8c13a301',     // mario
  'product@gonnng.com': 'f0f68338-8933-48d8-8f1d-9eb3aaf4f902', // luigi
};

// Populated at startup from the `users` table -- see loadDemoAccounts() below.
let demoAccountsByEmail: Record<string, UserSession> = { ...DEFAULT_FALLBACK_DEMO_ACCOUNTS };

// `users` has no display-name column, only `username` (a slug). Derive a
// readable name from it for the session object: "gyro_gearloose" -> "Gyro Gearloose"
function usernameToDisplayName(username: string): string {
  return username
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function loadDemoAccounts(): Promise<void> {
  demoAccountsByEmail = { ...DEFAULT_FALLBACK_DEMO_ACCOUNTS };

  if (!supabase) {
    console.log('Supabase client not configured on server. Using fallback demo accounts.');
    return;
  }

  try {
    const ids = Object.values(DEMO_ACCOUNT_USER_IDS);

    const { data, error } = await supabase
      .from('users')
      .select('id, public_id, username')
      .in('id', ids);

    if (error) {
      console.error('Failed to load demo accounts from Supabase:', error.message);
      return;
    }

    const userById = new Map((data ?? []).map((row) => [row.id, row]));

    for (const [demoEmail, userId] of Object.entries(DEMO_ACCOUNT_USER_IDS)) {
      const row = userById.get(userId);
      if (!row) {
        console.warn(`Demo account ${demoEmail} points at user id ${userId}, which was not found in the users table.`);
        continue;
      }
      demoAccountsByEmail[demoEmail] = {
        id: row.id,
        publicId: row.public_id,
        username: row.username,
        email: demoEmail, // login email kept as the account identity for the demo flow
        name: usernameToDisplayName(row.username),
        avatarUrl: DEFAULT_FALLBACK_DEMO_ACCOUNTS[demoEmail]?.avatarUrl,
        isOnboarded: true,
      };
    }

    console.log(`Loaded ${Object.keys(demoAccountsByEmail).length} demo accounts from Supabase.`);
  } catch (err) {
    console.error('Error in loadDemoAccounts:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser('gonnng_secret_cookie_key_2026'));

  await loadDemoAccounts();

  // Authentication Middleware
  const authenticateSession = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.gonnng_session;
    if (!token) {
      return res.status(401).json({ authenticated: false, error: 'Unauthorized: Session cookie missing or expired.' });
    }

    const session = userSessions.get(token);
    if (!session) {
      res.clearCookie('gonnng_session', { path: '/' });
      return res.status(401).json({ authenticated: false, error: 'Unauthorized: Invalid session token.' });
    }

    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      userSessions.delete(token);
      res.clearCookie('gonnng_session', { path: '/' });
      return res.status(401).json({ authenticated: false, error: 'Unauthorized: Session expired.' });
    }

    // Update last used timestamp
    session.lastUsedAt = new Date().toISOString();
    (req as any).user = session.user;
    (req as any).sessionToken = token;
    next();
  };

  // --- API ROUTES ---

  // GET /api/auth/me - Validate session cookie & return current authenticated user
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const token = req.cookies?.gonnng_session;
    if (!token) {
      return res.json({ authenticated: false, user: null });
    }

    const session = userSessions.get(token);
    if (!session) {
      res.clearCookie('gonnng_session', { path: '/' });
      return res.json({ authenticated: false, user: null });
    }

    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      userSessions.delete(token);
      res.clearCookie('gonnng_session', { path: '/' });
      return res.json({ authenticated: false, user: null });
    }

    session.lastUsedAt = new Date().toISOString();
    return res.json({ authenticated: true, user: session.user, sessionToken: session.token });
  });

  // POST /api/auth/login - Authenticate user & issue HttpOnly, Secure session cookie
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, password, rememberMe = true, customUser } = req.body;

    let targetUser: UserSession | undefined;

    if (customUser && customUser.email) {
      targetUser = customUser;
    } else if (email) {
      const cleanEmail = String(email).trim().toLowerCase();
      targetUser = demoAccountsByEmail[cleanEmail];

      // Fallback: in case the in-memory cache hasn't been (re)loaded yet or a
      // seeded user id changed since startup, re-fetch straight from Supabase
      // before giving up.
      if (!targetUser && DEMO_ACCOUNT_USER_IDS[cleanEmail] && supabase) {
        const { data: row, error } = await supabase
          .from('users')
          .select('id, public_id, username')
          .eq('id', DEMO_ACCOUNT_USER_IDS[cleanEmail])
          .single();

        if (!error && row) {
          targetUser = {
            id: row.id,
            publicId: row.public_id,
            username: row.username,
            email: cleanEmail,
            name: usernameToDisplayName(row.username),
            avatarUrl: undefined,
            isOnboarded: true,
          };
        }
      }
    }

    if (!targetUser) {
      // Fallback default if not explicitly matched
      targetUser = demoAccountsByEmail['test@gonnng.com'];
    }

    if (!targetUser) {
      return res.status(500).json({
        success: false,
        authenticated: false,
        error: 'No demo accounts are available -- check Supabase connectivity and DEMO_ACCOUNT_USER_IDS.',
      });
    }

    // Generate secure session token
    const token = `gon_sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date();
    // 30 days if rememberMe is true, or session duration (null)
    const expiresAt = rememberMe ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;

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

    // Set secure authentication cookie
    const cookieOptions: express.CookieOptions = {
      httpOnly: true, // Prevents XSS / JavaScript access
      sameSite: 'lax', // Protects against CSRF
      path: '/',
      secure: process.env.NODE_ENV === 'production'
    };

    if (rememberMe) {
      cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }

    res.cookie('gonnng_session', token, cookieOptions);

    return res.json({
      success: true,
      authenticated: true,
      user: targetUser,
      sessionToken: token,
      expiresAt
    });
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
      const cleanPath = finalPath.replace(/^\/+/, '');
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