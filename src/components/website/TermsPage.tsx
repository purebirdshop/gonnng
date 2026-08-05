import React from 'react';
import { FileText, CheckSquare, AlertTriangle, Copyright, Scale } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-12 space-y-10 text-gray-800">
      {/* HEADER */}
      <div className="space-y-3 border-b border-gray-200 pb-8">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs font-mono font-bold text-blue-700">
          <FileText className="w-3.5 h-3.5" />
          <span>Legal Agreement</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Gonnng Terms of Service</h1>
        <p className="text-xs text-gray-500 font-mono">Effective Date: July 2026 • Version 2.4</p>
      </div>

      <div className="space-y-8 text-xs sm:text-sm leading-relaxed font-sans">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-[#FF5C00]" />
            <span>1. Acceptance of Terms</span>
          </h2>
          <p>
            By accessing or using Gonnng (including the web application, mobile applications, and services), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#FF5C00]" />
            <span>2. Account Responsibilities & Acceptable Usage</span>
          </h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree not to:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-gray-700">
            <li>Post unlawful, defamatory, or hateful content in recipes, comments, or progress logs.</li>
            <li>Attempt to breach or reverse engineer Gonnng services or API endpoints.</li>
            <li>Impersonate other creators or upload copyrighted imagery without authorization.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Copyright className="w-4 h-4 text-[#FF5C00]" />
            <span>3. Intellectual Property & User-Generated Content</span>
          </h2>
          <p>
            <strong>You own 100% of your intellectual property.</strong> Gonnng claims no ownership over your recipes, artwork, manuscripts, codebase, or creative projects. When you publish a recipe publicly, you grant Gonnng a non-exclusive license to display it to other users on the platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#FF5C00]" />
            <span>4. Limitations of Liability & Termination</span>
          </h2>
          <p>
            Gonnng provides services on an "as is" and "as available" basis. We reserve the right to suspend accounts violating acceptable usage guidelines or to modify services with prior notice.
          </p>
        </section>
      </div>
    </div>
  );
};
