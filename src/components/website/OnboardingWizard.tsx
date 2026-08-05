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
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8 text-gray-900">
      {/* PROGRESS STEPPER */}
      <div className="flex items-center justify-between text-xs font-mono text-gray-500 border-b border-gray-200 pb-4">
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
            <h2 className="text-2xl font-extrabold text-gray-900">Welcome, {user.name}!</h2>
            <p className="text-xs sm:text-sm text-gray-600">
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
                  className={`p-4 rounded-2xl border text-left transition-all space-y-2 cursor-pointer ${
                    isSelected
                      ? 'bg-orange-50 border-[#FF5C00] text-gray-900 shadow-sm'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-[#FF5C00]' : 'text-gray-400'}`} />
                    {isSelected && <Check className="w-4 h-4 text-[#FF5C00]" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">{type.label}</h3>
                    <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{type.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full bg-gradient-to-r from-[#FF5C00] to-[#FF8000] text-black py-3.5 rounded-xl text-xs font-bold shadow-lg shadow-[#FF5C00]/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all cursor-pointer"
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
            <h2 className="text-2xl font-extrabold text-gray-900">What are you working on right now?</h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Describe a key project or idea you want to complete this month.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-700 font-mono">My Current Focus Goal</label>
            <input
              type="text"
              value={mainGoal}
              onChange={(e) => setMainGoal(e.target.value)}
              placeholder="e.g. Paint 3 oil landscapes / Complete Sourdough Batch #5 / Launch portfolio"
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#FF5C00]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setStep(1)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-mono text-xs py-3 rounded-xl border border-gray-300 transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="bg-gradient-to-r from-[#FF5C00] to-[#FF8000] text-black py-3 rounded-xl text-xs font-bold shadow-lg shadow-[#FF5C00]/20 flex items-center justify-center gap-2 cursor-pointer"
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
            <h2 className="text-2xl font-extrabold text-gray-900">Select Your Starter Recipe</h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Recipes break your ideas into achievable steps with estimated phases. You can customize this anytime.
            </p>
          </div>

          <div className="space-y-3">
            <div 
              onClick={() => setSelectedRecipe('recipe-sandwich')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedRecipe === 'recipe-sandwich' 
                  ? 'bg-orange-50 border-[#FF5C00] text-gray-900 shadow-sm' 
                  : 'bg-white border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50'
              }`}
            >
              <h3 className="text-sm font-bold text-gray-900">🥪 Make a Sandwich (Universal Starter)</h3>
              <p className="text-xs text-gray-600 mt-1">The foundational 2-phase onboarding recipe for gathering ingredients and assembling Toast & Crisp fillings.</p>
            </div>

            <div 
              onClick={() => setSelectedRecipe('recipe-paint')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedRecipe === 'recipe-paint' 
                  ? 'bg-orange-50 border-[#FF5C00] text-gray-900 shadow-sm' 
                  : 'bg-white border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50'
              }`}
            >
              <h3 className="text-sm font-bold text-gray-900">🎨 Paint an Oil Canvas Masterpiece</h3>
              <p className="text-xs text-gray-600 mt-1">Conception, thumbnail sketching, impasto glazing, and exhibition framing.</p>
            </div>
          </div>

          <button
            onClick={handleFinish}
            className="w-full bg-gradient-to-r from-[#FF5C00] to-[#FF8000] text-black py-3.5 rounded-xl text-xs font-bold shadow-xl shadow-[#FF5C00]/25 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Launch My Gonnng Workspace</span>
          </button>
        </div>
      )}
    </div>
  );
};
