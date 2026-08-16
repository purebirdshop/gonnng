import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Recipe, Phase, Task, ProfileVisibility, RecipeVisibility } from '../types';
import { dataService } from '../services/dataService';
import { getCategoryColorCollection, COLOR_COLLECTIONS } from '../utils/categoryColors';
import { CATEGORIES_DATA } from '../data/categoriesData';

const ALL_CATEGORY_NAMES = CATEGORIES_DATA.map(c => c.name);
import { 
  CategoryBadge, 
  IconOnlyPrimaryButton, 
  IconOnlyTileButton, 
  IconOnlySubButton, 
  IconWithLabelButton 
} from './DesignSystemTiles';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { 
  BookHeart, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight, 
  X, 
  SquarePen,
  Check, 
  Trash2, 
  Plus, 
  GripVertical, 
  Bookmark, 
  GitFork, 
  Globe, 
  Lock, 
  Users, 
  CheckSquare, 
  Square, 
  ArrowUp,
  ArrowDown,
  UtensilsCrossed,
  MessageSquareShare,
  Save,
  Shredder,
  BookPlus,
  List,
  FileCode,
  Info,
  AlertTriangle
} from 'lucide-react';
import { parseMarkedText, serializeToMarked } from '../utils/markedEngine';
import { MarkedRenderer } from './MarkedRenderer';
import { MarkedSyntaxGuideModal } from './MarkedSyntaxGuideModal';

// ==========================================
// PROJECT EXPLORE MODAL
// ==========================================
export interface ProjectExploreModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProject?: (updatedProject: Project) => Promise<void> | void;
  onDeleteProject?: (projectId: string) => Promise<void> | void;
  onCompleteProject?: (projectId: string) => Promise<void> | void;
  onShare?: (project: Project) => void;
  onOpenRecipe?: (recipeId: string) => void;
  canViewRecipe?: boolean;
  currentUser?: { id?: string; name?: string };
  initialEditMode?: boolean;
  onAddRecipe?: (recipe: Recipe) => void;
  onSaveProjectAsRecipe?: (recipe: Recipe) => Promise<void> | void;
}

