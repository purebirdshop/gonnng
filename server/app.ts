import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { setupSwagger } from './swagger.js';
import { ensureAuthColumnsExist, SESSION_SECRET } from './lib/sessions.js';
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

  app.use(express.json());
  app.use(cookieParser(SESSION_SECRET));

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
