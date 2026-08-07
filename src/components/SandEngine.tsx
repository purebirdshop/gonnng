import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Collection, Project, Recipe, Phase } from '../types';
import { AlertCircle, ShieldAlert, Hourglass, ShieldCheck, Trash2, CheckCircle, X, Edit2, Save, Layers, Target, GripVertical, Plus, Search, GitFork, BookOpen, PrinterCheck, FolderKanban, Bookmark } from 'lucide-react';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import PrintPreviewModal, { PrintableItem } from './PrintPreviewModal';
import { ENABLE_AREA_OF_FOCUS } from '../featureFlags';

interface SandEngineProps {
  collections: Collection[];
  sessionProjects: Project[];
  allProjects?: Project[];
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
  savedRecipeIds?: string[];
  onToggleSaveRecipe?: (recipeId: string) => void;

  initialTab?: 'projects' | 'focus' | 'library';
  onTabChange?: (tab: 'projects' | 'focus' | 'library') => void;
  currentUser?: { id?: string; name?: string; avatarUrl?: string; avatar?: string; privacyDefault?: 'public' | 'private' };
  setShowSearchModal?: (show: boolean) => void;
  setEditingRecipe?: (recipe: Recipe | null) => void;
  setForkInitialData?: (recipe: Recipe | null) => void;
  handleInstantiateRecipe?: (recipe: Recipe) => void;
}