export function ProjectExploreModal({
  project,
  isOpen,
  onClose,
  onUpdateProject,
  onDeleteProject,
  onCompleteProject,
  onShare,
  onOpenRecipe,
  canViewRecipe = true,
  currentUser,
  initialEditMode = false,
  onAddRecipe,
  onSaveProjectAsRecipe
}: ProjectExploreModalProps) {
  useEffect(() => {
    if (isOpen && project) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen, Boolean(project)]);

  if (!isOpen || !project) return null;

  const isAuthor = Boolean(
    currentUser?.id && project.userId && currentUser.id === project.userId ||
    (currentUser?.name && (project as any).authorName && currentUser.name.toLowerCase() === String((project as any).authorName).toLowerCase()) ||
    true // default true if logged in user owns state
  );

  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [tempTitle, setTempTitle] = useState(project.title || '');
  const [tempCategory, setTempCategory] = useState(project.category || 'General');
  const [tempPhases, setTempPhases] = useState<Phase[]>(
    project.phases ? JSON.parse(JSON.stringify(project.phases)) : []
  );
  const [tempPrivacy, setTempPrivacy] = useState<ProfileVisibility>(project.privacy || 'public');
  const [saveAsRecipe, setSaveAsRecipe] = useState(false);
  const [collapsedPhases, setCollapsedPhases] = useState<Record<number, boolean>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Marked mode state
  const [editModeToggle, setEditModeToggle] = useState<'bulleted' | 'marked'>(() => {
    try {
      const saved = localStorage.getItem('gonnng_edit_mode_toggle');
      return saved === 'marked' ? 'marked' : 'bulleted';
    } catch (e) {
      return 'bulleted';
    }
  });
  const [markedText, setMarkedText] = useState('');
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [showInfoPopover, setShowInfoPopover] = useState(false);
  const [showSyntaxGuideModal, setShowSyntaxGuideModal] = useState(false);

  // Sync state when project changes
  useEffect(() => {
    if (project) {
      setTempTitle(project.title || '');
      setTempCategory(project.category || 'General');
      setTempPhases(
        project.phases
          ? JSON.parse(JSON.stringify(project.phases)).map((ph: any, pIdx: number) => ({
              id: ph.id || crypto.randomUUID(),
              title: ph.title,
              sourcePhaseId: ph.sourcePhaseId,
              position: ph.position ?? pIdx + 1,
              tasks: (ph.tasks || []).map((t: any, tIdx: number) => ({
                id: t.id || crypto.randomUUID(),
                title: t.title,
                completed: Boolean(t.completed),
                sourceTaskId: t.sourceTaskId,
                position: t.position ?? tIdx + 1,
                estimatedHours: t.estimatedHours,
                body_markdown: t.body_markdown
              }))
            }))
          : []
      );
      setTempPrivacy(project.privacy || 'public');
      setIsEditing(initialEditMode);

      // Auto-collapse phases where all tasks are complete
      const initialCollapsed: Record<number, boolean> = {};
      (project.phases || []).forEach((ph, pIdx) => {
        if (ph.tasks && ph.tasks.length > 0 && ph.tasks.every(t => t.completed)) {
          initialCollapsed[pIdx] = true;
        }
      });
      setCollapsedPhases(initialCollapsed);
    }
  }, [project, initialEditMode]);

  useEffect(() => {
    if (isEditing) {
      const text = serializeToMarked({ title: tempTitle, phases: tempPhases });
      setMarkedText(text);
      const parsed = parseMarkedText(text, tempTitle);
      setParseWarnings(parsed.warnings);
    }
  }, [isEditing]);

  const handleSwitchEditMode = (mode: 'bulleted' | 'marked') => {
    if (mode === editModeToggle) return;

    if (mode === 'marked') {
      const text = serializeToMarked({ title: tempTitle, phases: tempPhases });
      setMarkedText(text);
      const parsed = parseMarkedText(text, tempTitle);
      setParseWarnings(parsed.warnings);
    } else {
      const parsed = parseMarkedText(markedText, tempTitle);
      setTempTitle(parsed.title);
      setTempPhases(parsed.phases);
      setParseWarnings(parsed.warnings);
    }

    setEditModeToggle(mode);
    try {
      localStorage.setItem('gonnng_edit_mode_toggle', mode);
    } catch (e) {}
  };

  const handleMarkedTextChange = (val: string) => {
    setMarkedText(val);
    const parsed = parseMarkedText(val, tempTitle);
    setParseWarnings(parsed.warnings);
  };

  const activeCategory = isEditing ? tempCategory : (project.category || 'General');
  const colors = getCategoryColorCollection(activeCategory);

  // Task / Phase toggle & completion helpers
  const handleToggleTask = (phaseIndex: number, taskIndex: number) => {
    const updated = [...tempPhases];
    const targetTask = updated[phaseIndex].tasks[taskIndex];
    targetTask.completed = !targetTask.completed;
    setTempPhases(updated);

    // Auto-collapse if all tasks complete
    const allDone = updated[phaseIndex].tasks.length > 0 && updated[phaseIndex].tasks.every(t => t.completed);
    if (allDone) {
      setCollapsedPhases(prev => ({ ...prev, [phaseIndex]: true }));
    }

    if (!isEditing && onUpdateProject) {
      const updatedProj: Project = { ...project, phases: updated };
      onUpdateProject(updatedProj);
    }
  };

  const handleTogglePhaseAll = (phaseIndex: number) => {
    const updated = [...tempPhases];
    const targetPhase = updated[phaseIndex];
    const allCompleted = targetPhase.tasks.length > 0 && targetPhase.tasks.every(t => t.completed);
    targetPhase.tasks.forEach(t => { t.completed = !allCompleted; });
    setTempPhases(updated);

    if (!allCompleted) {
      setCollapsedPhases(prev => ({ ...prev, [phaseIndex]: true }));
    } else {
      setCollapsedPhases(prev => ({ ...prev, [phaseIndex]: false }));
    }

    if (!isEditing && onUpdateProject) {
      const updatedProj: Project = { ...project, phases: updated };
      onUpdateProject(updatedProj);
    }
  };

  const togglePhaseCollapse = (pIdx: number) => {
    setCollapsedPhases(prev => ({ ...prev, [pIdx]: !prev[pIdx] }));
  };

  // Edit Mode actions
  const handleAddPhase = () => {
    setTempPhases(prev => [
       ...prev,
       {
        id: crypto.randomUUID(),
        title: `Phase ${prev.length + 1}`,
        tasks: [{ id: crypto.randomUUID(), title: 'Initial step', completed: false }]
       }
     ]);
   };
 
   const handleAddTask = (phaseIndex: number) => {
     setTempPhases(prev =>
       prev.map((ph, pIdx) => {
         if (pIdx === phaseIndex) {
           return {
             ...ph,
            tasks: [...ph.tasks, { id: crypto.randomUUID(), title: '', completed: false }]
           };
         }
         return ph;
       })
     );
   };

  const handleDeletePhase = (phaseIndex: number) => {
    const phaseToDelete = tempPhases[phaseIndex];
    const taskCount = phaseToDelete.tasks?.length || 0;
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Phase?',
      message: `Deleting this phase will also delete all ${taskCount} nested tasks. Are you sure you want to proceed?`,
      onConfirm: () => {
        setTempPhases(prev => prev.filter((_, idx) => idx !== phaseIndex));
        setDeleteConfirm(null);
      }
    });
  };

  const handleDeleteTask = (phaseIndex: number, taskIndex: number) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Task?',
      message: 'Are you sure you want to delete this task?',
      onConfirm: () => {
        setTempPhases(prev =>
          prev.map((ph, pIdx) => {
            if (pIdx === phaseIndex) {
              return {
                ...ph,
                tasks: ph.tasks.filter((_, tIdx) => tIdx !== taskIndex)
              };
            }
            return ph;
          })
        );
        setDeleteConfirm(null);
      }
    });
  };

  const movePhase = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === tempPhases.length - 1)) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...tempPhases];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setTempPhases(updated);
  };

  const moveTask = (phaseIndex: number, taskIndex: number, direction: 'up' | 'down') => {
    const tasks = tempPhases[phaseIndex].tasks;
    if ((direction === 'up' && taskIndex === 0) || (direction === 'down' && taskIndex === tasks.length - 1)) return;
    const targetIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1;
    const updatedTasks = [...tasks];
    const [moved] = updatedTasks.splice(taskIndex, 1);
    updatedTasks.splice(targetIndex, 0, moved);

    setTempPhases(prev =>
      prev.map((ph, pIdx) => (pIdx === phaseIndex ? { ...ph, tasks: updatedTasks } : ph))
    );
  };

  const handleSaveEdit = async () => {
    let finalTitle = tempTitle;
    let finalPhases = tempPhases;

    if (editModeToggle === 'marked') {
      const parsed = parseMarkedText(markedText, tempTitle);
      finalTitle = parsed.title;
      finalPhases = parsed.phases;
    }

    let linkedRecipeId = project.recipeId;
    let savedRecipeObj: Recipe | null = null;

    if (saveAsRecipe) {
      const isUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));
      const recipeUuid = (project.recipeId && isUuid(project.recipeId))
        ? project.recipeId
        : crypto.randomUUID();

      const newRecipe: Recipe = {
        id: recipeUuid,
        title: finalTitle,
        category: tempCategory || 'General',
        description: `Recipe created from project: ${finalTitle}`,
        phases: finalPhases.map((p, pIdx) => {
          const phaseUuid = (p.id && isUuid(p.id)) ? p.id : crypto.randomUUID();
          return {
            id: phaseUuid,
            title: p.title,
            position: pIdx + 1,
            tasks: (p.tasks || []).map((t, tIdx) => ({
              id: (t.id && isUuid(t.id)) ? t.id : crypto.randomUUID(),
              title: t.title,
              completed: false,
              position: tIdx + 1,
              body_markdown: t.body_markdown
            }))
          };
        }),
        authorId: currentUser?.id || project.userId || '4c0ab90e-6ec5-4a14-bb46-f10d4dc7bcb2',
        authorName: currentUser?.name || (project as any).authorName || 'Creator',
        createdAt: new Date().toISOString(),
        visibility: tempPrivacy === 'private' ? 'private' : 'public',
        tags: ['project-recipe', 'custom'],
        isCustom: true
      };

      savedRecipeObj = await dataService.saveRecipe(newRecipe, currentUser?.id);
      linkedRecipeId = savedRecipeObj.id;

      if (onAddRecipe) {
        onAddRecipe(savedRecipeObj);
      } else if (onSaveProjectAsRecipe) {
        await onSaveProjectAsRecipe(savedRecipeObj);
      }
    }

    const updatedProject: Project = {
      ...project,
      title: finalTitle,
      category: tempCategory,
      phases: finalPhases.map((p, pIdx) => ({
        ...p,
        source_phase_id: savedRecipeObj?.phases[pIdx]?.id || (p as any).source_phase_id,
        tasks: (p.tasks || []).map((t, tIdx) => ({
          ...t,
          source_task_id: savedRecipeObj?.phases[pIdx]?.tasks[tIdx]?.id || (t as any).source_task_id
        }))
      })),
      privacy: tempPrivacy,
      recipeId: linkedRecipeId || project.recipeId
    };

    await dataService.updateProject(updatedProject, currentUser?.id);

    if (onUpdateProject) {
      await onUpdateProject(updatedProject);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setTempTitle(project.title || '');
    setTempCategory(project.category || 'General');
    setTempPhases(project.phases ? JSON.parse(JSON.stringify(project.phases)) : []);
    setTempPrivacy(project.privacy || 'public');
    setIsEditing(false);
  };

  const handleDeleteEntireProject = () => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Project?',
      message: 'Are you sure you want to delete this project? This action cannot be undone.',
      onConfirm: async () => {
        if (onDeleteProject) {
          await onDeleteProject(project.id);
        }
        setDeleteConfirm(null);
        onClose();
      }
    });
  };

  const handleCopyShare = () => {
    if (onShare) {
      onShare(project);
    } else if (navigator.clipboard) {
      const permalink = `${window.location.origin}/project/${encodeURIComponent(project.publicId || project.id)}`;
      navigator.clipboard.writeText(permalink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const totalTasks = tempPhases.reduce((acc, ph) => acc + (ph.tasks?.length || 0), 0);
  const completedTasks = tempPhases.reduce((acc, ph) => acc + (ph.tasks?.filter(t => t.completed).length || 0), 0);
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const allCompleted = tempPhases.length > 0 && tempPhases.every(ph => ph.tasks.length > 0 && ph.tasks.every(t => t.completed));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.18 }}
          className="relative w-full h-full sm:h-auto max-w-full sm:max-w-[1024px] max-h-full sm:max-h-[90vh] my-auto bg-white rounded-none sm:rounded-[20px] shadow-2xl border-0 sm:border sm:border-black/10 overflow-hidden flex flex-col z-10"
          style={{ backgroundColor: colors.ultraLight }}
        >
          {/* HEADER BANNER - Full-width band, fill = Parent Category's Light value */}
          <div
            className="w-full sticky top-0 z-20 border-b border-black/5 flex flex-col"
            style={{ backgroundColor: colors.light }}
          >
            <div className="w-full p-[12px] flex items-center justify-between gap-3 sm:gap-4">
              {/* Left: Category Badge or Category Dropdown + Bulleted/Marked Toggle */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {isEditing ? (
                  <>
                    <select
                      value={tempCategory}
                      onChange={(e) => setTempCategory(e.target.value)}
                      className="font-mono text-[11px] font-bold uppercase px-2.5 py-1.5 rounded-lg border border-black/20 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/20 cursor-pointer shrink-0"
                    >
                      {ALL_CATEGORY_NAMES.map((cat, catIdx) => (
                        <option key={`exp-proj-cat-${cat}-${catIdx}`} value={cat}>{cat}</option>
                      ))}
                    </select>

                    {/* Bulleted vs Marked Toggle */}
                    <div className="flex items-center gap-1 bg-white/90 p-1 rounded-xl border border-black/15 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleSwitchEditMode('bulleted')}
                        className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                          editModeToggle === 'bulleted'
                            ? 'bg-amber-500 text-black shadow-2xs'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
                        }`}
                        title="Bulleted Mode (Structured Phase & Task Builder)"
                      >
                        <List className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Bulleted</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSwitchEditMode('marked')}
                        className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                          editModeToggle === 'marked'
                            ? 'bg-amber-500 text-black shadow-2xs'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
                        }`}
                        title="Marked Mode (Markdown Content Entry Engine)"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Marked</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <CategoryBadge category={project.category || 'General'} collection={colors} />
                )}
              </div>

              {/* Right: Header Icon Cluster (Fixed / Sticky Upper Right) */}
              <div className="flex items-center gap-2 shrink-0">
                {isAuthor ? (
                  isEditing ? (
                    <>
                      <IconOnlyPrimaryButton
                        icon={Save}
                        onClick={handleSaveEdit}
                        title="Save Changes"
                      />
                      <IconOnlySubButton
                        icon={X}
                        onClick={handleCancelEdit}
                        collection={colors}
                        title="Cancel Edit"
                      />
                    </>
                  ) : (
                    <>
                      <IconOnlyPrimaryButton
                        icon={SquarePen}
                        onClick={() => setIsEditing(true)}
                        title="Edit Project"
                      />
                      <IconOnlySubButton
                        icon={ChevronDown}
                        onClick={onClose}
                        collection={colors}
                        title="Close Modal"
                      />
                    </>
                  )
                ) : (
                  <IconOnlySubButton
                    icon={ChevronDown}
                    onClick={onClose}
                    collection={colors}
                    title="Close Modal"
                  />
                )}
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="w-full h-[6px] bg-white overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${progressPercentage}%`,
                  backgroundColor: colors.primary,
                }}
              />
            </div>
          </div>

          {/* SCROLLABLE MODAL BODY */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* TITLE & METADATA */}
            <div className="space-y-2">
              {isEditing ? (
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="text-2xl font-display font-bold text-gray-900 bg-transparent border-0 outline-none w-full focus:ring-1 focus:ring-black/20 rounded px-1 -mx-1"
                  placeholder="Project Title..."
                />
              ) : (
                <h2 className="text-2xl font-display font-bold text-gray-900 leading-tight">
                  {project.title}
                </h2>
              )}

              <div className="flex items-center gap-3 text-xs font-mono text-gray-500">
                <span>Created: {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}</span>
                {project.completedAt && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold">Completed: {new Date(project.completedAt).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>

            {/* PHASE & TASK LIST / MARKED EDITOR */}
            {isEditing && editModeToggle === 'marked' ? (
              <div className="space-y-4">
                {/* Marked Mode Banner with Info Icon */}
                <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-950 font-mono">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-bold">Marked Mode Engine</span>
                    <span className="hidden md:inline text-[11px] text-gray-600 font-sans">
                      (# Title, ## Phase, ### Task, followed by Markdown task body)
                    </span>
                  </div>

                  <div className="relative group flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowInfoPopover(!showInfoPopover)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 cursor-pointer transition-colors flex items-center gap-1 text-[11px] font-bold uppercase"
                      title="Markdown Convention Reference"
                    >
                      <Info className="w-3.5 h-3.5 text-amber-600" />
                      <span>Info</span>
                    </button>

                    {/* Hover / Tap Info Popover */}
                    {showInfoPopover && (
                      <div className="absolute right-0 top-full mt-2 w-72 p-3.5 bg-white rounded-xl shadow-xl border border-black/10 z-40 text-xs text-gray-800 space-y-2 font-sans">
                        <div className="font-bold font-mono text-[11px] text-amber-900 border-b border-gray-100 pb-1 flex items-center justify-between">
                          <span>Marked Formatting Guide</span>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-100">Help</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-gray-600">
                          Type <code className="font-mono bg-gray-100 px-1"># Title</code> for document title, <code className="font-mono bg-gray-100 px-1">## Phase</code> for phases, and <code className="font-mono bg-gray-100 px-1">### Task</code> for step titles. Content under tasks supports bold, italics, links, images, code blocks, and tables.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowInfoPopover(false);
                            setShowSyntaxGuideModal(true);
                          }}
                          className="text-[11px] font-mono font-bold uppercase text-amber-700 hover:text-amber-900 underline block cursor-pointer pt-1"
                        >
                          Full Reference Table →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Parser Warnings Banner */}
                {parseWarnings.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-1.5 font-mono text-xs shadow-xs">
                    <div className="flex items-center justify-between border-b border-amber-200 pb-1">
                      <div className="flex items-center gap-2 font-bold text-amber-800">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Parsing Warnings ({parseWarnings.length})</span>
                      </div>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-950 font-sans">
                      {parseWarnings.map((warn, wIdx) => (
                        <li key={`explore-proj-warn-${wIdx}`}>{warn}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Textarea */}
                <div className="space-y-1">
                  <label className="font-mono text-xs font-bold uppercase text-gray-700 block">
                    Markdown Content Source
                  </label>
                  <textarea
                    value={markedText}
                    onChange={(e) => handleMarkedTextChange(e.target.value)}
                    className="w-full font-mono text-xs sm:text-sm bg-white border border-black/15 rounded-2xl p-4 min-h-[380px] shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-500/50 leading-relaxed text-gray-900"
                    placeholder="# My Project Title&#10;&#10;## Phase 1: Planning&#10;&#10;### Research requirements&#10;Add task body notes, links, or code snippets here..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {tempPhases.map((phase, pIdx) => {
                const totalInPhase = phase.tasks.length;
                const doneInPhase = phase.tasks.filter(t => t.completed).length;
                const isPhaseDone = totalInPhase > 0 && doneInPhase === totalInPhase;
                const isCollapsed = Boolean(collapsedPhases[pIdx]);

                return (
                  <div
                    key={`modal-project-ph-${phase.id || pIdx}-${pIdx}`}
                    className="rounded-2xl border border-black/10 overflow-hidden shadow-sm transition-all"
                    style={{ backgroundColor: colors.soft }}
                  >
                    {/* PHASE HEADER */}
                    <div
                      onClick={() => togglePhaseCollapse(pIdx)}
                      className="px-4 py-3 flex items-center justify-between gap-3 cursor-pointer select-none border-b border-black/5 hover:bg-black/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                            <button
                              type="button"
                              onClick={() => movePhase(pIdx, 'up')}
                              disabled={pIdx === 0}
                              className="p-1 hover:bg-black/10 rounded disabled:opacity-30"
                            >
                              <ArrowUp className="w-3.5 h-3.5 text-gray-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => movePhase(pIdx, 'down')}
                              disabled={pIdx === tempPhases.length - 1}
                              className="p-1 hover:bg-black/10 rounded disabled:opacity-30"
                            >
                              <ArrowDown className="w-3.5 h-3.5 text-gray-600" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePhaseAll(pIdx);
                            }}
                            className="p-1 rounded hover:bg-black/10 shrink-0 text-gray-800"
                            title="Toggle all tasks in phase"
                          >
                            {isPhaseDone ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        )}

                        {isEditing ? (
                          <input
                            type="text"
                            value={phase.title}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTempPhases(prev =>
                                prev.map((ph, idx) => (idx === pIdx ? { ...ph, title: val } : ph))
                              );
                            }}
                            className="font-bold text-sm text-gray-900 bg-transparent border-0 outline-none w-full focus:ring-1 focus:ring-black/20 rounded px-1 -mx-1"
                          />
                        ) : (
                          <span className={`font-bold text-sm truncate ${isPhaseDone ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {phase.title}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Right counter: Project shows done/total fraction */}
                        <span className="font-mono text-xs font-semibold text-gray-600">
                          {doneInPhase}/{totalInPhase}
                        </span>

                        {isEditing && (
                          <IconOnlySubButton
                            icon={Trash2}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePhase(pIdx);
                            }}
                            collection={colors}
                            title="Delete Phase"
                          />
                        )}

                        <div className="p-1 text-gray-500">
                          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* PHASE TASKS LIST */}
                    {!isCollapsed && (
                      <div className="p-3 space-y-2 bg-white/60">
                        {phase.tasks.map((task, tIdx) => (
                          <div
                            key={`modal-project-task-${phase.id || pIdx}-${task.id || tIdx}-${tIdx}`}
                            className="p-3 rounded-xl border border-black/5 bg-white flex items-center justify-between gap-3 shadow-2xs hover:border-black/15 transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {isEditing ? (
                                <div className="flex items-center gap-1 shrink-0">
                                  <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                                  <button
                                    type="button"
                                    onClick={() => moveTask(pIdx, tIdx, 'up')}
                                    disabled={tIdx === 0}
                                    className="p-0.5 hover:bg-black/10 rounded disabled:opacity-30"
                                  >
                                    <ArrowUp className="w-3 h-3 text-gray-600" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveTask(pIdx, tIdx, 'down')}
                                    disabled={tIdx === phase.tasks.length - 1}
                                    className="p-0.5 hover:bg-black/10 rounded disabled:opacity-30"
                                  >
                                    <ArrowDown className="w-3 h-3 text-gray-600" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleTask(pIdx, tIdx)}
                                  className="p-1 rounded hover:bg-black/5 text-gray-800 shrink-0"
                                >
                                  {task.completed ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Square className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>
                              )}

                              {isEditing ? (
                                <input
                                  type="text"
                                  value={task.title}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setTempPhases(prev =>
                                      prev.map((ph, idx) => {
                                        if (idx === pIdx) {
                                          return {
                                            ...ph,
                                            tasks: ph.tasks.map((t, subIdx) =>
                                              subIdx === tIdx ? { ...t, title: val } : t
                                            )
                                          };
                                        }
                                        return ph;
                                      })
                                    );
                                  }}
                                  className="text-xs font-medium text-gray-900 bg-transparent border-0 outline-none w-full focus:ring-1 focus:ring-black/20 rounded px-1 -mx-1"
                                  placeholder="Task description..."
                                />
                              ) : (
                                <div className="flex-1 min-w-0">
                                  <span className={`text-xs font-medium block ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                    {task.title}
                                  </span>
                                  {task.body_markdown && (
                                    <MarkedRenderer
                                      markdown={task.body_markdown}
                                      className="mt-1.5 pt-1.5 border-t border-black/5 text-xs text-gray-700"
                                    />
                                  )}
                                </div>
                              )}
                            </div>

                            {isEditing && (
                              <IconOnlySubButton
                                icon={Trash2}
                                onClick={() => handleDeleteTask(pIdx, tIdx)}
                                collection={colors}
                                title="Delete Task"
                              />
                            )}
                          </div>
                        ))}

                        {/* Add Task Button per Phase in Edit Mode */}
                        {isEditing && (
                          <div className="pt-1 flex justify-start">
                            <IconWithLabelButton
                              variant="sub"
                              icon={Plus}
                              label="ADD TASK"
                              onClick={() => handleAddTask(pIdx)}
                              collection={colors}
                              title="Add Task to Phase"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Phase Button centered below last phase block */}
              {isEditing && (
                <div className="pt-3 flex justify-center">
                  <IconWithLabelButton
                    variant="tile"
                    icon={Plus}
                    label="ADD PHASE"
                    onClick={handleAddPhase}
                    collection={colors}
                    title="Add New Phase"
                  />
                </div>
              )}
            </div>
          )}

            {/* VISIBILITY SELECTOR (in Edit Mode) */}
            {isEditing && (
              <div className="p-4 rounded-2xl border border-black/10 bg-white/80 space-y-2">
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-gray-700">
                  Project Visibility
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {(['public', 'internal', 'private'] as ProfileVisibility[]).map((vis, visIdx) => (
                    <button
                      key={`exp-proj-vis-${vis}-${visIdx}`}
                      type="button"
                      onClick={() => setTempPrivacy(vis)}
                      className={`p-2.5 rounded-xl border text-xs font-mono font-bold uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        tempPrivacy === vis
                          ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-xs'
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {vis === 'public' && <Globe className="w-3.5 h-3.5" />}
                      {vis === 'internal' && <Users className="w-3.5 h-3.5" />}
                      {vis === 'private' && <Lock className="w-3.5 h-3.5" />}
                      <span>{vis}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="p-3 sm:p-5 border-t border-black/10 bg-white/90 backdrop-blur-md flex flex-row items-center justify-between gap-2 sm:gap-4 w-full">
            {isAuthor ? (
              isEditing ? (
                <>
                  {/* Footer Edit Mode */}
                  <IconWithLabelButton
                    variant="tomato"
                    icon={Shredder}
                    label="DELETE"
                    onClick={handleDeleteEntireProject}
                    title="Delete Project"
                    mobileIconOnly={true}
                  />

                  <div className="flex items-center gap-1.5 min-w-0">
                    <input
                      type="checkbox"
                      id="save-as-recipe-check"
                      checked={saveAsRecipe}
                      onChange={(e) => setSaveAsRecipe(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer shrink-0"
                    />
                    <label htmlFor="save-as-recipe-check" className="font-mono text-[10px] sm:text-xs font-semibold text-gray-700 cursor-pointer truncate">
                      Add to Library
                    </label>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <IconWithLabelButton
                      variant="shady"
                      icon={X}
                      label="CANCEL"
                      onClick={handleCancelEdit}
                      title="Cancel Changes"
                      mobileIconOnly={true}
                    />
                    <IconWithLabelButton
                      variant="primary"
                      icon={Save}
                      label="SAVE"
                      onClick={handleSaveEdit}
                      title="Save Changes"
                      mobileIconOnly={true}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Footer Author View Mode */}
                  <IconWithLabelButton
                    variant="sub"
                    icon={MessageSquareShare}
                    label={copiedLink ? "COPIED LINK" : "SHARE"}
                    onClick={handleCopyShare}
                    collection={colors}
                    title="Share Project"
                    mobileIconOnly={true}
                  />

                  <IconWithLabelButton
                    variant="primary"
                    icon={Check}
                    label={allCompleted ? "PROJECT COMPLETED!" : "COMPLETE PROJECT"}
                    onClick={() => {
                      if (onCompleteProject) onCompleteProject(project.id);
                    }}
                    title="Complete Project"
                    mobileIconOnly={true}
                  />
                </>
              )
            ) : (
              <>
                {/* Footer Non-Author View Mode */}
                <IconWithLabelButton
                  variant="sub"
                  icon={MessageSquareShare}
                  label={copiedLink ? "COPIED LINK" : "SHARE"}
                  onClick={handleCopyShare}
                  collection={colors}
                  title="Share Project"
                  mobileIconOnly={true}
                />

                {canViewRecipe && project.recipeId && onOpenRecipe && (
                  <IconWithLabelButton
                    variant="primary"
                    icon={GitFork}
                    label="VIEW RECIPE"
                    onClick={() => onOpenRecipe(project.recipeId)}
                    title="View Linked Recipe"
                    mobileIconOnly={true}
                  />
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>

      {deleteConfirm && (
        <DeleteConfirmModal
          isOpen={deleteConfirm.isOpen}
          title={deleteConfirm.title}
          message={deleteConfirm.message}
          onConfirm={deleteConfirm.onConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      <MarkedSyntaxGuideModal
        isOpen={showSyntaxGuideModal}
        onClose={() => setShowSyntaxGuideModal(false)}
      />
    </AnimatePresence>
  );
}

// ==========================================
// RECIPE EXPLORE MODAL
// ==========================================
export interface RecipeExploreModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateRecipe?: (updatedRecipe: Recipe) => Promise<void> | void;
  onDeleteRecipe?: (recipeId: string) => Promise<void> | void;
  onStartProjectFromRecipe?: (recipe: Recipe) => void;
  onForkRecipe?: (recipe: Recipe) => void;
  isSaved?: boolean;
  onToggleSaveRecipe?: (recipeId: string, recipeObj?: Recipe) => void;
  onOpenCreatorProfile?: (authorIdOrName: string) => void;
  currentUser?: { id?: string; name?: string };
  initialEditMode?: boolean;
  forceMobileSizing?: boolean;
}

export function RecipeExploreModal({
  recipe,
  isOpen,
  onClose,
  onUpdateRecipe,
  onDeleteRecipe,
  onStartProjectFromRecipe,
  onForkRecipe,
  isSaved = false,
  onToggleSaveRecipe,
  onOpenCreatorProfile,
  currentUser,
  initialEditMode = false,
  forceMobileSizing = false
}: RecipeExploreModalProps) {
  useEffect(() => {
    if (isOpen && recipe) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen, Boolean(recipe)]);

  if (!isOpen || !recipe) return null;

  const isAuthor = Boolean(
    currentUser?.id && recipe.authorId && currentUser.id === recipe.authorId ||
    (currentUser?.name && recipe.authorName && currentUser.name.toLowerCase() === String(recipe.authorName).toLowerCase()) ||
    recipe.isCustom
  );

  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [tempTitle, setTempTitle] = useState(recipe.title || '');
  const [tempCategory, setTempCategory] = useState(recipe.category || 'General');
  const [tempDescription, setTempDescription] = useState(recipe.description || '');
  const [tempPhases, setTempPhases] = useState<any[]>(
    recipe.phases ? JSON.parse(JSON.stringify(recipe.phases)) : []
  );
  const [tempPrivacy, setTempPrivacy] = useState<RecipeVisibility>(recipe.visibility || 'public');
  const [collapsedPhases, setCollapsedPhases] = useState<Record<number, boolean>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Marked mode state
  const [editModeToggle, setEditModeToggle] = useState<'bulleted' | 'marked'>(() => {
    try {
      const saved = localStorage.getItem('gonnng_edit_mode_toggle');
      return saved === 'marked' ? 'marked' : 'bulleted';
    } catch (e) {
      return 'bulleted';
    }
  });
  const [markedText, setMarkedText] = useState('');
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [showInfoPopover, setShowInfoPopover] = useState(false);
  const [showSyntaxGuideModal, setShowSyntaxGuideModal] = useState(false);

  useEffect(() => {
    if (recipe) {
      setTempTitle(recipe.title || '');
      setTempCategory(recipe.category || 'General');
      setTempDescription(recipe.description || '');
      setTempPhases(
        recipe.phases
          ? JSON.parse(JSON.stringify(recipe.phases)).map((ph: any, pIdx: number) => ({
              id: ph.id || crypto.randomUUID(),
              title: ph.title,
              position: ph.position ?? pIdx + 1,
              tasks: (ph.tasks || []).map((t: any, tIdx: number) => ({
                id: t.id || crypto.randomUUID(),
                title: t.title,
                position: t.position ?? tIdx + 1,
                estimatedHours: t.estimatedHours,
                body_markdown: t.body_markdown,
                completed: t.completed
              }))
            }))
          : []
      );
      setTempPrivacy(recipe.visibility || 'public');
    }
  }, [recipe]);

  useEffect(() => {
    setIsEditing(initialEditMode);
  }, [initialEditMode, recipe?.id]);

  useEffect(() => {
    if (isEditing) {
      const text = serializeToMarked({
        title: tempTitle,
        description: tempDescription,
        phases: tempPhases
      });
      setMarkedText(text);
      const parsed = parseMarkedText(text, tempTitle);
      setParseWarnings(parsed.warnings);
    }
  }, [isEditing]);

  const handleSwitchEditMode = (mode: 'bulleted' | 'marked') => {
    if (mode === editModeToggle) return;

    if (mode === 'marked') {
      const text = serializeToMarked({
        title: tempTitle,
        description: tempDescription,
        phases: tempPhases
      });
      setMarkedText(text);
      const parsed = parseMarkedText(text, tempTitle);
      setParseWarnings(parsed.warnings);
    } else {
      const parsed = parseMarkedText(markedText, tempTitle);
      setTempTitle(parsed.title);
      setTempPhases(parsed.phases);
      setParseWarnings(parsed.warnings);
    }

    setEditModeToggle(mode);
    try {
      localStorage.setItem('gonnng_edit_mode_toggle', mode);
    } catch (e) {}
  };

  const handleMarkedTextChange = (val: string) => {
    setMarkedText(val);
    const parsed = parseMarkedText(val, tempTitle);
    setParseWarnings(parsed.warnings);
  };

  const activeCategory = isEditing ? tempCategory : (recipe.category || 'General');
  const colors = getCategoryColorCollection(activeCategory);

  const togglePhaseCollapse = (pIdx: number) => {
    setCollapsedPhases(prev => ({ ...prev, [pIdx]: !prev[pIdx] }));
  };

  const handleAddPhase = () => {
    setTempPhases(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: `Phase ${prev.length + 1}`,
        tasks: [{ id: crypto.randomUUID(), title: 'Initial task' }]
      }
    ]);
  };

  const handleAddTask = (phaseIndex: number) => {
    setTempPhases(prev =>
      prev.map((ph, pIdx) => {
        if (pIdx === phaseIndex) {
          return {
            ...ph,
            tasks: [...(ph.tasks || []), { id: crypto.randomUUID(), title: '' }]
          };
        }
        return ph;
      })
    );
  };

  const handleDeletePhase = (phaseIndex: number) => {
    const phaseToDelete = tempPhases[phaseIndex];
    const taskCount = phaseToDelete.tasks?.length || 0;
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Phase?',
      message: `Deleting this phase will also delete all ${taskCount} nested tasks. Are you sure you want to proceed?`,
      onConfirm: () => {
        setTempPhases(prev => prev.filter((_, idx) => idx !== phaseIndex));
        setDeleteConfirm(null);
      }
    });
  };

  const handleDeleteTask = (phaseIndex: number, taskIndex: number) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Task?',
      message: 'Are you sure you want to delete this task?',
      onConfirm: () => {
        setTempPhases(prev =>
          prev.map((ph, pIdx) => {
            if (pIdx === phaseIndex) {
              return {
                ...ph,
                tasks: ph.tasks.filter((_: any, tIdx: number) => tIdx !== taskIndex)
              };
            }
            return ph;
          })
        );
        setDeleteConfirm(null);
      }
    });
  };

  const movePhase = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === tempPhases.length - 1)) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...tempPhases];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setTempPhases(updated);
  };

  const moveTask = (phaseIndex: number, taskIndex: number, direction: 'up' | 'down') => {
    const tasks = tempPhases[phaseIndex].tasks || [];
    if ((direction === 'up' && taskIndex === 0) || (direction === 'down' && taskIndex === tasks.length - 1)) return;
    const targetIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1;
    const updatedTasks = [...tasks];
    const [moved] = updatedTasks.splice(taskIndex, 1);
    updatedTasks.splice(targetIndex, 0, moved);

    setTempPhases(prev =>
      prev.map((ph, pIdx) => (pIdx === phaseIndex ? { ...ph, tasks: updatedTasks } : ph))
    );
  };

  const handleSaveEdit = async () => {
    let finalTitle = tempTitle;
    let finalPhases = tempPhases;

    if (editModeToggle === 'marked') {
      const parsed = parseMarkedText(markedText, tempTitle);
      finalTitle = parsed.title;
      finalPhases = parsed.phases;
    }

    const updatedRecipe: Recipe = {
      ...recipe,
      title: finalTitle,
      category: tempCategory,
      description: tempDescription,
      phases: finalPhases,
      visibility: tempPrivacy,
    };
    await dataService.saveRecipe(updatedRecipe, currentUser?.id);
    if (onUpdateRecipe) {
      await onUpdateRecipe(updatedRecipe);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setTempTitle(recipe.title || '');
    setTempCategory(recipe.category || 'General');
    setTempDescription(recipe.description || '');
    setTempPhases(recipe.phases ? JSON.parse(JSON.stringify(recipe.phases)) : []);
    setTempPrivacy(recipe.visibility || 'public');
    setIsEditing(false);
  };

  const handleDeleteEntireRecipe = () => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Recipe?',
      message: 'Are you sure you want to delete this recipe? This action cannot be undone.',
      onConfirm: async () => {
        if (onDeleteRecipe) {
          await onDeleteRecipe(recipe.id);
        }
        setDeleteConfirm(null);
        onClose();
      }
    });
  };

  const handleCopyShare = () => {
    if (navigator.clipboard) {
      const permalink = `${window.location.origin}/recipe/${encodeURIComponent(recipe.publicId || recipe.id)}`;
      navigator.clipboard.writeText(permalink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.18 }}
          className={`relative w-full ${
            forceMobileSizing 
              ? 'h-[90vh] sm:h-[85vh] max-w-[360px] sm:max-w-[400px] rounded-[24px]' 
              : 'h-full sm:h-auto max-w-full sm:max-w-[1024px] rounded-none sm:rounded-[20px]'
          } max-h-full sm:max-h-[90vh] my-auto bg-white shadow-2xl border-0 sm:border sm:border-black/10 overflow-hidden flex flex-col z-10`}
          style={{ backgroundColor: colors.ultraLight }}
        >
          {/* HEADER BANNER - Full-width band, fill = Parent Category's Light value */}
          <div
            className="w-full p-[12px] flex items-center justify-between gap-3 sm:gap-4 sticky top-0 z-20 border-b border-black/5"
            style={{ backgroundColor: colors.light }}
          >
            {/* Left Cluster: Category Badge/Dropdown + Bulleted/Marked Toggle */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {isEditing ? (
                <>
                  <select
                    value={tempCategory}
                    onChange={(e) => setTempCategory(e.target.value)}
                    className="font-mono text-[11px] font-bold uppercase px-2.5 py-1.5 rounded-lg border border-black/20 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/20 cursor-pointer shrink-0"
                  >
                    {ALL_CATEGORY_NAMES.map((cat, catIdx) => (
                      <option key={`exp-rec-cat-${cat}-${catIdx}`} value={cat}>{cat}</option>
                    ))}
                  </select>

                  {/* Bulleted vs Marked Toggle */}
                  <div className="flex items-center gap-1 bg-white/90 p-1 rounded-xl border border-black/15 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleSwitchEditMode('bulleted')}
                      className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                        editModeToggle === 'bulleted'
                          ? 'bg-amber-500 text-black shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
                      }`}
                      title="Bulleted Mode (Structured Phase & Task Builder)"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Bulleted</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchEditMode('marked')}
                      className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                        editModeToggle === 'marked'
                          ? 'bg-amber-500 text-black shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
                      }`}
                      title="Marked Mode (Markdown Content Entry Engine)"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Marked</span>
                    </button>
                  </div>
                </>
              ) : (
                <CategoryBadge category={recipe.category || 'General'} collection={colors} />
              )}
            </div>

            {/* Right Cluster: Header Icon Cluster */}
            <div className="flex items-center gap-2 shrink-0">
              {isAuthor ? (
                isEditing ? (
                  <>
                    <div
                      className="w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0 border border-black/10"
                      style={{ backgroundColor: colors.soft, color: colors.dark }}
                      title="You created this recipe"
                    >
                      <BookHeart className="w-5 h-5" />
                    </div>
                    <IconOnlyPrimaryButton
                      icon={Save}
                      onClick={handleSaveEdit}
                      title="Save Changes"
                    />
                    <IconOnlySubButton
                      icon={X}
                      onClick={handleCancelEdit}
                      collection={colors}
                      title="Cancel Edit"
                    />
                  </>
                ) : (
                  <>
                    <div
                      className="w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0 border border-black/10"
                      style={{ backgroundColor: colors.soft, color: colors.dark }}
                      title="You created this recipe"
                    >
                      <BookHeart className="w-5 h-5" />
                    </div>
                    <IconOnlyPrimaryButton
                      icon={SquarePen}
                      onClick={() => setIsEditing(true)}
                      title="Edit Recipe"
                    />
                    <IconOnlySubButton
                      icon={ChevronDown}
                      onClick={onClose}
                      collection={colors}
                      title="Close Modal"
                    />
                  </>
                )
              ) : (
                <>
                  {/* Fork Button */}
                  {onForkRecipe && (
                    <IconOnlySubButton
                      icon={UtensilsCrossed}
                      onClick={() => onForkRecipe(recipe)}
                      collection={colors}
                      title="Fork / Copy Recipe"
                    />
                  )}

                  {/* Bookmark Toggle Button */}
                  {onToggleSaveRecipe && (
                    isSaved ? (
                      <IconOnlyTileButton
                        icon={Bookmark}
                        onClick={() => onToggleSaveRecipe(recipe.id, recipe)}
                        collection={COLOR_COLLECTIONS['Gonnng Gold']}
                        title="Saved in Library (Click to remove)"
                      />
                    ) : (
                      <IconOnlySubButton
                        icon={Bookmark}
                        onClick={() => onToggleSaveRecipe(recipe.id, recipe)}
                        collection={colors}
                        title="Save to Library"
                      />
                    )
                  )}

                  <IconOnlySubButton
                    icon={ChevronDown}
                    onClick={onClose}
                    collection={colors}
                    title="Close Modal"
                  />
                </>
              )}
            </div>
          </div>

          {/* SCROLLABLE MODAL BODY */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* TITLE & DESCRIPTION */}
            <div className="space-y-2">
              {isEditing ? (
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="text-2xl font-display font-bold text-gray-900 bg-transparent border-0 outline-none w-full focus:ring-1 focus:ring-black/20 rounded px-1 -mx-1"
                  placeholder="Recipe Title..."
                />
              ) : (
                <h2 className="text-2xl font-display font-bold text-gray-900 leading-tight">
                  {recipe.title}
                </h2>
              )}

              {/* METADATA ROW */}
              <div className="flex items-center gap-3 text-xs font-mono text-gray-500 flex-wrap">
                {isAuthor ? (
                  <span>Created Date: {recipe.createdAt ? new Date(recipe.createdAt).toLocaleDateString() : 'N/A'}</span>
                ) : (
                  <span>
                    Created by{' '}
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenCreatorProfile && (recipe.authorId || recipe.authorName)) {
                          onOpenCreatorProfile(recipe.authorId || recipe.authorName);
                        }
                      }}
                      className="font-bold text-gray-800 hover:text-amber-700 hover:underline cursor-pointer"
                    >
                      @{recipe.authorName || 'Anonymous'}
                    </button>
                  </span>
                )}

                <span>•</span>
                <span>Last Updated: {recipe.updatedAt ? new Date(recipe.updatedAt).toLocaleDateString() : 'N/A'}</span>

                {recipe.forkedFrom && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 font-mono text-[10px]">
                      <GitFork className="w-3 h-3" /> Forked from {recipe.forkedFrom}
                    </span>
                  </>
                )}
              </div>

              {/* DESCRIPTION */}
              {isEditing ? (
                <textarea
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  className="w-full text-sm font-sans text-gray-800 bg-transparent border border-black/10 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-black/20 mt-2"
                  rows={3}
                  placeholder="Recipe description..."
                />
              ) : (
                recipe.description && (
                  <p className="text-sm font-sans text-gray-700 leading-relaxed pt-1">
                    {recipe.description}
                  </p>
                )
              )}
            </div>

            {/* PHASE & TASK LIST / MARKED EDITOR */}
            {isEditing && editModeToggle === 'marked' ? (
              <div className="space-y-4">
                {/* Marked Mode Banner with Info Icon */}
                <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-950 font-mono">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-bold">Marked Mode Engine</span>
                    <span className="hidden md:inline text-[11px] text-gray-600 font-sans">
                      (# Title, ## Phase, ### Task, followed by Markdown task body)
                    </span>
                  </div>

                  <div className="relative group flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowInfoPopover(!showInfoPopover)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 cursor-pointer transition-colors flex items-center gap-1 text-[11px] font-bold uppercase"
                      title="Markdown Convention Reference"
                    >
                      <Info className="w-3.5 h-3.5 text-amber-600" />
                      <span>Info</span>
                    </button>

                    {/* Hover / Tap Info Popover */}
                    {showInfoPopover && (
                      <div className="absolute right-0 top-full mt-2 w-72 p-3.5 bg-white rounded-xl shadow-xl border border-black/10 z-40 text-xs text-gray-800 space-y-2 font-sans">
                        <div className="font-bold font-mono text-[11px] text-amber-900 border-b border-gray-100 pb-1 flex items-center justify-between">
                          <span>Marked Formatting Guide</span>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-100">Help</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-gray-600">
                          Type <code className="font-mono bg-gray-100 px-1"># Title</code> for document title, <code className="font-mono bg-gray-100 px-1">## Phase</code> for phases, and <code className="font-mono bg-gray-100 px-1">### Task</code> for step titles. Content under tasks supports bold, italics, links, images, code blocks, and tables.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowInfoPopover(false);
                            setShowSyntaxGuideModal(true);
                          }}
                          className="text-[11px] font-mono font-bold uppercase text-amber-700 hover:text-amber-900 underline block cursor-pointer pt-1"
                        >
                          Full Reference Table →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Parser Warnings Banner */}
                {parseWarnings.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-1.5 font-mono text-xs shadow-xs">
                    <div className="flex items-center justify-between border-b border-amber-200 pb-1">
                      <div className="flex items-center gap-2 font-bold text-amber-800">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Parsing Warnings ({parseWarnings.length})</span>
                      </div>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-950 font-sans">
                      {parseWarnings.map((warn, wIdx) => (
                        <li key={`explore-rec-warn-${wIdx}`}>{warn}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Textarea */}
                <div className="space-y-1">
                  <label className="font-mono text-xs font-bold uppercase text-gray-700 block">
                    Markdown Content Source
                  </label>
                  <textarea
                    value={markedText}
                    onChange={(e) => handleMarkedTextChange(e.target.value)}
                    className="w-full font-mono text-xs sm:text-sm bg-white border border-black/15 rounded-2xl p-4 min-h-[380px] shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-500/50 leading-relaxed text-gray-900"
                    placeholder="# My Recipe Title&#10;&#10;## Phase 1: Preparation&#10;&#10;### Prep ingredients&#10;Add recipe step body notes, links, or code snippets here..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {tempPhases.map((phase, pIdx) => {
                const tasks = phase.tasks || [];
                const isCollapsed = Boolean(collapsedPhases[pIdx]);

                return (
                  <div
                    key={`modal-recipe-ph-${phase.id || pIdx}-${pIdx}`}
                    className="rounded-2xl border border-black/10 overflow-hidden shadow-sm transition-all"
                    style={{ backgroundColor: colors.soft }}
                  >
                    {/* PHASE HEADER */}
                    <div
                      onClick={() => togglePhaseCollapse(pIdx)}
                      className="px-4 py-3 flex items-center justify-between gap-3 cursor-pointer select-none border-b border-black/5 hover:bg-black/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                            <button
                              type="button"
                              onClick={() => movePhase(pIdx, 'up')}
                              disabled={pIdx === 0}
                              className="p-1 hover:bg-black/10 rounded disabled:opacity-30"
                            >
                              <ArrowUp className="w-3.5 h-3.5 text-gray-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => movePhase(pIdx, 'down')}
                              disabled={pIdx === tempPhases.length - 1}
                              className="p-1 hover:bg-black/10 rounded disabled:opacity-30"
                            >
                              <ArrowDown className="w-3.5 h-3.5 text-gray-600" />
                            </button>
                          </div>
                        ) : (
                          /* View Mode Decorative Bullet */
                          <div className="w-2 h-2 rounded-full bg-gray-600 shrink-0 ml-1" />
                        )}

                        {isEditing ? (
                          <input
                            type="text"
                            value={phase.title}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTempPhases(prev =>
                                prev.map((ph, idx) => (idx === pIdx ? { ...ph, title: val } : ph))
                              );
                            }}
                            className="font-bold text-sm text-gray-900 bg-transparent border-0 outline-none w-full focus:ring-1 focus:ring-black/20 rounded px-1 -mx-1"
                          />
                        ) : (
                          <span className="font-bold text-sm text-gray-900 truncate">
                            {phase.title}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Right Counter: Plain task count for Recipe */}
                        <span className="font-mono text-xs font-semibold text-gray-600">
                          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                        </span>

                        {isEditing && (
                          <IconOnlySubButton
                            icon={Trash2}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePhase(pIdx);
                            }}
                            collection={colors}
                            title="Delete Phase"
                          />
                        )}

                        <div className="p-1 text-gray-500">
                          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* PHASE TASKS LIST */}
                    {!isCollapsed && (
                      <div className="p-3 space-y-2 bg-white/60">
                        {tasks.map((task: any, tIdx: number) => (
                          <div
                            key={`modal-recipe-task-${phase.id || pIdx}-${task.id || tIdx}-${tIdx}`}
                            className="p-3 rounded-xl border border-black/5 bg-white flex items-center justify-between gap-3 shadow-2xs hover:border-black/15 transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {isEditing ? (
                                <div className="flex items-center gap-1 shrink-0">
                                  <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                                  <button
                                    type="button"
                                    onClick={() => moveTask(pIdx, tIdx, 'up')}
                                    disabled={tIdx === 0}
                                    className="p-0.5 hover:bg-black/10 rounded disabled:opacity-30"
                                  >
                                    <ArrowUp className="w-3 h-3 text-gray-600" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveTask(pIdx, tIdx, 'down')}
                                    disabled={tIdx === tasks.length - 1}
                                    className="p-0.5 hover:bg-black/10 rounded disabled:opacity-30"
                                  >
                                    <ArrowDown className="w-3 h-3 text-gray-600" />
                                  </button>
                                </div>
                              ) : (
                                /* View Mode Decorative Bullet for Tasks */
                                <span className="text-gray-400 text-xs font-mono shrink-0 font-bold ml-1">•</span>
                              )}

                              {isEditing ? (
                                <input
                                  type="text"
                                  value={task.title}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setTempPhases(prev =>
                                      prev.map((ph, idx) => {
                                        if (idx === pIdx) {
                                          return {
                                            ...ph,
                                            tasks: ph.tasks.map((t: any, subIdx: number) =>
                                              subIdx === tIdx ? { ...t, title: val } : t
                                            )
                                          };
                                        }
                                        return ph;
                                      })
                                    );
                                  }}
                                  className="text-xs font-medium text-gray-900 bg-transparent border-0 outline-none w-full focus:ring-1 focus:ring-black/20 rounded px-1 -mx-1"
                                  placeholder="Step description..."
                                />
                              ) : (
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs font-semibold text-gray-900 leading-snug block">
                                    {task.title}
                                  </span>
                                  {task.body_markdown && (
                                    <MarkedRenderer
                                      markdown={task.body_markdown}
                                      className="mt-1.5 pt-1.5 border-t border-black/5 text-xs text-gray-700"
                                    />
                                  )}
                                </div>
                              )}
                            </div>

                            {isEditing && (
                              <IconOnlySubButton
                                icon={Trash2}
                                onClick={() => handleDeleteTask(pIdx, tIdx)}
                                collection={colors}
                                title="Delete Task"
                              />
                            )}
                          </div>
                        ))}

                        {/* Add Task Button per Phase in Edit Mode */}
                        {isEditing && (
                          <div className="pt-1 flex justify-start">
                            <IconWithLabelButton
                              variant="sub"
                              icon={Plus}
                              label="ADD TASK"
                              onClick={() => handleAddTask(pIdx)}
                              collection={colors}
                              title="Add Task to Phase"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Phase Button centered below last phase block */}
              {isEditing && (
                <div className="pt-3 flex justify-center">
                  <IconWithLabelButton
                    variant="tile"
                    icon={Plus}
                    label="ADD PHASE"
                    onClick={handleAddPhase}
                    collection={colors}
                    title="Add New Phase"
                  />
                </div>
              )}
            </div>
          )}

            {/* VISIBILITY SELECTOR (in Edit Mode) */}
            {isEditing && (
              <div className="p-4 rounded-2xl border border-black/10 bg-white/80 space-y-2">
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-gray-700">
                  Recipe Visibility
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {(['public', 'private'] as RecipeVisibility[]).map((vis, visIdx) => (
                    <button
                      key={`exp-rec-vis-${vis}-${visIdx}`}
                      type="button"
                      onClick={() => setTempPrivacy(vis)}
                      className={`p-2.5 rounded-xl border text-xs font-mono font-bold uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        tempPrivacy === vis
                          ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-xs'
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {vis === 'public' && <Globe className="w-3.5 h-3.5" />}
                      {vis === 'private' && <Lock className="w-3.5 h-3.5" />}
                      <span>{vis}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="p-3 sm:p-5 border-t border-black/10 bg-white/90 backdrop-blur-md flex flex-row items-center justify-between gap-2 sm:gap-4 w-full">
            {isAuthor ? (
              isEditing ? (
                <>
                  {/* Footer Author Edit Mode */}
                  <IconWithLabelButton
                    variant="tomato"
                    icon={Shredder}
                    label="DELETE"
                    onClick={handleDeleteEntireRecipe}
                    title="Delete Recipe"
                    mobileIconOnly={true}
                  />

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <IconWithLabelButton
                      variant="shady"
                      icon={X}
                      label="CANCEL"
                      onClick={handleCancelEdit}
                      title="Cancel Changes"
                      mobileIconOnly={true}
                    />
                    <IconWithLabelButton
                      variant="primary"
                      icon={Save}
                      label="SAVE"
                      onClick={handleSaveEdit}
                      title="Save Changes"
                      mobileIconOnly={true}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Footer Author View Mode */}
                  <div className="flex items-center gap-2">
                    <IconWithLabelButton
                      variant="sub"
                      icon={MessageSquareShare}
                      label={copiedLink ? "COPIED LINK" : "SHARE"}
                      onClick={handleCopyShare}
                      collection={colors}
                      title="Share Recipe"
                      mobileIconOnly={true}
                    />
                  </div>

                  {onStartProjectFromRecipe && (
                    <IconWithLabelButton
                      variant="primary"
                      icon={BookPlus}
                      label="START PROJECT"
                      onClick={() => {
                        onClose();
                        onStartProjectFromRecipe(recipe);
                      }}
                      title="Start Active Project"
                      mobileIconOnly={true}
                    />
                  )}
                </>
              )
            ) : (
              <>
                {/* Footer Non-Author View Mode */}
                <div className="flex items-center gap-2">
                  <IconWithLabelButton
                    variant="sub"
                    icon={MessageSquareShare}
                    label={copiedLink ? "COPIED LINK" : "SHARE"}
                    onClick={handleCopyShare}
                    collection={colors}
                    title="Share Recipe"
                    mobileIconOnly={true}
                  />
                </div>

                {onStartProjectFromRecipe && (
                  <IconWithLabelButton
                    variant="primary"
                    icon={BookPlus}
                    label="START PROJECT"
                    onClick={() => {
                      onClose();
                      onStartProjectFromRecipe(recipe);
                    }}
                    title="Start Active Project"
                    mobileIconOnly={true}
                  />
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>

      {deleteConfirm && (
        <DeleteConfirmModal
          isOpen={deleteConfirm.isOpen}
          title={deleteConfirm.title}
          message={deleteConfirm.message}
          onConfirm={deleteConfirm.onConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      <MarkedSyntaxGuideModal
        isOpen={showSyntaxGuideModal}
        onClose={() => setShowSyntaxGuideModal(false)}
      />
    </AnimatePresence>
  );
}
