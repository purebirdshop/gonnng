import React, { useState } from 'react';
import { 
  Sparkles, Palette, BookOpen, Code, Hammer, Flame, 
  Rocket, ArrowRight, Check, Layers, Target, CheckCircle2 
} from 'lucide-react';
import { authService, UserSession } from '../../services/authService';

interface OnboardingWizardProps {
  user: UserSession;
  onComplete: () => void;
}

const CREATOR_TYPES = [
  { id: 'artist', label: 'Artist & Painter', icon: Palette, desc: 'Oil canvas, digital art, illustration & prints' },
  { id: 'writer', label: 'Writer & Author', icon: BookOpen, desc: 'Novels, screenplays, essays & newsletter series' },
  { id: 'developer', label: 'Developer & Hacker', icon: Code, desc: 'Web apps, open source, game dev & AI prototypes' },
  { id: 'maker', label: 'Maker & Craftsman', icon: Hammer, desc: 'Woodworking, 3D printing, electronics & physical builds' },
  { id: 'chef', label: 'Chef & Culinary', icon: Flame, desc: 'Sourdough, pastry, recipe development & fermentation' },
  { id: 'entrepreneur', label: 'Founder & Entrepreneur', icon: Rocket, desc: 'Product launches, campaigns & business milestones' }
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState('artist');
  const [mainGoal, setMainGoal] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState('recipe-sandwich');

  const handleFinish = () => {
    authService.completeOnboarding();
    onComplete();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      {/* PROGRESS STEPPER */}
      <div className="flex items-center justify-between text-xs font-mono text-white/50 border-b border-white/10 pb-4">
        <span className="flex items-center gap-1.5 text-[#FF5C00] font-bold">
          <Sparkles className="w-4 h-4" />
          <span>Creator Onboarding Setup</span>
        </span>
        <span>Step {step} of 3</span>
      </div>

      {/* STEP 1: CREATOR PERSONA */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white">Welcome, {user.name}!</h2>
            <p className="text-xs sm:text-sm text-white/70">
              What kind of creator best describes your work? We will tailor your workspace templates accordingly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CREATOR_TYPES.map(type => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-4 rounded-2xl border text-left transition-all space-y-2 ${
                    isSelected
                      ? 'bg-[#FF5C00]/20 border-[#FF5C00] text-white shadow-lg shadow-[#FF5C00]/10'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-[#FF5C00]' : 'text-white/60'}`} />
                    {isSelected && <Check className="w-4 h-4 text-[#FF5C00]" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{type.label}</h3>
                    <p className="text-[11px] text-white/50 leading-tight mt-0.5">{type.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full bg-gradient-to-r from-[#FF5C00] to-[#FF8000] text-white py-3.5 rounded-xl text-xs font-bold shadow-lg shadow-[#FF5C00]/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all"
          >
            <span>Continue to Goals</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 2: PRIMARY CREATIVE GOAL */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white">What are you working on right now?</h2>
            <p className="text-xs sm:text-sm text-white/70">
              Describe a key project or idea you want to complete this month.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-white/70 font-mono">My Current Focus Goal</label>
            <input
              type="text"
              value={mainGoal}
              onChange={(e) => setMainGoal(e.target.value)}
              placeholder="e.g. Paint 3 oil landscapes / Complete Sourdough Batch #5 / Launch portfolio"
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF5C00]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setStep(1)}
              className="bg-white/5 hover:bg-white/10 text-white font-mono text-xs py-3 rounded-xl border border-white/10 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="bg-gradient-to-r from-[#FF5C00] to-[#FF8000] text-white py-3 rounded-xl text-xs font-bold shadow-lg shadow-[#FF5C00]/20 flex items-center justify-center gap-2"
            >
              <span>Next: Pick Blueprint</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: FIRST RECIPE & WORKSPACE LAUNCH */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white">Select Your Starter Recipe</h2>
            <p className="text-xs sm:text-sm text-white/70">
              Recipes break your ideas into achievable steps with estimated phases. You can customize this anytime.
            </p>
          </div>

          <div className="space-y-3">
            <div 
              onClick={() => setSelectedRecipe('recipe-sandwich')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedRecipe === 'recipe-sandwich' 
                  ? 'bg-[#FF5C00]/20 border-[#FF5C00] text-white' 
                  : 'bg-white/5 border-white/10 text-white/70'
              }`}
            >
              <h3 className="text-sm font-bold text-white">🥪 Make a Sandwich (Universal Starter)</h3>
              <p className="text-xs text-white/60 mt-1">The foundational 2-phase onboarding recipe for gathering ingredients and assembling Toast & Crisp fillings.</p>
            </div>

            <div 
              onClick={() => setSelectedRecipe('recipe-paint')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedRecipe === 'recipe-paint' 
                  ? 'bg-[#FF5C00]/20 border-[#FF5C00] text-white' 
                  : 'bg-white/5 border-white/10 text-white/70'
              }`}
            >
              <h3 className="text-sm font-bold text-white">🎨 Paint an Oil Canvas Masterpiece</h3>
              <p className="text-xs text-white/60 mt-1">Conception, thumbnail sketching, impasto glazing, and exhibition framing.</p>
            </div>
          </div>

          <button
            onClick={handleFinish}
            className="w-full bg-gradient-to-r from-[#FF5C00] to-[#FF8000] text-white py-3.5 rounded-xl text-xs font-bold shadow-xl shadow-[#FF5C00]/25 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Launch My Gonnng Workspace</span>
          </button>
        </div>
      )}
    </div>
  );
};
