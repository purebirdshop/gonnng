import { Router, type Request, type Response } from 'express';
import { authenticateSession } from '../lib/sessions';
import { emailService } from '../emailService';

const router = Router();

// GET /api/health - Public API health status endpoint
router.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

// GET /api/projects - Sample API route validating session cookie (FR-105)
router.get('/api/projects', authenticateSession, (req: Request, res: Response) => {
    const user = (req as any).user;
    return res.json({
      success: true,
      authenticatedUser: user.name,
      message: `Access granted for user ${user.username || user.email}`
    });
  });

// POST /api/email/send - Proxy email dispatches via server-side Resend service
router.post('/api/email/send', async (req: Request, res: Response) => {
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

// GET /api/cookie-governance - Public endpoint returning cookie standards documentation
router.get('/api/cookie-governance', (_req: Request, res: Response) => {
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

export default router;
