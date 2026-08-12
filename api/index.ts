import type { Request, Response } from 'express';
import { createApp } from '../server/app.js';

let appInstance: any = null;

export default async function handler(req: Request, res: Response) {
  if (!appInstance) {
    appInstance = await createApp();
  }
  return appInstance(req, res);
}
