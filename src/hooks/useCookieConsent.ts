import { useState, useEffect, useCallback } from 'react';
import { 
  cookieConsentService, 
  CookiePreferences, 
  AttributionData, 
  CookieGovernanceItem 
} from '../services/cookieConsent';

export function useCookieConsent() {
  const [hasAnswered, setHasAnswered] = useState<boolean>(() => cookieConsentService.hasUserConsented());
  const [preferences, setPreferences] = useState<CookiePreferences>(() => cookieConsentService.getCookiePreferences());
  const [attribution, setAttribution] = useState<AttributionData | null>(null);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState<boolean>(false);

  // Sync state on load and on custom event
  useEffect(() => {
    // Check marketing attribution on mount
    const attr = cookieConsentService.captureMarketingAttribution();
    setAttribution(attr);

    const handleConsentUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<CookiePreferences>;
      setPreferences(customEvent.detail || cookieConsentService.getCookiePreferences());
      setHasAnswered(true);
      setAttribution(cookieConsentService.captureMarketingAttribution());
    };

    window.addEventListener('gonnng_cookie_consent_updated', handleConsentUpdate);
    return () => window.removeEventListener('gonnng_cookie_consent_updated', handleConsentUpdate);
  }, []);

  const acceptAll = useCallback(() => {
    const updated = cookieConsentService.acceptAll();
    setPreferences(updated);
    setHasAnswered(true);
  }, []);

  const rejectOptional = useCallback(() => {
    const updated = cookieConsentService.rejectOptional();
    setPreferences(updated);
    setHasAnswered(true);
  }, []);

  const savePreferences = useCallback((newPrefs: Partial<CookiePreferences>) => {
    const updated = cookieConsentService.saveCookiePreferences(newPrefs);
    setPreferences(updated);
    setHasAnswered(true);
  }, []);

  const openPreferencesModal = useCallback(() => {
    setIsPreferencesModalOpen(true);
  }, []);

  const closePreferencesModal = useCallback(() => {
    setIsPreferencesModalOpen(false);
  }, []);

  const trackEvent = useCallback((eventName: string, payload: Record<string, any> = {}) => {
    return cookieConsentService.trackAnalyticsEvent(eventName, payload);
  }, []);

  const governanceItems: CookieGovernanceItem[] = cookieConsentService.getGovernanceDirectory();

  return {
    hasAnswered,
    preferences,
    attribution,
    isPreferencesModalOpen,
    acceptAll,
    rejectOptional,
    savePreferences,
    openPreferencesModal,
    closePreferencesModal,
    trackEvent,
    governanceItems
  };
}
