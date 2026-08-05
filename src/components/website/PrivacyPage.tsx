import React from 'react';
import { Shield, Lock, Eye, Trash2, Mail, Cookie, Sliders } from 'lucide-react';

interface PrivacyPageProps {
  onOpenCookiePreferences?: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onOpenCookiePreferences }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-12 space-y-10 text-gray-800">
      {/* HEADER */}
      <div className="space-y-3 border-b border-gray-200 pb-8">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-mono font-bold text-emerald-700">
          <Shield className="w-3.5 h-3.5" />
          <span>Privacy & Data Protection</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Gonnng Privacy Policy</h1>
        <p className="text-xs text-gray-500 font-mono">Last Updated: July 2026 • Version 2.4</p>
      </div>

      <div className="space-y-8 text-xs sm:text-sm leading-relaxed font-sans">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#FF5C00]" />
            <span>1. Information We Collect</span>
          </h2>
          <p>
            When you register or interact with the Gonnng application, we collect information you voluntarily provide:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-gray-700">
            <li><strong>Account Profile:</strong> Name, email address, password hash, avatar URL, and bio.</li>
            <li><strong>Creative Work:</strong> Projects, Recipes, Collections, tasks, progress logs, and attached photos.</li>
            <li><strong>Circle Interactions:</strong> Following lists, circle membership status, comments, and gong reactions.</li>
            <li><strong>Technical Telemetry:</strong> Device type, browser environment, and basic performance logs.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#FF5C00]" />
            <span>2. How We Store and Protect Your Data</span>
          </h2>
          <p>
            Gonnng utilizes multi-layered security safeguards:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-gray-700">
            <li><strong>Data Encryption:</strong> All network traffic is encrypted via TLS 1.3 SSL protocols.</li>
            <li><strong>Cloud Storage:</strong> When Supabase integration is enabled, data is stored in PostgreSQL databases protected by Row-Level Security (RLS) policies.</li>
            <li><strong>Local Browser Storage:</strong> When offline or feature-flagged, data remains in your local browser sandbox.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Cookie className="w-4 h-4 text-[#FF5C00]" />
            <span>3. Third-Party Services & Cookie Infrastructure</span>
          </h2>
          <p>
            Gonnng utilizes cookies across both our promotional website and web application:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
            <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-xl space-y-1">
              <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF5C00]"></span>
                Promotional Website Cookies
              </h4>
              <p className="text-gray-600">
                Used for visitor analytics, marketing attribution (UTM source/campaign tracking), and user experience settings. Requires user consent via our cookie banner.
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-xl space-y-1">
              <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Web Application Cookies
              </h4>
              <p className="text-gray-600">
                Used for secure session authentication (<code className="text-[#FF5C00]">gonnng_session</code>), anti-CSRF protection, and API route verification. Uses HttpOnly and Secure flags.
              </p>
            </div>
          </div>

          {onOpenCookiePreferences && (
            <div className="pt-2">
              <button
                type="button"
                id="privacy-cookie-manage-btn"
                onClick={onOpenCookiePreferences}
                className="px-4 py-2.5 rounded-xl bg-gray-900 text-white font-mono text-xs font-bold hover:bg-gray-800 transition-colors flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Sliders className="w-4 h-4 text-[#FF5C00]" />
                <span>Manage Cookie Preferences & Governance Directory</span>
              </button>
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-[#FF5C00]" />
            <span>4. Your Rights & Data Deletion Process</span>
          </h2>
          <p>
            You retain full ownership of your creative content. You have the right to:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-gray-700">
            <li>Export all your recipes and project data in JSON or CSV format from workspace settings.</li>
            <li>Request full account and data deletion by contacting privacy@gonnng.com or submitting a support ticket. Account deletion wipes all database records within 14 business days.</li>
          </ul>
        </section>

        <section className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-2">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#FF5C00]" />
            <span>Contact Privacy Team</span>
          </h2>
          <p className="text-xs text-gray-600">
            For questions regarding this Privacy Policy or your data rights, contact us at <strong>privacy@gonnng.com</strong>.
          </p>
        </section>
      </div>
    </div>
  );
};
