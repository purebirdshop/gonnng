import React from 'react';
import { Sparkles, Download, HelpCircle, Mail, LogIn, ArrowRight, Shield, FileText, CheckCircle } from 'lucide-react';
import { isAuthFeatureEnabled, UserSession } from '../../services/authService';

interface WebsiteHeaderProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  currentUser: UserSession | null;
  onLogout: () => void;
  onOpenWorkspace: () => void;
}

export const WebsiteHeader: React.FC<WebsiteHeaderProps> = ({
  currentTab,
  onNavigate,
  currentUser,
  onLogout,
  onOpenWorkspace
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0c0c0e]/90 backdrop-blur-md border-b border-white/10 px-4 lg:px-8 py-3.5 transition-all relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 relative">
        {/* Brand Logo */}
        <button 
          onClick={() => onNavigate('home')} 
          className="flex items-center gap-2.5 group text-left focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF5C00] to-[#FF8000] flex items-center justify-center text-white shadow-lg shadow-[#FF5C00]/20 group-hover:scale-105 transition-transform">
            <span className="font-mono text-xl font-black tracking-tighter">G</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-lg text-white tracking-tight">Gonnng</span>
              <span className="text-[10px] font-mono font-bold bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30 px-1.5 py-0.5 rounded-md">
                v2.4
              </span>
            </div>
            <p className="text-[10px] text-white/50 font-mono hidden sm:block">Finish what you start</p>
          </div>
        </button>

        {/* Desktop Primary Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-10">
          <button
            onClick={() => onNavigate('home')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              currentTab === 'home'
                ? 'bg-[#FF5C00] text-white font-bold shadow-md shadow-[#FF5C00]/20'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('download')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              currentTab === 'download'
                ? 'bg-[#FF5C00] text-white font-bold shadow-md shadow-[#FF5C00]/20'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Web App
          </button>
          <button
            onClick={() => onNavigate('support')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              currentTab === 'support'
                ? 'bg-[#FF5C00] text-white font-bold shadow-md shadow-[#FF5C00]/20'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Support
          </button>
          <button
            onClick={() => onNavigate('contact')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              currentTab === 'contact'
                ? 'bg-[#FF5C00] text-white font-bold shadow-md shadow-[#FF5C00]/20'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Contact
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenWorkspace}
                className="bg-gradient-to-r from-[#FF5C00] to-[#FF8000] hover:from-[#ff6b1a] hover:to-[#ff8f1a] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-[#FF5C00]/20 flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Launch</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={onLogout}
                className="text-xs font-medium text-white/50 hover:text-white/90 px-2.5 py-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('login')}
                className="text-xs font-semibold text-white/80 hover:text-white px-3.5 py-2 hover:bg-white/5 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
              <button
                onClick={onOpenWorkspace}
                className="bg-white/10 hover:bg-white/15 text-white border border-white/20 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FF5C00]" />
                <span className="hidden sm:inline">Try Demo App</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Subnav */}
      <div className="flex md:hidden items-center justify-around mt-2.5 pt-2 border-t border-white/10 text-[11px] font-medium text-white/70">
        <button 
          onClick={() => onNavigate('home')} 
          className={`px-2 py-1 ${currentTab === 'home' ? 'text-[#FF5C00] font-bold' : ''}`}
        >
          Home
        </button>
        <button 
          onClick={() => onNavigate('download')} 
          className={`px-2 py-1 ${currentTab === 'download' ? 'text-[#FF5C00] font-bold' : ''}`}
        >
          Download
        </button>
        <button 
          onClick={() => onNavigate('support')} 
          className={`px-2 py-1 ${currentTab === 'support' ? 'text-[#FF5C00] font-bold' : ''}`}
        >
          Support
        </button>
        <button 
          onClick={() => onNavigate('contact')} 
          className={`px-2 py-1 ${currentTab === 'contact' ? 'text-[#FF5C00] font-bold' : ''}`}
        >
          Contact
        </button>
      </div>
    </header>
  );
};
