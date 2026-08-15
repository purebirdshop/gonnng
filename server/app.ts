import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { setupSwagger } from './swagger.js';
import { ensureAuthColumnsExist } from './lib/sessions.js';
import authRoutes from './routes/auth.js';
import messageRoutes from './routes/messages.js';
import mediaRoutes from './routes/media.js';
import miscRoutes from './routes/misc.js';

/**
 * Builds and configures the Express app shared by both the local dev server
 * (server.ts, which adds Vite middleware + app.listen) and the Vercel
 * serverless entry point (api/index.ts, which never calls app.listen and
 * lets Vercel's static hosting serve the built frontend instead).
 */
export async function createApp(): Promise<Express> {
  const app = express();

  // --- CORS MIDDLEWARE FOR NATIVE MOBILE (CAPACITOR) & CROSS-ORIGIN FETCH ---
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    // Dynamically echo allowed origin (required for credentials: 'include')
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie');

    // Instantly answer CORS preflight OPTIONS requests with 200 OK
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    next();
  });

  app.use(express.json());
  app.use(cookieParser());

  await ensureAuthColumnsExist();

  // Mount Swagger UI Documentation
  setupSwagger(app);

  // --- API ROUTES ---
  app.use(miscRoutes);
  app.use(authRoutes);
  app.use(messageRoutes);
  app.use(mediaRoutes);

  // 404 handler for unmatched API routes (prevents fallback to index.html)
  app.all('/api/*', (_req: Request, res: Response) => {
    return res.status(404).json({ success: false, authenticated: false, error: 'API endpoint not found.' });
  });

  // Error handling for API routes
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/')) {
      console.error('API Server Error:', err);
      return res.status(500).json({ success: false, authenticated: false, error: err?.message || 'Internal server error.' });
    }
    next(err);
  });

  return app;
}
