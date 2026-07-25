import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Collection, Project, Recipe, Phase } from '../types';
import { AlertCircle, ShieldAlert, Hourglass, ShieldCheck, Trash2, CheckCircle, X, Edit2, Save, Layers, Target, GripVertical, Plus, Search, GitFork, BookOpen } from 'lucide-react';

interface SandEngineProps {
  collections: Collection[];
  allProjects: Project[];
  onUpdateCollectionMode: (id: string, mode: 'sequential' | 'parallel' | 'hybrid') => void;
  onUpdateCollectionBudget: (id: string, hours: number) => void;
  onUpdateProject?: (project: Project) => void;
  onUpdateCollection?: (collection: Collection) => void;
  onDeleteCollection?: (id: string) => void;
  onMarkProjectComplete?: (projectId: string) => void;

  // Project props
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  getProjectProgress: (p: Project) => number;
  handleDeleteProject: (id: string) => void;
  handleToggleTask: (projId: string, phaseId: string, taskId: string) => void;
  setShowCreateModal: (show: boolean) => void;
  activeProject: Project | undefined;

  recipes?: Recipe[];
  onAddRecipe?: (recipe: Recipe) => void;
  theme?: 'dark' | 'light';

  initialTab?: 'projects' | 'focus' | 'library';
  currentUser?: { id?: string; name?: string; avatarUrl?: string; avatar?: string; privacyDefault?: 'public' | 'private' };
  setShowSearchModal?: (show: boolean) => void;
  setEditingRecipe?: (recipe: Recipe | null) => void;
  setForkInitialData?: (recipe: Recipe | null) => void;
  handleInstantiateRecipe?: (recipe: Recipe) => void;
}

