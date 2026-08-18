import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Collection, Project, Recipe, Phase } from '../types';
import { AlertCircle, ShieldAlert, Hourglass, ShieldCheck, Trash2, CheckCircle, X, Edit2, Save, BookOpenCheck, Target, GripVertical, Plus, Search, LibraryBig, BookOpen, PrinterCheck, FolderKanban, Bookmark, Pencil, Sparkles } from 'lucide-react';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import PrintPreviewModal, { PrintableItem } from './PrintPreviewModal';
import RecipeDetailModal from './RecipeDetailModal';
import { ENABLE_AREA_OF_FOCUS } from '../featureFlags';
import { getCategoryColor } from '../data/categoriesData';
import CategoryCombobox from './CategoryCombobox';
import { 
  RecipeTile, 
  ProjectTile, 
  CategoryBadge, 
  IconOnlyTileButton, 
  IconOnlySubButton,
  IconOnlyPrimaryButton
} from './DesignSystemTiles';
import { ProjectExploreModal, RecipeExploreModal } from './ExploreModals';
import { toValidUuid } from '../services/dataService';

export { RecipeTile, ProjectTile, CategoryBadge, IconOnlyTileButton, IconOnlySubButton, IconOnlyPrimaryButton };

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
  onUpdateRecipe?: (recipe: Recipe) => void;
  savedRecipeIds?: string[];
  onToggleSaveRecipe?: (recipeId: string, recipeObj?: Recipe) => void;

  initialTab?: 'projects' | 'focus' | 'library';
  onTabChange?: (tab: 'projects' | 'focus' | 'library') => void;
  currentUser?: { id?: string; name?: string; avatarUrl?: string; avatar?: string; privacyDefault?: 'public' | 'private' };
  setShowSearchModal?: (show: boolean, category?: string) => void;
  setEditingRecipe?: (recipe: Recipe | null) => void;
  setForkInitialData?: (recipe: Recipe | null) => void;
  handleInstantiateRecipe?: (recipe: Recipe) => void;
  onOpenCreatorProfile?: (creatorIdOrName: string) => void;
}

export interface ProcessTileProps {
  key?: React.Key;
  type: 'project' | 'recipe';
  id: string;
  title: string;
  category?: string;
  recipeTitle?: string;
  authorName?: string;
  authorId?: string;
  createdAt?: string | number;
  phases: Array<{ title: string; tasks: Array<{ title: string; completed?: boolean }> }>;
  description?: string;
  forkedFrom?: string;
  tags?: string[];
  progress?: number;
  isCompleted?: boolean;
  isSelected?: boolean;
  isSaved?: boolean;
  isAuthor?: boolean;
  onClickTile?: () => void;
  onOpenCreatorProfile?: (creatorIdOrName: string) => void;
  onToggleSaveRecipe?: (recipeId: string, recipeObj?: Recipe) => void;
  onExploreRecipe?: () => void;
  onForkRecipe?: () => void;
  onStartRecipe?: () => void;
  onEditRecipe?: () => void;
  onEditProject?: () => void;
  onPrint?: () => void;
  onDeleteProject?: () => void;
}

