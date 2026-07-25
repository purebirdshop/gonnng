import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, Square, Award, Flame, ChevronRight, Play, ArrowRight, HelpCircle } from 'lucide-react';

interface OnboardingProps {
  onCompleteTutorial: () => void;
}

export default function Onboarding({ onCompleteTutorial }: OnboardingProps) {
  const [step, setStep] = useState<number>(0);
  
  // Local state for tracking the tutorial sandwich tasks
  const [tasks, setTasks] = useState([
    // Phase 1
    { id: 't1', phase: 0, title: 'Source artisan bread (Sourdough)', completed: false, layer: 'bread-bottom' },
    { id: 't2', phase: 0, title: 'Crisp the bacon or plant-based strips', completed: false, layer: 'bacon' },
    { id: 't3', phase: 0, title: 'Wash crisp garden lettuce leaves', completed: false, layer: 'lettuce' },
    { id: 't4', phase: 0, title: 'Slice heirloom red tomatoes', completed: false, layer: 'tomato' },
    { id: 't5', phase: 0, title: 'Locate garlic herb mayonnaise', completed: false, layer: 'mayo' },
    // Phase 2
    { id: 't6', phase: 1, title: 'Lightly toast bread slices to golden brown', completed: false, layer: 'toast' },
    { id: 't7', phase: 1, title: 'Assemble stacked layers carefully', completed: false, layer: 'stack' },
    // Phase 3
    { id: 't8', phase: 2, title: 'Take the crucial first bite', completed: false, layer: 'bite' },
    { id: 't9', phase: 2, title: 'Consume sandwich and celebrate completion!', completed: false, layer: 'finish' }
  ]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, completed: !t.completed };
      }
      return t;
    }));
  };

  const getPhaseProgress = (phaseIndex: number) => {
    const phaseTasks = tasks.filter(t => t.phase === phaseIndex);
    const completedCount = phaseTasks.filter(t => t.completed).length;
    return Math.round((completedCount / phaseTasks.length) * 100);
  };

  const totalProgress = Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);

  const getLayerOpacity = (layerName: string) => {
    const task = tasks.find(t => t.layer === layerName);
    return task?.completed ? 1 : 0.1;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-white" id="onboarding-root">
      <div className="bg-[#151515] rounded-3xl border border-white/10 shadow-xl overflow-hidden">
        {/* Onboarding Header */}
        <div className="bg-[#0A0A0A] text-white p-8 relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,92,0,0.15),transparent)]"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="bg-[#FF5C00] text-black font-mono text-xs uppercase px-2.5 py-1 rounded-full font-bold tracking-wider">
                Tutorial Recipe
              </span>
              <h1 className="text-3xl md:text-4xl font-display font-bold mt-2 tracking-tight uppercase italic">
                The Anatomy of Creation
              </h1>
              <p className="text-white/40 font-sans text-sm mt-1 max-w-xl">
                Every monumental achievement—be it writing a novel, painting a canvas, or building a spaceship—is simply a series of small, intentional steps stacked together. Let's practice.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
              <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-[#FF5C00]/10 border border-[#FF5C00]/20">
                <span className="text-[#FF5C00] font-mono font-bold text-lg">{totalProgress}%</span>
              </div>
              <div>
                <div className="text-xs text-white/40 font-mono">PROJECT COMPLETION</div>
                <div className="text-sm font-semibold font-sans">BLT Sandwich Project</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Interactive Stages */}
        <div className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step-intro"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                id="intro-slide"
              >
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <h2 className="text-2xl font-display font-bold text-white">
                      "The whole is a sum of its parts."
                    </h2>
                    <p className="text-white/60 leading-relaxed text-sm">
                      Gonnng teaches you to visualize execution. Most systems focus only on the finished deadline, leaving you paralyzed. Gonnng focuses on the physical elements required to create.
                    </p>
                    <p className="text-white/80 leading-relaxed text-sm font-semibold">
                      To understand Gonnng, we will build a universal masterpiece:
                      <span className="text-[#FF5C00] block text-lg font-display font-bold mt-1 uppercase italic">The Ultimate BLT Sandwich.</span>
                    </p>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex gap-3">
                      <HelpCircle className="text-white/40 shrink-0 w-5 h-5 mt-0.5" />
                      <p className="text-xs text-white/50 leading-relaxed">
                        In this quick tutorial, you will start with a reusable <strong>Recipe</strong>, track individual <strong>Phases</strong>, and complete <strong>Tasks</strong> to see your visual project completion grow.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-[#0A0A0A] rounded-2xl p-6 border border-white/10 flex flex-col justify-center items-center text-center space-y-4 relative">
                    <div className="w-20 h-20 bg-[#FF5C00]/15 rounded-full flex items-center justify-center text-3xl border border-[#FF5C00]/20">
                      🥪
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-display font-bold text-white text-lg">Seeded Recipe</h3>
                      <p className="text-xs text-white/40">Provided by Gonnng Academy</p>
                    </div>
                    <div className="text-xs font-mono bg-white/5 px-3 py-1.5 rounded-full border border-white/10 shadow-sm text-white/80">
                      3 Phases • 9 Tasks • 2.6 Hours Est.
                    </div>
                    <button
                      id="instantiate-recipe-btn"
                      onClick={() => setStep(1)}
                      className="w-full py-3 px-4 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Start Recipe <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step-phase-1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                id="phase-1-slide"
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div>
                    <span className="text-xs font-mono text-white/40">PHASE 1 OF 3</span>
                    <h2 className="text-xl font-display font-bold text-white">Gather Ingredients</h2>
                  </div>
                  <div className="bg-white/10 text-white/85 px-3 py-1 rounded-full text-xs font-mono font-bold border border-white/10">
                    {getPhaseProgress(0)}% Done
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <p className="text-xs text-white/40 font-mono uppercase tracking-wider mb-2">Required Action Items</p>
                    {tasks.filter(t => t.phase === 0).map(task => (
                      <div
                        key={task.id}
                        id={`task-${task.id}`}
                        onClick={() => toggleTask(task.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          task.completed 
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-sm' 
                            : 'bg-white/5 border-white/10 text-white hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {task.completed ? (
                            <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-white/40 shrink-0" />
                          )}
                          <span className={`text-sm ${task.completed ? 'line-through text-emerald-400/80' : ''}`}>{task.title}</span>
                        </div>
                        <span className="text-xs font-mono text-white/40 shrink-0">Est. 10m</span>
                      </div>
                    ))}
                  </div>

                  {/* Right side: Visual feedback representing ingredient stockpile */}
                  <div className="bg-[#0A0A0A] rounded-2xl p-6 border border-white/10 flex flex-col justify-between items-center min-h-[300px]">
                    <div className="text-center">
                      <h3 className="font-display font-semibold text-white text-sm">Visual Assembly Counter</h3>
                      <p className="text-xs text-white/40">Check off items to gather them in your pantry</p>
                    </div>

                    {/* Stacking Sandwich Visualization */}
                    <div className="relative w-48 h-48 flex items-center justify-center">
                      <div className="space-y-1 w-full flex flex-col items-center">
                        {/* Upper Toast slice - showing only placeholder */}
                        <div className="text-xs text-white/20 font-mono italic">Toasted Lid (Pending Phase 2)</div>
                        
                        <motion.div 
                          animate={{ scale: getLayerOpacity('tomato') === 1 ? 1.05 : 0.95 }}
                          style={{ opacity: getLayerOpacity('tomato') }}
                          className="w-32 py-1.5 bg-red-500 rounded-full text-center text-[10px] text-white font-bold transition-all shadow-sm"
                        >
                          🍅 Red Tomatoes
                        </motion.div>
                        
                        <motion.div 
                          animate={{ scale: getLayerOpacity('lettuce') === 1 ? 1.05 : 0.95 }}
                          style={{ opacity: getLayerOpacity('lettuce') }}
                          className="w-36 py-1.5 bg-emerald-500 rounded-full text-center text-[10px] text-white font-bold transition-all shadow-sm"
                        >
                          🥬 Fresh Lettuce
                        </motion.div>
                        
                        <motion.div 
                          animate={{ scale: getLayerOpacity('bacon') === 1 ? 1.05 : 0.95 }}
                          style={{ opacity: getLayerOpacity('bacon') }}
                          className="w-34 py-1.5 bg-amber-800 rounded-full text-center text-[10px] text-white font-bold transition-all shadow-sm"
                        >
                          🥓 Crispy Bacon
                        </motion.div>
                        
                        <motion.div 
                          animate={{ scale: getLayerOpacity('mayo') === 1 ? 1.05 : 0.95 }}
                          style={{ opacity: getLayerOpacity('mayo') }}
                          className="w-28 py-1 bg-yellow-100 rounded-full text-center text-[10px] text-amber-900 border border-yellow-200 font-bold transition-all shadow-sm"
                        >
                          🍯 Garlic Herb Mayo
                        </motion.div>
                        
                        <motion.div 
                          animate={{ scale: getLayerOpacity('bread-bottom') === 1 ? 1.05 : 0.95 }}
                          style={{ opacity: getLayerOpacity('bread-bottom') }}
                          className="w-36 py-2.5 bg-amber-600 rounded-lg text-center text-[10px] text-white font-bold transition-all shadow-md"
                        >
                          🍞 Bottom Sourdough Slice
                        </motion.div>
                      </div>
                    </div>

                    <button
                      id="next-phase-2-btn"
                      disabled={getPhaseProgress(0) < 100}
                      onClick={() => setStep(2)}
                      className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        getPhaseProgress(0) === 100
                          ? 'bg-[#FF5C00] text-black hover:bg-[#FF751A] font-black shadow-md cursor-pointer'
                          : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
                      }`}
                    >
                      {getPhaseProgress(0) === 100 ? "Proceed to Assembly" : "Gather All Ingredients to Proceed"} 
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-phase-2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                id="phase-2-slide"
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div>
                    <span className="text-xs font-mono text-white/40">PHASE 2 OF 3</span>
                    <h2 className="text-xl font-display font-bold text-white">Assemble & Toast</h2>
                  </div>
                  <div className="bg-white/10 text-white/85 px-3 py-1 rounded-full text-xs font-mono font-bold border border-white/10">
                    {getPhaseProgress(1)}% Done
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <p className="text-xs text-white/40 font-mono uppercase tracking-wider mb-2">Required Action Items</p>
                    {tasks.filter(t => t.phase === 1).map(task => (
                      <div
                        key={task.id}
                        id={`task-${task.id}`}
                        onClick={() => toggleTask(task.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          task.completed 
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-sm' 
                            : 'bg-white/5 border-white/10 text-white hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {task.completed ? (
                            <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-white/40 shrink-0" />
                          )}
                          <span className={`text-sm ${task.completed ? 'line-through text-emerald-400/80' : ''}`}>{task.title}</span>
                        </div>
                        <span className="text-xs font-mono text-white/40 shrink-0">Est. 15m</span>
                      </div>
                    ))}
                  </div>

                  {/* Sandwich stacking visualization fully compiled */}
                  <div className="bg-[#0A0A0A] rounded-2xl p-6 border border-white/10 flex flex-col justify-between items-center min-h-[300px]">
                    <div className="text-center">
                      <h3 className="font-display font-semibold text-white text-sm">Active Layer Stack</h3>
                      <p className="text-xs text-[#FF5C00] font-mono font-bold">Golden Brown Sourdough Toast</p>
                    </div>

                    <div className="relative w-48 h-48 flex items-center justify-center">
                      <div className="space-y-1 w-full flex flex-col items-center">
                        {/* Upper Sourdough Slice - Opacity depends on task completions */}
                        <motion.div 
                          animate={{ 
                            y: getLayerOpacity('toast') === 1 ? 0 : -20,
                            scale: getLayerOpacity('toast') === 1 ? 1 : 0.8
                          }}
                          style={{ opacity: getLayerOpacity('toast') }}
                          className="w-36 py-2.5 bg-amber-700 rounded-lg text-center text-[10px] text-white font-bold border-t-2 border-amber-500 shadow-md transition-all"
                        >
                          🍞 Top Sourdough Toast Slice
                        </motion.div>
                        
                        <div className="w-32 py-1 bg-red-500 rounded-full text-center text-[9px] text-white font-bold">🍅 Tomatoes Layered</div>
                        <div className="w-36 py-1 bg-emerald-500 rounded-full text-center text-[9px] text-white font-bold">🥬 Crisp Lettuce Stacked</div>
                        <div className="w-34 py-1 bg-amber-800 rounded-full text-center text-[9px] text-white font-bold">🥓 Smoked Bacon Crisped</div>
                        <div className="w-28 py-0.5 bg-yellow-100 rounded-full text-center text-[9px] text-amber-900 border border-yellow-200">🍯 Mayo Spread</div>
                        
                        <div className="w-36 py-2 bg-amber-600 rounded-lg text-center text-[9px] text-white font-bold">🍞 Bottom Sourdough Slice</div>
                      </div>
                    </div>

                    <button
                      id="next-phase-3-btn"
                      disabled={getPhaseProgress(1) < 100}
                      onClick={() => setStep(3)}
                      className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        getPhaseProgress(1) === 100
                          ? 'bg-[#FF5C00] text-black hover:bg-[#FF751A] font-black shadow-md cursor-pointer'
                          : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
                      }`}
                    >
                      {getPhaseProgress(1) === 100 ? "Proceed to Consumption" : "Finish Assembly Phase"} 
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-phase-3"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                id="phase-3-slide"
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div>
                    <span className="text-xs font-mono text-white/40">PHASE 3 OF 3</span>
                    <h2 className="text-xl font-display font-bold text-white">Consume & Reflect</h2>
                  </div>
                  <div className="bg-white/10 text-white/85 px-3 py-1 rounded-full text-xs font-mono font-bold border border-white/10">
                    {getPhaseProgress(2)}% Done
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <p className="text-xs text-white/40 font-mono uppercase tracking-wider mb-2">Required Action Items</p>
                    {tasks.filter(t => t.phase === 2).map(task => (
                      <div
                        key={task.id}
                        id={`task-${task.id}`}
                        onClick={() => toggleTask(task.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          task.completed 
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-sm' 
                            : 'bg-white/5 border-white/10 text-white hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {task.completed ? (
                            <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-white/40 shrink-0" />
                          )}
                          <span className={`text-sm ${task.completed ? 'line-through text-emerald-400/80' : ''}`}>{task.title}</span>
                        </div>
                        <span className="text-xs font-mono text-white/40 shrink-0">Est. 5m</span>
                      </div>
                    ))}
                  </div>

                  {/* Sandwich biting visualization */}
                  <div className="bg-[#0A0A0A] rounded-2xl p-6 border border-white/10 flex flex-col justify-between items-center min-h-[300px]">
                    <div className="text-center">
                      <h3 className="font-display font-semibold text-white text-sm">Final Outcome</h3>
                      <p className="text-xs text-white/40">Witnessing a project reach its ultimate goal</p>
                    </div>

                    <div className="relative w-40 h-40 flex items-center justify-center">
                      {tasks.find(t => t.layer === 'finish')?.completed ? (
                        <div className="text-6xl animate-bounce">✨🍽️✨</div>
                      ) : tasks.find(t => t.layer === 'bite')?.completed ? (
                        <div className="text-6xl">😋🥪✨</div>
                      ) : (
                        <div className="text-6xl">🥪</div>
                      )}
                    </div>

                    <button
                      id="finish-tutorial-btn"
                      disabled={getPhaseProgress(2) < 100}
                      onClick={() => setStep(4)}
                      className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        getPhaseProgress(2) === 100
                          ? 'bg-[#FF5C00] text-black hover:bg-[#FF751A] font-black shadow-lg cursor-pointer'
                          : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
                      }`}
                    >
                      {getPhaseProgress(2) === 100 ? "Ring the Gong! 🔔" : "Finish Tasting to Complete"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step-complete"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-12 px-6 space-y-6"
                id="tutorial-complete-slide"
              >
                <div className="inline-flex items-center justify-center w-24 h-24 bg-[#FF5C00]/15 rounded-full text-white shadow-inner border border-[#FF5C00]/20">
                  <span className="text-5xl animate-bounce">🔔</span>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-3xl font-display font-bold text-white uppercase italic tracking-tighter">
                    GONNNG! Project Complete.
                  </h2>
                  <p className="text-white/60 max-w-lg mx-auto text-sm leading-relaxed">
                    You have successfully broken an idea down, acquired materials, executed assembly, and completed your first project! You are now a licensed Creative Architect.
                  </p>
                </div>

                <div className="max-w-md mx-auto grid grid-cols-3 gap-4 py-4">
                  <div className="bg-[#0A0A0A] p-3 rounded-xl border border-white/10 text-center">
                    <div className="text-xs text-white/40 font-mono uppercase">Phases</div>
                    <div className="text-lg font-bold font-display text-white">3 / 3</div>
                  </div>
                  <div className="bg-[#0A0A0A] p-3 rounded-xl border border-white/10 text-center">
                    <div className="text-xs text-white/40 font-mono uppercase">Tasks Done</div>
                    <div className="text-lg font-bold font-display text-white">9 / 9</div>
                  </div>
                  <div className="bg-[#0A0A0A] p-3 rounded-xl border border-white/10 text-center">
                    <div className="text-xs text-white/40 font-mono uppercase">Gong Awarded</div>
                    <div className="text-lg font-bold font-display text-[#FF5C00]">+1</div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 text-white/80 rounded-2xl p-4 max-w-lg mx-auto text-xs text-left leading-relaxed">
                  <strong className="text-[#FF5C00]">The Gonnng Philosophy Checklist:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-white/60">
                    <li>You break larger ambitions into discrete segments (Phases).</li>
                    <li>You keep actions binary, short, and achievable (Tasks).</li>
                    <li>You align multiple projects into targeted groups (Collections).</li>
                    <li>You forecast resources (Sand Engine) to guarantee completion.</li>
                  </ul>
                </div>

                <button
                  id="start-creating-app-btn"
                  onClick={onCompleteTutorial}
                  className="px-8 py-4 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 mx-auto text-sm cursor-pointer"
                >
                  Enter the Creator Sandbox <Play className="w-4 h-4 fill-black" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
