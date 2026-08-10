import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, ShieldCheck, Settings, Check, X, Megaphone, BarChart3, Sliders } from 'lucide-react';
import { CookiePreferences, AttributionData } from '../services/cookieConsent';

interface CookieBannerProps {
  isVisible: boolean;
  attribution: AttributionData | null;
  onAcceptAll: () => void;
  onRejectOptional: () => void;
  onManagePreferences: () => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({
  isVisible,
  attribution,
  onAcceptAll,
  onRejectOptional,
  onManagePreferences
}) => {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-xl z-50 bg-gray-900/95 backdrop-blur-xl border border-gray-800 text-white p-5 rounded-2xl shadow-2xl shadow-black/60 ring-1 ring-white/10"
        id="cookie-consent-banner"
      >
        <div className="flex flex-col space-y-3.5">
          {/* Header & Title */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B] shrink-0">
                <Cookie className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-sm text-white flex items-center gap-2">
                  Cookie & Privacy Preferences
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    GDPR & CCPA Compliant
                  </span>
                </h3>
                <p className="text-[11px] font-mono text-gray-400">
                  Transparency and control over your data
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onRejectOptional}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              title="Close & Reject Optional Cookies"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs text-gray-300 leading-relaxed font-sans">
            We use cookies to improve your experience, analyze website traffic, and understand how visitors find Gonnng. Essential cookies keep the platform secure and functional.
          </p>

          {/* Marketing Attribution Detected Callout */}
          {attribution && (attribution.source || attribution.campaign) && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center gap-2 text-[11px] font-mono text-amber-300">
              <Megaphone className="w-3.5 h-3.5 shrink-0 text-[#F59E0B]" />
              <span className="truncate">
                Campaign source detected: <strong className="text-white">{attribution.source || 'Direct'}</strong> ({attribution.campaign || 'General'})
              </span>
            </div>
          )}

          {/* Category Pills Overview */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono pt-1 border-t border-white/10">
            <span className="px-2 py-0.5 rounded-md bg-white/10 text-white flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Necessary (Required)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 text-gray-300 flex items-center gap-1">
              <BarChart3 className="w-3 h-3 text-blue-400" /> Analytics
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 text-gray-300 flex items-center gap-1">
              <Megaphone className="w-3 h-3 text-purple-400" /> Marketing Attribution
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 text-gray-300 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-amber-400" /> Preferences
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
            <button
              type="button"
              id="cookie-manage-prefs-btn"
              onClick={onManagePreferences}
              className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-gray-400" />
              <span>Manage Preferences</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="cookie-reject-optional-btn"
                onClick={onRejectOptional}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-mono font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors cursor-pointer"
              >
                Reject Optional Cookies
              </button>
              <button
                type="button"
                id="cookie-accept-all-btn"
                onClick={onAcceptAll}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-mono font-bold text-black bg-[#F59E0B] hover:bg-[#FF751A] shadow-lg shadow-[#F59E0B]/20 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Accept All</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
