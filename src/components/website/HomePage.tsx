import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Download, ArrowRight, CheckCircle2, Flame, 
  Layers, Code, Palette, BookOpen, Hammer, Rocket, Trophy, 
  Users, Repeat, Clock, Target, ShieldCheck, HeartHandshake
} from 'lucide-react';
import { Recipe } from '../../types';
import { dataService } from '../../services/dataService';
import { getCategoryColorCollection } from '../../utils/categoryColors';
import { RecipePromoBlock } from './RecipePromoBlock';
import { RecipeExploreModal } from '../ExploreModals';

interface HomePageProps {
  onNavigate: (tab: string) => void;
  onOpenWorkspace: () => void;
  recipes?: Recipe[];
}

const DEFAULT_PUBLIC_RECIPES: Recipe[] = [
  { id: 'def-1', title: 'Bake Wild Sourdough Bread', description: '', authorId: 'gonnng', authorName: 'Gonnng Studio', category: 'Baking & Culinary Arts', tags: [], visibility: 'public', phases: [] },
  { id: 'def-2', title: 'Build a Custom Teak Bench', description: '', authorId: 'gonnng', authorName: 'Gonnng Studio', category: 'Woodworking & Joinery', tags: [], visibility: 'public', phases: [] },
  { id: 'def-3', title: 'Write a Sci-Fi Novella', description: '', authorId: 'gonnng', authorName: 'Gonnng Studio', category: 'Writing & Storytelling', tags: [], visibility: 'public', phases: [] },
  { id: 'def-4', title: 'Design a Minimalist Keyboard', description: '', authorId: 'gonnng', authorName: 'Gonnng Studio', category: 'Technology & Code', tags: [], visibility: 'public', phases: [] },
  { id: 'def-5', title: 'Craft Hand-Poured Soy Candles', description: '', authorId: 'gonnng', authorName: 'Gonnng Studio', category: 'Crafts & Handmade', tags: [], visibility: 'public', phases: [] },
  { id: 'def-6', title: 'Record a 4-Track Indie EP', description: '', authorId: 'gonnng', authorName: 'Gonnng Studio', category: 'Music & Audio', tags: [], visibility: 'public', phases: [] },
  { id: 'def-7', title: 'Launch a Full-Stack Web App', description: '', authorId: 'gonnng', authorName: 'Gonnng Studio', category: 'Technology & Code', tags: [], visibility: 'public', phases: [] }
];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenWorkspace, recipes: propRecipes }) => {
  const [loadedRecipes, setLoadedRecipes] = useState<Recipe[]>(propRecipes || []);
  const [selectedPromoRecipe, setSelectedPromoRecipe] = useState<Recipe | null>(null);
  const [savedRecipeIds, setSavedRecipeIds] = useState<string[]>([]);

  useEffect(() => {
    if (propRecipes && propRecipes.length > 0) {
      setLoadedRecipes(propRecipes);
    } else {
      dataService.getRecipes().then(r => {
        if (r && r.length > 0) {
          setLoadedRecipes(r);
        }
      });
    }
  }, [propRecipes]);

  const handleToggleSaveRecipe = (recipeId: string, _recipeObj?: Recipe) => {
    setSavedRecipeIds(prev => 
      prev.includes(recipeId) ? prev.filter(id => id !== recipeId) : [...prev, recipeId]
    );
  };

  const handleStartProjectFromPromo = (_recipe: Recipe) => {
    setSelectedPromoRecipe(null);
    onNavigate('register');
  };

  // Extract public recipes
  const publicRecipes = loadedRecipes.filter(r => (r.visibility ?? 'public') === 'public');
  const activeRecipes = publicRecipes.length > 0 ? publicRecipes : DEFAULT_PUBLIC_RECIPES;

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activeRecipes.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (activeRecipes.length <= 1) return 0;
        let next = Math.floor(Math.random() * activeRecipes.length);
        while (next === prev && activeRecipes.length > 1) {
          next = Math.floor(Math.random() * activeRecipes.length);
        }
        return next;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [activeRecipes.length, activeRecipes]);

  const currentRecipe = activeRecipes[currentIndex % activeRecipes.length] || DEFAULT_PUBLIC_RECIPES[0];
  const currentTitle = currentRecipe?.title || 'Bake Wild Sourdough Bread';
  const colorCollection = getCategoryColorCollection(currentRecipe?.category);

  return (
    <div className="bg-white min-h-screen space-y-24 py-8 lg:py-16 text-gray-900 w-full">
      {/* HERO SECTION */}
      <section className="px-4 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 space-y-6 text-left">
            <h1 className="text-5xl sm:text-5xl lg:text-5xl xl:text-6xl font-extrabold text-gray-900 tracking-tight leading-[0.85] space-y-2">
              <span className="block">Your ideas</span>
              <span className="block text-3xl sm:text-3xl lg:text-3xl xl:text-4xl font-extrabold tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] via-[#FF8000] to-[#FFB000]">
                deserve to get done.
              </span>
            </h1>

            <div className="text-base sm:text-lg text-gray-700 leading-relaxed font-sans max-w-2xl flex flex-col sm:flex-row sm:items-center items-start gap-1.5 sm:gap-2 pt-2">
              <span className="text-lg sm:text-xl font-black uppercase tracking-wider text-gray-900 sm:mr-2">I WANT TO</span>
              <span className="inline-flex items-center overflow-hidden py-1 align-middle relative">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentRecipe?.id || currentTitle}
                    initial={{ y: 28, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -28, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      backgroundColor: colorCollection.soft,
                      borderColor: colorCollection.light,
                      color: colorCollection.dark
                    }}
                    className="inline-flex items-center gap-2 p-[6px] px-4 border rounded-[14px] shadow-sm font-bold text-sm sm:text-base font-mono tracking-tight cursor-default"
                  >
                    <Sparkles 
                      className="w-4 h-4 shrink-0" 
                      style={{ color: colorCollection.primary }} 
                    />
                    <span>{currentTitle}</span>
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('register')}
                className="bg-gradient-to-r from-[#F59E0B] to-[#FF8000] hover:from-[#ff6b1a] hover:to-[#ff8f1a] text-black px-6 py-3.5 rounded-xl text-sm font-bold transition-all shadow-xl shadow-[#F59E0B]/25 flex items-center gap-2 group cursor-pointer"
              >
                <span>Let's get started!</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Recipe Promo Block */}
          <div className="lg:col-span-7 w-full my-4 overflow-visible">
            <RecipePromoBlock
              savedRecipeIds={savedRecipeIds}
              onToggleSaveRecipe={handleToggleSaveRecipe}
              onOpenRecipeModal={(recipe) => setSelectedPromoRecipe(recipe)}
              onStartProject={handleStartProjectFromPromo}
            />
          </div>
        </div>
      </section>

      {/* WHAT IS GONNNG SECTION */}
      <section className="px-4 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-3xl p-8 lg:p-12 space-y-12 shadow-sm">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-xs font-mono font-bold text-[#F59E0B] uppercase tracking-wider">The Problem & Solution</h2>
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
          <h2 className="text-xs font-mono font-bold text-[#F59E0B] uppercase tracking-wider">Four Simple Steps</h2>
          <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">How Gonnng Powers Your Workflow</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-3 text-left hover:border-[#F59E0B]/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 flex items-center justify-center font-mono font-bold text-lg">
              1
            </div>
            <h4 className="text-base font-bold text-gray-900">Capture</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Save your raw ideas, sketches, and creative impulses into project scratchpads before they fade away.
            </p>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-3 text-left hover:border-[#F59E0B]/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 flex items-center justify-center font-mono font-bold text-lg">
              2
            </div>
            <h4 className="text-base font-bold text-gray-900">Plan</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Convert raw concepts into step-by-step Recipes with clear phases, time estimates, and budget limits.
            </p>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-3 text-left hover:border-[#F59E0B]/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 flex items-center justify-center font-mono font-bold text-lg">
              3
            </div>
            <h4 className="text-base font-bold text-gray-900">Create</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Execute tasks one by one, attach progress photos, and log updates to your private or public circle.
            </p>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-3 text-left hover:border-[#F59E0B]/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 flex items-center justify-center font-mono font-bold text-lg">
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
          <h2 className="text-xs font-mono font-bold text-[#F59E0B] uppercase tracking-wider">Features</h2>
          <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">Built specifically for creative minds</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-3">
            <Layers className="w-6 h-6 text-[#F59E0B]" />
            <h4 className="text-base font-bold text-gray-900">Creative Recipes</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Repeatable, customizable blueprints for writing, painting, baking, coding, or building physical artifacts.
            </p>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-3">
            <Target className="w-6 h-6 text-[#F59E0B]" />
            <h4 className="text-base font-bold text-gray-900">Collections & Focus Areas</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Group related projects into seasonal collections with deadlines, budget caps, and work modes.
            </p>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-3">
            <Users className="w-6 h-6 text-[#F59E0B]" />
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
                <Icon className="w-4 h-4 text-[#F59E0B]" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="px-4 lg:px-8 max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-br from-[#F59E0B]/15 via-orange-50 to-white border border-[#F59E0B]/30 rounded-3xl p-10 space-y-6 shadow-sm">
          <h3 className="text-3xl font-extrabold text-gray-900">Ready to finish your next big idea?</h3>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            Join thousands of creators using Gonnng to organize their creative life and build momentum every single day.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={onOpenWorkspace}
              className="bg-gradient-to-r from-[#F59E0B] to-[#FF8000] text-black px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-[#F59E0B]/25 hover:scale-105 transition-all cursor-pointer"
            >
              Launch Web App
            </button>
            <button
              onClick={() => onNavigate('features')}
              className="bg-white text-gray-900 border border-gray-300 px-6 py-3.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
            >
              Explore Web Features
            </button>
          </div>
        </div>
      </section>
      {/* PROMO RECIPE EXPLORE MODAL (Forced Mobile Sizing) */}
      {selectedPromoRecipe && (
        <RecipeExploreModal
          recipe={selectedPromoRecipe}
          isOpen={Boolean(selectedPromoRecipe)}
          onClose={() => setSelectedPromoRecipe(null)}
          forceMobileSizing={true}
          isSaved={savedRecipeIds.includes(selectedPromoRecipe.id)}
          onToggleSaveRecipe={handleToggleSaveRecipe}
          onStartProjectFromRecipe={handleStartProjectFromPromo}
        />
      )}
    </div>
  );
};