export default function SandEngine({ 
  collections, 
  allProjects, 
  onUpdateCollectionMode,
  onUpdateCollectionBudget,
  onUpdateProject,
  onUpdateCollection,
  onDeleteCollection,
  onMarkProjectComplete,
  selectedProjectId,
  setSelectedProjectId,
  getProjectProgress,
  handleDeleteProject,
  handleToggleTask,
  setShowCreateModal,
  activeProject,
  recipes = [],
  onAddRecipe,
  theme = 'dark',
  initialTab = 'projects',
  currentUser,
  setShowSearchModal,
  setEditingRecipe,
  setForkInitialData,
  handleInstantiateRecipe
}: SandEngineProps) {
  const [topTab, setTopTab] = useState<'projects' | 'focus' | 'library'>(initialTab);
  const [activeItemType, setActiveItemType] = useState<'project' | 'focus'>('project');
  const [selectedColId, setSelectedColId] = useState<string>(collections[0]?.id || '');
  const [customBudgetHours, setCustomBudgetHours] = useState<number>(80);
  const [showMobileDetailModal, setShowMobileDetailModal] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setTopTab(initialTab);
      if (initialTab === 'projects') setActiveItemType('project');
      if (initialTab === 'focus') setActiveItemType('focus');
    }
  }, [initialTab]);

  // Edit State for Project
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editProjectTitle, setEditProjectTitle] = useState('');
  const [editPhases, setEditPhases] = useState<Phase[]>([]);
  const [saveToLibrary, setSaveToLibrary] = useState(false);

  // Drag and drop state for Project Edit
  const [draggedPhaseIdx, setDraggedPhaseIdx] = useState<number | null>(null);
  const [dragOverPhaseIdx, setDragOverPhaseIdx] = useState<number | null>(null);

  const [draggedTask, setDraggedTask] = useState<{ phaseIdx: number; taskIdx: number } | null>(null);
  const [dragOverTask, setDragOverTask] = useState<{ phaseIdx: number; taskIdx: number } | null>(null);

  // Edit State for Focus / Collection
  const [isEditingFocus, setIsEditingFocus] = useState(false);
  const [editFocusTitle, setEditFocusTitle] = useState('');
  const [editFocusDescription, setEditFocusDescription] = useState('');
  const [editFocusBudget, setEditFocusBudget] = useState(80);

  const activeCollection = collections.find(c => c.id === selectedColId) || collections[0];

  // Derive projects linked to active collection
  const linkedProjects = activeCollection 
    ? allProjects.filter(p => p.collectionId === activeCollection.id || activeCollection.projectIds.includes(p.id))
    : [];

  const totalRemainingHours = linkedProjects.reduce((sum, p) => {
    return sum + p.phases.reduce((ps, ph) => {
      const incompleteTasks = ph.tasks.filter(t => !t.completed);
      return ps + incompleteTasks.reduce((ts, t) => ts + (t.estimatedHours || 1), 0);
    }, 0);
  }, 0);

  const budgetedHours = activeCollection?.budgetedHours || 80;

  // Feasibility Check
  const calculateFeasibility = () => {
    if (!activeCollection) return { status: 'UNKNOWN', level: 'HEALTHY', message: 'No active Area of FOCUS', advice: '', color: 'slate' };

    const hoursNeeded = totalRemainingHours;
    const hoursBudgeted = budgetedHours;

    if (hoursNeeded === 0) {
      return {
        status: 'COMPLETED',
        level: 'HEALTHY',
        message: 'All projects in this Area of FOCUS are 100% completed!',
        advice: 'Zero remaining sand units required. Excellent creative momentum!',
        color: 'emerald'
      };
    }

    if (activeCollection.workMode === 'sequential') {
      const margin = hoursBudgeted - hoursNeeded;
      if (margin < 0) {
        return {
          status: 'CRITICAL',
          level: 'CRITICAL',
          message: 'Sequential execution capacity exceeded!',
          advice: `Requires ${hoursNeeded}h work vs ${hoursBudgeted}h budgeted. Under sequential mode, target is missed by ${Math.abs(margin)} hours.`,
          color: 'red'
        };
      } else {
        return {
          status: 'HEALTHY PACE',
          level: 'HEALTHY',
          message: 'Sequential execution is safe and steady.',
          advice: `With ${margin}h of reserve sand units, finishing one project fully before embarking on the next ensures zero context-switch loss.`,
          color: 'emerald'
        };
      }
    } else if (activeCollection.workMode === 'parallel') {
      const overheadNeeded = Math.round(hoursNeeded * 1.25);
      const margin = hoursBudgeted - overheadNeeded;

      if (margin < 0) {
        return {
          status: 'CRITICAL',
          level: 'CRITICAL',
          message: 'Parallel cognitive overload risk.',
          advice: `Working on all projects simultaneously inflates estimated load to ${overheadNeeded}h. Sequence your phases!`,
          color: 'red'
        };
      } else {
        return {
          status: 'WARNING',
          level: 'WARNING',
          message: 'Parallel overlapping workload active.',
          advice: `Technically feasible within ${hoursBudgeted}h, but splitting energy limits depth. Keep close track of daily milestones.`,
          color: 'amber'
        };
      }
    } else {
      const margin = hoursBudgeted - hoursNeeded;
      return {
        status: 'HEALTHY PACE',
        level: 'HEALTHY',
        message: 'Overlapping hybrid schedule is balanced.',
        advice: 'Researching or prepping the next project while finishing current active phases.',
        color: 'emerald'
      };
    }
  };

  const feasibility = calculateFeasibility();
  const sandFillPercentage = Math.max(0, Math.min(100, Math.round(((budgetedHours - totalRemainingHours) / budgetedHours) * 100)));

  // Sorting Projects: Active (uncompleted) first, Completed at the bottom
  const activeProjectsList = allProjects.filter(p => !p.isCompleted);
  const completedProjectsList = allProjects.filter(p => p.isCompleted);
  const sortedProjects = [...activeProjectsList, ...completedProjectsList];

  const isProjectInLibrary = activeProject ? (recipes?.some(r => r.id === activeProject.recipeId || r.title.trim().toLowerCase() === activeProject.title.trim().toLowerCase()) || false) : false;

  const handleSaveProjectToLibrary = () => {
    if (!activeProject || !onAddRecipe) return;
    const newRecipe: Recipe = {
      id: `recipe-proj-${Date.now()}`,
      title: activeProject.title,
      authorId: 'user-current',
      authorName: 'Creative Architect',
      category: 'Creative',
      description: `Execution blueprint for ${activeProject.title}`,
      phases: activeProject.phases.map(ph => ({
        title: ph.title,
        tasks: ph.tasks.map(t => ({ title: t.title, estimatedHours: t.estimatedHours || 1 }))
      })),
      tags: ['my-projects', 'custom'],
      isCustom: true
    };
    onAddRecipe(newRecipe);
  };

  // Handlers for Project Edit
  const handleStartProjectEdit = () => {
    if (!activeProject) return;
    setEditProjectTitle(activeProject.title);
    setEditPhases(activeProject.phases.map(ph => ({
      id: ph.id,
      title: ph.title,
      tasks: ph.tasks.map(t => ({ ...t }))
    })));
    setSaveToLibrary(!isProjectInLibrary);
    setIsEditingProject(true);
  };

  const handleSaveProjectEdit = () => {
    if (!activeProject) return;
    const updated: Project = {
      ...activeProject,
      title: editProjectTitle.trim() || activeProject.title,
      phases: editPhases
    };
    if (onUpdateProject) {
      onUpdateProject(updated);
    }
    if (saveToLibrary && onAddRecipe && !isProjectInLibrary) {
      const newRecipe: Recipe = {
        id: `recipe-proj-${Date.now()}`,
        title: updated.title,
        authorId: 'user-current',
        authorName: 'Creative Architect',
        category: 'Creative',
        description: `Execution blueprint for ${updated.title}`,
        phases: updated.phases.map(ph => ({
          title: ph.title,
          tasks: ph.tasks.map(t => ({ title: t.title, estimatedHours: t.estimatedHours || 1 }))
        })),
        tags: ['my-projects', 'custom'],
        isCustom: true
      };
      onAddRecipe(newRecipe);
      setSaveToLibrary(false);
    }
    setIsEditingProject(false);
    setShowMobileDetailModal(false);
  };

  // Phase Drag Handlers
  const handlePhaseDragStart = (e: React.DragEvent, pIdx: number) => {
    e.dataTransfer.setData('text/plain', `phase:${pIdx}`);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedPhaseIdx(pIdx);
  };

  const handlePhaseDragOver = (e: React.DragEvent, pIdx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverPhaseIdx !== pIdx) {
      setDragOverPhaseIdx(pIdx);
    }
  };

  const handlePhaseDrop = (e: React.DragEvent, targetPIdx: number) => {
    e.preventDefault();
    if (draggedPhaseIdx !== null && draggedPhaseIdx !== targetPIdx) {
      setEditPhases(prev => {
        const next = [...prev];
        const [moved] = next.splice(draggedPhaseIdx, 1);
        next.splice(targetPIdx, 0, moved);
        return next;
      });
    }
    setDraggedPhaseIdx(null);
    setDragOverPhaseIdx(null);
  };

  // Task Drag Handlers
  const handleTaskDragStart = (e: React.DragEvent, pIdx: number, tIdx: number) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', `task:${pIdx}:${tIdx}`);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTask({ phaseIdx: pIdx, taskIdx: tIdx });
  };

  const handleTaskDragOver = (e: React.DragEvent, pIdx: number, tIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTask({ phaseIdx: pIdx, taskIdx: tIdx });
  };

  const handleTaskDrop = (e: React.DragEvent, targetPIdx: number, targetTIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedTask) {
      const { phaseIdx: srcPIdx, taskIdx: srcTIdx } = draggedTask;
      if (srcPIdx !== targetPIdx || srcTIdx !== targetTIdx) {
        setEditPhases(prev => {
          const next = prev.map(ph => ({
            ...ph,
            tasks: [...ph.tasks]
          }));
          const taskToMove = next[srcPIdx].tasks[srcTIdx];
          next[srcPIdx].tasks.splice(srcTIdx, 1);
          next[targetPIdx].tasks.splice(targetTIdx, 0, taskToMove);
          return next;
        });
      }
    }
    setDraggedTask(null);
    setDragOverTask(null);
  };

  const handlePhaseContainerTaskDrop = (e: React.DragEvent, targetPIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedTask) {
      const { phaseIdx: srcPIdx, taskIdx: srcTIdx } = draggedTask;
      if (srcPIdx !== targetPIdx) {
        setEditPhases(prev => {
          const next = prev.map(ph => ({
            ...ph,
            tasks: [...ph.tasks]
          }));
          const taskToMove = next[srcPIdx].tasks[srcTIdx];
          next[srcPIdx].tasks.splice(srcTIdx, 1);
          next[targetPIdx].tasks.push(taskToMove);
          return next;
        });
      }
    }
    setDraggedTask(null);
    setDragOverTask(null);
  };

  const handleAddPhase = () => {
    setEditPhases(prev => [
      ...prev,
      {
        id: `phase-edit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: `Phase ${prev.length + 1}`,
        tasks: [
          {
            id: `task-edit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            title: 'New Task',
            completed: false,
            estimatedHours: 1
          }
        ]
      }
    ]);
  };

  const handleRemovePhase = (pIdx: number) => {
    setEditPhases(prev => prev.filter((_, i) => i !== pIdx));
  };

  const handleAddTaskToPhase = (pIdx: number) => {
    setEditPhases(prev => prev.map((ph, i) => i === pIdx ? {
      ...ph,
      tasks: [
        ...ph.tasks,
        {
          id: `task-edit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: 'New Task',
          completed: false,
          estimatedHours: 1
        }
      ]
    } : ph));
  };

  const handleRemoveTask = (pIdx: number, tIdx: number) => {
    setEditPhases(prev => prev.map((ph, i) => i === pIdx ? {
      ...ph,
      tasks: ph.tasks.filter((_, j) => j !== tIdx)
    } : ph));
  };

  // Handlers for Focus Edit
  const handleStartFocusEdit = () => {
    if (!activeCollection) return;
    setEditFocusTitle(activeCollection.title);
    setEditFocusDescription(activeCollection.description || '');
    setEditFocusBudget(activeCollection.budgetedHours || 80);
    setIsEditingFocus(true);
    setShowMobileDetailModal(true);
  };

  const handleSaveFocusEdit = () => {
    if (!activeCollection) return;
    const updated: Collection = {
      ...activeCollection,
      title: editFocusTitle || activeCollection.title,
      description: editFocusDescription,
      budgetedHours: editFocusBudget
    };
    if (onUpdateCollection) {
      onUpdateCollection(updated);
    } else {
      onUpdateCollectionBudget(activeCollection.id, editFocusBudget);
    }
    setIsEditingFocus(false);
    setShowMobileDetailModal(false);
  };

  const handleProjectCompleteAction = (projectId: string) => {
    if (onMarkProjectComplete) {
      onMarkProjectComplete(projectId);
    } else if (onUpdateProject && activeProject) {
      onUpdateProject({
        ...activeProject,
        isCompleted: true,
        completedAt: new Date().toISOString()
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-white pb-28 sm:pb-8" id="sand-engine-root">
      {/* Main Container */}
      <div className="bg-black border-[10px] border-white/5 rounded-none p-4 sm:p-6 w-full min-w-0" id="dashboard-section-root">
        
        {/* TOP OVERALL TAB BAR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-6 border-b border-white/10 gap-4" id="sand-top-tab-bar">
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10 shadow-inner">
            <button
              id="sand-tab-projects"
              type="button"
              onClick={() => {
                setTopTab('projects');
                setActiveItemType('project');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                topTab === 'projects'
                  ? 'bg-[#FF5C00] text-black shadow-md font-black'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> PROJECTS
            </button>
            <button
              id="sand-tab-focus"
              type="button"
              onClick={() => {
                setTopTab('focus');
                setActiveItemType('focus');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                topTab === 'focus'
                  ? 'bg-[#FF5C00] text-black shadow-md font-black'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Target className="w-3.5 h-3.5" /> FOCUS
            </button>
            <button
              id="sand-tab-library"
              type="button"
              onClick={() => {
                setTopTab('library');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                topTab === 'library'
                  ? 'bg-[#FF5C00] text-black shadow-md font-black'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> LIBRARY
            </button>
          </div>

          {topTab === 'library' ? (
            <div className="flex gap-2 shrink-0 w-full sm:w-auto">
              <button
                id="sand-library-search-btn"
                type="button"
                onClick={() => setShowSearchModal && setShowSearchModal(true)}
                className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-[#FF5C00] border border-[#FF5C00]/30 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer flex-1 sm:flex-initial justify-center"
              >
                <Search className="w-4 h-4" /> Search Recipes
              </button>
              <button
                id="sand-library-add-btn"
                type="button"
                onClick={() => {
                  if (setForkInitialData) setForkInitialData(null);
                  if (setEditingRecipe) setEditingRecipe(null);
                  if (setShowCreateModal) setShowCreateModal(true);
                }}
                className="px-4 py-2 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black rounded-xl text-xs transition-all shadow cursor-pointer flex-1 sm:flex-initial justify-center"
              >
                + Start New Recipe
              </button>
            </div>
          ) : (
            <button
              id="dashboard-top-add-btn"
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Plus className="w-4 h-4" /> {topTab === 'projects' ? 'Start New Project' : 'Create Area of FOCUS'}
            </button>
          )}
        </div>

        {/* MAIN SAND VIEW TAB CONTENT */}
        {topTab === 'library' ? (
          /* LIBRARY TAB VIEW INSIDE SAND ENGINE */
          <div className="space-y-6" id="recipes-library-root">
            <div className="bg-[#151515] border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-sm font-display font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#FF5C00]" /> Process & Blueprint Library
                </h3>
                <p className="text-xs text-white/60 mt-1">
                  Explore, learn from, and follow reusable human execution blueprints.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recipes.map((recipe, idx) => (
                <div 
                  key={recipe.id} 
                  id={`recipe-card-${recipe.id}`}
                  className="bg-[#151515] border border-white/10 shadow-sm hover:shadow-md transition-all flex flex-col justify-between p-5 rounded-2xl"
                  style={(recipe.id === 'recipe-custom-1784771489038' || idx === 0) ? {
                    paddingLeft: '13px',
                    paddingRight: '12px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    borderWidth: '1px',
                    borderRadius: '0px'
                  } : { padding: '1.5rem', borderRadius: '1.5rem' }}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="bg-[#FF5C00]/15 text-[#FF5C00] font-mono text-[9px] uppercase px-2 py-1 rounded font-bold tracking-wider">
                        {recipe.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-white/40">
                          by {recipe.authorName}
                        </span>
                        {((recipe.authorName && currentUser?.name && recipe.authorName.toLowerCase() === currentUser.name.toLowerCase()) || recipe.authorName === 'Creative Architect' || recipe.authorName === 'You') ? (
                          <button
                            type="button"
                            id={`edit-recipe-${recipe.id}`}
                            onClick={() => {
                              if (setEditingRecipe) setEditingRecipe(recipe);
                              if (setForkInitialData) setForkInitialData(null);
                              setShowCreateModal(true);
                            }}
                            className="p-1 bg-white/5 hover:bg-[#FF5C00] text-white/70 hover:text-black rounded-lg transition-all cursor-pointer flex items-center justify-center border border-white/10"
                            title="Edit Recipe Blueprint"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            id={`fork-recipe-${recipe.id}`}
                            onClick={() => {
                              if (setForkInitialData) setForkInitialData(recipe);
                              if (setEditingRecipe) setEditingRecipe(null);
                              setShowCreateModal(true);
                            }}
                            className="p-1 bg-white/5 hover:bg-[#FF5C00] text-white/70 hover:text-black rounded-lg transition-all cursor-pointer flex items-center justify-center border border-white/10"
                            title="Fork Recipe Blueprint"
                          >
                            <GitFork className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-lg font-display font-bold text-white">{recipe.title}</h3>
                      <p className="text-xs text-white/60 font-sans leading-relaxed">{recipe.description}</p>
                      
                      {recipe.forkedFrom && (
                        <div className="inline-flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md font-mono mt-1">
                          <GitFork className="w-3 h-3" /> Forked from {recipe.forkedFrom}
                        </div>
                      )}
                    </div>

                    {/* List of Recipe milestones */}
                    <div className="space-y-2 pt-2">
                      <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Sequence Milestones</p>
                      <div className="space-y-1">
                        {recipe.phases.map((ph, phIdx) => (
                          <div key={phIdx} className="flex gap-2 items-center text-xs text-white/80 font-sans">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C00]"></span>
                            <strong className="font-semibold text-white">{ph.title}</strong>
                            <span className="text-[10px] text-white/40 font-mono">({ph.tasks.length} sub-tasks)</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tags display */}
                    <div className="flex gap-1 pt-2 flex-wrap">
                      {recipe.tags.map(tag => (
                        <span key={tag} className="text-[9px] font-mono bg-white/5 text-white/40 px-2 py-0.5 rounded-full border border-white/10">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="border-t border-white/10 pt-4 mt-6 flex justify-between items-center">
                    <div className="text-[10px] text-white/40 font-mono">
                      {recipe.phases.reduce((s, p) => s + p.tasks.length, 0)} TOTAL CHECKS
                    </div>

                    <button
                      id={`instantiate-recipe-${recipe.id}`}
                      onClick={() => {
                        if (setForkInitialData) setForkInitialData(recipe);
                        if (setEditingRecipe) setEditingRecipe(null);
                        if (setShowCreateModal) setShowCreateModal(true);
                      }}
                      className="px-4 py-2 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Start Recipe
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full min-w-0 items-stretch" id="dashboard-grid">
            
            {/* LEFT SIDE: PROJECTS | FOCUS List */}
            <div className="w-full min-w-0 md:h-full flex flex-col" id="dashboard-sidebar">
              <div className="bg-black rounded-none border-0 px-0 pt-[12px] pb-0 sm:p-5 shadow-sm space-y-4 w-full min-w-0 md:h-full md:flex md:flex-col md:justify-between" id="dashboard-sidebar-inner">
                <div className="space-y-3">
                  {/* Header title for active list */}
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="text-xs font-mono font-bold text-white/70 uppercase tracking-wider">
                      {topTab === 'projects' ? `Active Projects (${sortedProjects.length})` : `Areas of Focus (${collections.length})`}
                    </span>
                  </div>

                  {/* List Content */}
                  <div className="space-y-2.5 max-md:max-h-none max-md:overflow-visible md:max-h-[520px] md:overflow-y-auto pr-0 md:pr-1">
                    {topTab === 'projects' ? (
                      /* PROJECTS TAB LIST */
                      sortedProjects.length > 0 ? (
                        sortedProjects.map(p => {
                          const progress = getProjectProgress(p);
                          const isSelected = selectedProjectId === p.id && activeItemType === 'project';
                          const isCompleted = p.isCompleted;

                          return (
                            <div
                              key={p.id}
                              id={`proj-select-card-${p.id}`}
                              onClick={() => {
                                setSelectedProjectId(p.id);
                                setActiveItemType('project');
                                setIsEditingProject(false);
                                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                                  setShowMobileDetailModal(true);
                                }
                              }}
                              className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                                isSelected
                                  ? isCompleted
                                    ? 'bg-[#1a1a1a] border-2 border-emerald-500 text-white shadow-md'
                                    : theme === 'light'
                                      ? 'bg-orange-50/80 border-2 border-[#FF5C00] text-gray-900 shadow-md ring-2 ring-[#FF5C00]/20'
                                      : 'bg-[#1f1f1f] border-2 border-[#FF5C00] text-white shadow-md ring-2 ring-[#FF5C00]/20'
                                  : isCompleted
                                  ? 'bg-[#141414] border border-white/10 text-white/50 opacity-70 hover:opacity-100'
                                  : theme === 'light'
                                    ? 'bg-white border border-gray-200 text-gray-900 shadow-sm hover:border-[#FF5C00]/50'
                                    : 'bg-[#151515] border border-white/10 text-white shadow-sm hover:border-[#FF5C00]/50'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <h4 className={`text-[9px] font-mono font-bold uppercase truncate ${
                                      isCompleted ? 'text-white/40 font-normal' : 'text-[#FF5C00]'
                                    }`}>
                                      {p.recipeTitle}
                                    </h4>
                                    {isCompleted && (
                                      <span className="text-[8px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                        COMPLETED
                                      </span>
                                    )}
                                  </div>
                                  <h5 className={`text-xs font-bold truncate mt-0.5 ${
                                    isCompleted 
                                      ? 'line-through text-white/40' 
                                      : theme === 'light' ? 'text-gray-900' : 'text-white'
                                  }`}>
                                    {p.title}
                                  </h5>
                                </div>
                                <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded shrink-0 font-bold ${
                                  isCompleted
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-[#FF5C00] text-black shadow-sm'
                                }`}>
                                  {progress}%
                                </span>
                              </div>

                              {/* Progress bar */}
                              <div className={`w-full rounded-full h-1 mt-2.5 overflow-hidden ${
                                isCompleted 
                                  ? 'bg-white/10' 
                                  : theme === 'light' ? 'bg-gray-200' : 'bg-white/10'
                              }`}>
                                <div 
                                  className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-[#FF5C00]'}`} 
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-white/40 text-xs font-sans">
                          No active projects. Click below to start!
                        </div>
                      )
                    ) : (
                      /* FOCUS TAB LIST */
                      collections.length > 0 ? (
                        collections.map(col => {
                          const colProjects = allProjects.filter(p => p.collectionId === col.id || col.projectIds.includes(p.id));
                          const totalTasks = colProjects.reduce((sum, p) => sum + p.phases.reduce((ps, ph) => ps + ph.tasks.length, 0), 0);
                          const compTasks = colProjects.reduce((sum, p) => sum + p.phases.reduce((ps, ph) => ps + ph.tasks.filter(t => t.completed).length, 0), 0);
                          const progress = totalTasks > 0 ? Math.round((compTasks / totalTasks) * 100) : 0;
                          const isSelected = selectedColId === col.id && activeItemType === 'focus';
                          const isCompleted = totalTasks > 0 && compTasks === totalTasks;

                          return (
                            <div
                              key={col.id}
                              id={`focus-select-card-${col.id}`}
                              onClick={() => {
                                setSelectedColId(col.id);
                                setActiveItemType('focus');
                                setIsEditingFocus(false);
                                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                                  setShowMobileDetailModal(true);
                                }
                              }}
                              className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                                isSelected
                                  ? isCompleted
                                    ? 'bg-[#1a1a1a] border-2 border-emerald-500 text-white shadow-md'
                                    : theme === 'light'
                                      ? 'bg-orange-50/80 border-2 border-[#FF5C00] text-gray-900 shadow-md ring-2 ring-[#FF5C00]/20'
                                      : 'bg-[#1f1f1f] border-2 border-[#FF5C00] text-white shadow-md ring-2 ring-[#FF5C00]/20'
                                  : isCompleted
                                  ? 'bg-[#141414] border border-white/10 text-white/50 opacity-70 hover:opacity-100'
                                  : theme === 'light'
                                    ? 'bg-white border border-gray-200 text-gray-900 shadow-sm hover:border-[#FF5C00]/50'
                                    : 'bg-[#151515] border border-white/10 text-white shadow-sm hover:border-[#FF5C00]/50'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0 flex-1">
                                  <h4 className={`text-[9px] font-mono font-bold uppercase truncate ${
                                    isCompleted ? 'text-white/40 font-normal' : 'text-[#FF5C00]'
                                  }`}>
                                    {colProjects.length} {colProjects.length === 1 ? 'PROJECT' : 'PROJECTS'} {col.budgetedHours ? `• ${col.budgetedHours}H` : ''}
                                  </h4>
                                  <h5 className={`text-xs font-bold truncate mt-0.5 ${
                                    isCompleted 
                                      ? 'line-through text-white/40' 
                                      : theme === 'light' ? 'text-gray-900' : 'text-white'
                                  }`}>
                                    {col.title}
                                  </h5>
                                </div>
                                <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded shrink-0 font-bold ${
                                  isCompleted
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-[#FF5C00] text-black shadow-sm'
                                }`}>
                                  {progress}%
                                </span>
                              </div>

                              <div className={`w-full rounded-full h-1 mt-2.5 overflow-hidden ${
                                isCompleted 
                                  ? 'bg-white/10' 
                                  : theme === 'light' ? 'bg-gray-200' : 'bg-white/10'
                              }`}>
                                <div 
                                  className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-[#FF5C00]'}`} 
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-white/40 text-xs font-sans">
                          No Areas of FOCUS created yet.
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

          {/* RIGHT SIDE DETAILED VIEWER (Desktop inline) */}
          <div className="hidden md:block md:col-span-2 space-y-6 w-full min-w-0" id="dashboard-details">
            {activeItemType === 'project' && activeProject ? (
              /* --- PROJECT VIEWER --- */
              <div className="bg-[#151515] rounded-3xl border border-white/10 p-3.5 sm:p-5 md:p-6 shadow-sm space-y-6 w-full min-w-0 h-full flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Project Header with double-click edit */}
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10 w-full min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="bg-white/10 text-white/60 font-mono text-[9px] uppercase px-2 py-0.5 rounded font-bold truncate max-w-[150px]">
                          {activeProject.recipeTitle}
                        </span>
                        <span className="text-[10px] font-mono text-white/40 uppercase">
                          Created: {new Date(activeProject.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[9px] font-mono text-[#FF5C00] bg-[#FF5C00]/10 px-2 py-0.5 rounded border border-[#FF5C00]/20">
                          💡 Double-click title to edit
                        </span>
                      </div>

                      {isEditingProject ? (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={editProjectTitle}
                            onChange={(e) => setEditProjectTitle(e.target.value)}
                            className="bg-black border border-[#FF5C00] rounded-xl px-3 py-1.5 text-base font-display font-bold text-white w-full focus:outline-none"
                            placeholder="Project title..."
                            autoFocus
                          />
                        </div>
                      ) : (
                        <h2 
                          onDoubleClick={handleStartProjectEdit}
                          title="Double-click to edit project title"
                          className="text-base sm:text-lg font-display font-bold text-white mt-1 break-words cursor-pointer hover:text-[#FF5C00] transition-colors"
                        >
                          {activeProject.title}
                        </h2>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isEditingProject ? (
                        <>
                          <button
                            type="button"
                            onClick={handleSaveProjectEdit}
                            className="p-2 bg-[#FF5C00] hover:bg-[#FF751A] text-black rounded-xl cursor-pointer shadow flex items-center justify-center transition-all"
                            title="Save changes"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditingProject(false)}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl cursor-pointer transition-all flex items-center justify-center"
                            title="Cancel edit"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleStartProjectEdit}
                            className="p-2 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                            title="Edit project"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            id={`delete-project-btn-${activeProject.id}`}
                            type="button"
                            onClick={() => handleDeleteProject(activeProject.id)}
                            className="p-2 text-white/40 hover:text-red-500 hover:bg-white/5 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                            title="Delete project"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Project Progress Circle Banner */}
                  {(() => {
                    const progress = getProjectProgress(activeProject);
                    return (
                      <div className="bg-black p-4 rounded-2xl border border-white/10 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono text-white/40 uppercase">Overall Completion</span>
                          <h4 className="text-xl font-display font-bold text-white">{progress}% Completed</h4>
                        </div>
                        <div className="w-12 h-12 rounded-full border-4 border-[#FF5C00] flex items-center justify-center font-mono font-bold text-xs text-[#FF5C00]">
                          {progress}%
                        </div>
                      </div>
                    );
                  })()}

                  {/* Phases Checklist */}
                  <div className="space-y-5">
                    {isEditingProject ? (
                      <div className="space-y-6">
                        {editPhases.map((phase, pIdx) => (
                          <div 
                            key={phase.id || `edit-phase-${pIdx}`} 
                            className={`space-y-3 p-3.5 rounded-2xl border transition-all ${
                              dragOverPhaseIdx === pIdx ? 'border-[#FF5C00] bg-[#FF5C00]/10' : 'bg-black/40 border-white/10'
                            }`}
                            onDragOver={(e) => handlePhaseDragOver(e, pIdx)}
                            onDrop={(e) => handlePhaseContainerTaskDrop(e, pIdx)}
                          >
                            {/* Phase Header */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {/* Number Icon with Hover Drag Handle */}
                                <div 
                                  className="group relative cursor-grab active:cursor-grabbing p-0.5 rounded shrink-0"
                                  draggable
                                  onDragStart={(e) => handlePhaseDragStart(e, pIdx)}
                                  onDragOver={(e) => handlePhaseDragOver(e, pIdx)}
                                  onDrop={(e) => handlePhaseDrop(e, pIdx)}
                                  title="Click, hold & drag vertically to reorder phase"
                                >
                                  <span className="bg-[#FF5C00]/20 text-[#FF5C00] group-hover:bg-[#FF5C00] group-hover:text-black w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] shrink-0 font-bold font-mono transition-all shadow">
                                    <span className="group-hover:hidden">{pIdx + 1}</span>
                                    <GripVertical className="w-3.5 h-3.5 hidden group-hover:block" />
                                  </span>
                                </div>

                                <input
                                  type="text"
                                  value={phase.title}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditPhases(prev => prev.map((p, i) => i === pIdx ? { ...p, title: val } : p));
                                  }}
                                  className="bg-black border border-white/20 focus:border-[#FF5C00] rounded-xl px-3 py-1 text-xs font-bold text-white flex-1 focus:outline-none"
                                  placeholder="Phase title..."
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemovePhase(pIdx)}
                                className="p-1.5 text-white/40 hover:text-red-400 hover:bg-white/10 rounded-lg transition-all shrink-0 cursor-pointer"
                                title="Delete phase"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Tasks inside Phase */}
                            <div className="space-y-2 pl-0 sm:pl-7 w-full min-w-0">
                              {phase.tasks.map((task, tIdx) => (
                                <div
                                  key={task.id || `edit-task-${tIdx}`}
                                  draggable
                                  onDragStart={(e) => handleTaskDragStart(e, pIdx, tIdx)}
                                  onDragOver={(e) => handleTaskDragOver(e, pIdx, tIdx)}
                                  onDrop={(e) => handleTaskDrop(e, pIdx, tIdx)}
                                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 bg-black/60 border-white/10 transition-all ${
                                    dragOverTask?.phaseIdx === pIdx && dragOverTask?.taskIdx === tIdx ? 'border-[#FF5C00] bg-[#FF5C00]/10' : ''
                                  }`}
                                >
                                  {/* Task Drag Handle */}
                                  <div 
                                    className="cursor-grab active:cursor-grabbing text-white/40 hover:text-[#FF5C00] shrink-0 p-1 rounded hover:bg-white/5"
                                    title="Click, hold & drag vertically to reorder task or move to another phase"
                                  >
                                    <GripVertical className="w-4 h-4" />
                                  </div>

                                  {/* Disabled Checkbox */}
                                  <input
                                    type="checkbox"
                                    checked={task.completed}
                                    disabled
                                    className="w-4 h-4 rounded border-white/20 bg-black text-[#FF5C00] opacity-30 cursor-not-allowed shrink-0"
                                  />

                                  {/* Task Title Input */}
                                  <input
                                    type="text"
                                    value={task.title}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setEditPhases(prev => prev.map((p, i) => i === pIdx ? {
                                        ...p,
                                        tasks: p.tasks.map((t, j) => j === tIdx ? { ...t, title: val } : t)
                                      } : p));
                                    }}
                                    className="bg-transparent border-0 border-b border-white/10 focus:border-[#FF5C00] text-xs text-white font-medium flex-1 focus:outline-none px-1 py-0.5"
                                    placeholder="Task description..."
                                  />

                                  {/* Delete Task */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTask(pIdx, tIdx)}
                                    className="p-1 text-white/30 hover:text-red-400 rounded transition-all shrink-0 cursor-pointer"
                                    title="Delete task"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}

                              <button
                                type="button"
                                onClick={() => handleAddTaskToPhase(pIdx)}
                                className="w-full py-1.5 border border-dashed border-white/20 hover:border-[#FF5C00]/50 hover:text-[#FF5C00] text-white/50 hover:bg-white/5 text-[11px] font-mono rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer mt-1"
                              >
                                <Plus className="w-3 h-3" /> Add Task
                              </button>
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={handleAddPhase}
                          className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#FF5C00]" /> Add New Phase
                        </button>
                      </div>
                    ) : (
                      activeProject.phases.map((phase, pIdx) => {
                        const isPhaseComplete = phase.tasks.length > 0 && phase.tasks.every(t => t.completed);

                        return (
                          <div key={phase.id} className="space-y-3 w-full min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-xs font-mono font-bold text-white/80 uppercase tracking-wider flex items-center gap-2">
                                <span className="bg-white/10 text-white/85 w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] shrink-0">
                                  {pIdx + 1}
                                </span>
                                <span onDoubleClick={handleStartProjectEdit} className="break-words cursor-pointer hover:text-[#FF5C00]">
                                  {phase.title}
                                </span>

                                {/* Phase Complete Badge */}
                                {isPhaseComplete && (
                                  <span className="text-emerald-400 font-bold font-mono text-xs bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md ml-2 inline-flex items-center gap-1 animate-pulse">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Complete!
                                  </span>
                                )}
                              </h3>
                            </div>

                            <div className="space-y-2 pl-0 sm:pl-7 w-full min-w-0">
                              {phase.tasks.map(task => (
                                <div
                                  key={task.id}
                                  onClick={() => handleToggleTask(activeProject.id, phase.id, task.id)}
                                  className={`p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 min-w-0 w-full ${
                                    task.completed
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-sm'
                                      : 'bg-white/5 border border-white/10 text-white/80 hover:border-white/20 hover:bg-white/10'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className="shrink-0">
                                      {task.completed ? (
                                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                                      ) : (
                                        <div className="w-5 h-5 rounded-md border-2 border-white/20"></div>
                                      )}
                                    </div>
                                    <span className={`text-xs break-words ${task.completed ? 'line-through text-emerald-400/80 font-medium' : 'font-medium'}`}>
                                      {task.title}
                                    </span>
                                  </div>

                                  <span className="text-[10px] font-mono text-white/40 shrink-0">
                                    {task.estimatedHours || 1}h est
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* PROJECT COMPLETE BUTTON AT BOTTOM */}
                {!isEditingProject && (() => {
                  const isAllTasksComplete = activeProject.phases.length > 0 && activeProject.phases.every(ph => ph.tasks.length > 0 && ph.tasks.every(t => t.completed));

                  if (isAllTasksComplete) {
                    return (
                      <div className="pt-6 border-t border-white/10 space-y-3">
                        {activeProject.isCompleted ? (
                          <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-center space-y-1">
                            <div className="flex items-center justify-center gap-2 text-emerald-400 font-mono font-black text-sm uppercase">
                              <CheckCircle className="w-5 h-5 text-emerald-400" /> PROJECT COMPLETED!
                            </div>
                            <p className="text-xs text-emerald-300/80 font-sans">
                              Moved to the bottom of the Projects list.
                            </p>
                          </div>
                        ) : (
                          <button
                            id={`project-complete-btn-${activeProject.id}`}
                            type="button"
                            onClick={() => handleProjectCompleteAction(activeProject.id)}
                            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm sm:text-base uppercase rounded-2xl tracking-wider shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-95"
                          >
                            <CheckCircle className="w-5 h-5 text-black" /> PROJECT COMPLETE!
                          </button>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
                {/* DELETE PROJECT BUTTON WHEN EDITING */}
                {isEditingProject && (
                  <div className="pt-6 border-t border-white/10 flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteProject(activeProject.id);
                        setIsEditingProject(false);
                      }}
                      className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-2xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
                    >
                      <Trash2 className="w-4 h-4" /> Delete this project
                    </button>
                  </div>
                )}
              </div>
            ) : activeItemType === 'focus' && activeCollection ? (
              /* --- AREA OF FOCUS VIEWER --- */
              <div className="bg-[#151515] rounded-3xl border border-white/10 p-3.5 sm:p-5 md:p-6 shadow-sm space-y-6 w-full min-w-0 h-full flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Focus Header with double-click edit */}
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10 w-full min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="bg-[#FF5C00]/15 text-[#FF5C00] font-mono text-[9px] uppercase px-2 py-0.5 rounded font-bold">
                          Area of FOCUS
                        </span>
                        <span className="text-[10px] font-mono text-white/40 uppercase">
                          Mode: {activeCollection.workMode}
                        </span>
                        <span className="text-[9px] font-mono text-[#FF5C00] bg-[#FF5C00]/10 px-2 py-0.5 rounded border border-[#FF5C00]/20">
                          💡 Double-click element to edit
                        </span>
                      </div>

                      {isEditingFocus ? (
                        <div className="space-y-3 mt-2 bg-black/60 p-4 rounded-2xl border border-white/10">
                          <div>
                            <label className="block text-[10px] font-mono text-white/50 uppercase mb-1">Focus Title</label>
                            <input
                              type="text"
                              value={editFocusTitle}
                              onChange={(e) => setEditFocusTitle(e.target.value)}
                              className="bg-black border border-[#FF5C00] rounded-xl px-3 py-2 text-sm font-display font-bold text-white w-full focus:outline-none"
                              placeholder="Area of Focus title..."
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-white/50 uppercase mb-1">Description</label>
                            <textarea
                              value={editFocusDescription}
                              onChange={(e) => setEditFocusDescription(e.target.value)}
                              className="bg-black border border-white/20 rounded-xl px-3 py-2 text-xs font-sans text-white w-full focus:outline-none h-20"
                              placeholder="Focus description..."
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-white/50 uppercase mb-1">Budgeted Hours</label>
                            <input
                              type="number"
                              value={editFocusBudget}
                              onChange={(e) => setEditFocusBudget(Number(e.target.value))}
                              className="bg-black border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white w-32 font-mono font-bold focus:outline-none focus:border-[#FF5C00]"
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                            <button
                              type="button"
                              onClick={handleSaveFocusEdit}
                              className="px-4 py-2 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black text-xs uppercase rounded-xl transition-all shadow flex items-center gap-1.5 cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" /> Save Changes
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditingFocus(false)}
                              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                            {onDeleteCollection && (
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteCollection(activeCollection.id);
                                  setIsEditingFocus(false);
                                }}
                                className="ml-auto px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete Focus
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <h2
                            onDoubleClick={handleStartFocusEdit}
                            title="Double-click to edit title"
                            className="text-base sm:text-lg font-display font-bold text-white break-words cursor-pointer hover:text-[#FF5C00] transition-colors"
                          >
                            {activeCollection.title}
                          </h2>
                          {activeCollection.description && (
                            <p 
                              onDoubleClick={handleStartFocusEdit}
                              title="Double-click to edit description"
                              className="text-xs text-white/60 font-sans cursor-pointer hover:text-white"
                            >
                              {activeCollection.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isEditingFocus ? (
                        <>
                          <button
                            type="button"
                            onClick={handleSaveFocusEdit}
                            className="p-2 bg-[#FF5C00] hover:bg-[#FF751A] text-black rounded-xl cursor-pointer shadow flex items-center justify-center transition-all"
                            title="Save changes"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditingFocus(false)}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl cursor-pointer transition-all flex items-center justify-center"
                            title="Cancel edit"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleStartFocusEdit}
                            className="p-2 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                            title="Edit Area of FOCUS"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {onDeleteCollection && (
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteCollection(activeCollection.id);
                              }}
                              className="p-2 text-white/40 hover:text-red-500 hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                              title="Delete Area of FOCUS"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Feasibility Reality Check Card */}
                  <div className={`p-5 rounded-2xl border ${
                    feasibility.level === 'CRITICAL' 
                      ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                      : feasibility.level === 'WARNING'
                      ? 'bg-[#FF5C00]/10 border-[#FF5C00]/25 text-[#FF5C00]'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        feasibility.level === 'CRITICAL' ? 'bg-red-500 text-white' : feasibility.level === 'WARNING' ? 'bg-[#FF5C00] text-black' : 'bg-emerald-500 text-white'
                      }`}>
                        {feasibility.level === 'CRITICAL' ? <ShieldAlert className="w-5 h-5" /> : feasibility.level === 'WARNING' ? <AlertCircle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-white/60">
                          SAND REALITY CHECK
                        </span>
                        <h4 className="text-sm font-display font-bold">{feasibility.message}</h4>
                        <p className="text-xs opacity-90 leading-relaxed">{feasibility.advice}</p>
                      </div>
                    </div>
                  </div>

                  {/* Execution Mode Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">
                      Work Execution Style
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['sequential', 'parallel', 'hybrid'] as const).map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => onUpdateCollectionMode(activeCollection.id, mode)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            activeCollection.workMode === mode
                              ? 'bg-[#FF5C00] border-[#FF5C00] text-black font-bold'
                              : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20'
                          }`}
                        >
                          <div className="text-xs font-mono uppercase font-bold">{mode}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sand Budget Slider */}
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="flex justify-between items-center text-xs font-mono text-white/60">
                      <span>BUDGETED CAPACITY:</span>
                      <span className="text-[#FF5C00] font-bold">{budgetedHours} Hours</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="150"
                      step="5"
                      value={budgetedHours}
                      onChange={(e) => onUpdateCollectionBudget(activeCollection.id, parseInt(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF5C00]"
                    />
                  </div>

                  {/* Bound Projects */}
                  <div className="space-y-3 pt-3 border-t border-white/10">
                    <h4 className="text-xs font-mono font-bold text-white/60 uppercase tracking-wider">
                      Bound Projects ({linkedProjects.length})
                    </h4>
                    {linkedProjects.length > 0 ? (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {linkedProjects.map(p => {
                          const pProg = getProjectProgress(p);
                          return (
                            <div key={p.id} className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                              <div className="flex justify-between items-center">
                                <h5 className="text-xs font-bold text-white">{p.title}</h5>
                                <span className="text-[10px] font-mono bg-black px-2 py-0.5 rounded border border-white/10 text-[#FF5C00] font-bold">
                                  {pProg}%
                                </span>
                              </div>
                              <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                                <div className="bg-[#FF5C00] h-full rounded-full" style={{ width: `${pProg}%` }}></div>
                              </div>
                              {p.phases.map((ph, phIdx) => (
                                <div key={ph.id} className="space-y-1 pt-1">
                                  <span className="text-[9px] font-mono text-white/40 uppercase">Phase {phIdx + 1}: {ph.title}</span>
                                  {ph.tasks.map(t => (
                                    <div 
                                      key={t.id} 
                                      onClick={() => handleToggleTask(p.id, ph.id, t.id)}
                                      className="flex items-center gap-2 text-xs text-white/80 hover:text-white cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={t.completed}
                                        onChange={() => handleToggleTask(p.id, ph.id, t.id)}
                                        className="w-3.5 h-3.5 rounded border-white/20 bg-black text-[#FF5C00] focus:ring-0 cursor-pointer"
                                      />
                                      <span className={t.completed ? 'line-through text-white/40' : ''}>{t.title}</span>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-white/40 font-mono">No projects assigned to this Area of FOCUS.</p>
                    )}
                  </div>
                </div>

                {/* DELETE FOCUS BUTTON WHEN EDITING */}
                {isEditingFocus && (
                  <div className="pt-6 border-t border-white/10 flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (onDeleteCollection) {
                          onDeleteCollection(activeCollection.id);
                        }
                        setIsEditingFocus(false);
                      }}
                      className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-2xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
                    >
                      <Trash2 className="w-4 h-4" /> Delete this Area of FOCUS
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#151515] rounded-3xl p-12 text-center border border-white/10">
                <p className="text-white/40 font-sans">Select an item on the left to view details.</p>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* DETAIL EDIT MODAL */}
      <AnimatePresence>
        {showMobileDetailModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border relative max-h-[90vh] flex flex-col transition-colors ${
                theme === 'light'
                  ? 'bg-white text-gray-900 border-gray-200'
                  : 'bg-[#121212] text-white border-white/10'
              }`}
            >
              {activeItemType === 'project' && activeProject ? (
                <>
                  {/* Fixed Non-Scrollable Header */}
                  <div className={`p-4 sm:p-5 border-b flex items-start justify-between gap-3 shrink-0 ${
                    theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-white/10 bg-white/[0.02]'
                  }`}>
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="text-[10px] font-mono text-[#FF5C00] uppercase font-bold">{activeProject.recipeTitle}</span>
                      {isEditingProject ? (
                        <input
                          type="text"
                          value={editProjectTitle}
                          onChange={(e) => setEditProjectTitle(e.target.value)}
                          className={`border rounded-xl px-3 py-1.5 text-base font-display font-bold w-full focus:outline-none focus:border-[#FF5C00] ${
                            theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-black border-white/20 text-white'
                          }`}
                          placeholder="Project title..."
                          autoFocus
                        />
                      ) : (
                        <h3 
                          onDoubleClick={handleStartProjectEdit}
                          title="Double-click to edit project title"
                          className="text-lg font-bold cursor-pointer hover:text-[#FF5C00] leading-snug"
                        >
                          {activeProject.title}
                        </h3>
                      )}
                    </div>

                    {/* Interaction Buttons & Close Button Cluster */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isEditingProject ? (
                        <>
                          <button
                            type="button"
                            onClick={handleSaveProjectEdit}
                            className="p-2 bg-[#FF5C00] hover:bg-[#FF751A] text-black rounded-xl cursor-pointer shadow flex items-center justify-center transition-all"
                            title="Save changes"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingProject(false);
                              setShowMobileDetailModal(false);
                            }}
                            className={`p-2 rounded-xl cursor-pointer transition-all flex items-center justify-center ${
                              theme === 'light' ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                            title="Cancel edit"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleStartProjectEdit}
                            className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                              theme === 'light' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
                            }`}
                            title="Edit project"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleDeleteProject(activeProject.id);
                              setShowMobileDetailModal(false);
                            }}
                            className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                              theme === 'light' ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-white/40 hover:text-red-500 hover:bg-white/5'
                            }`}
                            title="Delete project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Close Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowMobileDetailModal(false);
                          setIsEditingProject(false);
                        }}
                        className={`p-2 rounded-xl transition-all border cursor-pointer ml-1 ${
                          theme === 'light'
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                            : 'bg-black/70 hover:bg-black text-white/60 hover:text-white border-white/10'
                        }`}
                        title="Close modal"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Body */}
                  <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
                    <div className="space-y-4">
                      {isEditingProject ? (
                        <div className="space-y-5">
                          {editPhases.map((ph, pIdx) => (
                            <div 
                              key={ph.id || `mobile-edit-ph-${pIdx}`} 
                              className={`p-3 rounded-2xl border space-y-2 transition-all ${
                                dragOverPhaseIdx === pIdx ? 'border-[#FF5C00] bg-[#FF5C00]/10' : theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-black/60 border-white/10'
                              }`}
                              onDragOver={(e) => handlePhaseDragOver(e, pIdx)}
                              onDrop={(e) => handlePhaseContainerTaskDrop(e, pIdx)}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div 
                                    className="group relative cursor-grab active:cursor-grabbing p-0.5 rounded shrink-0"
                                    draggable
                                    onDragStart={(e) => handlePhaseDragStart(e, pIdx)}
                                    onDragOver={(e) => handlePhaseDragOver(e, pIdx)}
                                    onDrop={(e) => handlePhaseDrop(e, pIdx)}
                                    title="Click, hold & drag vertically to reorder phase"
                                  >
                                    <span className="bg-[#FF5C00]/20 text-[#FF5C00] group-hover:bg-[#FF5C00] group-hover:text-black w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] shrink-0 font-bold font-mono transition-all">
                                      <span className="group-hover:hidden">{pIdx + 1}</span>
                                      <GripVertical className="w-3.5 h-3.5 hidden group-hover:block" />
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    value={ph.title}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setEditPhases(prev => prev.map((p, i) => i === pIdx ? { ...p, title: val } : p));
                                    }}
                                    className={`border rounded-lg px-2.5 py-1 text-xs font-bold w-full focus:outline-none focus:border-[#FF5C00] ${
                                      theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-black border-white/20 text-white'
                                    }`}
                                    placeholder="Phase title..."
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhase(pIdx)}
                                  className="p-1 text-white/40 hover:text-red-400 rounded cursor-pointer"
                                  title="Delete phase"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Tasks inside phase */}
                              <div className="space-y-1.5 pl-2">
                                {ph.tasks.map((t, tIdx) => (
                                  <div
                                    key={t.id || `mobile-edit-t-${tIdx}`}
                                    draggable
                                    onDragStart={(e) => handleTaskDragStart(e, pIdx, tIdx)}
                                    onDragOver={(e) => handleTaskDragOver(e, pIdx, tIdx)}
                                    onDrop={(e) => handleTaskDrop(e, pIdx, tIdx)}
                                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
                                      dragOverTask?.phaseIdx === pIdx && dragOverTask?.taskIdx === tIdx
                                        ? 'border-[#FF5C00] bg-[#FF5C00]/10'
                                        : theme === 'light' ? 'bg-white border-gray-200' : 'bg-black/40 border-white/10'
                                    }`}
                                  >
                                    <div 
                                      className="cursor-grab active:cursor-grabbing text-white/40 hover:text-[#FF5C00] shrink-0 p-1"
                                      title="Click, hold & drag vertically to reorder task or move to another phase"
                                    >
                                      <GripVertical className="w-3.5 h-3.5" />
                                    </div>

                                    <input
                                      type="checkbox"
                                      checked={t.completed}
                                      disabled
                                      className="w-3.5 h-3.5 rounded border-white/20 bg-black text-[#FF5C00] opacity-30 cursor-not-allowed shrink-0"
                                    />

                                    <input
                                      type="text"
                                      value={t.title}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setEditPhases(prev => prev.map((p, i) => i === pIdx ? {
                                          ...p,
                                          tasks: p.tasks.map((tk, j) => j === tIdx ? { ...tk, title: val } : tk)
                                        } : p));
                                      }}
                                      className="bg-transparent border-0 border-b border-white/10 focus:border-[#FF5C00] text-xs text-white font-medium flex-1 focus:outline-none px-1 py-0.5"
                                      placeholder="Task description..."
                                    />

                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTask(pIdx, tIdx)}
                                      className="p-1 text-white/30 hover:text-red-400 rounded cursor-pointer"
                                      title="Delete task"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}

                                <button
                                  type="button"
                                  onClick={() => handleAddTaskToPhase(pIdx)}
                                  className="w-full py-1 border border-dashed border-white/20 hover:border-[#FF5C00]/50 hover:text-[#FF5C00] text-white/50 text-[10px] font-mono rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer mt-1"
                                >
                                  <Plus className="w-3 h-3" /> Add Task
                                </button>
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={handleAddPhase}
                            className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-[#FF5C00]" /> Add New Phase
                          </button>
                        </div>
                      ) : (
                        activeProject.phases.map((ph, pIdx) => {
                          const isPhaseComplete = ph.tasks.length > 0 && ph.tasks.every(t => t.completed);

                          return (
                            <div key={ph.id} className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-mono font-bold text-[#FF5C00] uppercase">Phase {pIdx + 1}: {ph.title}</span>
                                {isPhaseComplete && <span className="text-emerald-400 font-bold text-xs shrink-0">Complete!</span>}
                              </div>
                              {ph.tasks.map(t => (
                                <div
                                  key={t.id}
                                  onClick={() => handleToggleTask(activeProject.id, ph.id, t.id)}
                                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                    theme === 'light' ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'bg-white/5 border-white/10 hover:bg-white/10'
                                  }`}
                                >
                                  <span className={`text-xs ${t.completed ? 'line-through text-emerald-500' : ''}`}>{t.title}</span>
                                  <input type="checkbox" checked={t.completed} readOnly className="w-4 h-4 text-[#FF5C00]" />
                                </div>
                              ))}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Delete button when editing project */}
                    {isEditingProject && (
                      <div className="pt-4 border-t border-white/10 flex justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            handleDeleteProject(activeProject.id);
                            setIsEditingProject(false);
                            setShowMobileDetailModal(false);
                          }}
                          className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
                        >
                          <Trash2 className="w-4 h-4" /> Delete this project
                        </button>
                      </div>
                    )}

                    {activeProject.phases.every(ph => ph.tasks.every(t => t.completed)) && (
                      <button
                        type="button"
                        onClick={() => {
                          handleProjectCompleteAction(activeProject.id);
                          setShowMobileDetailModal(false);
                        }}
                        className="w-full py-3 bg-emerald-500 text-black font-black text-sm uppercase rounded-xl"
                      >
                        PROJECT COMPLETE!
                      </button>
                    )}
                  </div>
                </>
              ) : activeCollection ? (
                <>
                  {/* Fixed Non-Scrollable Header */}
                  <div className={`p-4 sm:p-5 border-b flex items-start justify-between gap-3 shrink-0 ${
                    theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-white/10 bg-white/[0.02]'
                  }`}>
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="text-[10px] font-mono text-[#FF5C00] uppercase font-bold">Area of FOCUS</span>
                      {isEditingFocus ? (
                        <div className="space-y-2 mt-1">
                          <input
                            type="text"
                            value={editFocusTitle}
                            onChange={(e) => setEditFocusTitle(e.target.value)}
                            className={`border rounded-xl px-3 py-1.5 text-sm font-display font-bold w-full focus:outline-none focus:border-[#FF5C00] ${
                              theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-black border-white/20 text-white'
                            }`}
                            placeholder="Area of Focus title..."
                            autoFocus
                          />
                          <textarea
                            value={editFocusDescription}
                            onChange={(e) => setEditFocusDescription(e.target.value)}
                            className={`border rounded-xl px-3 py-1.5 text-xs font-sans w-full focus:outline-none h-14 ${
                              theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-black border-white/20 text-white'
                            }`}
                            placeholder="Description..."
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono opacity-60">Budget (Hours):</span>
                            <input
                              type="number"
                              value={editFocusBudget}
                              onChange={(e) => setEditFocusBudget(Number(e.target.value))}
                              className={`border rounded-xl px-3 py-1 text-xs w-20 font-mono font-bold ${
                                theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-black border-white/20 text-white'
                              }`}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 
                            onDoubleClick={handleStartFocusEdit}
                            className="text-lg font-bold cursor-pointer hover:text-[#FF5C00] leading-snug"
                          >
                            {activeCollection.title}
                          </h3>
                          {activeCollection.description && (
                            <p className="text-xs opacity-60">{activeCollection.description}</p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Interaction Buttons & Close Button Cluster */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isEditingFocus ? (
                        <>
                          <button
                            type="button"
                            onClick={handleSaveFocusEdit}
                            className="p-2 bg-[#FF5C00] hover:bg-[#FF751A] text-black rounded-xl cursor-pointer shadow flex items-center justify-center transition-all"
                            title="Save changes"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingFocus(false);
                              setShowMobileDetailModal(false);
                            }}
                            className={`p-2 rounded-xl cursor-pointer transition-all flex items-center justify-center ${
                              theme === 'light' ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                            title="Cancel edit"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleStartFocusEdit}
                            className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                              theme === 'light' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
                            }`}
                            title="Edit Area of FOCUS"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {onDeleteCollection && (
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteCollection(activeCollection.id);
                                setShowMobileDetailModal(false);
                              }}
                              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                                theme === 'light' ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-white/40 hover:text-red-500 hover:bg-white/5'
                              }`}
                              title="Delete Area of FOCUS"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}

                      {/* Close Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowMobileDetailModal(false);
                          setIsEditingFocus(false);
                        }}
                        className={`p-2 rounded-xl transition-all border cursor-pointer ml-1 ${
                          theme === 'light'
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                            : 'bg-black/70 hover:bg-black text-white/60 hover:text-white border-white/10'
                        }`}
                        title="Close modal"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Body */}
                  <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
                    {/* Delete button when editing focus */}
                    {isEditingFocus && (
                      <div className="pt-2 flex justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (onDeleteCollection) {
                              onDeleteCollection(activeCollection.id);
                            }
                            setIsEditingFocus(false);
                            setShowMobileDetailModal(false);
                          }}
                          className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
                        >
                          <Trash2 className="w-4 h-4" /> Delete this Area of FOCUS
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
