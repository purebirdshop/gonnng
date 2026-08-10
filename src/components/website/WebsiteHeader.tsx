import React from 'react';
import { Sparkles, Download, HelpCircle, Mail, LogIn, ArrowRight, Shield, FileText, CheckCircle } from 'lucide-react';
import { isAuthFeatureEnabled, UserSession } from '../../services/authService';
import { GonnngGIcon, GonnngGLogo } from '../GonnngLogo';

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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 lg:px-8 py-3.5 transition-all relative shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 relative">
        {/* Brand Logo */}
        <button 
          onClick={() => onNavigate('home')} 
          className="flex items-center group text-left focus:outline-none cursor-pointer"
        >
          {/* Mobile & Tablet Layout Logo (Gonnng G Icon) */}
          <div className="lg:hidden flex items-center justify-center group-hover:scale-105 transition-transform">
            <GonnngGIcon className="w-8 h-8" />
          </div>

          {/* Desktop Layout Logo (Gonnng G Logo with text built-in) */}
          <div className="hidden lg:flex items-center justify-center group-hover:scale-105 transition-transform">
            <GonnngGLogo />
          </div>
        </button>

        {/* Desktop Primary Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-full border border-gray-200 md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-10">
          <button
            onClick={() => onNavigate('home')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              currentTab === 'home'
                ? 'bg-[#F59E0B] text-black font-bold shadow-md'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/80'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('download')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              currentTab === 'download'
                ? 'bg-[#F59E0B] text-black font-bold shadow-md'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/80'
            }`}
          >
            Web App
          </button>
          <button
            onClick={() => onNavigate('support')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              currentTab === 'support'
                ? 'bg-[#F59E0B] text-black font-bold shadow-md'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/80'
            }`}
          >
            Support
          </button>
          <button
            onClick={() => onNavigate('contact')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              currentTab === 'contact'
                ? 'bg-[#F59E0B] text-black font-bold shadow-md'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/80'
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
                className="bg-gradient-to-r from-[#F59E0B] to-[#FF8000] hover:from-[#ff6b1a] hover:to-[#ff8f1a] text-black px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-[#F59E0B]/20 flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Launch</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={onLogout}
                className="text-xs font-medium text-gray-600 hover:text-gray-900 px-2.5 py-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('login')}
                className="text-xs font-semibold text-gray-700 hover:text-gray-900 px-3.5 py-2 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
              <button
                onClick={() => onNavigate('register')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span className="hidden sm:inline">Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Subnav */}
      <div className="flex md:hidden items-center justify-around mt-2.5 pt-2 border-t border-gray-200 text-[11px] font-medium text-gray-600">
        <button 
          onClick={() => onNavigate('home')} 
          className={`px-2 py-1 cursor-pointer ${currentTab === 'home' ? 'text-[#F59E0B] font-bold' : ''}`}
        >
          Home
        </button>
        <button 
          onClick={() => onNavigate('download')} 
          className={`px-2 py-1 cursor-pointer ${currentTab === 'download' ? 'text-[#F59E0B] font-bold' : ''}`}
        >
          Download
        </button>
        <button 
          onClick={() => onNavigate('support')} 
          className={`px-2 py-1 cursor-pointer ${currentTab === 'support' ? 'text-[#F59E0B] font-bold' : ''}`}
        >
          Support
        </button>
        <button 
          onClick={() => onNavigate('contact')} 
          className={`px-2 py-1 cursor-pointer ${currentTab === 'contact' ? 'text-[#F59E0B] font-bold' : ''}`}
        >
          Contact
        </button>
      </div>
    </header>
  );
};
