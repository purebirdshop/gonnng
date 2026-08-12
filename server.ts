import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApp } from './server/app.js';

/**
 * Local development / traditional-hosting entry point.
 * This file is NOT used on Vercel — Vercel invokes api/index.ts as a
 * serverless function instead, and serves the built frontend as static
 * assets directly (see vercel.json). Run this with `tsx server.ts` (or
 * your existing "dev"/"start" script) for local development or for
 * deploying to a long-running Node host.
 */
async function startServer() {
  const app = await createApp();
  const PORT = Number(process.env.PORT) || 3000;

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
  // app.listen(PORT, 'localhost', () => {
    console.log(`⚒️ Server running on port ${PORT}`);
  });
}

startServer();
