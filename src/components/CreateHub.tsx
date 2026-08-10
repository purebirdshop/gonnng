import React, { useState, useRef, useEffect } from 'react';
import { Recipe, Project, Collection, FeedPost, Task, Creator } from '../types';
import { 
  X, 
  Camera, 
  Image as ImageIcon, 
  Plus, 
  Check, 
  Trash2, 
  AlertCircle, 
  Film, 
  Upload, 
  Info, 
  Globe, 
  CircleDotDashed, 
  Album,
  ArrowLeft,
  ArrowRight,
  Video,
  Square,
  FolderKanban,
  RefreshCw
} from 'lucide-react';
import FileUploadZone from './FileUploadZone';
import { UploadedFile } from '../services/uploadService';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { ENABLE_AREA_OF_FOCUS } from '../featureFlags';
import CategoryCombobox from './CategoryCombobox';

interface CreateHubProps {
  onClose: () => void;
  recipes: Recipe[];
  collections: Collection[];
  projects: Project[];
  privacyDefault: 'public' | 'internal' | 'private';
  currentUser?: Creator;
  onAddRecipe?: (recipe: Recipe) => void;
  onAddProject: (project: Project) => void;
  onAddPost: (post: FeedPost) => void | Promise<void>;
  onAddCollection?: (collection: Collection) => void;
  onUpdateProject?: (project: Project) => void;
  onUpdateRecipe?: (recipe: Recipe) => void;
  forkInitialData?: Recipe | null;
  editingRecipe?: Recipe | null;
  permissions?: { camera: boolean; microphone: boolean; files: boolean };
  onNavigateToPermissions?: () => void;
  onUpdatePermissions?: (permissions: { camera: boolean; microphone: boolean; files: boolean }) => void;
  onRequestDevicePermissions?: () => void;
}

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  file?: File;
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
  permissions = { camera: true, microphone: true, files: true },
  onNavigateToPermissions,
  onUpdatePermissions,
  onRequestDevicePermissions
}: CreateHubProps) {
  const myUserId = currentUser?.id;
  const myUserName = currentUser?.name;
  const myUserAvatar = currentUser?.avatarUrl || '';
  
  // Carousel Step State: 1 = Camera / Media Capture, 2 = Details Form, 3 = Preview
  const [carouselStep, setCarouselStep] = useState<1 | 2 | 3>(1);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modes: 'focus', 'project', 'recipe', 'update'
  const [activeMode, setActiveMode] = useState<'focus' | 'project' | 'recipe' | 'update'>(editingRecipe ? 'recipe' : 'update');
  const [privacy, setPrivacy] = useState<'public' | 'internal' | 'private'>(privacyDefault || 'public');

  useEffect(() => {
    if (privacyDefault) {
      setPrivacy(privacyDefault);
    }
  }, [privacyDefault]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Media attachments state (up to 10 items)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [imageError, setImageError] = useState('');
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showLibraryInfoModal, setShowLibraryInfoModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera & Recording States
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [cameraCaptureMode, setCameraCaptureMode] = useState<'video' | 'photo'>('video');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    async function checkCameras() {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter(d => d.kind === 'videoinput');
          setHasMultipleCameras(videoInputs.length > 1);
        } catch (e) {
          console.warn('Error enumerating camera devices:', e);
        }
      }
    }
    checkCameras();
  }, []);

  const createSyntheticCameraStream = (): MediaStream => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    let frame = 0;

    const interval = setInterval(() => {
      if (!ctx) return;
      frame++;

      // Animated studio viewfinder background
      const grad = ctx.createLinearGradient(0, 0, 1280, 720);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e293b');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);

      // Soft ambient aperture movement
      const cx = 640 + Math.sin(frame * 0.04) * 120;
      const cy = 360 + Math.cos(frame * 0.03) * 80;
      const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 300);
      glow.addColorStop(0, 'rgba(255, 92, 0, 0.4)');
      glow.addColorStop(0.5, 'rgba(255, 92, 0, 0.12)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, 300, 0, Math.PI * 2);
      ctx.fill();

      // Camera viewfinder reticle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(426, 0); ctx.lineTo(426, 720);
      ctx.moveTo(853, 0); ctx.lineTo(853, 720);
      ctx.moveTo(0, 240); ctx.lineTo(1280, 240);
      ctx.moveTo(0, 480); ctx.lineTo(1280, 480);
      ctx.stroke();

      // Focus ring
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(640, 360, 50, 0, Math.PI * 2);
      ctx.stroke();

      // Corner brackets
      const bSize = 30;
      const pad = 80;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(pad, pad + bSize); ctx.lineTo(pad, pad); ctx.lineTo(pad + bSize, pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(1280 - pad - bSize, pad); ctx.lineTo(1280 - pad, pad); ctx.lineTo(1280 - pad, pad + bSize); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, 720 - pad - bSize); ctx.lineTo(pad, 720 - pad); ctx.lineTo(pad + bSize, 720 - pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(1280 - pad - bSize, 720 - pad); ctx.lineTo(1280 - pad, 720 - pad); ctx.lineTo(1280 - pad, 720 - pad - bSize); ctx.stroke();

      // Viewfinder overlay
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('LIVE STREAM • 1080P', 90, 70);
    }, 1000 / 30);

    const stream = canvas.captureStream(30);
    (stream as any)._syntheticCleanup = () => clearInterval(interval);
    return stream;
  };

  const stopCameraInternal = () => {
    if (cameraStreamRef.current) {
      if ((cameraStreamRef.current as any)._syntheticCleanup) {
        try {
          (cameraStreamRef.current as any)._syntheticCleanup();
        } catch {}
      }
      cameraStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) {
          console.warn('Error stopping media track:', e);
        }
      });
      cameraStreamRef.current = null;
    }
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      mediaRecorderRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch {}
    }
    setCameraActive(false);
    setIsRecording(false);
  };

  const startCameraStream = async (requestedFacingMode?: 'user' | 'environment') => {
    const targetFacing = requestedFacingMode || facingMode;
    if (permissions?.camera === false) {
      setCameraError(true);
      setCameraActive(false);
      return;
    }

    setCameraError(false);
    let stream: MediaStream | null = null;

    // Attempt 1: Video + Audio with ideal constraints
    if (permissions?.microphone !== false && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: targetFacing },
          audio: true
        });
      } catch (err1) {
        console.warn('Camera stream attempt 1 (video+audio ideal) failed:', err1);
      }

      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: targetFacing },
            audio: true
          });
        } catch (err2) {
          console.warn('Camera stream attempt 2 (video+audio basic) failed:', err2);
        }
      }
    }

    // Attempt 3: Video-only
    if (!stream && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: targetFacing }
        });
      } catch (err3) {
        console.warn('Camera stream attempt 3 (video-only ideal) failed:', err3);
      }
    }

    if (!stream && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: targetFacing }
        });
      } catch (err4) {
        console.warn('Camera stream attempt 4 (video-only basic) failed:', err4);
      }
    }

    // Fallback: If hardware stream fails/blocked in iframe, use live synthetic camera feed
    if (!stream) {
      try {
        stream = createSyntheticCameraStream();
      } catch (e) {
        console.warn('Synthetic camera stream fallback error:', e);
      }
    }

    if (stream) {
      cameraStreamRef.current = stream;
      setCameraActive(true);
      setCameraError(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((e) => console.warn('Video play error:', e));
      }
    } else {
      setCameraError(true);
      setCameraActive(false);
    }
  };

  const handleFlipCamera = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    stopCameraInternal();
    startCameraStream(nextFacing);
  };

  // Camera lifecycle based on step 1 and permissions
  useEffect(() => {
    let mounted = true;

    if (carouselStep === 1) {
      if (permissions?.camera !== false) {
        startCameraStream();
      } else {
        stopCameraInternal();
        setCameraError(true);
      }
    } else {
      stopCameraInternal();
    }

    return () => {
      mounted = false;
      stopCameraInternal();
    };
  }, [carouselStep, permissions?.camera, permissions?.microphone]);

  const handleResetDevicePermissions = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    stopCameraInternal();
    onClose();
    if (onRequestDevicePermissions) {
      onRequestDevicePermissions();
    } else if (onNavigateToPermissions) {
      onNavigateToPermissions();
    }
  };

  const dataUrlToFile = (dataUrl: string, fileName: string): File | undefined => {
    try {
      const arr = dataUrl.split(',');
      if (arr.length < 2) return undefined;
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], fileName, { type: mime });
    } catch (e) {
      console.warn('Failed converting dataUrl to File:', e);
      return undefined;
    }
  };

  const mediaItemToFile = async (item: MediaItem): Promise<File | undefined> => {
    if (item.file) return item.file;

    if (item.url.startsWith('data:')) {
      return dataUrlToFile(item.url, `${item.name || 'snapshot'}-${Date.now()}.${item.type === 'video' ? 'webm' : 'jpg'}`);
    }

    if (item.url.startsWith('blob:') || item.url.startsWith('http')) {
      try {
        const res = await fetch(item.url);
        const blob = await res.blob();
        const ext = item.type === 'video' ? 'webm' : 'jpg';
        const mime = blob.type || (item.type === 'video' ? 'video/webm' : 'image/jpeg');
        return new File([blob], `${item.name || 'media'}-${Date.now()}.${ext}`, { type: mime });
      } catch (e) {
        console.warn('Failed fetching blob/http media to File:', e);
      }
    }

    return undefined;
  };

  const capturePhoto = () => {
    if (videoRef.current && cameraActive) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror snapshot horizontally to match viewfinder reflection
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const photoFile = dataUrlToFile(dataUrl, `camera-photo-${Date.now()}.jpg`);
        const newItem: MediaItem = {
          id: `media-photo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          file: photoFile,
          url: dataUrl,
          type: 'image',
          name: `Snapshot ${new Date().toLocaleTimeString()}`
        };
        setMediaItems(prev => [...prev, newItem].slice(0, 10));
        setImageError('');
      }
    } else {
      // Fallback preset snapshot
      const randomPreset = MEDIA_PRESETS[Math.floor(Math.random() * MEDIA_PRESETS.length)];
      addPresetMedia(randomPreset);
    }
  };

  const toggleVideoRecording = () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRecording(false);
    } else {
      if (!cameraStreamRef.current) {
        const randomPreset = MEDIA_PRESETS[Math.floor(Math.random() * MEDIA_PRESETS.length)];
        addPresetMedia(randomPreset);
        return;
      }
      try {
        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(cameraStreamRef.current);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const videoUrl = URL.createObjectURL(blob);
          const newItem: MediaItem = {
            id: `media-video-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            url: videoUrl,
            type: 'video',
            name: `Recording ${new Date().toLocaleTimeString()}`
          };
          setMediaItems(prev => [...prev, newItem].slice(0, 10));
          setImageError('');
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        setRecordingTime(0);
        timerRef.current = setInterval(() => {
          setRecordingTime(t => t + 1);
        }, 1000);
      } catch (err) {
        console.error('Error starting video recording:', err);
      }
    }
  };

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
  const [projCategory, setProjCategory] = useState(forkInitialData ? forkInitialData.category : 'Creative');
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

  useEffect(() => {
    if (forkInitialData && !editingRecipe) {
      setActiveMode('project');
      setSelectedRecipeId(forkInitialData.id);
      setProjTitle(forkInitialData.title);
      setProjCategory(forkInitialData.category || 'Creative');
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
      setRecipeCategory(editingRecipe.category || 'Creative');
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
      if (found.category) setProjCategory(found.category);
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
    if (customPhases.length <= 1) return;
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
      if (p.tasks.length <= 1) return p;

      return {
        ...p,
        tasks: p.tasks.filter(t => t.id !== taskId)
      };
    }));
  };

  // Delete Confirm Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const confirmDeletePhase = (phaseId: string, phaseTitle?: string) => {
    if (customPhases.length <= 1) return;
    setDeleteConfirm({
      isOpen: true,
      title: "Are you sure?",
      message: `Are you sure you want to delete ${phaseTitle ? `"${phaseTitle}"` : 'this phase'}?`,
      onConfirm: () => {
        handleDeletePhase(phaseId);
        setDeleteConfirm(null);
      }
    });
  };

  const confirmDeleteTask = (phaseId: string, taskId: string, taskTitle?: string) => {
    const phase = customPhases.find(p => p.id === phaseId);
    if (phase && phase.tasks.length <= 1) return;
    setDeleteConfirm({
      isOpen: true,
      title: "Are you sure?",
      message: `Are you sure you want to delete ${taskTitle ? `"${taskTitle}"` : 'this task'}?`,
      onConfirm: () => {
        handleDeleteTask(phaseId, taskId);
        setDeleteConfirm(null);
      }
    });
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

  // Default updateProjId to empty string (no project selected by default)
  const [updateProjId, setUpdateProjId] = useState<string>('');
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
        file,
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

  // Handle Close Request ("Are you sure?" prompt on Step 2 or Step 3)
  const handleCloseRequest = () => {
    if (carouselStep === 2 || carouselStep === 3 || mediaItems.length > 0) {
      setCloseConfirmOpen(true);
    } else {
      stopCameraInternal();
      onClose();
    }
  };

  // -------------------------------------------------------------
  // Form Submit Handlers
  // -------------------------------------------------------------

  // A. CREATE FOCUS (Area of FOCUS)
  const handleCreateFocus = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!focusTitle.trim()) return;

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
    const selectedFiles = mediaItems.map(m => m.file).filter((f): f is File => Boolean(f));
    const newPost: FeedPost = {
      id: crypto.randomUUID(),
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
      images: mediaItems.map(m => m.url),
      mediaFiles: selectedFiles,
      privacy: privacy,
      createdAt: new Date().toISOString(),
      gongs: { continue: 0, refine: 0, reconsider: 0 }
    };

    onAddPost(newPost);
    stopCameraInternal();
    onClose();
  };

  // B. CREATE PROJECT
  const handleCreateProject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!projTitle.trim()) return;

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
      category: projCategory || chosenRecipe?.category || 'Creative',
      recipeId: chosenRecipe ? chosenRecipe.id : 'recipe-custom',
      recipeTitle: chosenRecipe ? chosenRecipe.title : (projFocusId ? (collections.find(c => c.id === projFocusId)?.title || 'Area of FOCUS') : 'Standalone Project'),
      phases: projectPhases,
      createdAt: new Date().toISOString(),
      collectionId: projFocusId || undefined,
      privacy: privacy,
      progressPhotos: mediaItems.map(m => ({
        url: m.url,
        caption: projDesc || projTitle,
        date: new Date().toISOString().split('T')[0]
      }))
    };

    onAddProject(newProject);

    if (addToLibrary && onAddRecipe) {
      const newRecipe: Recipe = {
        id: `recipe-custom-${Date.now()}`,
        title: projTitle.trim(),
        authorId: myUserId,
        authorName: myUserName,
        category: projCategory || chosenRecipe?.category || 'Creative',
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

    const mainImage = mediaItems[0]?.url;
    const selectedFiles = mediaItems.map(m => m.file).filter((f): f is File => Boolean(f));
    const newPost: FeedPost = {
      id: crypto.randomUUID(),
      type: 'project_created',
      userId: myUserId,
      userName: myUserName,
      userAvatar: myUserAvatar,
      timeString: 'Just now',
      title: `Started Project: "${newProject.title}"`,
      content: projDesc || `Started a new project${projFocusId ? ` under the Area of FOCUS: ${collections.find(c => c.id === projFocusId)?.title}` : ''}. Timeframe estimate: ${hoursEst} hours.`,
      attachedId: newProject.id,
      attachedName: newProject.title,
      projectId: newProject.id,
      image: mainImage,
      images: mediaItems.map(m => m.url),
      mediaFiles: selectedFiles,
      privacy: privacy,
      createdAt: new Date().toISOString(),
      gongs: { continue: 0, refine: 0, reconsider: 0 }
    };

    onAddPost(newPost);
    stopCameraInternal();
    onClose();
  };

  // C. CREATE RECIPE (STANDALONE BLUEPRINT)
  const handleCreateRecipe = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!recipeTitle.trim()) return;

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

    const selectedCat = recipeCategory.trim() || 'Creative';

    if (editingRecipe) {
      const updatedRecipe: Recipe = {
        ...editingRecipe,
        title: recipeTitle.trim(),
        category: selectedCat,
        description: recipeDesc.trim() || `Step-by-step process blueprint for ${recipeTitle.trim()}`,
        phases: recipePhases,
        tags: recipeTags ? recipeTags.split(',').map(t => t.trim()).filter(Boolean) : editingRecipe.tags,
      };
      if (onUpdateRecipe) {
        onUpdateRecipe(updatedRecipe);
      } else if (onAddRecipe) {
        onAddRecipe(updatedRecipe);
      }
      stopCameraInternal();
      onClose();
      return;
    }

    const newRecipe: Recipe = {
      id: `recipe-custom-${Date.now()}`,
      title: recipeTitle.trim(),
      authorId: myUserId,
      authorName: myUserName,
      category: selectedCat,
      description: recipeDesc.trim() || `Step-by-step process blueprint for ${recipeTitle.trim()}`,
      phases: recipePhases,
      tags: recipeTags ? recipeTags.split(',').map(t => t.trim()).filter(Boolean) : ['custom', 'recipe'],
      isCustom: true
    };

    if (onAddRecipe) {
      onAddRecipe(newRecipe);
    }

    const mainImage = mediaItems[0]?.url;
    const selectedFiles = mediaItems.map(m => m.file).filter((f): f is File => Boolean(f));
    const newPost: FeedPost = {
      id: crypto.randomUUID(),
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
      mediaFiles: selectedFiles,
      privacy: privacy,
      createdAt: new Date().toISOString(),
      gongs: { continue: 0, refine: 0, reconsider: 0 }
    };

    onAddPost(newPost);
    stopCameraInternal();
    onClose();
  };

  // D. POST UPDATE
  const handlePostUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Convert all media items to File objects
      const selectedFiles: File[] = [];
      for (const item of mediaItems) {
        const f = await mediaItemToFile(item);
        if (f) selectedFiles.push(f);
      }

      if (updateProjId && activeUpdateProject) {
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
          id: crypto.randomUUID(),
          type: 'update_logged',
          userId: myUserId,
          userName: myUserName,
          userAvatar: myUserAvatar,
          timeString: 'Just now',
          title: postTitle,
          content: updateDesc || (completedTaskTitles.length > 0 ? `Completed ${completedTaskTitles.length} task(s) and logged a progress update.` : 'Logged a new progress update.'),
          attachedId: activeUpdateProject.id,
          attachedName: activeUpdateProject.title,
          projectId: activeUpdateProject.id,
          image: mainImage,
          images: mediaItems.map(m => m.url),
          mediaFiles: selectedFiles,
          hashtags: parsedHashtags,
          privacy: privacy,
          createdAt: new Date().toISOString(),
          gongs: { continue: 0, refine: 0, reconsider: 0 }
        };

        await onAddPost(newPost);
        stopCameraInternal();
        onClose();
      } else {
        // Standalone update post (not attached to any project)
        const parsedHashtags = updateHashtags
          .split(/[\s,]+/)
          .map(t => t.trim())
          .filter(Boolean)
          .map(t => t.startsWith('#') ? t : `#${t}`);

        const mainImage = mediaItems[0]?.url;
        const postTitle = updateDesc 
          ? (updateDesc.length > 45 ? `${updateDesc.substring(0, 42)}...` : updateDesc)
          : 'Daily Progress Update';

        const newPost: FeedPost = {
          id: crypto.randomUUID(),
          type: 'update_logged',
          userId: myUserId,
          userName: myUserName,
          userAvatar: myUserAvatar,
          timeString: 'Just now',
          title: postTitle,
          content: updateDesc || 'Logged a new progress update.',
          image: mainImage,
          images: mediaItems.map(m => m.url),
          mediaFiles: selectedFiles,
          hashtags: parsedHashtags,
          privacy: privacy,
          createdAt: new Date().toISOString(),
          gongs: { continue: 0, refine: 0, reconsider: 0 }
        };

        await onAddPost(newPost);
        stopCameraInternal();
        onClose();
      }
    } catch (err) {
      console.error('Error in handlePostUpdate:', err);
      setImageError('Failed to publish update. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto bg-gray-900/40 backdrop-blur-sm" id="creation-station-modal">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*,video/*"
        multiple
        className="hidden"
      />

      <div className={`rounded-none sm:rounded-3xl w-full h-full ${carouselStep === 1 ? 'sm:h-[600px]' : 'sm:h-auto'} max-w-none sm:max-w-xl overflow-hidden shadow-2xl border max-h-full sm:max-h-[92vh] flex flex-col relative transition-colors ${carouselStep === 1 ? 'bg-black text-white border-gray-800' : 'bg-white text-gray-900 border-gray-200'}`}>
        
        {/* Fixed Non-Scrollable Header - Only shown on Steps 2 and 3 */}
        {carouselStep !== 1 && (
          <div className="p-4 sm:p-5 border-b flex items-center justify-between gap-3 shrink-0 border-gray-200 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-display font-bold text-gray-900 tracking-tight">
                {carouselStep === 2 ? 'Creation Station — Details' : 'Creation Station — Preview'}
              </h2>
            </div>

            {/* Close Button */}
            <button
              type="button"
              id="close-hub-btn"
              onClick={handleCloseRequest}
              className="p-2 rounded-full transition-all border cursor-pointer shadow-sm shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border-gray-300"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Modal Content Container */}
        <div className={carouselStep === 1 ? "w-full h-full flex-1 relative bg-black overflow-hidden flex flex-col justify-between" : "p-5 sm:p-7 overflow-y-auto flex-1 space-y-5 flex flex-col justify-between"}>

          {imageError && (
            <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-red-400 text-xs font-mono flex items-center gap-2 absolute top-16 left-4 right-4 z-40 shadow-xl backdrop-blur-md">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{imageError}</span>
            </div>
          )}

          {/* STEP 1: CAMERA & MEDIA CAPTURE */}
          {carouselStep === 1 && (
            <div className="relative w-full h-full flex-1 bg-black overflow-hidden flex items-center justify-center">
              {/* Full Modal Camera Viewfinder (Width & Height 100%) */}
              {permissions?.camera !== false && cameraActive && !cameraError ? (
                <video
                  ref={(el) => {
                    (videoRef as any).current = el;
                    if (el && cameraStreamRef.current) {
                      if (el.srcObject !== cameraStreamRef.current) {
                        el.srcObject = cameraStreamRef.current;
                      }
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={(e) => {
                    e.currentTarget.play().catch(() => {});
                  }}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                    WebkitTransform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 z-10">
                  <div className="w-16 h-16 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
                    <Camera className="w-8 h-8 text-[#F59E0B]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-display">Camera Viewfinder</h4>
                    <p className="text-xs text-white/70 font-sans mt-2 max-w-xs leading-relaxed">
                      Camera stream unavailable. You can upload files using the upload icon button in the top right.
                    </p>
                    <button
                      type="button"
                      id="reset-device-permissions-btn"
                      onClick={handleResetDevicePermissions}
                      className="mt-4 px-4 py-1.5 bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30 text-[#F59E0B] border border-[#F59E0B]/40 font-mono text-xs font-bold rounded-full shadow-lg transition-all cursor-pointer backdrop-blur-md inline-block"
                    >
                      Reset device permissions
                    </button>
                  </div>
                </div>
              )}

              {/* TOP LEFT: Cancel/Close Button */}
              <button
                type="button"
                id="close-hub-step1-btn"
                onClick={handleCloseRequest}
                className="absolute top-4 left-4 z-30 p-2.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all cursor-pointer backdrop-blur-md border border-white/20 shadow-lg flex items-center justify-center"
                title="Cancel / Close"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* TOP CENTER: "Video | Photo" Text Links (No background color) */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                <button
                  type="button"
                  id="camera-mode-video-btn"
                  onClick={() => setCameraCaptureMode('video')}
                  className={`transition-all cursor-pointer p-1 bg-transparent border-none ${
                    cameraCaptureMode === 'video'
                      ? 'text-[#F59E0B] font-black underline decoration-2 underline-offset-4'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  Video
                </button>
                <span className="text-white/40 font-normal">|</span>
                <button
                  type="button"
                  id="camera-mode-photo-btn"
                  onClick={() => setCameraCaptureMode('photo')}
                  className={`transition-all cursor-pointer p-1 bg-transparent border-none ${
                    cameraCaptureMode === 'photo'
                      ? 'text-[#F59E0B] font-black underline decoration-2 underline-offset-4'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  Photo
                </button>
              </div>

              {/* TOP RIGHT: Flip Camera Button (if multiple cameras detected) + Upload Icon Button directly below it */}
              <div className="absolute top-4 right-4 z-30 flex flex-col items-center gap-3">
                {hasMultipleCameras && (
                  <button
                    type="button"
                    id="flip-camera-btn"
                    onClick={handleFlipCamera}
                    className="p-2.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all cursor-pointer backdrop-blur-md border border-white/20 shadow-lg flex items-center justify-center"
                    title="Flip camera"
                  >
                    <RefreshCw className="w-5 h-5 text-white" />
                  </button>
                )}

                <button
                  type="button"
                  id="upload-media-icon-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="p-2.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all cursor-pointer backdrop-blur-md border border-white/20 shadow-lg flex items-center justify-center"
                  title="Upload image or video"
                >
                  <Upload className="w-5 h-5 text-[#F59E0B]" />
                </button>
              </div>

              {/* LIVE RECORDING TIMER */}
              {isRecording && permissions?.camera && (
                <div className="absolute top-16 left-4 z-30 bg-red-600/90 text-white font-mono text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
                  <span>00:{recordingTime < 10 ? `0${recordingTime}` : recordingTime}</span>
                </div>
              )}

              {/* BOTTOM CENTER: Shutter / Record Button */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                <div className="pointer-events-auto">
                  {cameraCaptureMode === 'photo' ? (
                    <button
                      type="button"
                      id="tiktok-photo-shutter-btn"
                      onClick={capturePhoto}
                      className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center cursor-pointer transition-transform active:scale-90 shadow-2xl group"
                      title="Take Photo"
                    >
                      <span className="w-11 h-11 rounded-full bg-white group-hover:scale-105 transition-transform shadow-inner" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      id="tiktok-video-shutter-btn"
                      onClick={toggleVideoRecording}
                      className={`w-16 h-16 rounded-full border-4 flex items-center justify-center cursor-pointer transition-all shadow-2xl ${
                        isRecording
                          ? 'border-red-500 bg-red-600/30 scale-90 ring-4 ring-red-500/50 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]'
                          : 'border-white bg-white/20 hover:bg-white/30 active:scale-90'
                      }`}
                      title={isRecording ? "Stop Recording" : "Record Video"}
                    >
                      {isRecording ? (
                        <span className="w-5 h-5 rounded-sm bg-red-600 shadow-md animate-pulse" />
                      ) : (
                        <span className="w-11 h-11 rounded-full bg-red-500 hover:bg-red-600 transition-transform shadow-inner" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* LOWER LEFT: Captured Badge */}
              {mediaItems.length > 0 && (
                <div className="absolute bottom-4 left-4 z-30 bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/30 font-mono text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                  <Check className="w-3.5 h-3.5" />
                  <span>{mediaItems.length} Captured</span>
                </div>
              )}

              {/* LOWER RIGHT: Next Button */}
              <div className="absolute bottom-4 right-4 z-30">
                <button
                  type="button"
                  id="next-step-btn"
                  onClick={() => {
                    stopCameraInternal();
                    setCarouselStep(2);
                  }}
                  className="p-3.5 bg-[#F59E0B] hover:bg-[#FF751A] text-black rounded-full transition-all shadow-xl flex items-center justify-center cursor-pointer font-bold active:scale-95"
                  title="Next Step: Details Form"
                >
                  <ArrowRight className="w-6 h-6 stroke-[3]" />
                </button>
              </div>

              {/* Bottom Recording Progress Bar */}
              {isRecording && (
                <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/60 z-30 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-600 via-[#F59E0B] to-amber-400 transition-all duration-300 ease-linear shadow-[0_0_12px_rgba(255,92,0,0.9)]"
                    style={{ width: `${Math.min((recordingTime / 60) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: DETAILS FORM */}
          {carouselStep === 2 && (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4 w-full max-w-full">
                {/* Media Preview Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">
                      Media <span className="text-red-500 ml-0.5">*</span> {mediaItems.length > 0 ? `(${mediaItems.length})` : ''}
                    </label>
                    <button
                      type="button"
                      onClick={() => setCarouselStep(1)}
                      className="text-[10px] font-mono text-[#F59E0B] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3 h-3" /> Re-record / Upload
                    </button>
                  </div>

                  {/* Parent Thumbnail */}
                  {mediaItems.length > 0 ? (
                    <div className="space-y-2">
                      <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-white/15 bg-black shadow-md group">
                        {mediaItems[0].type === 'video' ? (
                          <video src={mediaItems[0].url} className="w-full h-full object-cover" controls />
                        ) : (
                          <img src={mediaItems[0].url} alt="Main thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        )}
                        <button
                          type="button"
                          onClick={() => removeMediaItem(mediaItems[0].id)}
                          className="absolute top-2 right-2 p-1.5 bg-[#F59E0B] hover:bg-[#FF751A] text-white rounded-full transition-all cursor-pointer shadow-lg border border-white/30 z-10 flex items-center justify-center"
                          title="Remove media"
                        >
                          <X className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>

                      {/* Smaller Thumbnails below Parent Preview */}
                      {mediaItems.length > 1 && (
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                          {mediaItems.slice(1).map((item, idx) => (
                            <div key={item.id} className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/20 shrink-0 group bg-black">
                              {item.type === 'video' ? (
                                <video src={item.url} className="w-full h-full object-cover" />
                              ) : (
                                <img src={item.url} alt={`Media ${idx + 2}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              )}
                              <button
                                type="button"
                                onClick={() => removeMediaItem(item.id)}
                                className="absolute top-0.5 right-0.5 p-1 bg-[#F59E0B] hover:bg-[#FF751A] text-white rounded-full transition-all cursor-pointer shadow border border-white/30 z-10 flex items-center justify-center"
                                title="Remove media"
                              >
                                <X className="w-3 h-3 stroke-[2.5]" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div 
                      onClick={() => setCarouselStep(1)}
                      className="p-3 bg-white/5 border border-dashed border-white/20 rounded-2xl flex items-center justify-between cursor-pointer hover:border-[#F59E0B] transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Camera className="w-4 h-4 text-[#F59E0B]" />
                        <span className="text-xs font-bold text-white/80">No media attached yet</span>
                      </div>
                      <span className="text-xs font-mono text-[#F59E0B] font-bold">Record / Upload →</span>
                    </div>
                  )}
                </div>

                {/* FORM TYPE: UPDATE */}
                {activeMode === 'update' && (
                  <div className="space-y-4">
                    {/* Toggle Project Selection */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">
                          Select Project
                        </label>
                        {updateProjId && (
                          <button
                            type="button"
                            onClick={() => {
                              setUpdateProjId('');
                              setSelectedTaskIds([]);
                            }}
                            className="text-[10px] font-mono text-white/40 hover:text-[#F59E0B] transition-colors cursor-pointer"
                          >
                            Deselect Project
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                        {[...incompleteProjects].sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).map(proj => {
                          const isSelected = updateProjId === proj.id;
                          return (
                            <button
                              key={proj.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setUpdateProjId('');
                                  setSelectedTaskIds([]);
                                } else {
                                  setUpdateProjId(proj.id);
                                  setSelectedTaskIds([]);
                                }
                              }}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono shrink-0 border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#F59E0B] text-black font-bold border-[#F59E0B]'
                                  : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
                              }`}
                            >
                              {proj.title}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">
                        Description <span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <textarea
                        value={updateDesc}
                        onChange={(e) => setUpdateDesc(e.target.value)}
                        rows={3}
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-sans text-white focus:outline-none focus:border-[#F59E0B] leading-relaxed"
                        placeholder="Share details about your work progress or checkpoint..."
                      />
                    </div>

                    {/* Privacy Control Cluster */}
                    <div className="space-y-1">
                      <label className="block text-xs font-mono text-gray-500 uppercase tracking-wider">Privacy Setting</label>
                      <div className="inline-flex items-center gap-1.5 p-1 rounded-xl border bg-gray-100 border-gray-200">
                        <button
                          type="button"
                          onClick={() => setPrivacy('public')}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono ${
                            privacy === 'public'
                              ? 'bg-[#F59E0B] text-black shadow-sm font-bold'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Public</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrivacy('internal')}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono ${
                            privacy === 'internal'
                              ? 'bg-[#F59E0B] text-black shadow-sm font-bold'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <CircleDotDashed className="w-3.5 h-3.5" />
                          <span>Internal</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrivacy('private')}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono ${
                            privacy === 'private'
                              ? 'bg-[#F59E0B] text-black shadow-sm font-bold'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <Album className="w-3.5 h-3.5" />
                          <span>Private</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">Hashtags</label>
                      <input
                        type="text"
                        value={updateHashtags}
                        onChange={(e) => setUpdateHashtags(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#F59E0B]"
                        placeholder="#woodworking, #diy, #progress"
                      />
                    </div>

                    {/* Tasks Section: ONLY SHOWN IF A PROJECT IS SELECTED */}
                    {updateProjId && activeUpdateProject && (
                      <div className="space-y-2 pt-1 border-t border-white/10">
                        <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">
                          Tasks to update & check off
                        </label>

                        <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 space-y-3 max-h-44 overflow-y-auto">
                          {activeUpdateProject.phases.map((phase, pIdx) => {
                            const incompleteInPhase = phase.tasks.filter(t => !t.completed);
                            if (incompleteInPhase.length === 0) return null;

                            return (
                              <div key={phase.id || `ph-${pIdx}`} className="space-y-1.5">
                                <h5 className="text-[10px] font-mono font-bold text-[#F59E0B] uppercase tracking-wider">
                                  Phase {pIdx + 1}: {phase.title}
                                </h5>
                                <div className="space-y-1 pl-1">
                                  {incompleteInPhase.map((task, tIdx) => (
                                    <label
                                      key={task.id || `task-${pIdx}-${tIdx}`}
                                      className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                        selectedTaskIds.includes(task.id)
                                          ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-white'
                                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedTaskIds.includes(task.id)}
                                        onChange={() => toggleTaskSelection(task.id)}
                                        className="w-4 h-4 rounded border-white/20 bg-black text-[#F59E0B] focus:ring-0 cursor-pointer"
                                      />
                                      <span className="flex-1 font-sans truncate">{task.title}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* FORM TYPE: PROJECT */}
                {activeMode === 'project' && (
                  <div className="space-y-4">
                    {ENABLE_AREA_OF_FOCUS && (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">Area of FOCUS</label>
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                          {collections.map(col => (
                            <button
                              key={col.id}
                              type="button"
                              onClick={() => setProjFocusId(prev => prev === col.id ? '' : col.id)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono shrink-0 border transition-all cursor-pointer ${
                                projFocusId === col.id
                                  ? 'bg-[#F59E0B] text-black font-bold border-[#F59E0B]'
                                  : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
                              }`}
                            >
                              {col.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">Recipe Blueprint</label>
                      <select
                        value={selectedRecipeId}
                        onChange={(e) => handleRecipeSelect(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#181818] border border-white/10 rounded-xl text-sm font-sans text-white focus:outline-none focus:border-[#F59E0B] cursor-pointer"
                      >
                        <option value="" className="bg-[#181818] text-white/60">Select a Recipe from Library...</option>
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
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-sans text-white focus:outline-none focus:border-[#F59E0B]"
                        placeholder="e.g. Master Oil Painting Canvas Study"
                      />
                    </div>

                    <CategoryCombobox
                      value={projCategory}
                      onChange={setProjCategory}
                      label="Project Category"
                      placeholder="Search category (e.g. Cinematography, Coding, Photography)..."
                      id="project-category-combobox"
                    />

                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">Description</label>
                      <textarea
                        value={projDesc}
                        onChange={(e) => setProjDesc(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-sans text-white focus:outline-none focus:border-[#F59E0B] leading-relaxed"
                        placeholder="Explain project details, milestones, and deliverables..."
                      />
                    </div>

                    {/* Privacy Control Cluster */}
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1 p-1 rounded-xl border bg-gray-100 border-gray-200">
                        <button
                          type="button"
                          onClick={() => setPrivacy('public')}
                          className={`p-2 rounded-lg transition-all cursor-pointer ${
                            privacy === 'public' ? 'bg-[#F59E0B] text-black font-bold' : 'text-white/60'
                          }`}
                        >
                          <Globe className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrivacy('internal')}
                          className={`p-2 rounded-lg transition-all cursor-pointer ${
                            privacy === 'internal' ? 'bg-[#F59E0B] text-black font-bold' : 'text-white/60'
                          }`}
                        >
                          <CircleDotDashed className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrivacy('private')}
                          className={`p-2 rounded-lg transition-all cursor-pointer ${
                            privacy === 'private' ? 'bg-[#F59E0B] text-black font-bold' : 'text-white/60'
                          }`}
                        >
                          <Album className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Phases & Tasks */}
                    <div className="space-y-3 pt-2 border-t border-white/10">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">Phases & Tasks</label>
                        <button
                          type="button"
                          onClick={handleAddPhase}
                          className="px-3 py-1 bg-white/10 hover:bg-white/20 text-[#F59E0B] font-mono text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-[#F59E0B]/30"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Phase
                        </button>
                      </div>

                      <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                        {customPhases.map((phase, pIdx) => (
                          <div key={phase.id} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={phase.title}
                                onChange={(e) => handleUpdatePhaseTitle(phase.id, e.target.value)}
                                className="flex-1 px-3 py-1.5 bg-[#181818] border border-white/10 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-[#F59E0B]"
                                placeholder={`Phase ${pIdx + 1} Title...`}
                                required
                              />
                            </div>
                            <div className="space-y-1.5 pl-2 border-l-2 border-white/10">
                              {phase.tasks.map((task, tIdx) => (
                                <div key={task.id} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={task.title}
                                    onChange={(e) => handleUpdateTaskTitle(phase.id, task.id, e.target.value)}
                                    className="flex-1 px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white/90 focus:outline-none focus:border-[#F59E0B]"
                                    placeholder={`Task ${tIdx + 1} description...`}
                                    required
                                  />
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => handleAddTask(phase.id)}
                                className="text-[11px] font-mono text-[#F59E0B] flex items-center gap-1 pt-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" /> Add Task
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* FORM TYPE: FOCUS */}
                {activeMode === 'focus' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">
                        Title <span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={focusTitle}
                        onChange={(e) => setFocusTitle(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-sans text-white focus:outline-none focus:border-[#F59E0B]"
                        placeholder="e.g. Fine Art Painting, Hardware Prototyping"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">Description</label>
                      <textarea
                        value={focusDesc}
                        onChange={(e) => setFocusDesc(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-sans text-white focus:outline-none focus:border-[#F59E0B] leading-relaxed"
                        placeholder="Describe this area of FOCUS and core creative goals..."
                      />
                    </div>
                  </div>
                )}

                {/* FORM TYPE: RECIPE */}
                {activeMode === 'recipe' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">
                        Recipe Title <span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={recipeTitle}
                        onChange={(e) => setRecipeTitle(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-sans text-white focus:outline-none focus:border-[#F59E0B]"
                        placeholder="e.g. Standard Oil Canvas Preparation"
                      />
                    </div>

                    <CategoryCombobox
                      value={recipeCategory}
                      onChange={setRecipeCategory}
                      label="Recipe Category"
                      placeholder="Search category (e.g. Culinary Arts, Cinematography, Crafts)..."
                      id="recipe-category-combobox"
                      required
                    />

                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono text-white/60 uppercase tracking-wider">Description</label>
                      <textarea
                        value={recipeDesc}
                        onChange={(e) => setRecipeDesc(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-sans text-white focus:outline-none focus:border-[#F59E0B] leading-relaxed"
                        placeholder="Explain this blueprint process..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2 Bottom Bar: Far Left Back Button (Step 1), Far Right Next Button (Step 3) */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setCarouselStep(1)}
                  className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer font-mono font-bold flex items-center gap-1.5"
                  title="Back to Camera / Uploads"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (mediaItems.length === 0) {
                      setImageError('Media is required. Please capture or upload a photo or video.');
                      return;
                    }
                    if (activeMode === 'update' && !updateDesc.trim()) {
                      setImageError('Description is required.');
                      return;
                    }
                    if (activeMode === 'project') {
                      if (!projTitle.trim()) {
                        setImageError('Project Title is required.');
                        return;
                      }
                      if (!projDesc.trim()) {
                        setImageError('Description is required.');
                        return;
                      }
                    }
                    if (activeMode === 'focus') {
                      if (!focusTitle.trim()) {
                        setImageError('Focus Area Title is required.');
                        return;
                      }
                      if (!focusDesc.trim()) {
                        setImageError('Description is required.');
                        return;
                      }
                    }
                    if (activeMode === 'recipe') {
                      if (!recipeTitle.trim()) {
                        setImageError('Recipe Title is required.');
                        return;
                      }
                      if (!recipeDesc.trim()) {
                        setImageError('Description is required.');
                        return;
                      }
                    }
                    setImageError('');
                    setCarouselStep(3);
                  }}
                  className="p-3 bg-[#F59E0B] hover:bg-[#FF751A] text-black rounded-xl transition-all cursor-pointer font-bold font-mono shadow-lg flex items-center gap-1.5"
                  title="Next Step: Preview Post"
                >
                  <ArrowRight className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW STEP */}
          {carouselStep === 3 && (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3 overflow-y-auto max-h-[480px] pr-1">
                {/* Sample Post Preview Box */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl">
                  {/* Header info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={myUserAvatar}
                        alt={myUserName}
                        className="w-8 h-8 rounded-full object-cover border border-white/20"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-white">{myUserName}</h4>
                        <p className="text-[10px] font-mono text-white/40">Just now</p>
                      </div>
                    </div>
                    <div className="px-2 py-0.5 rounded bg-white/10 text-white/70 text-[10px] font-mono flex items-center gap-1">
                      {privacy === 'public' && <Globe className="w-3 h-3 text-[#F59E0B]" />}
                      {privacy === 'internal' && <CircleDotDashed className="w-3 h-3 text-[#F59E0B]" />}
                      {privacy === 'private' && <Album className="w-3 h-3 text-[#F59E0B]" />}
                      <span className="capitalize">{privacy}</span>
                    </div>
                  </div>

                  {/* Thumbnail Preview */}
                  {mediaItems.length > 0 && (
                    <div className="space-y-2">
                      <div className="relative w-full h-44 rounded-xl overflow-hidden border border-white/10 bg-black">
                        {mediaItems[0].type === 'video' ? (
                          <video src={mediaItems[0].url} className="w-full h-full object-cover" controls />
                        ) : (
                          <img src={mediaItems[0].url} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        )}
                      </div>
                      {mediaItems.length > 1 && (
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                          {mediaItems.slice(1).map((m, i) => (
                            <div key={m.id} className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black">
                              {m.type === 'video' ? (
                                <video src={m.url} className="w-full h-full object-cover" />
                              ) : (
                                <img src={m.url} alt={`Thumb ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Title & Description Preview */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white font-display">
                      {activeMode === 'update' ? (
                        activeUpdateProject ? `Update on "${activeUpdateProject.title}"` : (updateDesc ? (updateDesc.length > 45 ? `${updateDesc.substring(0, 42)}...` : updateDesc) : 'Daily Progress Update')
                      ) : activeMode === 'project' ? (
                        projTitle || 'New Project'
                      ) : activeMode === 'focus' ? (
                        focusTitle || 'New Area of FOCUS'
                      ) : (
                        recipeTitle || 'New Recipe Blueprint'
                      )}
                    </h3>

                    <p className="text-xs text-white/80 font-sans leading-relaxed whitespace-pre-line">
                      {activeMode === 'update' ? (updateDesc || 'Logged progress update.') :
                       activeMode === 'project' ? (projDesc || 'Started new project.') :
                       activeMode === 'focus' ? (focusDesc || 'Created area of focus.') :
                       (recipeDesc || 'Published process recipe.')}
                    </p>
                  </div>

                  {/* Hashtags Preview */}
                  {activeMode === 'update' && updateHashtags && (
                    <div className="text-[11px] font-mono text-[#F59E0B] font-bold">
                      {updateHashtags.split(/[\s,]+/).map(t => t.startsWith('#') ? t : `#${t}`).join(' ')}
                    </div>
                  )}

                  {/* Checked Tasks Preview */}
                  {activeMode === 'update' && activeUpdateProject && selectedTaskIds.length > 0 && (
                    <div className="bg-black/40 p-2.5 rounded-xl border border-white/10 space-y-1">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block">
                        ✓ Tasks Completed ({selectedTaskIds.length})
                      </span>
                      <ul className="text-xs text-white/70 space-y-0.5 list-disc list-inside">
                        {activeUpdateProject.phases.flatMap(p => p.tasks).filter(t => selectedTaskIds.includes(t.id)).map((t, idx) => (
                          <li key={t.id || `chk-task-${idx}`} className="truncate">{t.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3 Bottom Bar: Left Arrow button on left, SHARE button on right */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setCarouselStep(2)}
                  className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer font-mono font-bold flex items-center gap-1.5"
                  title="Back to Details Form"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={(e) => {
                    if (activeMode === 'update') handlePostUpdate(e);
                    else if (activeMode === 'project') handleCreateProject(e);
                    else if (activeMode === 'focus') handleCreateFocus(e);
                    else if (activeMode === 'recipe') handleCreateRecipe(e);
                  }}
                  className={`px-6 py-3 bg-[#F59E0B] hover:bg-[#FF751A] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer ${
                    isSubmitting ? 'opacity-70 cursor-wait' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>SHARING...</span>
                    </>
                  ) : (
                    <>
                      <span>SHARE</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* DISCARD / ARE YOU SURE CONFIRMATION MODAL OVERLAY */}
      <DeleteConfirmModal
        isOpen={closeConfirmOpen}
        title="Are you sure?"
        message="Are you sure you want to discard this post draft? Any recorded media and form progress will be lost."
        confirmText="Discard Draft"
        cancelText="Keep Editing"
        onConfirm={() => {
          stopCameraInternal();
          setCloseConfirmOpen(false);
          onClose();
        }}
        onCancel={() => setCloseConfirmOpen(false)}
      />
    </div>
  );
}
