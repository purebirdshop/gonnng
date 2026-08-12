import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../server/app.js';

let appInstance: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!appInstance) {
    appInstance = await createApp();
  }
  return appInstance(req, res);
}
