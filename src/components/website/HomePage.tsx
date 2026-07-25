import React from 'react';
import { 
  Sparkles, Download, ArrowRight, CheckCircle2, Flame, 
  Layers, Code, Palette, BookOpen, Hammer, Rocket, Trophy, 
  Users, Repeat, Clock, Target, ShieldCheck, HeartHandshake
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (tab: string) => void;
  onOpenWorkspace: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenWorkspace }) => {
  return (
    <div className="space-y-24 py-8 lg:py-16">
      {/* HERO SECTION */}
      <section className="px-4 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 bg-[#FF5C00]/10 border border-[#FF5C00]/30 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-[#FF5C00]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gonnng Creative Productivity System v2.4</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
              Turn your ideas into <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5C00] via-[#FF8000] to-[#FFB000]">finished creations.</span>
            </h1>

            <p className="text-base sm:text-lg text-white/70 leading-relaxed font-sans max-w-2xl">
              Gonnng helps artists, writers, builders, and dreamers break ambitious creative projects into achievable steps, track progress, and celebrate every finished milestone.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onOpenWorkspace}
                className="bg-gradient-to-r from-[#FF5C00] to-[#FF8000] hover:from-[#ff6b1a] hover:to-[#ff8f1a] text-white px-6 py-3.5 rounded-xl text-sm font-bold transition-all shadow-xl shadow-[#FF5C00]/25 flex items-center gap-2 group cursor-pointer"
              >
                <span>Launch Web Workspace</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('download')}
                className="bg-white/10 hover:bg-white/15 text-white border border-white/20 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#FF5C00]" />
                <span>Web App Features</span>
              </button>
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center gap-6 text-xs text-white/60 font-mono">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Desktop & Mobile Browsers
              </span>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FF5C00] to-[#FF8000] rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative bg-[#141418] border border-white/15 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <span className="text-[10px] font-mono text-white/40">Gonnng Project Tracker</span>
              </div>

              <div className="space-y-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between text-xs text-white font-bold">
                    <span>Wild Yeast Sourdough Batch #42</span>
                    <span className="text-[#FF5C00] font-mono">85% Complete</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-[#FF5C00] to-[#FF8000] h-full w-[85%] rounded-full"></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 bg-white/5 p-2.5 rounded-lg border border-white/5 text-xs text-white/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="line-through text-white/50">Build sourdough starter (Day 1-7)</span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-white/5 p-2.5 rounded-lg border border-white/5 text-xs text-white/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="line-through text-white/50">4.5hr fermentation at 26°C</span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-[#FF5C00]/10 border border-[#FF5C00]/30 p-2.5 rounded-lg text-xs font-semibold text-white">
                    <Flame className="w-4 h-4 text-[#FF5C00] shrink-0 animate-bounce" />
                    <span>Bake in Dutch Oven at 245°C (30 mins)</span>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <span className="text-[10px] font-mono text-white/40">🔔 Gong Sound Ringing Upon Completion!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT IS GONNNG SECTION */}
      <section className="px-4 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-8 lg:p-12 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-xs font-mono font-bold text-[#FF5C00] uppercase tracking-wider">The Problem & Solution</h2>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              Why do 80% of creative projects stay unfinished?
            </h3>
            <p className="text-sm text-white/70 leading-relaxed font-sans">
              Too many ideas, vague steps, and lack of visual momentum cause makers to abandon brilliant projects halfway through. Gonnng fixes this forever.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Problem Box */}
            <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-mono font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                <span>⚠️</span> The Struggle Without Gonnng
              </h4>
              <ul className="space-y-3 text-xs text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Endless notebook pages of half-baked ideas with no concrete execution plan.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Overwhelmed by giant, intimidating goals ("Write a book", "Build an app").</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>No clear record of creative history or proof of progress when motivation dips.</span>
                </li>
              </ul>
            </div>

            {/* Solution Box */}
            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <span>✨</span> The Gonnng Solution
              </h4>
              <ul className="space-y-3 text-xs text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Turn ideas into structured, reusable <strong>Recipes</strong> with time & phase estimations.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Break projects into clear bite-sized tasks that feel effortless to complete.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Log progress photos, celebrate with gongs, and build a proud completion history.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="px-4 lg:px-8 max-w-7xl mx-auto space-y-12 text-center">
        <div className="space-y-3">
          <h2 className="text-xs font-mono font-bold text-[#FF5C00] uppercase tracking-wider">Four Simple Steps</h2>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">How Gonnng Powers Your Workflow</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3 text-left hover:border-[#FF5C00]/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30 flex items-center justify-center font-mono font-bold text-lg">
              1
            </div>
            <h4 className="text-base font-bold text-white">Capture</h4>
            <p className="text-xs text-white/60 leading-relaxed">
              Save your raw ideas, sketches, and creative impulses into project scratchpads before they fade away.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3 text-left hover:border-[#FF5C00]/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30 flex items-center justify-center font-mono font-bold text-lg">
              2
            </div>
            <h4 className="text-base font-bold text-white">Plan</h4>
            <p className="text-xs text-white/60 leading-relaxed">
              Convert raw concepts into step-by-step Recipes with clear phases, time estimates, and budget limits.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3 text-left hover:border-[#FF5C00]/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30 flex items-center justify-center font-mono font-bold text-lg">
              3
            </div>
            <h4 className="text-base font-bold text-white">Create</h4>
            <p className="text-xs text-white/60 leading-relaxed">
              Execute tasks one by one, attach progress photos, and log updates to your private or public circle.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3 text-left hover:border-[#FF5C00]/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30 flex items-center justify-center font-mono font-bold text-lg">
              4
            </div>
            <h4 className="text-base font-bold text-white">Celebrate</h4>
            <p className="text-xs text-white/60 leading-relaxed">
              Ring the Gong upon completion, earn community feedback, and archive your finished creation forever.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURE HIGHLIGHTS */}
      <section className="px-4 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-xs font-mono font-bold text-[#FF5C00] uppercase tracking-wider">Features</h2>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">Built specifically for creative minds</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <Layers className="w-6 h-6 text-[#FF5C00]" />
            <h4 className="text-base font-bold text-white">Creative Recipes</h4>
            <p className="text-xs text-white/60 leading-relaxed">
              Repeatable, customizable blueprints for writing, painting, baking, coding, or building physical artifacts.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <Target className="w-6 h-6 text-[#FF5C00]" />
            <h4 className="text-base font-bold text-white">Collections & Focus Areas</h4>
            <p className="text-xs text-white/60 leading-relaxed">
              Group related projects into seasonal collections with deadlines, budget caps, and work modes.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <Users className="w-6 h-6 text-[#FF5C00]" />
            <h4 className="text-base font-bold text-white">Circle Accountability</h4>
            <p className="text-xs text-white/60 leading-relaxed">
              Share progress logs privately with mutual circle members or publicly for feedback and encouragement.
            </p>
          </div>
        </div>
      </section>

      {/* AUDIENCE SECTION */}
      <section className="px-4 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        <h3 className="text-2xl font-bold text-white">Who uses Gonnng?</h3>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: Palette, label: 'Artists & Illustrators' },
            { icon: BookOpen, label: 'Writers & Authors' },
            { icon: Code, label: 'Developers & Hackers' },
            { icon: Hammer, label: 'Woodworkers & Makers' },
            { icon: Flame, label: 'Chefs & Culinary Creators' },
            { icon: Rocket, label: 'Founders & Entrepreneurs' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-full flex items-center gap-2 text-xs text-white font-medium">
                <Icon className="w-4 h-4 text-[#FF5C00]" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="px-4 lg:px-8 max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-br from-[#FF5C00]/20 via-[#FF8000]/10 to-transparent border border-[#FF5C00]/30 rounded-3xl p-10 space-y-6">
          <h3 className="text-3xl font-extrabold text-white">Ready to finish your next big idea?</h3>
          <p className="text-sm text-white/70 max-w-xl mx-auto">
            Join thousands of creators using Gonnng to organize their creative life and build momentum every single day.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={onOpenWorkspace}
              className="bg-gradient-to-r from-[#FF5C00] to-[#FF8000] text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-[#FF5C00]/25 hover:scale-105 transition-all cursor-pointer"
            >
              Launch Web App
            </button>
            <button
              onClick={() => onNavigate('download')}
              className="bg-white/10 text-white border border-white/20 px-6 py-3.5 rounded-xl text-sm font-semibold hover:bg-white/15 transition-all cursor-pointer"
            >
              Explore Web Features
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
