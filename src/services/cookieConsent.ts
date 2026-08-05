import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface CookiePreferences {
  strictlyNecessary: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
  userPreferences: boolean;
  timestamp: string;
}

export interface AttributionData {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  capturedAt: string;
}

export interface CookieGovernanceItem {
  name: string;
  purpose: string;
  category: 'Strictly Necessary' | 'Analytics' | 'Marketing Attribution' | 'User Preferences';
  requiredConsent: boolean;
  security: string;
  expiration: string;
  dataStored: string;
  owner: string;
}

const COOKIE_PREFS_KEY = 'gonnng_cookie_preferences';
const ATTRIBUTION_KEY = 'gonnng_attribution';
const ANALYTICS_BUFFER_KEY = 'gonnng_analytics_events';
const USER_PREFS_KEY = 'gonnng_user_prefs';

export const DEFAULT_COOKIE_PREFERENCES: CookiePreferences = {
  strictlyNecessary: true,
  analytics: false,
  marketing: false,
  userPreferences: false,
  timestamp: new Date().toISOString()
};

// Helper: parse document.cookie string
function getRawCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const matches = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1')}=([^;]*)`));
  return matches ? decodeURIComponent(matches[1]) : null;
}

// Helper: set raw browser cookie
function setRawCookie(name: string, value: string, days = 365, sameSite: 'lax' | 'strict' | 'none' = 'lax') {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `; expires=${date.toUTCString()}`;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=${sameSite}${secure}`;
}

// Helper: delete cookie
function removeRawCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
}

export const cookieConsentService = {
  // Check if user has answered cookie banner previously
  hasUserConsented(): boolean {
    if (typeof window === 'undefined') return false;
    const cookieVal = getRawCookie(COOKIE_PREFS_KEY);
    const localVal = localStorage.getItem(COOKIE_PREFS_KEY);
    return Boolean(cookieVal || localVal);
  },

  // Get current active preferences
  getCookiePreferences(): CookiePreferences {
    if (typeof window === 'undefined') return DEFAULT_COOKIE_PREFERENCES;
    try {
      const raw = getRawCookie(COOKIE_PREFS_KEY) || localStorage.getItem(COOKIE_PREFS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          strictlyNecessary: true, // Always locked on
          analytics: Boolean(parsed.analytics),
          marketing: Boolean(parsed.marketing),
          userPreferences: Boolean(parsed.userPreferences),
          timestamp: parsed.timestamp || new Date().toISOString()
        };
      }
    } catch (e) {
      console.warn('Error reading cookie preferences:', e);
    }
    return DEFAULT_COOKIE_PREFERENCES;
  },

  // Save new preferences
  saveCookiePreferences(prefs: Partial<CookiePreferences>): CookiePreferences {
    const updated: CookiePreferences = {
      strictlyNecessary: true,
      analytics: Boolean(prefs.analytics),
      marketing: Boolean(prefs.marketing),
      userPreferences: Boolean(prefs.userPreferences),
      timestamp: new Date().toISOString()
    };

    const stringified = JSON.stringify(updated);
    setRawCookie(COOKIE_PREFS_KEY, stringified, 365);
    localStorage.setItem(COOKIE_PREFS_KEY, stringified);

    // If marketing consent is rejected, purge stored attribution
    if (!updated.marketing) {
      removeRawCookie(ATTRIBUTION_KEY);
      localStorage.removeItem(ATTRIBUTION_KEY);
    } else {
      // Re-check UTM parameters upon consent grant
      this.captureMarketingAttribution();
    }

    // If analytics consent is rejected, clear event buffer
    if (!updated.analytics) {
      localStorage.removeItem(ANALYTICS_BUFFER_KEY);
    }

    // Dispatch event so UI and third-party script loaders react immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gonnng_cookie_consent_updated', { detail: updated }));
    }

    // Save to Supabase cookie_preferences table if active
    if (isSupabaseConfigured() && supabase) {
      try {
        const authSession = localStorage.getItem('gonnng_auth_session');
        const userId = authSession ? JSON.parse(authSession).id : 'user-current';
        supabase.from('cookie_preferences').upsert({
          user_id: userId,
          essential: true,
          functional: Boolean(updated.userPreferences),
          analytics: Boolean(updated.analytics),
          marketing: Boolean(updated.marketing),
          attribution: localStorage.getItem('gonnng_attribution') || null,
          updated_at: new Date().toISOString()
        }).then(({ error }) => {
          if (error) console.error('Error updating cookie_preferences in Supabase:', error);
        });
      } catch (e) {
        console.warn('Failed to sync cookie_preferences to Supabase:', e);
      }
    }

    return updated;
  },

  acceptAll(): CookiePreferences {
    return this.saveCookiePreferences({
      strictlyNecessary: true,
      analytics: true,
      marketing: true,
      userPreferences: true
    });
  },

  rejectOptional(): CookiePreferences {
    return this.saveCookiePreferences({
      strictlyNecessary: true,
      analytics: false,
      marketing: false,
      userPreferences: false
    });
  },

  // FR-003 Category 3: Capture UTM marketing parameters from URL if marketing consent is active
  captureMarketingAttribution(): AttributionData | null {
    if (typeof window === 'undefined') return null;

    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    const utmCampaign = urlParams.get('utm_campaign');
    const utmContent = urlParams.get('utm_content');
    const utmTerm = urlParams.get('utm_term');

    // If URL contains UTM parameters
    if (utmSource || utmMedium || utmCampaign || utmContent) {
      const attribution: AttributionData = {
        source: utmSource || undefined,
        medium: utmMedium || undefined,
        campaign: utmCampaign || undefined,
        content: utmContent || undefined,
        term: utmTerm || undefined,
        capturedAt: new Date().toISOString()
      };

      const prefs = this.getCookiePreferences();
      if (prefs.marketing) {
        const stringified = JSON.stringify(attribution);
        setRawCookie(ATTRIBUTION_KEY, stringified, 90);
        localStorage.setItem(ATTRIBUTION_KEY, stringified);
        console.log('✅ [Marketing Attribution Cookie Stored]:', attribution);
      } else {
        console.warn('⚠️ [Marketing Attribution Blocked]: Marketing cookies not consented by visitor.');
      }
      return attribution;
    }

    // Otherwise read existing attribution if stored
    try {
      const raw = getRawCookie(ATTRIBUTION_KEY) || localStorage.getItem(ATTRIBUTION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // FR-002 Category 2: Analytics tracking method respecting analytics consent
  trackAnalyticsEvent(eventName: string, payload: Record<string, any> = {}): boolean {
    const prefs = this.getCookiePreferences();
    if (!prefs.analytics) {
      console.log(`🚫 [Analytics Blocked - No Consent]: Event "${eventName}" not tracked.`);
      return false;
    }

    const eventRecord = {
      event: eventName,
      payload,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.pathname : '/'
    };

    try {
      const existingStr = localStorage.getItem(ANALYTICS_BUFFER_KEY);
      const existing = existingStr ? JSON.parse(existingStr) : [];
      existing.push(eventRecord);
      localStorage.setItem(ANALYTICS_BUFFER_KEY, JSON.stringify(existing.slice(-100))); // Keep last 100
    } catch (e) {
      console.error('Failed to buffer analytics event:', e);
    }

    console.log(`📊 [Analytics Event Logged]: "${eventName}"`, payload);
    return true;
  },

  // Category 4: User preference cookie helper
  saveUserPreference(key: string, value: any): boolean {
    const prefs = this.getCookiePreferences();
    if (!prefs.userPreferences) {
      console.log(`🚫 [User Preferences Blocked - No Consent]: Key "${key}" not saved.`);
      return false;
    }

    try {
      const existingStr = getRawCookie(USER_PREFS_KEY) || localStorage.getItem(USER_PREFS_KEY);
      const existing = existingStr ? JSON.parse(existingStr) : {};
      existing[key] = value;
      const stringified = JSON.stringify(existing);
      setRawCookie(USER_PREFS_KEY, stringified, 365);
      localStorage.setItem(USER_PREFS_KEY, stringified);
      return true;
    } catch {
      return false;
    }
  },

  // Shared Cookie Configuration & Governance Standard
  getGovernanceDirectory(): CookieGovernanceItem[] {
    return [
      {
        name: 'gonnng_cookie_preferences',
        purpose: 'Stores visitor cookie consent choices and granular category permissions.',
        category: 'Strictly Necessary',
        requiredConsent: false,
        security: 'SameSite=Lax, Secure',
        expiration: '365 days',
        dataStored: 'JSON object containing consent flags and timestamp.',
        owner: 'Gonnng Compliance & Consent Infrastructure'
      },
      {
        name: 'gonnng_session',
        purpose: 'Secure authentication session cookie used to identify logged-in users, maintain state, and protect API requests.',
        category: 'Strictly Necessary',
        requiredConsent: false,
        security: 'HttpOnly, Secure, SameSite=Lax',
        expiration: 'Session or 30 days (Remember Me)',
        dataStored: 'Encrypted unique session token identifier.',
        owner: 'Gonnng Security & Auth Backend'
      },
      {
        name: 'gonnng_attribution',
        purpose: 'Stores referrer campaign attribution data (utm_source, utm_campaign, utm_medium) to understand how visitors discover Gonnng.',
        category: 'Marketing Attribution',
        requiredConsent: true,
        security: 'SameSite=Lax',
        expiration: '90 days',
        dataStored: 'UTM marketing channel variables and timestamp.',
        owner: 'Gonnng Growth & Marketing Team'
      },
      {
        name: 'analytics_id',
        purpose: 'Tracks website traffic patterns, page navigation paths, download clicks, and conversion funnels.',
        category: 'Analytics',
        requiredConsent: true,
        security: 'SameSite=Lax',
        expiration: '180 days',
        dataStored: 'Anonymous visitor token and event counters.',
        owner: 'Gonnng Product & Analytics'
      },
      {
        name: 'gonnng_user_prefs',
        purpose: 'Remembers user interface customizations such as layout preferences, language settings, and dismissed announcement banners.',
        category: 'User Preferences',
        requiredConsent: true,
        security: 'SameSite=Lax',
        expiration: '365 days',
        dataStored: 'JSON dictionary of UI display options.',
        owner: 'Gonnng Frontend App'
      }
    ];
  }
};