export default function SandEngine({ 
  collections, 
  sessionProjects: rawSessionProjects, 
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
  savedRecipeIds = [],
  onToggleSaveRecipe,
  initialTab = 'projects',
  onTabChange,
  currentUser,
  setShowSearchModal,
  setEditingRecipe,
  setForkInitialData,
  handleInstantiateRecipe
}: SandEngineProps) {
  const [topTab, setTopTab] = useState<'projects' | 'focus' | 'library'>(!ENABLE_AREA_OF_FOCUS && initialTab === 'focus' ? 'projects' : initialTab);
  const [activeItemType, setActiveItemType] = useState<'project' | 'focus'>('project');
  const [selectedColId, setSelectedColId] = useState<string>(collections[0]?.id || '');
  const [customBudgetHours, setCustomBudgetHours] = useState<number>(80);
  const [showMobileDetailModal, setShowMobileDetailModal] = useState(false);
  const [visibleActiveProjectsCount, setVisibleActiveProjectsCount] = useState<number>(15);

  useEffect(() => {
    if (initialTab) {
      const effectiveTab = !ENABLE_AREA_OF_FOCUS && initialTab === 'focus' ? 'projects' : initialTab;
      setTopTab(effectiveTab);
      if (effectiveTab === 'projects') setActiveItemType('project');
      if (effectiveTab === 'focus' && ENABLE_AREA_OF_FOCUS) setActiveItemType('focus');
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

  // Printable Copy Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printableItem, setPrintableItem] = useState<PrintableItem | null>(null);

  const handleOpenPrintModal = (item: PrintableItem) => {
    setPrintableItem(item);
    setPrintModalOpen(true);
  };

  // Delete Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const confirmDeleteProject = (projId: string, projTitle?: string, onCloseModal?: () => void) => {
    setDeleteConfirm({
      isOpen: true,
      title: "Are you sure?",
      message: `Are you sure you want to delete ${projTitle ? `"${projTitle}"` : 'this project'}? This action cannot be undone.`,
      onConfirm: () => {
        handleDeleteProject(projId);
        if (onCloseModal) onCloseModal();
        setDeleteConfirm(null);
      }
    });
  };

  const confirmDeleteFocus = (focusId: string, focusTitle?: string, onCloseModal?: () => void) => {
    setDeleteConfirm({
      isOpen: true,
      title: "Are you sure?",
      message: `Are you sure you want to delete ${focusTitle ? `"${focusTitle}"` : 'this Area of FOCUS'}? This action cannot be undone.`,
      onConfirm: () => {
        if (onDeleteCollection) onDeleteCollection(focusId);
        if (onCloseModal) onCloseModal();
        setDeleteConfirm(null);
      }
    });
  };

  const confirmDeletePhase = (pIdx: number, phaseTitle?: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: "Are you sure?",
      message: `Are you sure you want to delete ${phaseTitle ? `"${phaseTitle}"` : `Phase ${pIdx + 1}`}?`,
      onConfirm: () => {
        handleRemovePhase(pIdx);
        setDeleteConfirm(null);
      }
    });
  };

  const confirmDeleteTask = (pIdx: number, tIdx: number, taskTitle?: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: "Are you sure?",
      message: `Are you sure you want to delete ${taskTitle ? `"${taskTitle}"` : 'this task'}?`,
      onConfirm: () => {
        handleRemoveTask(pIdx, tIdx);
        setDeleteConfirm(null);
      }
    });
  };

  // sessionProjects is the initial query result filtered for the session of the signed-in user
  const sessionProjects = rawSessionProjects || allProjects || [];
  const userProjects = sessionProjects;

  // Recipes in Process > LIBRARY: created by authenticated user OR saved/bookmarked by authenticated user
  const userLibraryRecipes = (recipes || []).filter(recipe => {
    const isAuthor = Boolean(
      (recipe.authorId && currentUser?.id && recipe.authorId === currentUser.id) ||
      (recipe.authorName && currentUser?.name && recipe.authorName.toLowerCase() === currentUser.name.toLowerCase()) ||
      recipe.isCustom ||
      recipe.authorName === 'You' ||
      recipe.authorName === 'Creative Architect'
    );
    const isSaved = (savedRecipeIds || []).includes(recipe.id);
    return isAuthor || isSaved;
  });

  const activeCollection = collections.find(c => c.id === selectedColId) || collections[0];

  // Derive projects linked to active collection
  const linkedProjects = activeCollection 
    ? userProjects.filter(p => p.collectionId === activeCollection.id || activeCollection.projectIds.includes(p.id))
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

  // Sorting Projects: Active (uncompleted) first sorted from most recent first, Completed at the bottom
  const activeProjectsList = [...userProjects.filter(p => !p.isCompleted)].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA !== timeB) return timeB - timeA;
    return b.id.localeCompare(a.id);
  });

  const completedProjectsList = [...userProjects.filter(p => p.isCompleted)].sort((a, b) => {
    const timeA = a.completedAt ? new Date(a.completedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const timeB = b.completedAt ? new Date(b.completedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    if (timeA !== timeB) return timeB - timeA;
    return b.id.localeCompare(a.id);
  });

  const visibleActiveProjects = activeProjectsList.slice(0, visibleActiveProjectsCount);
  const sortedProjects = [...visibleActiveProjects, ...completedProjectsList];

  const isProjectInLibrary = activeProject ? (recipes?.some(r => r.id === activeProject.recipeId || r.title.trim().toLowerCase() === activeProject.title.trim().toLowerCase()) || false) : false;

  const handleSaveProjectToLibrary = () => {
    if (!activeProject || !onAddRecipe) return;
    const newRecipe: Recipe = {
      id: `recipe-proj-${Date.now()}`,
      title: activeProject.title,
      authorId: currentUser?.id || 'user-current',
      authorName: currentUser?.name || 'Creative Architect',
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
        authorId: currentUser?.id || 'user-current',
        authorName: currentUser?.name || 'Creative Architect',
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
                if (onTabChange) onTabChange('projects');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                topTab === 'projects'
                  ? 'bg-[#FF5C00] text-black shadow-md font-black'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> PROJECTS
            </button>
            {ENABLE_AREA_OF_FOCUS && (
              <button
                id="sand-tab-focus"
                type="button"
                onClick={() => {
                  setTopTab('focus');
                  setActiveItemType('focus');
                  if (onTabChange) onTabChange('focus');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  topTab === 'focus'
                    ? 'bg-[#FF5C00] text-black shadow-md font-black'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Target className="w-3.5 h-3.5" /> FOCUS
              </button>
            )}
            <button
              id="sand-tab-library"
              type="button"
              onClick={() => {
                setTopTab('library');
                if (onTabChange) onTabChange('library');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                topTab === 'library'
                  ? 'bg-[#FF5C00] text-black shadow-md font-black'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
            </div>
          ) : (
            <button
              id="dashboard-top-add-btn"
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Plus className="w-4 h-4" /> {topTab === 'projects' || !ENABLE_AREA_OF_FOCUS ? 'New Project' : 'Create Area of FOCUS'}
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

            {userLibraryRecipes && userLibraryRecipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userLibraryRecipes.map((recipe, idx) => {
                  const isSaved = (savedRecipeIds || []).includes(recipe.id);
                  const isAuthor = Boolean(
                    (recipe.authorId && currentUser?.id && recipe.authorId === currentUser.id) ||
                    (recipe.authorName && currentUser?.name && recipe.authorName.toLowerCase() === currentUser.name.toLowerCase()) ||
                    recipe.isCustom ||
                    recipe.authorName === 'You' ||
                    recipe.authorName === 'Creative Architect'
                  );

                  return (
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
                            {isAuthor && (
                              <button
                                type="button"
                                id={`edit-recipe-${recipe.id}`}
                                onClick={() => {
                                  if (setEditingRecipe) setEditingRecipe(recipe);
                                  if (setForkInitialData) setForkInitialData(null);
                                  if (setShowCreateModal) setShowCreateModal(true);
                                }}
                                className="p-1 bg-white/5 hover:bg-[#FF5C00] text-white/70 hover:text-black rounded-lg transition-all cursor-pointer flex items-center justify-center border border-white/10"
                                title="Edit Recipe Blueprint"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              id={`bookmark-recipe-${recipe.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onToggleSaveRecipe) onToggleSaveRecipe(recipe.id);
                              }}
                              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center border ${
                                isSaved
                                  ? 'bg-[#FF5C00] text-black border-[#FF5C00] font-bold shadow-sm'
                                  : 'bg-white/5 hover:bg-[#FF5C00]/20 text-white/70 hover:text-[#FF5C00] border-white/10'
                              }`}
                              title={isSaved ? "Saved in your Library (Click to remove)" : "Save / Bookmark to Library"}
                            >
                              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-black' : ''}`} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-lg font-display font-bold text-white">{recipe.title}</h3>
                            <button
                              type="button"
                              onClick={() => handleOpenPrintModal({
                                id: recipe.id,
                                type: 'recipe',
                                title: recipe.title,
                                description: recipe.description,
                                authorName: recipe.authorName,
                                category: recipe.category,
                                phases: recipe.phases,
                                tags: recipe.tags,
                                gongsCount: recipe.gongsCount,
                              })}
                              className="p-1.5 bg-white/5 hover:bg-[#FF5C00] text-white/70 hover:text-black rounded-lg transition-all cursor-pointer flex items-center justify-center border border-white/10 shrink-0"
                              title="Printable Copy"
                            >
                              <PrinterCheck className="w-4 h-4 stroke-[2]" />
                            </button>
                          </div>
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
                              <div key={`rec-ph-${recipe.id}-${phIdx}`} className="flex gap-2 items-center text-xs text-white/80 font-sans">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C00]"></span>
                                <strong className="font-semibold text-white">{ph.title}</strong>
                                <span className="text-[10px] text-white/40 font-mono">({ph.tasks.length} {ph.tasks.length === 1 ? 'task' : 'tasks'})</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tags display */}
                        <div className="flex gap-1 pt-2 flex-wrap">
                          {recipe.tags.map((tag, tagIdx) => (
                            <span key={`tag-${tag}-${tagIdx}`} className="text-[9px] font-mono bg-white/5 text-white/40 px-2 py-0.5 rounded-full border border-white/10">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons with Fork button in lower left corner */}
                      <div className="border-t border-white/10 pt-4 mt-6 flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            id={`fork-recipe-${recipe.id}`}
                            onClick={() => {
                              if (setForkInitialData) setForkInitialData(recipe);
                              if (setEditingRecipe) setEditingRecipe(null);
                              if (setShowCreateModal) setShowCreateModal(true);
                            }}
                            className="px-2.5 py-1.5 bg-white/5 hover:bg-[#FF5C00] text-white/70 hover:text-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border border-white/10 text-[11px] font-mono font-semibold"
                            title="Fork Recipe Blueprint"
                          >
                            <GitFork className="w-3 h-3.5" />
                            <span>Fork</span>
                          </button>
                          <span className="text-[10px] text-white/40 font-mono hidden sm:inline">
                            {recipe.phases.reduce((s, p) => s + p.tasks.length, 0)} CHECKS
                          </span>
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
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#151515] border border-white/10 p-12 rounded-3xl text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#FF5C00]/10 border border-[#FF5C00]/20 flex items-center justify-center mx-auto text-[#FF5C00]">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white font-display">No Process Blueprints in Library</h4>
                  <p className="text-xs text-white/60 max-w-md mx-auto leading-relaxed">
                    Your process blueprint library is currently empty. Create or publish your first recipe blueprint to build your sequence collection!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (setEditingRecipe) setEditingRecipe(null);
                    if (setForkInitialData) setForkInitialData(null);
                    if (setShowCreateModal) setShowCreateModal(true);
                  }}
                  className="px-5 py-2.5 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black text-xs rounded-xl shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer mt-2"
                >
                  <Plus className="w-4 h-4" /> New Recipe
                </button>
              </div>
            )}
          </div>
        ) : topTab === 'projects' ? (
          /* PROJECTS TAB - FULL VIEW TILE GRID LAYOUT */
          <div className="w-full space-y-4" id="dashboard-projects-view">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-600">
                Active Projects ({sortedProjects.length})
              </span>
            </div>

            {sortedProjects.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sortedProjects.map(p => {
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
                          setShowMobileDetailModal(true);
                        }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-3.5 ${
                          isSelected
                            ? isCompleted
                              ? 'bg-emerald-50 border-2 border-emerald-500 text-gray-900 shadow-md ring-2 ring-emerald-500/20'
                              : 'bg-orange-50 border-2 border-[#FF5C00] text-gray-900 shadow-md ring-2 ring-[#FF5C00]/20'
                            : isCompleted
                            ? 'bg-gray-50 border border-emerald-200 text-gray-700 hover:border-emerald-400'
                            : 'bg-white border border-gray-200 text-gray-900 shadow-sm hover:border-[#FF5C00]/60 hover:shadow-md'
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-start gap-2">
                            <span className="bg-[#FF5C00]/15 text-[#FF5C00] font-mono text-[9px] uppercase px-2 py-0.5 rounded font-bold tracking-wider truncate max-w-[150px]">
                              {p.recipeTitle}
                            </span>
                            <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded shrink-0 font-bold ${
                              isCompleted
                                ? 'bg-emerald-500/20 text-emerald-700 border border-emerald-500/30'
                                : 'bg-[#FF5C00] text-black shadow-sm'
                            }`}>
                              {isCompleted ? 'COMPLETED' : `${progress}%`}
                            </span>
                          </div>

                          <div>
                            <h5 className={`text-sm font-bold leading-snug truncate ${
                              isCompleted ? 'line-through text-gray-400' : 'text-gray-900'
                            }`}>
                              {p.title}
                            </h5>
                            <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                              Created: {new Date(p.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden border border-gray-200">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500' : 'bg-[#FF5C00]'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          {/* Milestones & Phases Summary */}
                          <div className="space-y-1 pt-1">
                            <p className="text-[9px] font-mono text-gray-500 uppercase tracking-wider font-semibold">
                              Phases ({p.phases.length})
                            </p>
                            <div className="space-y-0.5 max-h-20 overflow-y-auto pr-1">
                              {p.phases.slice(0, 3).map((ph, phIdx) => {
                                const phDone = ph.tasks.filter(t => t.completed).length;
                                const phTotal = ph.tasks.length;
                                const phComplete = phTotal > 0 && phDone === phTotal;
                                return (
                                  <div key={`ph-summary-${p.id}-${phIdx}`} className="flex justify-between items-center text-[11px] text-gray-600">
                                    <div className="flex items-center gap-1.5 truncate">
                                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${phComplete ? 'bg-emerald-500' : 'bg-[#FF5C00]'}`} />
                                      <span className={`truncate ${phComplete ? 'line-through text-gray-400' : ''}`}>
                                        {ph.title}
                                      </span>
                                    </div>
                                    <span className="text-[9px] font-mono text-gray-400 shrink-0">
                                      {phDone}/{phTotal}
                                    </span>
                                  </div>
                                );
                              })}
                              {p.phases.length > 3 && (
                                <p className="text-[9px] font-mono text-gray-400 italic">
                                  +{p.phases.length - 3} more phases...
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tile Action Bar */}
                        <div className="pt-2.5 border-t border-gray-200/80 flex items-center justify-between gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-gray-500">
                            Click to View Details
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPrintModal({
                                  id: p.id,
                                  type: 'project',
                                  title: p.title,
                                  recipeTitle: p.recipeTitle,
                                  phases: p.phases,
                                  progressPhotos: p.progressPhotos,
                                  createdAt: p.createdAt,
                                  completedAt: p.completedAt,
                                });
                              }}
                              className="p-1.5 bg-gray-100 hover:bg-[#FF5C00] text-gray-600 hover:text-black rounded-lg transition-all cursor-pointer"
                              title="Printable Copy"
                            >
                              <PrinterCheck className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDeleteProject(p.id, p.title);
                              }}
                              className="p-1.5 bg-gray-100 hover:bg-red-600 text-gray-600 hover:text-white rounded-lg transition-all cursor-pointer"
                              title="Delete Project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {activeProjectsList.length > visibleActiveProjectsCount && (
                  <button
                    type="button"
                    id="sand-more-projects-btn"
                    onClick={() => setVisibleActiveProjectsCount(prev => prev + 9)}
                    className="w-full py-2.5 px-4 mt-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border shadow-sm bg-gray-100 hover:bg-gray-200 text-[#FF5C00] border-[#FF5C00]/30"
                  >
                    More Projects... ({activeProjectsList.length - visibleActiveProjectsCount} remaining)
                  </button>
                )}
              </>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center space-y-3 my-2">
                <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 text-[#FF5C00] flex items-center justify-center mx-auto">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-gray-900 font-display">No Active Projects</h5>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    You don't have any active projects yet. Start a new project or create a custom blueprint!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (setEditingRecipe) setEditingRecipe(null);
                    if (setForkInitialData) setForkInitialData(null);
                    if (setShowCreateModal) setShowCreateModal(true);
                  }}
                  className="px-3.5 py-2 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> New Project
                </button>
              </div>
            )}
          </div>
        ) : (
          /* FOCUS TAB - 2-COLUMN LAYOUT WITH SIDEBAR & RIGHT DETAIL VIEW */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full min-w-0 items-stretch" id="dashboard-grid">
            
            {/* LEFT SIDE: FOCUS List */}
            <div className="w-full min-w-0 md:h-full flex flex-col" id="dashboard-sidebar">
              <div className="rounded-none border-0 px-0 pt-[12px] pb-0 sm:p-5 shadow-sm space-y-4 w-full min-w-0 md:h-full md:flex md:flex-col md:justify-between bg-white text-gray-900" id="dashboard-sidebar-inner">
                <div className="space-y-3">
                  {/* Header title for active list */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-600">
                      Areas of Focus ({collections.length})
                    </span>
                  </div>

                  {/* List Content */}
                  <div className="space-y-2.5 max-md:max-h-none max-md:overflow-visible md:max-h-[520px] md:overflow-y-auto pr-0 md:pr-1">
                    {collections.length > 0 ? (
                      collections.map(col => {
                        const colProjects = sessionProjects.filter(p => p.collectionId === col.id || col.projectIds.includes(p.id));
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
                                  ? 'bg-emerald-100 border-2 border-emerald-500 text-gray-900 shadow-md ring-2 ring-emerald-500/20'
                                  : 'bg-orange-100 border-2 border-[#FF5C00] text-gray-900 shadow-md ring-2 ring-[#FF5C00]/20'
                                : isCompleted
                                ? 'bg-emerald-50/60 border border-emerald-200 text-gray-700 opacity-80 hover:opacity-100'
                                : 'bg-white border border-gray-200 text-gray-900 shadow-sm hover:border-[#FF5C00]/50'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <h4 className={`text-[9px] font-mono font-bold uppercase truncate ${
                                  isCompleted ? 'text-gray-400 font-normal' : 'text-[#FF5C00]'
                                }`}>
                                  {colProjects.length} {colProjects.length === 1 ? 'PROJECT' : 'PROJECTS'} {col.budgetedHours ? `• ${col.budgetedHours}H` : ''}
                                </h4>
                                <h5 className={`text-xs font-bold truncate mt-0.5 ${
                                  isCompleted 
                                    ? 'line-through text-gray-400' 
                                    : 'text-gray-900'
                                }`}>
                                  {col.title}
                                </h5>
                              </div>
                              <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded shrink-0 font-bold ${
                                isCompleted
                                  ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                                  : 'bg-[#FF5C00] text-black shadow-sm'
                              }`}>
                                {progress}%
                              </span>
                            </div>

                            <div className={`w-full rounded-full h-1 mt-2.5 overflow-hidden ${
                              isCompleted 
                                ? 'bg-gray-200' 
                                : 'bg-gray-200'
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
                      <div className="text-center py-8 text-gray-500 text-xs font-sans">
                        No Areas of FOCUS created yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          {/* RIGHT SIDE DETAILED VIEWER (Desktop inline) */}
          <div className="hidden md:block md:col-span-2 space-y-6 w-full min-w-0" id="dashboard-details">
            {activeItemType === 'project' && activeProject ? (
              /* --- PROJECT VIEWER --- */
              <div className="rounded-3xl border p-3.5 sm:p-5 md:p-6 shadow-sm space-y-6 w-full min-w-0 h-full flex flex-col justify-between bg-white border-gray-200 text-gray-900 shadow-md">
                <div className="space-y-6">
                  {/* Project Header with double-click edit */}
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-200 w-full min-w-0">
                    <div className="min-w-0 flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="bg-gray-100 text-gray-700 border border-gray-200 font-mono text-[9px] uppercase px-2 py-0.5 rounded font-bold truncate max-w-[150px]">
                          {activeProject.recipeTitle}
                        </span>
                        <span className="text-[10px] font-mono text-gray-500 uppercase">
                          Created: {new Date(activeProject.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[9px] font-mono text-[#FF5C00] bg-[#FF5C00]/10 px-2 py-0.5 rounded border border-[#FF5C00]/20 font-semibold">
                          💡 Double-click title to edit
                        </span>
                      </div>

                      {isEditingProject ? (
                        <div className="mt-2 w-full">
                          <input
                            type="text"
                            value={editProjectTitle}
                            onChange={(e) => setEditProjectTitle(e.target.value)}
                            className="bg-white border-2 border-[#FF5C00] rounded-xl px-3 py-2 text-lg sm:text-xl font-display font-bold text-gray-900 w-full focus:outline-none"
                            placeholder="Project title..."
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3 mt-1.5 w-full min-w-0">
                          <h2 
                            onDoubleClick={handleStartProjectEdit}
                            title="Double-click to edit project title"
                            className="text-xl sm:text-2xl font-display font-bold text-gray-900 break-words cursor-pointer hover:text-[#FF5C00] transition-colors leading-snug w-full min-w-0 flex-1"
                          >
                            {activeProject.title}
                          </h2>
                          <button
                            type="button"
                            onClick={() => handleOpenPrintModal({
                              id: activeProject.id,
                              type: 'project',
                              title: activeProject.title,
                              recipeTitle: activeProject.recipeTitle,
                              phases: activeProject.phases,
                              progressPhotos: activeProject.progressPhotos,
                              createdAt: activeProject.createdAt,
                              completedAt: activeProject.completedAt,
                            })}
                            className="p-2 bg-gray-100 hover:bg-[#FF5C00] text-gray-700 hover:text-black rounded-xl transition-all cursor-pointer flex items-center justify-center border border-gray-200 shrink-0"
                            title="Printable Copy"
                          >
                            <PrinterCheck className="w-4 h-4 stroke-[2]" />
                          </button>
                        </div>
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
                            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl cursor-pointer transition-all flex items-center justify-center"
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
                            className="p-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                            title="Edit project"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            id={`delete-project-btn-${activeProject.id}`}
                            type="button"
                            onClick={() => confirmDeleteProject(activeProject.id, activeProject.title)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer flex items-center justify-center"
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
                                onClick={() => confirmDeletePhase(pIdx, phase.title)}
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
                                    onClick={() => confirmDeleteTask(pIdx, tIdx, task.title)}
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
                          <div key={phase.id || `proj-phase-${pIdx}`} className="space-y-3 w-full min-w-0">
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
                              {phase.tasks.map((task, tIdx) => (
                                <div
                                  key={task.id || `proj-task-${pIdx}-${tIdx}`}
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
                        confirmDeleteProject(activeProject.id, activeProject.title, () => setIsEditingProject(false));
                      }}
                      className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-2xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
                    >
                      <Trash2 className="w-4 h-4" /> Delete this project
                    </button>
                  </div>
                )}
              </div>
            ) : activeItemType === 'focus' && ENABLE_AREA_OF_FOCUS && activeCollection ? (
              /* --- AREA OF FOCUS VIEWER --- */
              <div className="rounded-3xl border p-3.5 sm:p-5 md:p-6 shadow-sm space-y-6 w-full min-w-0 h-full flex flex-col justify-between bg-white border-gray-200 text-gray-900 shadow-md">
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
                                  confirmDeleteFocus(activeCollection.id, activeCollection.title, () => setIsEditingFocus(false));
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
                                confirmDeleteFocus(activeCollection.id, activeCollection.title);
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
                                <div key={ph.id || `bound-ph-${p.id}-${phIdx}`} className="space-y-1 pt-1">
                                  <span className="text-[9px] font-mono text-white/40 uppercase">Phase {phIdx + 1}: {ph.title}</span>
                                  {ph.tasks.map((t, tIdx) => (
                                    <div 
                                      key={t.id || `bound-t-${phIdx}-${tIdx}`} 
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
                        confirmDeleteFocus(activeCollection.id, activeCollection.title, () => setIsEditingFocus(false));
                      }}
                      className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-2xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
                    >
                      <Trash2 className="w-4 h-4" /> Delete this Area of FOCUS
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto text-[#FF5C00]">
                  <FolderKanban className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-gray-900 font-display">No Project Selected</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                    {sortedProjects.length === 0 
                      ? "You don't have any active projects. Create your first project to start tracking your process steps."
                      : "Select a project from the left sidebar to view its sequence phases and task progress."}
                  </p>
                </div>
                {sortedProjects.length === 0 && (
                  <button
                    onClick={() => {
                      if (setEditingRecipe) setEditingRecipe(null);
                      if (setForkInitialData) setForkInitialData(null);
                      if (setShowCreateModal) setShowCreateModal(true);
                    }}
                    className="px-4 py-2 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> New Project
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      </div>

      {/* DETAIL EDIT MODAL */}
      <AnimatePresence>
        {showMobileDetailModal && (
          <div className="fixed top-10 sm:top-14 inset-x-0 bottom-0 z-50 flex items-stretch justify-center p-2 sm:p-4 overflow-hidden bg-gray-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="rounded-2xl sm:rounded-3xl w-full h-full max-w-full overflow-hidden shadow-2xl border relative flex flex-col transition-colors bg-white text-gray-900 border-gray-200"
            >
              {activeItemType === 'project' && activeProject ? (
                <>
                  {/* Fixed Non-Scrollable Header */}
                  <div className="p-4 sm:p-5 border-b flex items-start justify-between gap-3 shrink-0 border-gray-200 bg-gray-50">
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="text-[10px] font-mono text-[#FF5C00] uppercase font-bold">{activeProject.recipeTitle}</span>
                      {isEditingProject ? (
                        <input
                          type="text"
                          value={editProjectTitle}
                          onChange={(e) => setEditProjectTitle(e.target.value)}
                          className="border rounded-xl px-3 py-1.5 text-base font-display font-bold w-full focus:outline-none focus:border-[#FF5C00] bg-white border-gray-300 text-gray-900"
                          placeholder="Project title..."
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <h3 
                            onDoubleClick={handleStartProjectEdit}
                            title="Double-click to edit project title"
                            className="text-lg font-bold cursor-pointer hover:text-[#FF5C00] leading-snug"
                          >
                            {activeProject.title}
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleOpenPrintModal({
                              id: activeProject.id,
                              type: 'project',
                              title: activeProject.title,
                              recipeTitle: activeProject.recipeTitle,
                              phases: activeProject.phases,
                              progressPhotos: activeProject.progressPhotos,
                              createdAt: activeProject.createdAt,
                              completedAt: activeProject.completedAt,
                            })}
                            className="p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center border shrink-0 bg-gray-100 hover:bg-[#FF5C00] text-gray-700 hover:text-black border-gray-200"
                            title="Printable Copy"
                          >
                            <PrinterCheck className="w-4 h-4 stroke-[2]" />
                          </button>
                        </div>
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
                            className="p-2 rounded-xl cursor-pointer transition-all flex items-center justify-center bg-gray-200 text-gray-700 hover:bg-gray-300"
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
                            className="p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center bg-gray-100 text-gray-700 hover:bg-gray-200"
                            title="Edit project"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              confirmDeleteProject(activeProject.id, activeProject.title, () => setShowMobileDetailModal(false));
                            }}
                            className="p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100"
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
                        className="p-2 rounded-full transition-all border cursor-pointer ml-1 shadow-sm shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border-gray-300"
                        title="Close modal"
                      >
                        <X className="w-5 h-5" />
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
                                dragOverPhaseIdx === pIdx ? 'border-[#FF5C00] bg-[#FF5C00]/10' : 'bg-gray-50 border-gray-200'
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
                                    className="border rounded-lg px-2.5 py-1 text-xs font-bold w-full focus:outline-none focus:border-[#FF5C00] bg-white border-gray-300 text-gray-900"
                                    placeholder="Phase title..."
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => confirmDeletePhase(pIdx, ph.title)}
                                  className="p-1 text-gray-400 hover:text-red-500 rounded cursor-pointer"
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
                                        : 'bg-white border-gray-200'
                                    }`}
                                  >
                                    <div 
                                      className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-[#FF5C00] shrink-0 p-1"
                                      title="Click, hold & drag vertically to reorder task or move to another phase"
                                    >
                                      <GripVertical className="w-3.5 h-3.5" />
                                    </div>

                                    <input
                                      type="checkbox"
                                      checked={t.completed}
                                      disabled
                                      className="w-3.5 h-3.5 rounded border-gray-300 bg-gray-100 text-[#FF5C00] opacity-30 cursor-not-allowed shrink-0"
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
                                      className="bg-transparent border-0 border-b border-gray-200 focus:border-[#FF5C00] text-xs text-gray-900 font-medium flex-1 focus:outline-none px-1 py-0.5"
                                      placeholder="Task description..."
                                    />

                                    <button
                                      type="button"
                                      onClick={() => confirmDeleteTask(pIdx, tIdx, t.title)}
                                      className="p-1 text-gray-400 hover:text-red-500 rounded cursor-pointer"
                                      title="Delete task"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}

                                <button
                                  type="button"
                                  onClick={() => handleAddTaskToPhase(pIdx)}
                                  className="w-full py-1 border border-dashed border-gray-300 hover:border-[#FF5C00]/50 hover:text-[#FF5C00] text-gray-500 text-[10px] font-mono rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer mt-1"
                                >
                                  <Plus className="w-3 h-3" /> Add Task
                                </button>
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={handleAddPhase}
                            className="w-full py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 font-mono text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-[#FF5C00]" /> Add New Phase
                          </button>
                        </div>
                      ) : (
                        activeProject.phases.map((ph, pIdx) => {
                          const isPhaseComplete = ph.tasks.length > 0 && ph.tasks.every(t => t.completed);

                          return (
                            <div key={ph.id || `mobile-ph-${pIdx}`} className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-mono font-bold text-[#FF5C00] uppercase">Phase {pIdx + 1}: {ph.title}</span>
                                {isPhaseComplete && <span className="text-emerald-600 font-bold text-xs shrink-0">Complete!</span>}
                              </div>
                              {ph.tasks.map((t, tIdx) => (
                                <div
                                  key={t.id || `mobile-t-${pIdx}-${tIdx}`}
                                  onClick={() => handleToggleTask(activeProject.id, ph.id, t.id)}
                                  className="p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all bg-gray-50 border-gray-200 hover:bg-gray-100"
                                >
                                  <span className={`text-xs ${t.completed ? 'line-through text-emerald-600' : ''}`}>{t.title}</span>
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
                      <div className="pt-4 border-t border-gray-200 flex justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            confirmDeleteProject(activeProject.id, activeProject.title, () => {
                              setIsEditingProject(false);
                              setShowMobileDetailModal(false);
                            });
                          }}
                          className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
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
              ) : activeCollection && ENABLE_AREA_OF_FOCUS ? (
                <>
                  {/* Fixed Non-Scrollable Header */}
                  <div className="p-4 sm:p-5 border-b flex items-start justify-between gap-3 shrink-0 border-gray-200 bg-gray-50">
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="text-[10px] font-mono text-[#FF5C00] uppercase font-bold">Area of FOCUS</span>
                      {isEditingFocus ? (
                        <div className="space-y-2 mt-1">
                          <input
                            type="text"
                            value={editFocusTitle}
                            onChange={(e) => setEditFocusTitle(e.target.value)}
                            className="border rounded-xl px-3 py-1.5 text-sm font-display font-bold w-full focus:outline-none focus:border-[#FF5C00] bg-white border-gray-300 text-gray-900"
                            placeholder="Area of Focus title..."
                            autoFocus
                          />
                          <textarea
                            value={editFocusDescription}
                            onChange={(e) => setEditFocusDescription(e.target.value)}
                            className="border rounded-xl px-3 py-1.5 text-xs font-sans w-full focus:outline-none h-14 bg-white border-gray-300 text-gray-900"
                            placeholder="Description..."
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono opacity-60">Budget (Hours):</span>
                            <input
                              type="number"
                              value={editFocusBudget}
                              onChange={(e) => setEditFocusBudget(Number(e.target.value))}
                              className="border rounded-xl px-3 py-1 text-xs w-20 font-mono font-bold bg-white border-gray-300 text-gray-900"
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
                            className="p-2 rounded-xl cursor-pointer transition-all flex items-center justify-center bg-gray-200 text-gray-700 hover:bg-gray-300"
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
                            className="p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center bg-gray-100 text-gray-700 hover:bg-gray-200"
                            title="Edit Area of FOCUS"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {onDeleteCollection && (
                            <button
                              type="button"
                              onClick={() => {
                                confirmDeleteFocus(activeCollection.id, activeCollection.title, () => setShowMobileDetailModal(false));
                              }}
                              className="p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100"
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
                        className="p-2 rounded-full transition-all border cursor-pointer ml-1 shadow-sm shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border-gray-300"
                        title="Close modal"
                      >
                        <X className="w-5 h-5" />
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
                            confirmDeleteFocus(activeCollection.id, activeCollection.title, () => {
                              setIsEditingFocus(false);
                              setShowMobileDetailModal(false);
                            });
                          }}
                          className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
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

      <DeleteConfirmModal
        isOpen={!!deleteConfirm?.isOpen}
        title={deleteConfirm?.title}
        message={deleteConfirm?.message}
        onConfirm={() => deleteConfirm?.onConfirm()}
        onCancel={() => setDeleteConfirm(null)}
      />

      <PrintPreviewModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        item={printableItem}
      />
    </div>
  );
}
