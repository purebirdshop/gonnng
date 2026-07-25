import React from 'react';
import { Shield, Lock, Eye, Trash2, Mail } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-12 space-y-10 text-white/80">
      {/* HEADER */}
      <div className="space-y-3 border-b border-white/10 pb-8">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-mono font-bold text-emerald-400">
          <Shield className="w-3.5 h-3.5" />
          <span>Privacy & Data Protection</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Gonnng Privacy Policy</h1>
        <p className="text-xs text-white/50 font-mono">Last Updated: July 2026 • Version 2.4</p>
      </div>

      <div className="space-y-8 text-xs sm:text-sm leading-relaxed font-sans">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#FF5C00]" />
            <span>1. Information We Collect</span>
          </h2>
          <p>
            When you register or interact with the Gonnng application, we collect information you voluntarily provide:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-white/70">
            <li><strong>Account Profile:</strong> Name, email address, password hash, avatar URL, and bio.</li>
            <li><strong>Creative Work:</strong> Projects, Recipes, Collections, tasks, progress logs, and attached photos.</li>
            <li><strong>Circle Interactions:</strong> Following lists, circle membership status, comments, and gong reactions.</li>
            <li><strong>Technical Telemetry:</strong> Device type, browser environment, and basic performance logs.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#FF5C00]" />
            <span>2. How We Store and Protect Your Data</span>
          </h2>
          <p>
            Gonnng utilizes multi-layered security safeguards:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-white/70">
            <li><strong>Data Encryption:</strong> All network traffic is encrypted via TLS 1.3 SSL protocols.</li>
            <li><strong>Cloud Storage:</strong> When Supabase integration is enabled, data is stored in PostgreSQL databases protected by Row-Level Security (RLS) policies.</li>
            <li><strong>Local Browser Storage:</strong> When offline or feature-flagged, data remains in your local browser sandbox.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#FF5C00]" />
            <span>3. Third-Party Services & Cookies</span>
          </h2>
          <p>
            We do not sell, rent, or trade your personal data. We use limited essential third-party services:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-white/70">
            <li><strong>Supabase:</strong> For cloud database persistence and authentication.</li>
            <li><strong>Unsplash API:</strong> For royalty-free preview imagery.</li>
            <li><strong>Local Cookies & Session Storage:</strong> Used exclusively for session authentication and active user preferences.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-[#FF5C00]" />
            <span>4. Your Rights & Data Deletion Process</span>
          </h2>
          <p>
            You retain full ownership of your creative content. You have the right to:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-white/70">
            <li>Export all your recipes and project data in JSON or CSV format from workspace settings.</li>
            <li>Request full account and data deletion by contacting privacy@gonnng.com or submitting a support ticket. Account deletion wipes all database records within 14 business days.</li>
          </ul>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#FF5C00]" />
            <span>Contact Privacy Team</span>
          </h2>
          <p className="text-xs text-white/70">
            For questions regarding this Privacy Policy or your data rights, contact us at <strong>privacy@gonnng.com</strong>.
          </p>
        </section>
      </div>
    </div>
  );
};