export function ProcessTile({
  type,
  id,
  title,
  category,
  recipeTitle,
  authorName,
  authorId,
  createdAt,
  phases,
  progress = 0,
  isCompleted = false,
  isSaved = false,
  isAuthor = false,
  onClickTile,
  onOpenCreatorProfile,
  onToggleSaveRecipe,
  onExploreRecipe,
  onForkRecipe,
  onStartRecipe,
  onEditRecipe,
  onEditProject,
  onPrint,
  onDeleteProject,
}: ProcessTileProps) {
  const displayTitle = title || recipeTitle || '';

  if (type === 'recipe') {
    return (
      <RecipeTile
        id={id}
        title={displayTitle}
        category={category}
        authorName={authorName}
        authorId={authorId}
        phases={phases as any}
        isSaved={isSaved}
        isAuthor={isAuthor}
        onClickTile={onClickTile || onExploreRecipe}
        onOpenCreatorProfile={onOpenCreatorProfile}
        onToggleSaveRecipe={onToggleSaveRecipe ? (recipeId) => onToggleSaveRecipe(recipeId) : undefined}
        onEditRecipe={onEditRecipe}
        onForkRecipe={onForkRecipe}
        onStartRecipe={onStartRecipe}
      />
    );
  }

  return (
    <ProjectTile
      id={id}
      title={displayTitle}
      category={category}
      createdAt={createdAt}
      phases={phases as any}
      progress={progress}
      isCompleted={isCompleted}
      onClickTile={onClickTile}
      onEditProject={onEditProject || onEditRecipe}
      onDeleteProject={onDeleteProject}
      onPrint={onPrint}
    />
  );
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
  onUpdateRecipe,
  savedRecipeIds = [],
  onToggleSaveRecipe,
  initialTab = 'projects',
  onTabChange,
  currentUser,
  setShowSearchModal,
  setEditingRecipe,
  setForkInitialData,
  handleInstantiateRecipe,
  onOpenCreatorProfile
}: SandEngineProps) {
  const [topTab, setTopTab] = useState<'projects' | 'focus' | 'library'>(!ENABLE_AREA_OF_FOCUS && initialTab === 'focus' ? 'projects' : initialTab);
  const [activeItemType, setActiveItemType] = useState<'project' | 'focus'>('project');
  const [selectedColId, setSelectedColId] = useState<string>(collections[0]?.id || '');
  const [customBudgetHours, setCustomBudgetHours] = useState<number>(80);
  const [showMobileDetailModal, setShowMobileDetailModal] = useState(false);
  const [visibleActiveProjectsCount, setVisibleActiveProjectsCount] = useState<number>(15);
  const [selectedPreviewRecipe, setSelectedPreviewRecipe] = useState<Recipe | null>(null);
  const [previewInitialEditMode, setPreviewInitialEditMode] = useState(false);
  const [draftProject, setDraftProject] = useState<Project | null>(null);

  const handleOpenNewBlankProject = () => {
    const blankProject: Project = {
      id: `proj-${Date.now()}`,
      title: '',
      category: 'General',
      phases: [
        {
          id: `ph-1-${Date.now()}`,
          title: 'Phase 1',
          tasks: [
            { id: `t-1-${Date.now()}`, title: 'Initial step', completed: false }
          ]
        }
      ],
      privacy: 'public',
      createdAt: new Date().toISOString()
    };
    setDraftProject(blankProject);
    setActiveItemType('project');
    setIsEditingProject(true);
    setShowMobileDetailModal(true);
  };

  const handleStartProjectFromRecipeObj = async (recipe: Recipe) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      title: recipe.title,
      category: recipe.category || 'General',
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      phases: (recipe.phases || []).map((ph, pIdx) => ({
        id: `ph-${pIdx + 1}-${Date.now()}`,
        title: ph.title,
        tasks: (ph.tasks || []).map((t, tIdx) => ({
          id: `t-${pIdx + 1}-${tIdx + 1}-${Date.now()}`,
          title: t.title,
          completed: false
        }))
      })),
      privacy: 'public',
      createdAt: new Date().toISOString()
    };

    if (onUpdateProject) {
      await onUpdateProject(newProject);
    }
    setSelectedProjectId(newProject.id);
    setActiveItemType('project');
    setTopTab('projects');
  };

  const handleForkRecipeToProjectObj = (recipe: Recipe) => {
    const forkedProjectDraft: Project = {
      id: `proj-${Date.now()}`,
      title: recipe.title,
      category: recipe.category || 'General',
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      phases: (recipe.phases || []).map((ph, pIdx) => ({
        id: `ph-${pIdx + 1}-${Date.now()}`,
        title: ph.title,
        tasks: (ph.tasks || []).map((t, tIdx) => ({
          id: `t-${pIdx + 1}-${tIdx + 1}-${Date.now()}`,
          title: t.title,
          completed: false
        }))
      })),
      privacy: 'public',
      createdAt: new Date().toISOString()
    };

    setDraftProject(forkedProjectDraft);
    setActiveItemType('project');
    setIsEditingProject(true);
    setShowMobileDetailModal(true);
  };

  // Unbookmark session persistence & confirmation modal
  const [sessionKeptUnbookmarkedIds, setSessionKeptUnbookmarkedIds] = useState<string[]>([]);
  const [unbookmarkRecipeTarget, setUnbookmarkRecipeTarget] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    setSessionKeptUnbookmarkedIds([]);
  }, [topTab]);

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
  const [editProjectCategory, setEditProjectCategory] = useState('');
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

  // Recipes in Process > LIBRARY: created by authenticated user OR saved/bookmarked by authenticated user OR unbookmarked during current view session
  const userLibraryRecipes = useMemo(() => {
    const raw = (recipes || []).filter(recipe => {
      const isAuthor = Boolean(
        recipe.authorId && currentUser?.id && recipe.authorId === currentUser.id
      );
      const isSaved = (savedRecipeIds || []).includes(recipe.id) || (savedRecipeIds || []).includes(toValidUuid(recipe.id));
      const isKeptInSession = sessionKeptUnbookmarkedIds.includes(recipe.id) || sessionKeptUnbookmarkedIds.includes(toValidUuid(recipe.id));
      return isAuthor || isSaved || isKeptInSession;
    });
    const seen = new Set<string>();
    return raw.filter(r => {
      if (!r.id || seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }, [recipes, currentUser?.id, savedRecipeIds, sessionKeptUnbookmarkedIds]);

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
  const sortedProjects = useMemo(() => {
    const combined = [...visibleActiveProjects, ...completedProjectsList];
    const seen = new Set<string>();
    return combined.filter(p => {
      if (!p.id || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [visibleActiveProjects, completedProjectsList]);

  const isProjectInLibrary = activeProject ? (recipes?.some(r => r.id === activeProject.recipeId || (r.title && activeProject.title && r.title.trim().toLowerCase() === activeProject.title.trim().toLowerCase())) || false) : false;

  const handleSaveProjectToLibrary = () => {
    if (!activeProject || !onAddRecipe) return;
    const newRecipe: Recipe = {
      id: `recipe-proj-${Date.now()}`,
      title: activeProject.title,
      authorId: currentUser?.id,
      authorName: currentUser?.name,
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
    setEditProjectCategory(activeProject.category || 'General');
    setEditPhases(activeProject.phases.map((ph, pIdx) => ({
      id: ph.id || crypto.randomUUID(),
      title: ph.title,
      tasks: ph.tasks.map((t, tIdx) => ({
        ...t,
        id: t.id || crypto.randomUUID()
      }))
    })));
    setSaveToLibrary(!isProjectInLibrary);
    setIsEditingProject(true);
  };

  const handleSaveProjectEdit = () => {
    if (!activeProject) return;
    const updatedCategory = editProjectCategory.trim() || activeProject.category || 'General';
    const isUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));
    let recipeId = activeProject.recipeId;

    if (saveToLibrary && onAddRecipe && !isProjectInLibrary) {
      const newRecipeUuid = (activeProject.recipeId && isUuid(activeProject.recipeId)) ? activeProject.recipeId : crypto.randomUUID();
      recipeId = newRecipeUuid;
      const newRecipe: Recipe = {
        id: newRecipeUuid,
        title: editProjectTitle.trim() || activeProject.title,
        authorId: currentUser?.id,
        authorName: currentUser?.name,
        category: updatedCategory,
        description: `Execution blueprint for ${editProjectTitle.trim() || activeProject.title}`,
        phases: editPhases.map((ph, pIdx) => ({
          id: (ph.id && isUuid(ph.id)) ? ph.id : crypto.randomUUID(),
          title: ph.title,
          position: pIdx + 1,
          tasks: (ph.tasks || []).map((t, tIdx) => ({
            id: (t.id && isUuid(t.id)) ? t.id : crypto.randomUUID(),
            title: t.title,
            estimatedHours: t.estimatedHours || 1,
            position: tIdx + 1
          }))
        })),
        tags: ['my-projects', 'custom'],
        isCustom: true
      };
      onAddRecipe(newRecipe);
      setSaveToLibrary(false);
    }

    const updated: Project = {
      ...activeProject,
      title: editProjectTitle.trim() || activeProject.title,
      category: updatedCategory,
      phases: editPhases,
      recipeId
    };

    if (onUpdateProject) {
      onUpdateProject(updated);
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
        id: crypto.randomUUID(),
        title: `Phase ${prev.length + 1}`,
        tasks: [
          {
            id: crypto.randomUUID(),
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
          id: crypto.randomUUID(),
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
      <div className="bg-black border-0 rounded-none p-4 sm:p-6 w-full min-w-0" id="dashboard-section-root">
        
        {/* TOP OVERALL TAB BAR */}
        <div className="flex flex-row justify-between items-center pb-3 mb-3 border-b border-white/10 gap-2 sm:gap-4" id="sand-top-tab-bar">
          <div className="flex items-center gap-1 sm:gap-1.5 bg-white/5 p-0 rounded-2xl border border-white/10 shadow-inner overflow-x-auto">
            <button
              id="sand-tab-projects"
              type="button"
              onClick={() => {
                setTopTab('projects');
                setActiveItemType('project');
                if (onTabChange) onTabChange('projects');
              }}
              className={`px-2.5 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                topTab === 'projects'
                  ? 'bg-[#F59E0B] text-black shadow-md font-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpenCheck className="w-3.5 h-3.5" /> PROJECTS
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
                className={`px-2.5 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  topTab === 'focus'
                    ? 'bg-[#F59E0B] text-black shadow-md font-black'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
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
              className={`px-2.5 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                topTab === 'library'
                  ? 'bg-[#F59E0B] text-black shadow-md font-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LibraryBig className="w-3.5 h-3.5" /> LIBRARY
            </button>
          </div>
        </div>

        {/* MAIN SAND VIEW TAB CONTENT */}
        {topTab === 'library' ? (
          /* LIBRARY TAB VIEW INSIDE SAND ENGINE */
          <div className="space-y-6" id="recipes-library-root">

            {userLibraryRecipes && userLibraryRecipes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userLibraryRecipes.map((recipe, rIdx) => {
                  const isSaved = (savedRecipeIds || []).includes(recipe.id) || (savedRecipeIds || []).includes(toValidUuid(recipe.id));
                  const isAuthor = Boolean(
                    recipe.authorId && currentUser?.id && recipe.authorId === currentUser.id
                  );

                  return (
                    <ProcessTile
                      key={`recipe-tile-${recipe.id || rIdx}-${rIdx}`}
                      type="recipe"
                      id={recipe.id}
                      title={recipe.title}
                      category={recipe.category}
                      authorName={recipe.authorName}
                      authorId={recipe.authorId}
                      phases={recipe.phases}
                      description={recipe.description}
                      forkedFrom={recipe.forkedFrom}
                      tags={recipe.tags}
                      isSaved={isSaved}
                      isAuthor={isAuthor}
                      onClickTile={() => {
                        setPreviewInitialEditMode(false);
                        setSelectedPreviewRecipe(recipe);
                      }}
                      onOpenCreatorProfile={onOpenCreatorProfile}
                      onToggleSaveRecipe={(recipeId) => {
                        if (isSaved) {
                          setUnbookmarkRecipeTarget({ id: recipe.id, title: recipe.title });
                        } else {
                          if (onToggleSaveRecipe) {
                            onToggleSaveRecipe(recipeId, recipe);
                          }
                          setSessionKeptUnbookmarkedIds(prev => prev.filter(id => id !== recipeId));
                        }
                      }}
                      onExploreRecipe={() => {
                        setPreviewInitialEditMode(false);
                        setSelectedPreviewRecipe(recipe);
                        if (typeof window !== 'undefined') {
                          window.history.pushState({}, '', `/recipe/${encodeURIComponent(recipe.publicId || recipe.id)}`);
                        }
                      }}
                      onForkRecipe={() => handleForkRecipeToProjectObj(recipe)}
                      onStartRecipe={() => handleStartProjectFromRecipeObj(recipe)}
                      onEditRecipe={() => {
                        setSelectedPreviewRecipe(recipe);
                        setPreviewInitialEditMode(true);
                        if (typeof window !== 'undefined') {
                          window.history.pushState({}, '', `/recipe/${encodeURIComponent(recipe.publicId || recipe.id)}`);
                        }
                      }}
                      onPrint={() => handleOpenPrintModal({
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
                    />
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#151515] border border-white/10 p-12 rounded-3xl text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center mx-auto text-[#F59E0B]">
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
                  id="library-empty-create-recipe-btn"
                  onClick={() => {
                    const blankRecipe: Recipe = {
                      id: `rec_${Date.now()}`,
                      title: 'New Recipe Blueprint',
                      category: 'General',
                      description: '',
                      tags: [],
                      authorName: currentUser?.name || 'Creator',
                      authorId: currentUser?.id || 'user-1',
                      visibility: 'public',
                      phases: [
                        {
                          id: `ph-1-${Date.now()}`,
                          title: 'Phase 1: Setup',
                          position: 1,
                          tasks: [
                            {
                              id: `t-1-${Date.now()}`,
                              title: 'Initial step',
                              position: 1
                            }
                          ]
                        }
                      ],
                      gongsCount: { continue: 0, refine: 0, reconsider: 0 },
                      createdAt: new Date().toISOString(),
                      isCustom: true
                    };
                    setSelectedPreviewRecipe(blankRecipe);
                    setPreviewInitialEditMode(true);
                  }}
                  className="px-5 py-2.5 bg-[#F59E0B] hover:bg-[#FF751A] text-black font-black text-xs rounded-xl shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer mt-2"
                >
                  <Plus className="w-4 h-4" /> Create Recipe
                </button>
              </div>
            )}
          </div>
        ) : topTab === 'projects' ? (
          /* PROJECTS TAB - FULL VIEW TILE GRID LAYOUT */
          <div className="w-full space-y-4" id="dashboard-projects-view">
            {sortedProjects.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedProjects.map((p, pIdx) => {
                    const progress = getProjectProgress(p);
                    const isSelected = selectedProjectId === p.id && activeItemType === 'project';

                    return (
                      <ProcessTile
                        key={`proj-tile-${p.id || pIdx}-${pIdx}`}
                        type="project"
                        id={p.id}
                        title={p.title}
                        category={p.category}
                        recipeTitle={p.recipeTitle}
                        createdAt={p.createdAt}
                        phases={p.phases}
                        progress={progress}
                        isCompleted={p.isCompleted}
                        isSelected={isSelected}
                        onClickTile={() => {
                          setSelectedProjectId(p.id);
                          setActiveItemType('project');
                          setIsEditingProject(false);
                          setShowMobileDetailModal(true);
                        }}
                        onEditProject={() => {
                          setSelectedProjectId(p.id);
                          setActiveItemType('project');
                          setIsEditingProject(true);
                          setShowMobileDetailModal(true);
                        }}
                        onPrint={() => handleOpenPrintModal({
                          id: p.id,
                          type: 'project',
                          title: p.title,
                          recipeTitle: p.recipeTitle,
                          phases: p.phases,
                          progressPhotos: p.progressPhotos,
                          createdAt: p.createdAt,
                          completedAt: p.completedAt,
                        })}
                        onDeleteProject={() => confirmDeleteProject(p.id, p.title)}
                      />
                    );
                  })}
                </div>

                {activeProjectsList.length > visibleActiveProjectsCount && (
                  <button
                    type="button"
                    id="sand-more-projects-btn"
                    onClick={() => setVisibleActiveProjectsCount(prev => prev + 9)}
                    className="w-full py-2.5 px-4 mt-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border shadow-sm bg-gray-100 hover:bg-gray-200 text-[#F59E0B] border-[#F59E0B]/30"
                  >
                    More Projects... ({activeProjectsList.length - visibleActiveProjectsCount} remaining)
                  </button>
                )}
              </>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center space-y-3 my-2">
                <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 text-[#F59E0B] flex items-center justify-center mx-auto">
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
                  onClick={handleOpenNewBlankProject}
                  className="px-3.5 py-2 bg-[#F59E0B] hover:bg-[#FF751A] text-black font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
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
                      collections.map((col, cIdx) => {
                        const colProjects = sessionProjects.filter(p => p.collectionId === col.id || col.projectIds.includes(p.id));
                        const totalTasks = colProjects.reduce((sum, p) => sum + p.phases.reduce((ps, ph) => ps + ph.tasks.length, 0), 0);
                        const compTasks = colProjects.reduce((sum, p) => sum + p.phases.reduce((ps, ph) => ps + ph.tasks.filter(t => t.completed).length, 0), 0);
                        const progress = totalTasks > 0 ? Math.round((compTasks / totalTasks) * 100) : 0;
                        const isSelected = selectedColId === col.id && activeItemType === 'focus';
                        const isCompleted = totalTasks > 0 && compTasks === totalTasks;

                        return (
                          <div
                            key={`focus-col-${col.id || cIdx}-${cIdx}`}
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
                                  : 'bg-orange-100 border-2 border-[#F59E0B] text-gray-900 shadow-md ring-2 ring-[#F59E0B]/20'
                                : isCompleted
                                ? 'bg-emerald-50/60 border border-emerald-200 text-gray-700 opacity-80 hover:opacity-100'
                                : 'bg-white border border-gray-200 text-gray-900 shadow-sm hover:border-[#F59E0B]/50'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <h4 className={`text-[9px] font-mono font-bold uppercase truncate ${
                                  isCompleted ? 'text-gray-400 font-normal' : 'text-[#F59E0B]'
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
                                  : 'bg-[#F59E0B] text-black shadow-sm'
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
                                className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-[#F59E0B]'}`} 
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
                        {activeProject.category && (
                          <span 
                            className="font-mono text-[9px] uppercase px-2 py-0.5 rounded font-bold tracking-wider truncate max-w-[150px] border"
                            style={{
                              backgroundColor: `${getCategoryColor(activeProject.category)}25`,
                              color: getCategoryColor(activeProject.category),
                              borderColor: `${getCategoryColor(activeProject.category)}50`
                            }}
                          >
                            {activeProject.category}
                          </span>
                        )}
                        <span className="bg-gray-100 text-gray-700 border border-gray-200 font-mono text-[9px] uppercase px-2 py-0.5 rounded font-bold truncate max-w-[150px]">
                          {activeProject.recipeTitle}
                        </span>
                        <span className="text-[10px] font-mono text-gray-500 uppercase">
                          Created: {new Date(activeProject.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[9px] font-mono text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/20 font-semibold">
                          💡 Double-click title to edit
                        </span>
                      </div>

                      {isEditingProject ? (
                        <div className="mt-3 w-full space-y-3">
                          <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500 mb-1">
                              Project Title
                            </label>
                            <input
                              type="text"
                              value={editProjectTitle}
                              onChange={(e) => setEditProjectTitle(e.target.value)}
                              className="bg-white border-2 border-[#F59E0B] rounded-xl px-3 py-2 text-lg sm:text-xl font-display font-bold text-gray-900 w-full focus:outline-none"
                              placeholder="Project title..."
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500 mb-1">
                              Category <span className="text-[#F59E0B]">*</span>
                            </label>
                            <CategoryCombobox
                              value={editProjectCategory}
                              onChange={(cat) => setEditProjectCategory(cat)}
                              theme="light"
                              placeholder="Select or search category..."
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3 mt-1.5 w-full min-w-0">
                          <h2 
                            onDoubleClick={handleStartProjectEdit}
                            title="Double-click to edit project title"
                            className="text-xl sm:text-2xl font-display font-bold text-gray-900 break-words cursor-pointer hover:text-[#F59E0B] transition-colors leading-snug w-full min-w-0 flex-1"
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
                            className="p-2 bg-gray-100 hover:bg-[#F59E0B] text-gray-700 hover:text-black rounded-xl transition-all cursor-pointer flex items-center justify-center border border-gray-200 shrink-0"
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
                            className="p-2 bg-[#F59E0B] hover:bg-[#FF751A] text-black rounded-xl cursor-pointer shadow flex items-center justify-center transition-all"
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
                        <div className="w-12 h-12 rounded-full border-4 border-[#F59E0B] flex items-center justify-center font-mono font-bold text-xs text-[#F59E0B]">
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
                            key={`edit-phase-${phase.id || pIdx}-${pIdx}`} 
                            className={`space-y-3 p-3.5 rounded-2xl border transition-all ${
                              dragOverPhaseIdx === pIdx ? 'border-[#F59E0B] bg-[#F59E0B]/10' : 'bg-black/40 border-white/10'
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
                                  <span className="bg-[#F59E0B]/20 text-[#F59E0B] group-hover:bg-[#F59E0B] group-hover:text-black w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] shrink-0 font-bold font-mono transition-all shadow">
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
                                  className="bg-black border border-white/20 focus:border-[#F59E0B] rounded-xl px-3 py-1 text-xs font-bold text-white flex-1 focus:outline-none"
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
                                  key={`edit-task-${phase.id || pIdx}-${task.id || tIdx}-${tIdx}`}
                                  draggable
                                  onDragStart={(e) => handleTaskDragStart(e, pIdx, tIdx)}
                                  onDragOver={(e) => handleTaskDragOver(e, pIdx, tIdx)}
                                  onDrop={(e) => handleTaskDrop(e, pIdx, tIdx)}
                                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 bg-black/60 border-white/10 transition-all ${
                                    dragOverTask?.phaseIdx === pIdx && dragOverTask?.taskIdx === tIdx ? 'border-[#F59E0B] bg-[#F59E0B]/10' : ''
                                  }`}
                                >
                                  {/* Task Drag Handle */}
                                  <div 
                                    className="cursor-grab active:cursor-grabbing text-white/40 hover:text-[#F59E0B] shrink-0 p-1 rounded hover:bg-white/5"
                                    title="Click, hold & drag vertically to reorder task or move to another phase"
                                  >
                                    <GripVertical className="w-4 h-4" />
                                  </div>

                                  {/* Disabled Checkbox */}
                                  <input
                                    type="checkbox"
                                    checked={task.completed}
                                    disabled
                                    className="w-4 h-4 rounded border-white/20 bg-black text-[#F59E0B] opacity-30 cursor-not-allowed shrink-0"
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
                                    className="bg-transparent border-0 border-b border-white/10 focus:border-[#F59E0B] text-xs text-white font-medium flex-1 focus:outline-none px-1 py-0.5"
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
                                className="w-full py-1.5 border border-dashed border-white/20 hover:border-[#F59E0B]/50 hover:text-[#F59E0B] text-white/50 hover:bg-white/5 text-[11px] font-mono rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer mt-1"
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
                          <Plus className="w-3.5 h-3.5 text-[#F59E0B]" /> Add New Phase
                        </button>
                      </div>
                    ) : (
                      activeProject.phases.map((phase, pIdx) => {
                        const isPhaseComplete = phase.tasks.length > 0 && phase.tasks.every(t => t.completed);

                        return (
                          <div key={`view-phase-${phase.id || pIdx}-${pIdx}`} className="space-y-3 w-full min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-xs font-mono font-bold text-white/80 uppercase tracking-wider flex items-center gap-2">
                                <span className="bg-white/10 text-white/85 w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] shrink-0">
                                  {pIdx + 1}
                                </span>
                                <span onDoubleClick={handleStartProjectEdit} className="break-words cursor-pointer hover:text-[#F59E0B]">
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
                                  key={`view-task-${phase.id || pIdx}-${task.id || tIdx}-${tIdx}`}
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
                        <span className="bg-[#F59E0B]/15 text-[#F59E0B] font-mono text-[9px] uppercase px-2 py-0.5 rounded font-bold">
                          Area of FOCUS
                        </span>
                        <span className="text-[10px] font-mono text-white/40 uppercase">
                          Mode: {activeCollection.workMode}
                        </span>
                        <span className="text-[9px] font-mono text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/20">
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
                              className="bg-black border border-[#F59E0B] rounded-xl px-3 py-2 text-sm font-display font-bold text-white w-full focus:outline-none"
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
                              className="bg-black border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white w-32 font-mono font-bold focus:outline-none focus:border-[#F59E0B]"
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                            <button
                              type="button"
                              onClick={handleSaveFocusEdit}
                              className="px-4 py-2 bg-[#F59E0B] hover:bg-[#FF751A] text-black font-black text-xs uppercase rounded-xl transition-all shadow flex items-center gap-1.5 cursor-pointer"
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
                            className="text-base sm:text-lg font-display font-bold text-white break-words cursor-pointer hover:text-[#F59E0B] transition-colors"
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
                            className="p-2 bg-[#F59E0B] hover:bg-[#FF751A] text-black rounded-xl cursor-pointer shadow flex items-center justify-center transition-all"
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
                      ? 'bg-[#F59E0B]/10 border-[#F59E0B]/25 text-[#F59E0B]'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        feasibility.level === 'CRITICAL' ? 'bg-red-500 text-white' : feasibility.level === 'WARNING' ? 'bg-[#F59E0B] text-black' : 'bg-emerald-500 text-white'
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
                      {(['sequential', 'parallel', 'hybrid'] as const).map((mode, mIdx) => (
                        <button
                          key={`work-mode-${mode}-${mIdx}`}
                          type="button"
                          onClick={() => onUpdateCollectionMode(activeCollection.id, mode)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            activeCollection.workMode === mode
                              ? 'bg-[#F59E0B] border-[#F59E0B] text-black font-bold'
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
                      <span className="text-[#F59E0B] font-bold">{budgetedHours} Hours</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="150"
                      step="5"
                      value={budgetedHours}
                      onChange={(e) => onUpdateCollectionBudget(activeCollection.id, parseInt(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#F59E0B]"
                    />
                  </div>

                  {/* Bound Projects */}
                  <div className="space-y-3 pt-3 border-t border-white/10">
                    <h4 className="text-xs font-mono font-bold text-white/60 uppercase tracking-wider">
                      Bound Projects ({linkedProjects.length})
                    </h4>
                    {linkedProjects.length > 0 ? (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {linkedProjects.map((p, pIdx) => {
                          const pProg = getProjectProgress(p);
                          return (
                            <div key={`feas-proj-${p.id || pIdx}-${pIdx}`} className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                              <div className="flex justify-between items-center">
                                <h5 className="text-xs font-bold text-white">{p.title}</h5>
                                <span className="text-[10px] font-mono bg-black px-2 py-0.5 rounded border border-white/10 text-[#F59E0B] font-bold">
                                  {pProg}%
                                </span>
                              </div>
                              <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                                <div className="bg-[#F59E0B] h-full rounded-full" style={{ width: `${pProg}%` }}></div>
                              </div>
                              {p.phases.map((ph, phIdx) => (
                                <div key={`feas-ph-${p.id || pIdx}-${ph.id || phIdx}-${phIdx}`} className="space-y-1 pt-1">
                                  <span className="text-[9px] font-mono text-white/40 uppercase">Phase {phIdx + 1}: {ph.title}</span>
                                  {ph.tasks.map((t, tIdx) => (
                                    <div 
                                      key={`feas-t-${ph.id || phIdx}-${t.id || tIdx}-${tIdx}`} 
                                      onClick={() => handleToggleTask(p.id, ph.id, t.id)}
                                      className="flex items-center gap-2 text-xs text-white/80 hover:text-white cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={t.completed}
                                        onChange={() => handleToggleTask(p.id, ph.id, t.id)}
                                        className="w-3.5 h-3.5 rounded border-white/20 bg-black text-[#F59E0B] focus:ring-0 cursor-pointer"
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
                <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto text-[#F59E0B]">
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
                    onClick={() => handleOpenNewBlankProject()}
                    className="px-4 py-2 bg-[#F59E0B] hover:bg-[#FF751A] text-black font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
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
      {showMobileDetailModal && activeItemType === 'project' && (draftProject || activeProject || userProjects.find(p => p.id === selectedProjectId)) && (
        <ProjectExploreModal
          project={draftProject || activeProject || userProjects.find(p => p.id === selectedProjectId)!}
          isOpen={showMobileDetailModal}
          onAddRecipe={onAddRecipe}
          onClose={() => {
            setShowMobileDetailModal(false);
            setIsEditingProject(false);
            setDraftProject(null);
          }}
          onUpdateProject={async (updated) => {
            if (onUpdateProject) {
              await onUpdateProject(updated);
            }
            setDraftProject(null);
            setShowMobileDetailModal(false);
            setIsEditingProject(false);
            setSelectedProjectId(updated.id);
            setTopTab('projects');
          }}
          onDeleteProject={async (id) => {
            if (handleDeleteProject) {
              handleDeleteProject(id);
            }
            setDraftProject(null);
            setShowMobileDetailModal(false);
          }}
          onCompleteProject={async (id) => {
            if (onMarkProjectComplete) {
              await onMarkProjectComplete(id);
            }
          }}
          onOpenRecipe={(recId) => {
            const foundRec = (recipes || []).find((r: Recipe) => r.id === recId);
            if (foundRec) {
              setSelectedPreviewRecipe(foundRec);
            }
          }}
          canViewRecipe={true}
          currentUser={currentUser}
          initialEditMode={isEditingProject}
        />
      )}

      {showMobileDetailModal && activeItemType === 'collection' && activeCollection && ENABLE_AREA_OF_FOCUS && (
        <AnimatePresence>
          <div className="fixed top-10 sm:top-14 inset-x-0 bottom-0 z-50 flex items-stretch justify-center p-2 sm:p-4 overflow-hidden bg-gray-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="rounded-2xl sm:rounded-3xl w-full h-full max-w-full overflow-hidden shadow-2xl border relative flex flex-col transition-colors bg-white text-gray-900 border-gray-200"
            >
                <>
                  {/* Fixed Non-Scrollable Header */}
                  <div className="p-4 sm:p-5 border-b flex items-start justify-between gap-3 shrink-0 border-gray-200 bg-gray-50">
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="text-[10px] font-mono text-[#F59E0B] uppercase font-bold">Area of FOCUS</span>
                      {isEditingFocus ? (
                        <div className="space-y-2 mt-1">
                          <input
                            type="text"
                            value={editFocusTitle}
                            onChange={(e) => setEditFocusTitle(e.target.value)}
                            className="border rounded-xl px-3 py-1.5 text-sm font-display font-bold w-full focus:outline-none focus:border-[#F59E0B] bg-white border-gray-300 text-gray-900"
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
                            className="text-lg font-bold cursor-pointer hover:text-[#F59E0B] leading-snug"
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
                            className="p-2 bg-[#F59E0B] hover:bg-[#FF751A] text-black rounded-xl cursor-pointer shadow flex items-center justify-center transition-all"
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
            </motion.div>
          </div>
        </AnimatePresence>
      )}

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

      {selectedPreviewRecipe && (
        <RecipeDetailModal
          recipe={selectedPreviewRecipe}
          initialEditMode={previewInitialEditMode}
          onClose={() => {
            setSelectedPreviewRecipe(null);
            setPreviewInitialEditMode(false);
            if (typeof window !== 'undefined' && window.location.pathname.startsWith('/recipe/')) {
              window.history.pushState({}, '', '/process/library');
            }
          }}
          onStartRecipe={(rec) => {
            setSelectedPreviewRecipe(null);
            setPreviewInitialEditMode(false);
            handleStartProjectFromRecipeObj(rec);
          }}
          onForkRecipe={(rec) => {
            setSelectedPreviewRecipe(null);
            setPreviewInitialEditMode(false);
            handleForkRecipeToProjectObj(rec);
          }}
          onUpdateRecipe={(updated) => {
            if (onUpdateRecipe) onUpdateRecipe(updated);
            setSelectedPreviewRecipe(updated);
            setPreviewInitialEditMode(false);
          }}
          isSaved={(savedRecipeIds || []).includes(selectedPreviewRecipe.id) || (savedRecipeIds || []).includes(toValidUuid(selectedPreviewRecipe.id))}
          onToggleSaveRecipe={onToggleSaveRecipe}
          onOpenCreatorProfile={onOpenCreatorProfile}
          onPrintRecipe={(rec) => handleOpenPrintModal({
            id: rec.id,
            type: 'recipe',
            title: rec.title,
            description: rec.description,
            authorName: rec.authorName,
            category: rec.category,
            phases: rec.phases,
            tags: rec.tags,
            gongsCount: rec.gongsCount,
          })}
          currentUser={currentUser}
        />
      )}

      {/* Unbookmark Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!unbookmarkRecipeTarget}
        title="Remove Recipe from Library?"
        message={`Are you sure you want to remove "${unbookmarkRecipeTarget?.title}" from your saved library? It will remain visible in this view until you navigate away.`}
        confirmText="Confirm Remove"
        cancelText="Cancel"
        onConfirm={() => {
          if (unbookmarkRecipeTarget) {
            const targetId = unbookmarkRecipeTarget.id;
            if (onToggleSaveRecipe) {
              const targetObj = recipes?.find(r => r.id === targetId);
              onToggleSaveRecipe(targetId, targetObj);
            }
            setSessionKeptUnbookmarkedIds(prev => [...prev, targetId]);
            setUnbookmarkRecipeTarget(null);
          }
        }}
        onCancel={() => setUnbookmarkRecipeTarget(null)}
      />
    </div>
  );
}
