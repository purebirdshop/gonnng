import 'dotenv/config';
import type { Express } from 'express';
import { createApp } from '../server/app.js';

// Vercel recycles containers between invocations but keeps warm ones alive
// for a short window, so we cache the built app across invocations on the
// same container instead of reconstructing it (and re-running
// ensureAuthColumnsExist) on every request.
let appPromise: Promise<Express> | null = null;

function getApp(): Promise<Express> {
  if (!appPromise) {
    appPromise = createApp();
  }
  return appPromise;
}

export default async function handler(req: any, res: any) {
  const app = await getApp();
  return app(req, res);
}
