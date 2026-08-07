/**
 * Email Service integrated with Resend (https://resend.com)
 * Handles transactional and authentication emails for Gonnng.
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';
const DEFAULT_FROM = 'Gonnng Auth <auth@gonnng.com>';
const FALLBACK_FROM = 'Gonnng <onboarding@resend.dev>';

export const emailService = {
  /**
   * Core function to dispatch email via Resend REST API
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    const apiKey = RESEND_API_KEY;
    const configuredFrom = options.from || DEFAULT_FROM;

    if (!apiKey) {
      console.log('[Resend Email Service] VITE_RESEND_API_KEY not configured. Simulating email delivery:', options.to);
      return {
        success: true,
        id: `sim_resend_${Date.now()}`,
      };
    }

    const attemptSend = async (fromAddress: string): Promise<{ success: boolean; id?: string; error?: string; status?: number; data?: any }> => {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [options.to],
            subject: options.subject,
            html: options.html,
            text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
          }),
        });

        const data = await response.json();
        if (response.ok && data?.id) {
          return { success: true, id: data.id, status: response.status, data };
        }
        return { success: false, status: response.status, data, error: data?.message || 'Resend transmission error' };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Network error' };
      }
    };

    // Attempt 1: Try sending with configured sender
    let res = await attemptSend(configuredFrom);

    // Fallback 1: Unverified domain retry
    if (!res.success && configuredFrom !== FALLBACK_FROM && res.data?.message?.includes('domain is not verified')) {
      res = await attemptSend(FALLBACK_FROM);
    }

    // Fallback 2: Test mode restricted recipient
    if (!res.success && res.data?.message?.includes('only send testing emails to your own email address')) {
      console.log(`[Resend Test Mode] Email to ${options.to} simulated (Resend account limit)`);
      return { success: true, id: `sim_testmode_${Date.now()}` };
    }

    if (res.success) {
      return { success: true, id: res.id };
    }

    console.warn('[Resend Email Notice]:', res.error);
    return { success: false, error: res.error };
  },

  /**
   * 1. Verify Email Address
   */
  async sendVerificationEmail(email: string, token: string, name: string) {
    const verifyUrl = `${window.location.origin}/verify-email?token=${token}`;
    return this.sendEmail({
      to: email,
      subject: 'Verify your Gonnng account email',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 16px;">
          <h2 style="color: #FF5C00; margin-bottom: 12px;">Welcome to Gonnng, ${name}!</h2>
          <p style="color: #334155; line-height: 1.6;">Please confirm your email address to activate your account and start creating and sharing blueprints.</p>
          <div style="margin: 24px 0;">
            <a href="${verifyUrl}" style="background-color: #FF5C00; color: #000; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Verify Email Address</a>
          </div>
          <p style="color: #64748b; font-size: 12px;">Or copy and paste this link: <br/><a href="${verifyUrl}" style="color: #FF5C00;">${verifyUrl}</a></p>
        </div>
      `,
    });
  },

  /**
   * 2. Reset Password
   */
  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${window.location.origin}/reset-password?token=${token}`;
    return this.sendEmail({
      to: email,
      subject: 'Reset your Gonnng account password',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 16px;">
          <h2 style="color: #FF5C00; margin-bottom: 12px;">Password Reset Request</h2>
          <p style="color: #334155; line-height: 1.6;">We received a request to reset your password. Click below to set a new password:</p>
          <div style="margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #FF5C00; color: #000; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #64748b; font-size: 12px;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  },

  /**
   * 3. Welcome Onboarding Email
   */
  async sendWelcomeEmail(email: string, name: string) {
    return this.sendEmail({
      to: email,
      subject: '🎉 Welcome to Gonnng - Your Process Blueprint Studio',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 16px;">
          <h2 style="color: #FF5C00; margin-bottom: 12px;">Your Account is Ready, ${name}!</h2>
          <p style="color: #334155; line-height: 1.6;">Explore community recipes, sequence your custom projects, and track progress updates with your circle.</p>
        </div>
      `,
    });
  },

  /**
   * 4. Email Change Confirmation
   */
  async sendEmailChangeConfirmation(newEmail: string, oldEmail: string, token: string) {
    const confirmUrl = `${window.location.origin}/confirm-email-change?token=${token}`;
    return this.sendEmail({
      to: newEmail,
      subject: 'Confirm your new email address',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #FF5C00;">Confirm Email Change</h2>
          <p>Please confirm changing your email address from ${oldEmail} to ${newEmail}.</p>
          <a href="${confirmUrl}" style="background-color: #FF5C00; color: #000; font-weight: bold; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Confirm Email Update</a>
        </div>
      `,
    });
  },

  /**
   * 5. Magic Link / Passwordless Auth
   */
  async sendMagicLinkEmail(email: string, token: string) {
    const magicUrl = `${window.location.origin}/magic-login?token=${token}`;
    return this.sendEmail({
      to: email,
      subject: 'Sign in to Gonnng with your Magic Link',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #FF5C00;">Instant Sign-In Link</h2>
          <p>Click below to sign in instantly without password:</p>
          <a href="${magicUrl}" style="background-color: #FF5C00; color: #000; font-weight: bold; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Sign In Now</a>
        </div>
      `,
    });
  },

  /**
   * 6. Security Alert
   */
  async sendSecurityAlertEmail(email: string, activityDetails: string) {
    return this.sendEmail({
      to: email,
      subject: 'Security Alert: Account Activity Notice',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #e11d48;">Security Notice</h2>
          <p>New security activity detected on your Gonnng account:</p>
          <p style="background: #f1f5f9; padding: 12px; font-family: monospace;">${activityDetails}</p>
        </div>
      `,
    });
  },
};
