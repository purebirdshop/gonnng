import React, { useState, useRef } from 'react';
import { Recipe, Project, Collection, FeedPost, Task, Creator } from '../types';
import { X, Camera, Image as ImageIcon, Plus, Check, Trash2, AlertCircle, Film, Upload, Info } from 'lucide-react';
import FileUploadZone from './FileUploadZone';
import { UploadedFile } from '../services/uploadService';

interface CreateHubProps {
  onClose: () => void;
  recipes: Recipe[];
  collections: Collection[];
  projects: Project[];
  privacyDefault: 'public' | 'internal' | 'private';
  currentUser?: Creator;
  onAddRecipe?: (recipe: Recipe) => void;
  onAddProject: (project: Project) => void;
  onAddPost: (post: FeedPost) => void;
  onAddCollection?: (collection: Collection) => void;
  onUpdateProject?: (project: Project) => void;
  onUpdateRecipe?: (recipe: Recipe) => void;
  forkInitialData?: Recipe | null;
  editingRecipe?: Recipe | null;
  theme?: 'dark' | 'light';
}

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  name?: string;
}

export default function CreateHub({
  onClose,
  recipes,
  collections,
  projects,
  privacyDefault,
  currentUser,
  onAddRecipe,
  onAddProject,
  onAddPost,
  onAddCollection,
  onUpdateProject,
  onUpdateRecipe,
  forkInitialData,
  editingRecipe,
  theme = 'dark'
}: CreateHubProps) {
  const myUserId = currentUser?.id || 'user-current';
  const myUserName = currentUser?.name || 'Creative Architect';
  const myUserAvatar = currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120';
  // Modes: 'focus', 'project', 'recipe', 'update'
  const [activeMode, setActiveMode] = useState<'focus' | 'project' | 'recipe' | 'update'>(editingRecipe ? 'recipe' : 'project');

  // Media attachments state (up to 10 items)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [imageError, setImageError] = useState('');
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showLibraryInfoModal, setShowLibraryInfoModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Common Presets for Quick Media Selection
  const MEDIA_PRESETS = [
    { url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600', type: 'image' as const, name: 'Creative Studio' },
    { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=600', type: 'image' as const, name: 'Design Study' },
    { url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=600', type: 'image' as const, name: 'Crafting Work' },
    { url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=600', type: 'image' as const, name: 'Architect Setup' },
    { url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=600', type: 'image' as const, name: 'Art Workshop' }
  ];

  // -------------------------------------------------------------
  // 1. FOCUS State
  // -------------------------------------------------------------
  const [focusTitle, setFocusTitle] = useState('');
  const [focusDesc, setFocusDesc] = useState('');
  const [focusTimeframe, setFocusTimeframe] = useState(''); // Estimate in hours
  const [focusWorkMode, setFocusWorkMode] = useState<'sequential' | 'parallel' | 'hybrid'>('parallel');

  // -------------------------------------------------------------
  // 2. PROJECT State
  // -------------------------------------------------------------
  interface FormPhase {
    id: string;
    title: string;
    tasks: { id: string; title: string }[];
  }

  const [projFocusId, setProjFocusId] = useState<string>(''); // Optional Area of FOCUS
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(forkInitialData ? forkInitialData.id : ''); // Optional Recipe
  const [projTitle, setProjTitle] = useState(forkInitialData ? forkInitialData.title : '');
  const [projDesc, setProjDesc] = useState(forkInitialData ? forkInitialData.description : '');
  const [projTimeframe, setProjTimeframe] = useState(() => {
    if (forkInitialData?.phases) {
      const est = forkInitialData.phases.reduce((sum, ph) => sum + (ph.tasks?.reduce((ts, t) => ts + (t.estimatedHours || 2), 0) || 0), 0);
      return String(est || 8);
    }
    return '';
  });
  const [addToLibrary, setAddToLibrary] = useState(true);

  // -------------------------------------------------------------
  // 3. RECIPE State
  // -------------------------------------------------------------
  const initialRecipeData = editingRecipe || forkInitialData;
  const [recipeTitle, setRecipeTitle] = useState(
    editingRecipe ? editingRecipe.title : (forkInitialData ? `Fork of ${forkInitialData.title}` : '')
  );
  const [recipeCategory, setRecipeCategory] = useState(initialRecipeData ? initialRecipeData.category : 'Creative');
  const [recipeDesc, setRecipeDesc] = useState(initialRecipeData ? initialRecipeData.description : '');
  const [recipeTags, setRecipeTags] = useState(initialRecipeData ? initialRecipeData.tags.join(', ') : 'creative, process');

  // Editable phases & tasks for project/recipe creation
  const [customPhases, setCustomPhases] = useState<FormPhase[]>(() => {
    if (initialRecipeData && initialRecipeData.phases) {
      return initialRecipeData.phases.map((ph, pIdx) => ({
        id: `ph-${pIdx}`,
        title: ph.title,
        tasks: ph.tasks.map((t, tIdx) => ({ id: `tk-${pIdx}-${tIdx}`, title: t.title }))
      }));
    }
    return [
      {
        id: `ph-1`,
        title: 'Phase 1: Planning & Setup',
        tasks: [
          { id: `tk-1-1`, title: 'Define scope & initial materials' }
        ]
      }
    ];
  });

  React.useEffect(() => {
    if (forkInitialData && !editingRecipe) {
      setActiveMode('project');
      setSelectedRecipeId(forkInitialData.id);
      setProjTitle(forkInitialData.title);
      setProjDesc(forkInitialData.description);
      const totalEst = forkInitialData.phases?.reduce((sum, ph) => sum + (ph.tasks?.reduce((ts, t) => ts + (t.estimatedHours || 2), 0) || 0), 0) || 8;
      setProjTimeframe(String(totalEst));
      if (forkInitialData.phases && forkInitialData.phases.length > 0) {
        setCustomPhases(forkInitialData.phases.map((ph, pIdx) => ({
          id: `ph-${pIdx}`,
          title: ph.title,
          tasks: ph.tasks.map((t, tIdx) => ({ id: `tk-${pIdx}-${tIdx}`, title: t.title }))
        })));
      }
    } else if (editingRecipe) {
      setActiveMode('recipe');
      setRecipeTitle(editingRecipe.title);
      setRecipeCategory(editingRecipe.category);
      setRecipeDesc(editingRecipe.description);
      setRecipeTags(editingRecipe.tags ? editingRecipe.tags.join(', ') : '');
      if (editingRecipe.phases && editingRecipe.phases.length > 0) {
        setCustomPhases(editingRecipe.phases.map((ph, pIdx) => ({
          id: `ph-${pIdx}`,
          title: ph.title,
          tasks: ph.tasks.map((t, tIdx) => ({ id: `tk-${pIdx}-${tIdx}`, title: t.title }))
        })));
      }
    }
  }, [forkInitialData, editingRecipe]);

  const handleRecipeSelect = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    const found = recipes.find(r => r.id === recipeId);
    if (found) {
      if (!projTitle) setProjTitle(found.title);
      if (!projDesc) setProjDesc(found.description);
      const totalEst = found.phases?.reduce((sum, ph) => sum + (ph.tasks?.reduce((ts, t) => ts + (t.estimatedHours || 2), 0) || 0), 0) || 0;
      if (totalEst > 0 && !projTimeframe) setProjTimeframe(String(totalEst));

      if (found.phases && found.phases.length > 0) {
        setCustomPhases(found.phases.map((ph, pIdx) => ({
          id: `ph-${Date.now()}-${pIdx}`,
          title: ph.title,
          tasks: ph.tasks.map((t, tIdx) => ({
            id: `tk-${Date.now()}-${pIdx}-${tIdx}`,
            title: t.title
          }))
        })));
      }
    }
  };

  const handleAddPhase = () => {
    const newPhaseIndex = customPhases.length + 1;
    const newPhase: FormPhase = {
      id: `ph-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `Phase ${newPhaseIndex}: New Phase`,
      tasks: [
        { id: `tk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, title: '' }
      ]
    };
    setCustomPhases(prev => [...prev, newPhase]);
  };

  const handleDeletePhase = (phaseId: string) => {
    if (customPhases.length <= 1) return; // Must keep at least 1 phase
    setCustomPhases(prev => prev.filter(p => p.id !== phaseId));
  };

  const handleUpdatePhaseTitle = (phaseId: string, title: string) => {
    setCustomPhases(prev => prev.map(p => p.id === phaseId ? { ...p, title } : p));
  };

  const handleAddTask = (phaseId: string) => {
    setCustomPhases(prev => prev.map(p => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        tasks: [
          ...p.tasks,
          { id: `tk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, title: '' }
        ]
      };
    }));
  };

  const handleDeleteTask = (phaseId: string, taskId: string) => {
    setCustomPhases(prev => prev.map(p => {
      if (p.id !== phaseId) return p;
      if (p.tasks.length <= 1) return p; // Every phase requires at least 1 task

      return {
        ...p,
        tasks: p.tasks.filter(t => t.id !== taskId)
      };
    }));
  };

  const handleUpdateTaskTitle = (phaseId: string, taskId: string, title: string) => {
    setCustomPhases(prev => prev.map(p => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        tasks: p.tasks.map(t => t.id === taskId ? { ...t, title } : t)
      };
    }));
  };

  // -------------------------------------------------------------
  // 3. UPDATE State
  // -------------------------------------------------------------
  // Filter projects less than 100% complete
  const incompleteProjects = projects.filter(p => {
    const totalTasks = p.phases.reduce((sum, ph) => sum + ph.tasks.length, 0);
    if (totalTasks === 0) return true;
    const completedTasks = p.phases.reduce((sum, ph) => sum + ph.tasks.filter(t => t.completed).length, 0);
    return completedTasks < totalTasks;
  });

  const [updateProjId, setUpdateProjId] = useState<string>(incompleteProjects[0]?.id || projects[0]?.id || '');
  const [updateDesc, setUpdateDesc] = useState('');
  const [updateHashtags, setUpdateHashtags] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const activeUpdateProject = projects.find(p => p.id === updateProjId);

  // Toggle selected task in UPDATE form
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  // Handle local file uploads (up to 10)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newItems: MediaItem[] = files.map((file: File) => {
      const isVideo = file.type.startsWith('video');
      return {
        id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        url: URL.createObjectURL(file),
        type: isVideo ? 'video' : 'image',
        name: file.name
      };
    });

    setMediaItems(prev => [...prev, ...newItems].slice(0, 10));
    setImageError('');
    setShowMediaModal(false);
  };

  const addPresetMedia = (preset: { url: string; type: 'image' | 'video'; name: string }) => {
    if (mediaItems.length >= 10) return;
    setMediaItems(prev => [
      ...prev,
      {
        id: `media-preset-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        url: preset.url,
        type: preset.type,
        name: preset.name
      }
    ]);
    setImageError('');
  };

  const removeMediaItem = (id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
  };

  // -------------------------------------------------------------
  // Form Submit Handlers
  // -------------------------------------------------------------

  // A. CREATE FOCUS (Area of FOCUS)
  const handleCreateFocus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!focusTitle.trim()) return;

    if (mediaItems.length === 0) {
      setImageError('An image or video attachment is required to create an Area of FOCUS.');
      return;
    }

    const newCollection: Collection = {
      id: `focus-${Date.now()}`,
      title: focusTitle.trim(),
      description: focusDesc.trim(),
      deadlineDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      projectIds: [],
      workMode: focusWorkMode,
      budgetedHours: focusTimeframe ? Number(focusTimeframe) : 0
    };

    onAddCollection?.(newCollection);

    // Feed Post
    const mainImage = mediaItems[0]?.url;
    const newPost: FeedPost = {
      id: `post-focus-${Date.now()}`,
      type: 'project_created',
      userId: myUserId,
      userName: myUserName,
      userAvatar: myUserAvatar,
      timeString: 'Just now',
      title: `Created new Area of FOCUS: "${newCollection.title}"`,
      content: focusDesc || `Established a new area of FOCUS with an initial timeframe estimate of ${newCollection.budgetedHours || 0} hours.`,
      attachedId: newCollection.id,
      attachedName: newCollection.title,
      image: mainImage,
      privacy: privacyDefault || 'public',
      createdAt: new Date().toISOString(),
      gongs: { continue: 0, refine: 0, reconsider: 0 }
    };

    onAddPost(newPost);
    onClose();
  };

  // B. CREATE PROJECT
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) return;

    if (mediaItems.length === 0) {
      setImageError('An image or video attachment is required to post a PROJECT.');
      return;
    }

    const hoursEst = Number(projTimeframe) || 8;
    const chosenRecipe = recipes.find(r => r.id === selectedRecipeId);

    // Build project phases from customPhases state
    let projectPhases = customPhases
      .filter(ph => ph.title.trim().length > 0)
      .map((ph, pIdx) => {
        const validTasks = ph.tasks.filter(t => t.title.trim().length > 0);
        return {
          id: `phase-${pIdx + 1}-${Date.now()}`,
          title: ph.title.trim(),
          tasks: validTasks.map((t, tIdx) => ({
            id: `task-${pIdx + 1}-${tIdx + 1}-${Date.now()}`,
            title: t.title.trim(),
            completed: false,
            estimatedHours: Math.max(1, Math.ceil(hoursEst / (validTasks.length || 1)))
          }))
        };
      })
      .filter(ph => ph.tasks.length > 0);

    // Ensure at least one phase and task if all inputs were cleared
    if (projectPhases.length === 0) {
      projectPhases = [
        {
          id: `phase-1-${Date.now()}`,
          title: 'Phase 1: Initial Setup',
          tasks: [
            { id: `task-1-1-${Date.now()}`, title: 'Initial Project Task', completed: false, estimatedHours: hoursEst }
          ]
        }
      ];
    }

    const newProject: Project = {
      id: `project-${Date.now()}`,
      title: projTitle.trim(),
      recipeId: chosenRecipe ? chosenRecipe.id : 'recipe-custom',
      recipeTitle: chosenRecipe ? chosenRecipe.title : (projFocusId ? (collections.find(c => c.id === projFocusId)?.title || 'Area of FOCUS') : 'Standalone Project'),
      phases: projectPhases,
      createdAt: new Date().toISOString(),
      collectionId: projFocusId || undefined,
      privacy: privacyDefault,
      progressPhotos: mediaItems.map(m => ({
        url: m.url,
        caption: projDesc || projTitle,
        date: new Date().toISOString().split('T')[0]
      }))
    };

    onAddProject(newProject);

    // Add to my library if checked
    if (addToLibrary && onAddRecipe) {
      const newRecipe: Recipe = {
        id: `recipe-custom-${Date.now()}`,
        title: projTitle.trim(),
        authorId: myUserId,
        authorName: myUserName,
        category: chosenRecipe ? chosenRecipe.category : 'Creative',
        description: projDesc.trim() || `Execution blueprint for ${projTitle.trim()}`,
        phases: projectPhases.map(ph => ({
          title: ph.title,
          tasks: ph.tasks.map(t => ({
            title: t.title,
            estimatedHours: t.estimatedHours || 1
          }))
        })),
        tags: ['my-projects', 'custom'],
        isCustom: true
      };
      onAddRecipe(newRecipe);
    }

    // Feed Post
    const mainImage = mediaItems[0]?.url;
    const newPost: FeedPost = {
      id: `post-project-${Date.now()}`,
      type: 'project_created',
      userId: myUserId,
      userName: myUserName,
      userAvatar: myUserAvatar,
      timeString: 'Just now',
      title: `Started Project: "${newProject.title}"`,
      content: projDesc || `Started a new project${projFocusId ? ` under the Area of FOCUS: ${collections.find(c => c.id === projFocusId)?.title}` : ''}. Timeframe estimate: ${hoursEst} hours.`,
      attachedId: newProject.id,
      attachedName: newProject.title,
      image: mainImage,
      privacy: newProject.privacy || privacyDefault || 'public',
      createdAt: new Date().toISOString(),
      gongs: { continue: 0, refine: 0, reconsider: 0 }
    };

    onAddPost(newPost);
    onClose();
  };

  // C. CREATE RECIPE (STANDALONE BLUEPRINT)
  const handleCreateRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeTitle.trim()) return;

    // Image required when making a new recipe
    if (mediaItems.length === 0) {
      setImageError('An image attachment is required when creating a new recipe blueprint.');
      return;
    }

    let recipePhases = customPhases
      .filter(ph => ph.title.trim().length > 0)
      .map((ph) => {
        const validTasks = ph.tasks.filter(t => t.title.trim().length > 0);
        return {
          title: ph.title.trim(),
          tasks: validTasks.map(t => ({
            title: t.title.trim(),
            estimatedHours: 2
          }))
        };
      })
      .filter(ph => ph.tasks.length > 0);

    if (recipePhases.length === 0) {
      recipePhases = [
        {
          title: 'Phase 1: Setup',
          tasks: [{ title: 'Initial Recipe Step', estimatedHours: 2 }]
        }
      ];
    }

    const validCategories: ('Humorous' | 'Practical' | 'Creative' | 'Educational' | 'Strategy')[] = ['Humorous', 'Practical', 'Creative', 'Educational', 'Strategy'];
    const matchedCategory = validCategories.find(c => c.toLowerCase() === recipeCategory.trim().toLowerCase()) || 'Creative';

    if (editingRecipe) {
      const updatedRecipe: Recipe = {
        ...editingRecipe,
        title: recipeTitle.trim(),
        category: matchedCategory,
        description: recipeDesc.trim() || `Step-by-step process blueprint for ${recipeTitle.trim()}`,
        phases: recipePhases,
        tags: recipeTags ? recipeTags.split(',').map(t => t.trim()).filter(Boolean) : editingRecipe.tags,
      };
      if (onUpdateRecipe) {
        onUpdateRecipe(updatedRecipe);
      } else if (onAddRecipe) {
        onAddRecipe(updatedRecipe);
      }
      onClose();
      return;
    }

    const newRecipe: Recipe = {
      id: `recipe-custom-${Date.now()}`,
      title: recipeTitle.trim(),
      authorId: myUserId,
      authorName: myUserName,
      category: matchedCategory,
      description: recipeDesc.trim() || `Step-by-step process blueprint for ${recipeTitle.trim()}`,
      phases: recipePhases,
      tags: recipeTags ? recipeTags.split(',').map(t => t.trim()).filter(Boolean) : ['custom', 'recipe'],
      isCustom: true
    };

    if (onAddRecipe) {
      onAddRecipe(newRecipe);
    }

    const mainImage = mediaItems[0]?.url;
    const newPost: FeedPost = {
      id: `post-recipe-${Date.now()}`,
      type: 'project_created',
      userId: myUserId,
      userName: myUserName,
      userAvatar: myUserAvatar,
      timeString: 'Just now',
      title: `Published Recipe Blueprint: "${newRecipe.title}"`,
      content: recipeDesc || `Created and published a new process blueprint in my Process Library.`,
      attachedId: newRecipe.id,
      attachedName: newRecipe.title,
      image: mainImage,
      images: mediaItems.map(m => m.url),
      privacy: privacyDefault || 'public',
      createdAt: new Date().toISOString(),
      gongs: { continue: 0, refine: 0, reconsider: 0 }
    };

    onAddPost(newPost);
    onClose();
  };

  // C. POST UPDATE
  const handlePostUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUpdateProject) return;

    // Check off selected tasks on active project
    let updatedPhases = activeUpdateProject.phases;
    if (selectedTaskIds.length > 0) {
      updatedPhases = activeUpdateProject.phases.map(ph => ({
        ...ph,
        tasks: ph.tasks.map(t => {
          if (selectedTaskIds.includes(t.id)) {
            return { ...t, completed: true, completedAt: new Date().toISOString() };
          }
          return t;
        })
      }));
    }

    const newPhotos = mediaItems.map(m => ({
      url: m.url,
      caption: updateDesc || 'Project checkpoint update',
      date: new Date().toISOString().split('T')[0]
    }));

    const updatedProject: Project = {
      ...activeUpdateProject,
      phases: updatedPhases,
      progressPhotos: [...(activeUpdateProject.progressPhotos || []), ...newPhotos]
    };

    onUpdateProject?.(updatedProject);

    // Feed post
    const mainImage = mediaItems[0]?.url;
    const completedTaskTitles = activeUpdateProject.phases
      .flatMap(ph => ph.tasks)
      .filter(t => selectedTaskIds.includes(t.id))
      .map(t => t.title);

    const postTitle = completedTaskTitles.length > 0
      ? `Updated Task on "${activeUpdateProject.title}": ${completedTaskTitles.join(', ')}`
      : `Progress Checkpoint for "${activeUpdateProject.title}"`;

    const parsedHashtags = updateHashtags
      .split(/[\s,]+/)
      .map(t => t.trim())
      .filter(Boolean)
      .map(t => t.startsWith('#') ? t : `#${t}`);

    const newPost: FeedPost = {
      id: `post-update-${Date.now()}`,
      type: 'update_logged',
      userId: myUserId,
      userName: myUserName,
      userAvatar: myUserAvatar,
      timeString: 'Just now',
      title: postTitle,
      content: updateDesc || (completedTaskTitles.length > 0 ? `Completed ${completedTaskTitles.length} task(s) and logged a progress update.` : 'Logged a new progress update.'),
      attachedId: activeUpdateProject.id,
      attachedName: activeUpdateProject.title,
      image: mainImage,
      images: mediaItems.map(m => m.url),
      hashtags: parsedHashtags,
      privacy: activeUpdateProject.privacy || privacyDefault || 'public',
      createdAt: new Date().toISOString(),
      gongs: { continue: 0, refine: 0, reconsider: 0 }
    };

    onAddPost(newPost);
    onClose();
  };

  // Helper to calculate total accumulated hours for a focus area
  const getAccumulatedFocusHours = (colId: string) => {
    const focusProjects = projects.filter(p => p.collectionId === colId);
    return focusProjects.reduce((sum, p) => {
      return sum + p.phases.reduce((pSum, ph) => {
        return pSum + ph.tasks.reduce((tSum, t) => tSum + (t.estimatedHours || 1), 0);
      }, 0);
    }, 0);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" id="creation-station-modal">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*,video/*"
        multiple
        className="hidden"
      />

      <div className={`rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border max-h-[92vh] flex flex-col relative transition-colors ${
        theme === 'light'
          ? 'bg-white text-gray-900 border-gray-200'
          : 'bg-[#121212] text-white border-white/10'
      }`}>
        
        {/* Fixed Non-Scrollable Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 shrink-0 ${
          theme === 'light' ? 'border-gray-200 bg-gray-50/50' : 'border-white/10 bg-white/[0.02]'
        }`}>
          {/* Top 3 Options Selector */}
          <div className={`grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl border flex-1 ${
            theme === 'light' ? 'bg-gray-100 border-gray-200' : 'bg-white/5 border-white/10'
          }`}>
            <button
              type="button"
              id="mode-focus-btn"
              onClick={() => {
                setActiveMode('focus');
                setImageError('');
              }}
              className={`py-2 text-center text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                activeMode === 'focus'
                  ? 'bg-[#FF5C00] text-black shadow-md font-bold'
                  : theme === 'light' ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-200' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              FOCUS
            </button>
            <button
              type="button"
              id="mode-project-btn"
              onClick={() => {
                setActiveMode('project');
                setImageError('');
              }}
              className={`py-2 text-center text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                activeMode === 'project'
                  ? 'bg-[#FF5C00] text-black shadow-md font-bold'
                  : theme === 'light' ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-200' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              PROJECT
            </button>
            <button
              type="button"
              id="mode-update-btn"
              onClick={() => {
                setActiveMode('update');
                setImageError('');
              }}
              className={`py-2 text-center text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                activeMode === 'update'
                  ? 'bg-[#FF5C00] text-black shadow-md font-bold'
                  : theme === 'light' ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-200' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              UPDATE
            </button>
          </div>

          {/* Close Button */}
          <button
            type="button"
            id="close-hub-btn"
            onClick={onClose}
            className={`p-2 rounded-full transition-all border cursor-pointer shadow-sm shrink-0 ${
              theme === 'light'
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border-gray-300'
                : 'bg-black/70 hover:bg-black text-white/60 hover:text-white border-white/10'
            }`}
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Padding Container (Scrollable) */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-5">

          {/* Large Thumbnail Media Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">
                Media Attachment {activeMode === 'update' ? (
                  <span className="text-white/40 font-normal lowercase">(Optional)</span>
                ) : (
                  <span className="text-[#FF5C00] font-bold lowercase">(Required)</span>
                )}
              </label>
              {mediaItems.length > 0 && (
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  ✓ Attached ({mediaItems.length})
                </span>
              )}
            </div>

            {imageError && (
              <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-red-400 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{imageError}</span>
              </div>
            )}

            <div
              onClick={() => {
                setImageError('');
                setShowMediaModal(true);
              }}
              className={`relative w-full h-48 sm:h-56 rounded-2xl border-2 border-dashed bg-black/60 hover:border-[#FF5C00]/80 transition-all flex flex-col items-center justify-center p-3 cursor-pointer overflow-hidden group shadow-inner ${
                imageError ? 'border-red-500/80 bg-red-950/20' : 'border-white/20'
              }`}
            >
              {mediaItems.length > 0 ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={mediaItems[0].url}
                    alt="Media preview"
                    className="w-full h-full object-cover rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all rounded-xl flex items-center justify-center">
                    <span className="bg-black/80 backdrop-blur-md text-white font-mono text-xs px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5 shadow-lg">
                      <Camera className="w-4 h-4 text-[#FF5C00]" />
                      {mediaItems.length} {mediaItems.length === 1 ? 'media attached' : 'media items'} (Click to manage)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center space-y-2 p-4">
                  <div className="w-12 h-12 rounded-full bg-[#FF5C00]/15 border border-[#FF5C00]/30 flex items-center justify-center text-[#FF5C00] group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Click to Open Camera / Upload Media</p>
                    <p className="text-[10px] font-mono text-white/40 mt-0.5">
                      Up to 10 images or videos (Videos trim to 60s when multi-uploading)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Attached Thumbnails Strip */}
            {mediaItems.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {mediaItems.map((item, idx) => (
                  <div key={item.id} className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/20 shrink-0 group">
                    <img src={item.url} alt={`Media ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMediaItem(item.id);
                      }}
                      className="absolute top-0.5 right-0.5 p-1 bg-black/80 text-white hover:text-red-400 rounded-full text-[10px]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {mediaItems.length < 10 && (
                  <button
                    type="button"
                    onClick={() => setShowMediaModal(true)}
                    className="w-14 h-14 rounded-xl border border-dashed border-white/20 hover:border-[#FF5C00] bg-white/5 flex items-center justify-center text-white/40 hover:text-white shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* FORM TYPE 1: FOCUS */}
          {activeMode === 'focus' && (
            <form onSubmit={handleCreateFocus} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">
                  Title <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={focusTitle}
                  onChange={(e) => setFocusTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-sans text-white focus:outline-none focus:border-[#FF5C00]"
                  placeholder="e.g. Fine Art Painting, Hardware Prototyping"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">Description</label>
                <textarea
                  value={focusDesc}
                  onChange={(e) => setFocusDesc(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-sans text-white focus:outline-none focus:border-[#FF5C00] leading-relaxed"
                  placeholder="Describe this area of FOCUS and core creative goals..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">
                  Work Execution Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['sequential', 'parallel', 'hybrid'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setFocusWorkMode(mode)}
                      className={`py-2 px-3 rounded-xl border text-center text-xs font-mono uppercase font-bold transition-all cursor-pointer ${
                        focusWorkMode === mode
                          ? 'bg-[#FF5C00] border-[#FF5C00] text-black shadow-md'
                          : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">
                  Timeframe <span className="text-white/40 font-normal lowercase">(estimate in hours)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={focusTimeframe}
                  onChange={(e) => setFocusTimeframe(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-[#FF5C00]"
                  placeholder="e.g. 40"
                />
              </div>

              <div className="flex flex-row items-center justify-end gap-3 pt-4 border-t border-white/10 w-full">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none justify-center items-center flex px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none justify-center items-center flex px-6 py-2.5 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
                >
                  CREATE
                </button>
              </div>
            </form>
          )}

          {/* FORM TYPE 2: PROJECT */}
          {activeMode === 'project' && (
            <form onSubmit={handleCreateProject} className="space-y-4">
              {/* Horizontal Scroll of Active Areas of FOCUS */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">
                  Area of FOCUS
                </label>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {collections.map(col => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setProjFocusId(prev => prev === col.id ? '' : col.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-mono shrink-0 border transition-all cursor-pointer ${
                        projFocusId === col.id
                          ? 'bg-[#FF5C00] text-black font-bold border-[#FF5C00]'
                          : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {col.title}
                    </button>
                  ))}
                  {collections.length === 0 && (
                    <p className="text-xs text-white/40 font-mono py-1">No Areas of FOCUS created yet.</p>
                  )}
                </div>
              </div>

              {/* Recipe Selection Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">
                  Recipe Blueprint
                </label>
                <select
                  id="creation-station-recipe-select"
                  value={selectedRecipeId}
                  onChange={(e) => handleRecipeSelect(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#181818] border border-white/10 rounded-xl text-sm font-sans text-white focus:outline-none focus:border-[#FF5C00] cursor-pointer"
                >
                  <option value="" className="bg-[#181818] text-white/60">Select a Recipe from your Library...</option>
                  {recipes.map(recipe => (
                    <option key={recipe.id} value={recipe.id} className="bg-[#181818] text-white">
                      {recipe.title} ({recipe.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">
                  Title <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-sans text-white focus:outline-none focus:border-[#FF5C00]"
                  placeholder="e.g. Master Oil Painting Canvas Study"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">Description</label>
                <textarea
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-sans text-white focus:outline-none focus:border-[#FF5C00] leading-relaxed"
                  placeholder="Explain project details, milestones, and deliverables..."
                />
              </div>

              {/* Phases & Tasks Section */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">
                    Phases & Tasks
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPhase}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-[#FF5C00] font-mono text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-[#FF5C00]/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Phase
                  </button>
                </div>

                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {customPhases.map((phase, pIdx) => (
                    <div key={phase.id} className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2.5">
                      {/* Phase Header */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={phase.title}
                          onChange={(e) => handleUpdatePhaseTitle(phase.id, e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-[#181818] border border-white/10 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-[#FF5C00]"
                          placeholder={`Phase ${pIdx + 1} Title...`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => handleDeletePhase(phase.id)}
                          disabled={customPhases.length <= 1}
                          title={customPhases.length <= 1 ? "Minimum 1 phase required" : "Delete Phase"}
                          className={`p-1.5 rounded-lg border transition-all ${
                            customPhases.length <= 1 
                              ? 'opacity-30 cursor-not-allowed border-white/5 text-white/30' 
                              : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 cursor-pointer'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Tasks List */}
                      <div className="space-y-2 pl-2 border-l-2 border-white/10">
                        {phase.tasks.map((task, tIdx) => {
                          const isLastTaskInPhase = phase.tasks.length <= 1;

                          return (
                            <div key={task.id} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={task.title}
                                onChange={(e) => handleUpdateTaskTitle(phase.id, task.id, e.target.value)}
                                className="flex-1 px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs font-sans text-white/90 focus:outline-none focus:border-[#FF5C00]"
                                placeholder={`Task ${tIdx + 1} description...`}
                                required
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(phase.id, task.id)}
                                disabled={isLastTaskInPhase}
                                title={isLastTaskInPhase ? "Minimum 1 task required per phase" : "Delete Task"}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  isLastTaskInPhase 
                                    ? 'opacity-30 cursor-not-allowed border-white/5 text-white/30' 
                                    : 'bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 border-white/10 hover:border-red-500/30 cursor-pointer'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => handleAddTask(phase.id)}
                          className="mt-1 text-[11px] font-mono text-[#FF5C00] hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          Add Task
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider opacity-60">
                  Timeframe <span className="font-normal lowercase opacity-60">(estimate in hours)</span>
                </label>
                <input
                  type="text"
                  value={projTimeframe}
                  onChange={(e) => setProjTimeframe(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm font-mono focus:outline-none focus:border-[#FF5C00] ${
                    theme === 'light' ? 'bg-gray-50 border border-gray-300 text-gray-900' : 'bg-white/5 border border-white/10 text-white'
                  }`}
                  placeholder="e.g. 12"
                />
              </div>

              {/* Add to my library Checkbox with Information Modal trigger */}
              <div className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                theme === 'light'
                  ? 'bg-gray-50 border-gray-200 text-gray-800'
                  : 'bg-white/5 border-white/10 text-white/90'
              }`}>
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={addToLibrary}
                    onChange={(e) => setAddToLibrary(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#FF5C00] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold">Add to my library!</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowLibraryInfoModal(true)}
                  className="p-1 text-white/40 hover:text-[#FF5C00] transition-colors cursor-pointer"
                  title="More Information"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-row items-center justify-end gap-3 pt-4 border-t border-white/10 w-full">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none justify-center items-center flex px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none justify-center items-center flex px-6 py-2.5 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
                >
                  POST
                </button>
              </div>
            </form>
          )}

          {/* FORM TYPE 3: UPDATE */}
          {activeMode === 'update' && (
            <form onSubmit={handlePostUpdate} className="space-y-4">
              {/* Horizontal Scroll of Active Projects (<100% complete) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">
                  Select Project <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {incompleteProjects.length > 0 ? (
                    incompleteProjects.map(proj => (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => {
                          setUpdateProjId(proj.id);
                          setSelectedTaskIds([]);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-mono shrink-0 border transition-all cursor-pointer ${
                          updateProjId === proj.id
                            ? 'bg-[#FF5C00] text-black font-bold border-[#FF5C00]'
                            : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {proj.title}
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-white/40 font-mono py-1">No incomplete projects found.</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">Description</label>
                <textarea
                  value={updateDesc}
                  onChange={(e) => setUpdateDesc(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-sans text-white focus:outline-none focus:border-[#FF5C00] leading-relaxed"
                  placeholder="Share details about your work progress or checkpoint..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">Hashtags</label>
                <input
                  type="text"
                  value={updateHashtags}
                  onChange={(e) => setUpdateHashtags(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#FF5C00]"
                  placeholder="#woodworking, #diy, #progress"
                />
              </div>

              {/* Phases and Incomplete Tasks for Selected Project */}
              {activeUpdateProject && (
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">
                    Select Tasks to Update & Check Off
                  </label>

                  <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 space-y-3 max-h-48 overflow-y-auto">
                    {activeUpdateProject.phases.map((phase, pIdx) => {
                      const incompleteInPhase = phase.tasks.filter(t => !t.completed);
                      if (incompleteInPhase.length === 0) return null;

                      return (
                        <div key={phase.id} className="space-y-1.5">
                          <h5 className="text-[10px] font-mono font-bold text-[#FF5C00] uppercase tracking-wider">
                            Phase {pIdx + 1}: {phase.title}
                          </h5>
                          <div className="space-y-1 pl-1">
                            {incompleteInPhase.map(task => (
                              <label
                                key={task.id}
                                className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                  selectedTaskIds.includes(task.id)
                                    ? 'bg-[#FF5C00]/15 border-[#FF5C00] text-white'
                                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedTaskIds.includes(task.id)}
                                  onChange={() => toggleTaskSelection(task.id)}
                                  className="w-4 h-4 rounded border-white/20 bg-black text-[#FF5C00] focus:ring-0 cursor-pointer"
                                />
                                <span className="flex-1 font-sans truncate">{task.title}</span>
                                {task.estimatedHours && (
                                  <span className="text-[10px] font-mono text-white/40">{task.estimatedHours}h</span>
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {activeUpdateProject.phases.every(ph => ph.tasks.every(t => t.completed)) && (
                      <p className="text-xs font-mono text-emerald-400 text-center py-2">
                        🎉 All tasks on this project are 100% completed!
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-row items-center justify-end gap-3 pt-4 border-t border-white/10 w-full">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none justify-center items-center flex px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none justify-center items-center flex px-6 py-2.5 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
                >
                  POST UPDATE
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* LIBRARY INFO MODAL OVERLAY */}
      {showLibraryInfoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <div className={`rounded-3xl p-6 max-w-sm w-full space-y-4 border shadow-2xl relative transition-all ${
            theme === 'light' ? 'bg-white text-gray-900 border-gray-200' : 'bg-[#181818] text-white border-white/10'
          }`}>
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FF5C00] uppercase tracking-wider">
                <Info className="w-4 h-4 text-[#FF5C00]" />
                Add to My Library
              </div>
              <button
                type="button"
                onClick={() => setShowLibraryInfoModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs font-sans leading-relaxed opacity-80">
              Saving this project sequence converts your phases and tasks into a reusable Recipe Blueprint in your personal library. You can reuse or share this recipe blueprint whenever you start future projects.
            </p>
            <button
              type="button"
              onClick={() => setShowLibraryInfoModal(false)}
              className="w-full py-2.5 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}

      {/* CAMERA & MEDIA SELECTOR MODAL OVERLAY */}
      {showMediaModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-60 flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-5 text-white shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowMediaModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-display font-bold flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#FF5C00]" /> Media & Camera Station
              </h3>
              <p className="text-xs text-white/50 font-mono">
                Upload up to 10 images and/or videos. Single videos up to 3 minutes; multiple videos automatically trim to 60 seconds.
              </p>
            </div>

            {/* File Upload Zone for Logged in Users */}
            <FileUploadZone
              label="Upload Custom Media & Assets"
              onFileUploaded={(file: UploadedFile) => {
                if (mediaItems.length < 10) {
                  setMediaItems(prev => [
                    ...prev,
                    {
                      id: file.id,
                      url: file.url,
                      type: file.mimeType.startsWith('video') ? 'video' : 'image',
                      name: file.filename
                    }
                  ]);
                  setImageError('');
                }
              }}
            />

            {/* Upload Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FF5C00] rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-center"
              >
                <Upload className="w-6 h-6 text-[#FF5C00]" />
                <span className="text-xs font-bold">Choose Files</span>
                <span className="text-[9px] font-mono text-white/40">Images & Videos</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  // Instant camera snapshot preset simulation
                  addPresetMedia(MEDIA_PRESETS[Math.floor(Math.random() * MEDIA_PRESETS.length)]);
                  setShowMediaModal(false);
                }}
                className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FF5C00] rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-center"
              >
                <Camera className="w-6 h-6 text-[#FF5C00]" />
                <span className="text-xs font-bold">Capture Photo</span>
                <span className="text-[9px] font-mono text-white/40">Instant Camera Stream</span>
              </button>
            </div>

            {/* Presets Gallery */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="block text-xs font-mono text-white/40 uppercase tracking-wider">Quick Presets</label>
              <div className="grid grid-cols-5 gap-2">
                {MEDIA_PRESETS.map((preset, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      addPresetMedia(preset);
                      setShowMediaModal(false);
                    }}
                    className="h-14 rounded-xl overflow-hidden border border-white/10 hover:border-[#FF5C00] cursor-pointer group relative"
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMediaModal(false)}
                className="px-5 py-2 bg-[#FF5C00] text-black font-bold text-xs rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
