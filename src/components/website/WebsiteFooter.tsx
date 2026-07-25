import React from 'react';
import { Download, HelpCircle, Mail, Shield, FileText, Github, Twitter, Disc as Discord, ArrowUpRight } from 'lucide-react';

interface WebsiteFooterProps {
  onNavigate: (tab: string) => void;
  onOpenWorkspace: () => void;
}

export const WebsiteFooter: React.FC<WebsiteFooterProps> = ({ onNavigate, onOpenWorkspace }) => {
  return (
    <footer className="bg-[#08080a] border-t border-white/10 text-white/70 py-12 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
        {/* Brand Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF5C00] to-[#FF8000] flex items-center justify-center text-white font-mono font-black text-lg shadow-md shadow-[#FF5C00]/20">
              G
            </div>
            <span className="font-mono font-bold text-xl text-white tracking-tight">Gonnng</span>
          </div>
          <p className="text-xs text-white/60 leading-relaxed max-w-sm">
            Turn your creative ideas into finished masterpieces. Gonnng helps artists, writers, developers, and builders break big goals into achievable steps and celebrate completion.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a href="#twitter" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#github" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors">
              <Github className="w-4 h-4" />
            </a>
            <a href="#discord" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors">
              <Discord className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Product Navigation */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Product</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors">Home</button>
            </li>
            <li>
              <button onClick={() => onNavigate('download')} className="hover:text-white transition-colors">Web App Overview</button>
            </li>
            <li>
              <button onClick={onOpenWorkspace} className="text-[#FF5C00] font-semibold hover:underline flex items-center gap-1">
                <span>Web Workspace</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('login')} className="hover:text-white transition-colors">Login / Register</button>
            </li>
          </ul>
        </div>

        {/* Support & Resources */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Resources</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => onNavigate('support')} className="hover:text-white transition-colors">Help Center & FAQ</button>
            </li>
            <li>
              <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">Contact Support</button>
            </li>
            <li>
              <a href="#guides" onClick={(e) => { e.preventDefault(); onNavigate('support'); }} className="hover:text-white transition-colors">Recipe Creation Guides</a>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Legal</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => onNavigate('privacy')} className="hover:text-white transition-colors flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span>Privacy Policy</span>
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('terms')} className="hover:text-white transition-colors flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-blue-400" />
                <span>Terms of Service</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/40 font-mono">
        <p>© {new Date().getFullYear()} Gonnng Inc. All rights reserved. Built for creators.</p>
        <p className="flex items-center gap-2">
          <span>Status: All Systems Operational</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
        </p>
      </div>
    </footer>
  );
};
