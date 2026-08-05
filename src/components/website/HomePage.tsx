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
    <div className="space-y-24 py-8 lg:py-16 text-gray-900">
      {/* HERO SECTION */}
      <section className="px-4 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 bg-[#FF5C00]/10 border border-[#FF5C00]/30 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-[#FF5C00]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gonnng Creative Productivity System v2.4</span>
            </div>

            <h1 className="text-6xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[0.75]">
              Your ideas
            </h1>
            <h2 className="text-4xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.1]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5C00] via-[#FF8000] to-[#FFB000]">deserve to get done.</span>
            </h2>

            <p className="text-base sm:text-lg text-gray-600 leading-relaxed font-sans max-w-2xl">
              Gonnng helps artists, writers, builders, and dreamers break ambitious creative projects into achievable steps, track progress, and celebrate every finished milestone.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onOpenWorkspace}
                className="bg-gradient-to-r from-[#FF5C00] to-[#FF8000] hover:from-[#ff6b1a] hover:to-[#ff8f1a] text-black px-6 py-3.5 rounded-xl text-sm font-bold transition-all shadow-xl shadow-[#FF5C00]/25 flex items-center gap-2 group cursor-pointer"
              >
                <span>Launch Web Workspace</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('download')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#FF5C00]" />
                <span>Web App Features</span>
              </button>
            </div>

            <div className="pt-6 border-t border-gray-200 flex items-center gap-6 text-xs text-gray-500 font-mono">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Desktop & Mobile Browsers
              </span>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FF5C00] to-[#FF8000] rounded-3xl blur-2xl opacity-15 animate-pulse"></div>
            <div className="relative bg-white border border-gray-200 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <span className="text-[10px] font-mono text-gray-400">Gonnng Project Tracker</span>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between text-xs text-gray-900 font-bold">
                    <span>Wild Yeast Sourdough Batch #42</span>
                    <span className="text-[#FF5C00] font-mono">85% Complete</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-[#FF5C00] to-[#FF8000] h-full w-[85%] rounded-full"></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="line-through text-gray-400">Build sourdough starter (Day 1-7)</span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="line-through text-gray-400">4.5hr fermentation at 26°C</span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-[#FF5C00]/10 border border-[#FF5C00]/30 p-2.5 rounded-lg text-xs font-semibold text-gray-900">
                    <Flame className="w-4 h-4 text-[#FF5C00] shrink-0 animate-bounce" />
                    <span>Bake in Dutch Oven at 245°C (30 mins)</span>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <span className="text-[10px] font-mono text-gray-400">🔔 Gong Sound Ringing Upon Completion!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT IS GONNNG SECTION */}
      <section className="px-4 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-3xl p-8 lg:p-12 space-y-12 shadow-sm">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-xs font-mono font-bold text-[#FF5C00] uppercase tracking-wider">The Problem & Solution</h2>
            <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Why do 80% of creative projects stay unfinished?
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed font-sans">
              Too many ideas, vague steps, and lack of visual momentum cause makers to abandon brilliant projects halfway through. Gonnng fixes this forever.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Problem Box */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-mono font-bold text-red-700 uppercase tracking-wider flex items-center gap-2">
                <span>⚠️</span> The Struggle Without Gonnng
              </h4>
              <ul className="space-y-3 text-xs text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">✕</span>
                  <span>Endless notebook pages of half-baked ideas with no concrete execution plan.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">✕</span>
                  <span>Overwhelmed by giant, intimidating goals ("Write a book", "Build an app").</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">✕</span>
                  <span>No clear record of creative history or proof of progress when motivation dips.</span>
                </li>
              </ul>
            </div>

            {/* Solution Box */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-mono font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
                <span>✨</span> The Gonnng Solution
              </h4>
              <ul className="space-y-3 text-xs text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Turn ideas into structured, reusable <strong>Recipes</strong> with time & phase estimations.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Break projects into clear bite-sized tasks that feel effortless to complete.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
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
          <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">How Gonnng Powers Your Workflow</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-3 text-left hover:border-[#FF5C00]/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/15 text-[#FF5C00] border border-[#FF5C00]/30 flex items-center justify-center font-mono font-bold text-lg">
              1
            </div>
            <h4 className="text-base font-bold text-gray-900">Capture</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Save your raw ideas, sketches, and creative impulses into project scratchpads before they fade away.
            </p>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-3 text-left hover:border-[#FF5C00]/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/15 text-[#FF5C00] border border-[#FF5C00]/30 flex items-center justify-center font-mono font-bold text-lg">
              2
            </div>
            <h4 className="text-base font-bold text-gray-900">Plan</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Convert raw concepts into step-by-step Recipes with clear phases, time estimates, and budget limits.
            </p>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-3 text-left hover:border-[#FF5C00]/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/15 text-[#FF5C00] border border-[#FF5C00]/30 flex items-center justify-center font-mono font-bold text-lg">
              3
            </div>
            <h4 className="text-base font-bold text-gray-900">Create</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Execute tasks one by one, attach progress photos, and log updates to your private or public circle.
            </p>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-3 text-left hover:border-[#FF5C00]/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#FF5C00]/15 text-[#FF5C00] border border-[#FF5C00]/30 flex items-center justify-center font-mono font-bold text-lg">
              4
            </div>
            <h4 className="text-base font-bold text-gray-900">Celebrate</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Ring the Gong upon completion, earn community feedback, and archive your finished creation forever.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURE HIGHLIGHTS */}
      <section className="px-4 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-xs font-mono font-bold text-[#FF5C00] uppercase tracking-wider">Features</h2>
          <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">Built specifically for creative minds</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-3">
            <Layers className="w-6 h-6 text-[#FF5C00]" />
            <h4 className="text-base font-bold text-gray-900">Creative Recipes</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Repeatable, customizable blueprints for writing, painting, baking, coding, or building physical artifacts.
            </p>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-3">
            <Target className="w-6 h-6 text-[#FF5C00]" />
            <h4 className="text-base font-bold text-gray-900">Collections & Focus Areas</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Group related projects into seasonal collections with deadlines, budget caps, and work modes.
            </p>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-3">
            <Users className="w-6 h-6 text-[#FF5C00]" />
            <h4 className="text-base font-bold text-gray-900">Circle Accountability</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Share progress logs privately with mutual circle members or publicly for feedback and encouragement.
            </p>
          </div>
        </div>
      </section>

      {/* AUDIENCE SECTION */}
      <section className="px-4 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        <h3 className="text-2xl font-bold text-gray-900">Who uses Gonnng?</h3>
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
              <div key={idx} className="bg-white border border-gray-200 shadow-sm px-4 py-2.5 rounded-full flex items-center gap-2 text-xs text-gray-800 font-medium">
                <Icon className="w-4 h-4 text-[#FF5C00]" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="px-4 lg:px-8 max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-br from-[#FF5C00]/15 via-orange-50 to-white border border-[#FF5C00]/30 rounded-3xl p-10 space-y-6 shadow-sm">
          <h3 className="text-3xl font-extrabold text-gray-900">Ready to finish your next big idea?</h3>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            Join thousands of creators using Gonnng to organize their creative life and build momentum every single day.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={onOpenWorkspace}
              className="bg-gradient-to-r from-[#FF5C00] to-[#FF8000] text-black px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-[#FF5C00]/25 hover:scale-105 transition-all cursor-pointer"
            >
              Launch Web App
            </button>
            <button
              onClick={() => onNavigate('download')}
              className="bg-white text-gray-900 border border-gray-300 px-6 py-3.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
            >
              Explore Web Features
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
