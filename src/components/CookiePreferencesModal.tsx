import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldCheck, 
  BarChart3, 
  Megaphone, 
  Sliders, 
  Lock, 
  Check, 
  Cookie, 
  Table, 
  Info, 
  ExternalLink 
} from 'lucide-react';
import { CookiePreferences, CookieGovernanceItem } from '../services/cookieConsent';

interface CookiePreferencesModalProps {
  isOpen: boolean;
  preferences: CookiePreferences;
  governanceItems: CookieGovernanceItem[];
  onClose: () => void;
  onSavePreferences: (prefs: Partial<CookiePreferences>) => void;
  onAcceptAll: () => void;
}

export const CookiePreferencesModal: React.FC<CookiePreferencesModalProps> = ({
  isOpen,
  preferences,
  governanceItems,
  onClose,
  onSavePreferences,
  onAcceptAll
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'directory'>('categories');
  const [analytics, setAnalytics] = useState<boolean>(preferences.analytics);
  const [marketing, setMarketing] = useState<boolean>(preferences.marketing);
  const [userPreferences, setUserPreferences] = useState<boolean>(preferences.userPreferences);

  if (!isOpen) return null;

  const handleSave = () => {
    onSavePreferences({
      strictlyNecessary: true,
      analytics,
      marketing,
      userPreferences
    });
    onClose();
  };

  const handleAcceptAllClick = () => {
    onAcceptAll();
    setAnalytics(true);
    setMarketing(true);
    setUserPreferences(true);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-gray-900 border border-gray-800 text-white rounded-none sm:rounded-3xl p-6 w-full h-full sm:h-auto max-w-none sm:max-w-2xl shadow-2xl flex flex-col max-h-full sm:max-h-[90vh] space-y-5"
          id="cookie-preferences-modal"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B]">
                <Cookie className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-sans text-white">Privacy & Cookie Settings</h2>
                <p className="text-xs font-mono text-gray-400">Manage consent categories & view governance directory</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 w-fit text-xs font-mono">
            <button
              type="button"
              id="cookie-tab-categories"
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'categories'
                  ? 'bg-[#F59E0B] text-black shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Cookie Categories</span>
            </button>

            <button
              type="button"
              id="cookie-tab-directory"
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'directory'
                  ? 'bg-[#F59E0B] text-black shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Cookie Directory ({governanceItems.length})</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="overflow-y-auto flex-1 space-y-4 pr-1">
            {activeTab === 'categories' ? (
              <div className="space-y-4">
                {/* Category 1: Strictly Necessary */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <h3 className="text-sm font-bold text-white">Category 1: Strictly Necessary Cookies</h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Always Active
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed font-sans">
                      Enables core website functionality, security protections, session cookies (<code className="text-[#F59E0B]">gonnng_session</code>), and stores your privacy choices. Cannot be disabled.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-mono font-bold shrink-0">
                    <Lock className="w-3.5 h-3.5" /> Required
                  </div>
                </div>

                {/* Category 2: Analytics Cookies */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start justify-between gap-4 hover:border-white/20 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-400 shrink-0" />
                      <h3 className="text-sm font-bold text-white">Category 2: Analytics Cookies</h3>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed font-sans">
                      Understands website traffic, page visits, visitor paths, and conversion funnels. Helps us improve Gonnng performance and feature utility.
                    </p>
                    <p className="text-[11px] font-mono text-gray-400">
                      Integrations: Plausible / PostHog / Google Analytics
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                      className="sr-only peer"
                      id="toggle-cookie-analytics"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F59E0B]"></div>
                  </label>
                </div>

                {/* Category 3: Marketing Attribution Cookies */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start justify-between gap-4 hover:border-white/20 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-purple-400 shrink-0" />
                      <h3 className="text-sm font-bold text-white">Category 3: Marketing Attribution Cookies</h3>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed font-sans">
                      Tracks where visitors originated using campaign links (<code className="text-purple-300">utm_source</code>, <code className="text-purple-300">utm_campaign</code> e.g. TikTok, Twitter, Google ads).
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={marketing}
                      onChange={(e) => setMarketing(e.target.checked)}
                      className="sr-only peer"
                      id="toggle-cookie-marketing"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F59E0B]"></div>
                  </label>
                </div>

                {/* Category 4: User Preference Cookies */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start justify-between gap-4 hover:border-white/20 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
                      <h3 className="text-sm font-bold text-white">Category 4: User Preference Cookies</h3>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed font-sans">
                      Remembers visitor preferences such as layout preferences, language settings, and dismissed announcement banners.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={userPreferences}
                      onChange={(e) => setUserPreferences(e.target.checked)}
                      className="sr-only peer"
                      id="toggle-cookie-user-prefs"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F59E0B]"></div>
                  </label>
                </div>
              </div>
            ) : (
              /* Directory Tab */
              <div className="space-y-4">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-blue-200 flex items-start gap-2 font-sans">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    Below is the live governance catalog of cookies used across the Gonnng promotional website and web application.
                  </span>
                </div>

                <div className="space-y-3">
                  {governanceItems.map((item) => (
                    <div
                      key={item.name}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 hover:border-white/20 transition-all text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                        <code className="font-mono font-bold text-[#F59E0B] text-sm">{item.name}</code>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          item.category === 'Strictly Necessary'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : item.category === 'Analytics'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : item.category === 'Marketing Attribution'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {item.category}
                        </span>
                      </div>

                      <p className="text-gray-300 leading-relaxed font-sans">{item.purpose}</p>

                      <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-gray-400">
                        <div>
                          <strong className="text-gray-200 font-sans">Owner:</strong> {item.owner}
                        </div>
                        <div>
                          <strong className="text-gray-200 font-sans">Expiration:</strong> {item.expiration}
                        </div>
                        <div>
                          <strong className="text-gray-200 font-sans">Security:</strong> {item.security}
                        </div>
                        <div>
                          <strong className="text-gray-200 font-sans">Consent Required:</strong> {item.requiredConsent ? 'Yes (Optional)' : 'No (Essential)'}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/5 font-mono text-[10px] text-gray-400">
                        <span className="text-gray-300">Data stored:</span> {item.dataStored}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="pt-4 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-gray-400 font-mono text-center sm:text-left">
              Changes take effect immediately upon saving
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                id="cookie-modal-save-btn"
                onClick={handleSave}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors cursor-pointer"
              >
                Save Preferences
              </button>
              <button
                type="button"
                id="cookie-modal-accept-all-btn"
                onClick={handleAcceptAllClick}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-mono font-bold text-black bg-[#F59E0B] hover:bg-[#FF751A] shadow-lg shadow-[#F59E0B]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Accept All Cookies</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
