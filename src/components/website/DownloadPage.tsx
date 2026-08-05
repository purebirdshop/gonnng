import React from 'react';
import { Smartphone, Monitor, Check, Sparkles, ArrowRight, HelpCircle, Clock, Globe } from 'lucide-react';

interface DownloadPageProps {
  onOpenWorkspace: () => void;
}

export const DownloadPage: React.FC<DownloadPageProps> = ({ onOpenWorkspace }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 space-y-16 text-gray-900">
      {/* HEADER */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#FF5C00]/10 border border-[#FF5C00]/30 px-3 py-1 rounded-full text-xs font-mono font-bold text-[#FF5C00]">
          <Globe className="w-3.5 h-3.5" />
          <span>Web App First Platform</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Use Gonnng in your browser today
        </h1>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed font-sans">
          Gonnng is built as a responsive, high-performance web application accessible instantly from any device. Mobile apps are currently in development for a future release.
        </p>
      </div>

      {/* PLATFORM SELECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* DESKTOP WEB CARD */}
        <div className="bg-orange-50/50 border border-[#FF5C00]/40 rounded-2xl p-6 space-y-6 flex flex-col justify-between shadow-md">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#FF5C00]/20 text-[#FF5C00] flex items-center justify-center">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF5C00] text-black mb-1">
                AVAILABLE NOW
              </div>
              <h3 className="text-xl font-bold text-gray-900">Desktop Browser</h3>
              <p className="text-xs text-gray-600 mt-1">Full-featured creative workspace in Chrome, Safari, Edge or Firefox</p>
            </div>
            <ul className="space-y-2 text-xs text-gray-700 font-sans">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Rich Sand Engine process builder & Kanban boards</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant Gong audio feedback & ceremony overlays</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Local persistence with cloud sync</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2 pt-4 border-t border-gray-200">
            <button
              onClick={onOpenWorkspace}
              className="w-full bg-gradient-to-r from-[#FF5C00] to-[#FF8000] text-black font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#FF5C00]/25 hover:scale-105 transition-all cursor-pointer"
            >
              <span>Launch Web Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="block text-[10px] text-center text-gray-500 font-mono">Instant Access • No Install</span>
          </div>
        </div>

        {/* MOBILE WEB CARD */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-6 flex flex-col justify-between hover:border-[#FF5C00]/50 transition-colors">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-900 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 mb-1">
                AVAILABLE NOW
              </div>
              <h3 className="text-xl font-bold text-gray-900">Mobile Browser</h3>
              <p className="text-xs text-gray-600 mt-1">Optimized for iPhone, iPad, Android phones and tablets</p>
            </div>
            <ul className="space-y-2 text-xs text-gray-700 font-sans">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Touch-friendly progress log & voting controls</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Camera uploads directly from phone browser</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>PWA capability (Add to Home Screen)</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2 pt-4 border-t border-gray-200">
            <button
              onClick={onOpenWorkspace}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-gray-300 shadow-sm"
            >
              <span>Open on Mobile Browser</span>
              <ArrowRight className="w-4 h-4 text-[#FF5C00]" />
            </button>
            <span className="block text-[10px] text-center text-gray-500 font-mono">Works on iOS & Android Safari/Chrome</span>
          </div>
        </div>

        {/* NATIVE MOBILE APPS CARD (COMING SOON) */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-6 flex flex-col justify-between opacity-85 hover:opacity-100 transition-opacity">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-300 mb-1">
                IN DEVELOPMENT
              </div>
              <h3 className="text-xl font-bold text-gray-900">Native Mobile Apps</h3>
              <p className="text-xs text-gray-600 mt-1">Dedicated iOS & Android apps launching later</p>
            </div>
            <ul className="space-y-2 text-xs text-gray-700 font-sans">
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Native iOS & Android notifications</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Offline local storage syncing</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                <span>App Store & Google Play distribution</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2 pt-4 border-t border-gray-200">
            <div className="w-full bg-gray-100 text-gray-500 font-mono py-3 px-4 rounded-xl text-xs text-center border border-gray-200">
              Coming in a Future Update
            </div>
            <span className="block text-[10px] text-center text-gray-500 font-mono">Stay tuned for release news</span>
          </div>
        </div>
      </div>

      {/* QUICK START GUIDE */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8 space-y-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#FF5C00]" />
          <span>Getting Started with the Web App</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-gray-600">
          <div className="space-y-2">
            <h4 className="font-mono font-bold text-gray-900">1. Launch Workspace</h4>
            <p>Click "Launch Web Workspace" above to immediately enter the Gonnng environment in your desktop or mobile web browser.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-mono font-bold text-gray-900">2. Create Account or Sign In</h4>
            <p>Sign up with email or use a test account to preview pre-filled creative projects and process templates instantly.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-mono font-bold text-white">3. Add to Home Screen (Optional)</h4>
            <p>On mobile devices, open your browser menu and tap "Add to Home Screen" for a full-screen app experience.</p>
          </div>
        </div>
      </div>

      {/* PLATFORM DETAILS */}
      <div className="border border-white/10 rounded-2xl overflow-hidden text-xs">
        <div className="bg-white/5 px-6 py-3 font-mono font-bold text-white border-b border-white/10">
          Platform Specs & Browser Support
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-white/70 font-mono">
          <div>
            <span className="block text-white/40 text-[10px]">WEB APP VERSION</span>
            <span className="font-bold text-white">2.4.0 Live</span>
          </div>
          <div>
            <span className="block text-white/40 text-[10px]">ACCESSIBILITY</span>
            <span className="font-bold text-white">Desktop, Tablet & Mobile</span>
          </div>
          <div>
            <span className="block text-white/40 text-[10px]">NATIVE APPS</span>
            <span className="font-bold text-purple-400">Planned for Later</span>
          </div>
          <div>
            <span className="block text-white/40 text-[10px]">SECURITY</span>
            <span className="font-bold text-emerald-400">TLS 1.3 Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};
