import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Disc3, 
  Pencil, 
  Octagon, 
  Bell, 
  BookOpen, 
  FileSliders,  
  User, 
  Plus, 
  Search,
  Settings,
  GitFork,
  CircleDotDashed,
  X,
  BookPlus,
  Copy,
  Check
} from 'lucide-react';

import { Recipe, Project, Collection, Creator, FeedPost, Task, Phase, ProfileVisibility } from './types';
import { GonnngGIcon, GonnngGLogo } from './components/GonnngLogo';
import { dataService } from './services/dataService';
import { uploadService, getPublicMediaUrl } from './services/uploadService';
import { permissionService } from './services/permissionService';
import { authService, isAuthFeatureEnabled, UserSession } from './services/authService';
import { hydrateCreators, isUserInCircle } from './utils/followUtils';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

// Component imports
import Onboarding from './components/Onboarding';
import UserProfile, { AppPermissions } from './components/UserProfile';
import SandEngine from './components/SandEngine';
import Feed from './components/Feed';
import CreateHub from './components/CreateHub';
import SearchRecipesModal from './components/SearchRecipesModal';
import CreatorProfileModal from './components/CreatorProfileModal';
import UpdatesView, { MessageThread } from './components/UpdatesView';
import ShareDrawer from './components/ShareDrawer';
import MessageDrawer from './components/MessageDrawer';
import HomeCreatorProfileView from './components/HomeCreatorProfileView';
import PermissionsPromptModal from './components/PermissionsPromptModal';
import PostDetailModal from './components/PostDetailModal';
import { ProjectExploreModal, RecipeExploreModal } from './components/ExploreModals';
import {  
  IconOnlySubButton, 
} from './components/DesignSystemTiles';

// Website Component imports
import { WebsiteHeader } from './components/website/WebsiteHeader';
import { HomePage } from './components/website/HomePage';
import { DownloadPage } from './components/website/DownloadPage';
import { SupportPage } from './components/website/SupportPage';
import { PrivacyPage } from './components/website/PrivacyPage';
import { TermsPage } from './components/website/TermsPage';
import { ContactPage } from './components/website/ContactPage';
import { LoginPage } from './components/website/LoginPage';
import { OnboardingWizard } from './components/website/OnboardingWizard';

// Cookie Management Infrastructure
import { useCookieConsent } from './hooks/useCookieConsent';
import { CookieBanner } from './components/CookieBanner';
import { CookiePreferencesModal } from './components/CookiePreferencesModal';

export const isRestrictedPath = (pathname: string): boolean => {
  if (!pathname) return false;
  const path = pathname.toLowerCase().replace(/\/$/, '') || '/';
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return false;
  const root = parts[0];
  return root === 'updates' || root === 'circle';
};

export default function App() {
  // Global States loaded from LocalStorage if present
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('gonnng_recipes');
    return saved ? JSON.parse(saved) : [];
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('gonnng_projects');
    return saved ? JSON.parse(saved) : [];
  });

  const [collections, setCollections] = useState<Collection[]>(() => {
    const saved = localStorage.getItem('gonnng_collections');
    return saved ? JSON.parse(saved) : [];
  });

  const [posts, setPosts] = useState<FeedPost[]>(() => {
    const savedStr = localStorage.getItem('gonnng_posts');
    if (savedStr) {
      try {
        const savedList: FeedPost[] = JSON.parse(savedStr);
        if (Array.isArray(savedList)) return savedList;
      } catch {}
    }
    return [];
  });

  const [creators, setCreators] = useState<Creator[]>(() => {
    const saved = localStorage.getItem('gonnng_creators');
    if (saved) {
      try {
        const parsed: Creator[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return hydrateCreators(parsed);
        }
      } catch {}
    }
    return [];
  });

  const [currentUser, setCurrentUser] = useState<Creator | null>(() => {
    const saved = localStorage.getItem('gonnng_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          const followerIds = Array.isArray(parsed.followerIds) ? parsed.followerIds : [];
          const followingIds = Array.isArray(parsed.followingIds) ? parsed.followingIds : [];

          return {
            ...parsed,
            followerIds,
            followingIds,
            followersCount: followerIds.length,
            followingCount: followingIds.length
          };
        }
      } catch {}
    }
    return null;
  });

  const [savedRecipeIds, setSavedRecipeIds] = useState<string[]>(() => {
    const bookmarksStr = localStorage.getItem('gonnng_recipe_bookmarks');
    if (bookmarksStr) {
      try {
        const parsed = JSON.parse(bookmarksStr);
        if (Array.isArray(parsed)) {
          return parsed.map((b: any) => typeof b === 'string' ? b : (b.recipeId || ''));
        }
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    const uid = currentUser?.id || 'user-current';
    dataService.getUserSavedRecipeIds(uid).then(ids => {
      if (ids) {
        setSavedRecipeIds(ids);
      }
    });
  }, [currentUser?.id]);

  const handleToggleSaveRecipe = async (recipeId: string, recipeObj?: Recipe) => {
    const uid = currentUser?.id || 'user-current';
    const isNowSaved = await dataService.toggleBookmarkRecipe(uid, recipeId);
    if (recipeObj && isNowSaved) {
      setRecipes(prev => {
        if (prev.some(r => r.id === recipeObj.id)) return prev;
        return [recipeObj, ...prev];
      });
    }
    setSavedRecipeIds(prev => {
      const next = isNowSaved
        ? (prev.includes(recipeId) ? prev : [...prev, recipeId])
        : prev.filter(id => id !== recipeId);
      try {
        localStorage.setItem('gonnng_recipe_bookmarks', JSON.stringify(next));
      } catch {}
      return next;
    });
  };
  const parsePath = (pathname: string): { 
    viewMode: 'website' | 'workspace'; 
    websiteTab: string; 
    activeTab: 'updates' | 'recipes' | 'coach' | 'social' | 'profile';
    updatesCategory?: null | 'updates' | 'followers' | 'appinfo';
    updatesChatUserId?: string | null;
    processTab?: 'projects' | 'focus' | 'library';
    viewedCreatorIdentifier?: string | null;
    postId?: string | null;
    recipeId?: string | null;
    projectId?: string | null;
  } => {
    const path = pathname.toLowerCase().replace(/\/$/, '') || '/';
    const parts = path.split('/').filter(Boolean);

    if (parts.length === 0 || (parts.length === 1 && (parts[0] === 'index.html' || parts[0] === 'index.htm'))) {
      return { viewMode: 'website', websiteTab: 'home', activeTab: 'profile' };
    }

    const root = parts[0];

    if (['features', 'download', 'support', 'contact', 'privacy', 'terms', 'login'].includes(root)) {
      const tab = root === 'download' ? 'features' : root;
      return { viewMode: 'website', websiteTab: tab, activeTab: 'profile' };
    }

    if (root === 'circle') {
      return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'social' };
    }

    // Projects permalink: /project/:projectId or /projects/:projectId
    if (root === 'project' || root === 'projects') {
      const projectId = parts[1] || null;
      return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'coach', processTab: 'projects', projectId };
    }

    // Posts permalink: /p/:postId or /post/:postId
    if (root === 'p' || root === 'post') {
      const postId = parts[1] || null;
      return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'social', postId };
    }

    // Recipes permalink: /recipe/:recipeId or /recipes/:recipeId
    if (root === 'recipe' || root === 'recipes') {
      const recipeId = parts[1] || null;
      return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'recipes', processTab: 'library', recipeId };
    }

    if (root === 'updates') {
      const sub = parts[1];
      if (sub === 'notifications' || sub === 'activity' || sub === 'updates') {
        return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'updates', updatesCategory: 'updates' };
      }
      if (sub === 'followers' || sub === 'new-followers') {
        return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'updates', updatesCategory: 'followers' };
      }
      if (sub === 'system' || sub === 'appinfo' || sub === 'announcements' || sub === 'app-info') {
        return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'updates', updatesCategory: 'appinfo' };
      }
      if (sub === 'messages') {
        const chatUserId = parts[2] || null;
        return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'updates', updatesCategory: null, updatesChatUserId: chatUserId };
      }
      return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'updates', updatesCategory: null, updatesChatUserId: null };
    }

    if (root === 'process' || root === 'sand') {
      const sub = parts[1];
      if (sub === 'focus') {
        return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'coach', processTab: 'focus' };
      }
      if (sub === 'library' || sub === 'recipes') {
        const recipeId = parts[2] || null;
        return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'recipes', processTab: 'library', recipeId };
      }
      if (sub === 'recipe' && parts[2]) {
        return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'recipes', processTab: 'library', recipeId: parts[2] };
      }
      if (sub === 'projects' || sub === 'project') {
        const projectId = parts[2] || null;
        return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'coach', processTab: 'projects', projectId };
      }
      return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'coach', processTab: 'projects' };
    }

    if (root === 'library') {
      return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'recipes', processTab: 'library' };
    }

    if (root === 'profile' || root === 'u') {
      const viewedHandle = parts[1] || null;
      return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'profile', viewedCreatorIdentifier: viewedHandle };
    }

    return { viewMode: 'website', websiteTab: 'home', activeTab: 'profile' };
  };

  const getPathFromState = (
    mode: 'website' | 'workspace', 
    webTab: string, 
    appTab: 'updates' | 'recipes' | 'coach' | 'social' | 'profile',
    subState?: {
      updatesCategory?: null | 'updates' | 'followers' | 'appinfo';
      updatesChatUser?: Creator | null;
      processTab?: 'projects' | 'focus' | 'library';
      viewedCreator?: Creator | null | string;
      postId?: string | null;
      recipeId?: string | null;
      projectId?: string | null;
    }
  ): string => {
    if (mode === 'workspace') {
      // Direct permalinks take precedence
      if (subState?.recipeId) {
        return `/recipe/${encodeURIComponent(subState.recipeId)}`;
      }
      if (subState?.postId) {
        return `/p/${encodeURIComponent(subState.postId)}`;
      }
      if (subState?.viewedCreator) {
        const creatorObj = typeof subState.viewedCreator === 'object' ? subState.viewedCreator : null;
        const handle = creatorObj 
          ? (creatorObj.username || (creatorObj.name ? creatorObj.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '') || creatorObj.id)
          : subState.viewedCreator;
        return `/u/${encodeURIComponent(String(handle))}`;
      }

      switch (appTab) {
        case 'updates':
          if (subState?.updatesChatUser) {
            const handle = subState.updatesChatUser.username || subState.updatesChatUser.id;
            return `/updates/messages/${encodeURIComponent(handle)}`;
          }
          if (subState?.updatesCategory === 'updates') return '/updates/notifications';
          if (subState?.updatesCategory === 'followers') return '/updates/followers';
          if (subState?.updatesCategory === 'appinfo') return '/updates/system';
          return '/updates';
        case 'coach':
          if (subState?.processTab === 'focus') return '/process/focus';
          if (subState?.projectId) return `/project/${encodeURIComponent(subState.projectId)}`;
          return '/process/projects';
        case 'recipes':
          if (subState?.recipeId) return `/recipe/${encodeURIComponent(subState.recipeId)}`;
          return '/process/library';
        case 'social':
          return '/circle';
        case 'profile':
          return '/profile';
        default:
          return '/profile';
      }
    } else {
      if (subState?.recipeId) {
        return `/recipe/${encodeURIComponent(subState.recipeId)}`;
      }
      if (subState?.projectId) {
        return `/project/${encodeURIComponent(subState.projectId)}`;
      }
      switch (webTab) {
        case 'home': return '/';
        case 'features': return '/features';
        case 'download': return '/features';
        case 'support': return '/support';
        case 'contact': return '/contact';
        case 'privacy': return '/privacy';
        case 'terms': return '/terms';
        case 'login': return '/login';
        default: return '/';
      }
    }
  };

  const isNativeCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
  const initialSession = authService.getCurrentSession();
  const rawInitialPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isRootOrNativeDefault = isNativeCapacitor && (rawInitialPath === '/' || rawInitialPath === '/index.html' || rawInitialPath === '');

  let resolvedInitialPath = rawInitialPath;
  if (isRootOrNativeDefault) {
    resolvedInitialPath = (initialSession && initialSession.id) ? '/profile' : '/login';
    if (typeof window !== 'undefined' && window.location.pathname !== resolvedInitialPath) {
      window.history.replaceState({}, '', resolvedInitialPath);
    }
  } else if (isRestrictedPath(rawInitialPath) && !initialSession) {
    resolvedInitialPath = '/login';
    if (typeof window !== 'undefined' && window.location.pathname !== resolvedInitialPath) {
      window.history.replaceState({}, '', '/login');
    }
  }

  const initialRoute = parsePath(resolvedInitialPath);

  // Local UI controller states
  const [viewMode, setViewMode] = useState<'website' | 'workspace'>(initialRoute.viewMode);
  const [websiteTab, setWebsiteTab] = useState<string>(initialRoute.websiteTab);
  const [authSession, setAuthSession] = useState<UserSession | null>(initialSession);

  // Cookie Consent Infrastructure
  const {
    hasAnswered: hasAnsweredCookieConsent,
    preferences: cookiePreferences,
    attribution: cookieAttribution,
    isPreferencesModalOpen: isCookieModalOpen,
    acceptAll: handleAcceptAllCookies,
    rejectOptional: handleRejectOptionalCookies,
    savePreferences: handleSaveCookiePreferences,
    openPreferencesModal: handleOpenCookieModal,
    closePreferencesModal: handleCloseCookieModal,
    trackEvent: trackAnalyticsEvent,
    governanceItems: cookieGovernanceItems
  } = useCookieConsent();

  // Capacitor Status Bar Mobile Configuration
  useEffect(() => {
    const initStatusBar = async () => {
      try {
        if (Capacitor.isPluginAvailable('StatusBar')) {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
          await StatusBar.setOverlaysWebView({ overlay: false });
        }
      } catch (err) {
        // Silently handle web/preview environment
      }
    };
    initStatusBar();
  }, []);

  // Capacitor App lifecycle state listener on native iOS/Android
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let appStateHandle: any = null;
    CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        const session = authService.getCurrentSession();
        if (!session) {
          updateRoute('website', 'login');
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.history.replaceState({}, '', '/login');
          }
        }
      }
    }).then(handle => {
      appStateHandle = handle;
    }).catch(() => {});

    return () => {
      if (appStateHandle) {
        appStateHandle.remove();
      }
    };
  }, []);

  // On mount: check server authentication session via gonnng_session cookie
  useEffect(() => {
    authService.checkServerSession().then((user) => {
      if (user) {
        setAuthSession(user);
      } else {
        setAuthSession(null);
        if (typeof window !== 'undefined' && isRestrictedPath(window.location.pathname)) {
          if (window.location.pathname !== '/login') {
            window.history.replaceState({}, '', '/login');
          }
          setViewMode('website');
          setWebsiteTab('login');
        }
      }
    });
  }, []);

  // Ensure currentUser state is synced when authSession or creators change
  useEffect(() => {
    const activeUserId = authSession?.id || currentUser?.id || 'user-current';
    const activeEmail = authSession?.email;

    const matchingCreator = creators.find(
      c => c.id === activeUserId || (activeEmail && c.email?.toLowerCase() === activeEmail.toLowerCase())
    );

    if (matchingCreator) {
      setCurrentUser(prev => {
        if (!prev) return matchingCreator;
        const isDifferent =
          prev.id !== matchingCreator.id ||
          prev.name !== matchingCreator.name ||
          prev.bio !== matchingCreator.bio ||
          prev.goals !== matchingCreator.goals ||
          prev.privacyDefault !== matchingCreator.privacyDefault ||
          prev.followersCount !== matchingCreator.followersCount ||
          prev.followingCount !== matchingCreator.followingCount ||
          JSON.stringify(prev.followerIds) !== JSON.stringify(matchingCreator.followerIds) ||
          JSON.stringify(prev.followingIds) !== JSON.stringify(matchingCreator.followingIds);

        if (isDifferent) {
          return {
            ...matchingCreator,
            avatarUrl: matchingCreator.avatarUrl || authSession?.avatarUrl
          };
        }
        return prev;
      });
    } else if (authSession) {
      const newCreator: Creator = {
        id: authSession.id,
        publicId: authSession.publicId || Math.random().toString(36).substring(2, 11).toUpperCase(),
        username: authSession.username || (authSession.name ? authSession.name.toLowerCase().replace(/[^a-z0-9]/g, '') : '') || `user_${authSession.id?.substring(0, 6) || Date.now()}`,
        name: authSession.name || 'User',
        email: authSession.email || '',
        avatarUrl: authSession.avatarUrl || '',
        bio: (authSession as any).bio || '',
        goals: (authSession as any).goals || '',
        privacyDefault: ((authSession as any).privacyDefault || 'public') as ProfileVisibility,
        followerIds: [],
        followingIds: [],
        followersCount: 0,
        followingCount: 0
      };
      setCreators(prev => [...prev, newCreator]);
      setCurrentUser(newCreator);
    }
  }, [authSession, creators]);

  // Track page views when website tab changes
  useEffect(() => {
    if (viewMode === 'website') {
      trackAnalyticsEvent('Page View', { page: websiteTab });
      if (websiteTab === 'home') trackAnalyticsEvent('Landing Page Visit');
      if (websiteTab === 'features' || websiteTab === 'download') trackAnalyticsEvent('Features Page Visit');
      if (websiteTab === 'login') trackAnalyticsEvent('Account Creation Click');
    }
  }, [viewMode, websiteTab, trackAnalyticsEvent]);

  // Hardware & Device Permissions State
  const [permissions, setPermissions] = useState<AppPermissions>(() => {
    const saved = localStorage.getItem('gonnng_permissions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return { camera: true, microphone: true, files: true };
  });

  const [showPermissionsPromptModal, setShowPermissionsPromptModal] = useState<boolean>(false);

  // Flow 1: Cold start / login permission check (Authenticated users only)
  useEffect(() => {
    if (!currentUser?.id) {
      setShowPermissionsPromptModal(false);
      return;
    }

    let isMounted = true;

    async function checkUserDevicePermissions() {
      try {
        const userId = currentUser!.id;
        const resMap = await permissionService.onLoginOrColdStart(userId);
        
        const saved = localStorage.getItem('gonnng_permissions');
        let userDefined: AppPermissions | null = null;
        if (saved) {
          try { userDefined = JSON.parse(saved); } catch {}
        }

        const updated: AppPermissions = {
          camera: userDefined?.camera !== undefined ? userDefined.camera : (resMap.camera === 'granted'),
          microphone: userDefined?.microphone !== undefined ? userDefined.microphone : (resMap.microphone === 'granted'),
          files: userDefined?.files !== undefined ? userDefined.files : (resMap.file_access === 'granted')
        };

        if (isMounted) {
          setPermissions(updated);
          localStorage.setItem('gonnng_permissions', JSON.stringify(updated));
        }

        // Query user_device_permissions table for this user & device
        const cameraStored = await permissionService.getStoredPermission(userId, 'camera');
        const micStored = await permissionService.getStoredPermission(userId, 'microphone');
        const filesStored = await permissionService.getStoredPermission(userId, 'file_access');

        // Only triggers if permissions are NOT set on the device (null) or set to 'not_requested' for the device
        const isNotSetOrNotRequested =
          cameraStored === null || cameraStored === 'not_requested' ||
          micStored === null || micStored === 'not_requested' ||
          filesStored === null || filesStored === 'not_requested';

        const promptedLocally = localStorage.getItem('gonnng_permissions_prompted');

        if (isMounted && isNotSetOrNotRequested && !promptedLocally) {
          setShowPermissionsPromptModal(true);
        }
      } catch (err) {
        console.warn('Permission cold start check note:', err);
      }
    }

    checkUserDevicePermissions();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // Flow 2: Sync permissions on app foreground / resume
  useEffect(() => {
    if (!currentUser?.id) return;

    const syncForegroundPermissions = () => {
      if (document.visibilityState === 'visible') {
        permissionService.onForegroundSync(currentUser.id).then(resMap => {
          const saved = localStorage.getItem('gonnng_permissions');
          let userDefined: AppPermissions | null = null;
          if (saved) {
            try { userDefined = JSON.parse(saved); } catch {}
          }

          const updated: AppPermissions = {
            camera: userDefined?.camera !== undefined ? userDefined.camera : (resMap.camera === 'granted'),
            microphone: userDefined?.microphone !== undefined ? userDefined.microphone : (resMap.microphone === 'granted'),
            files: userDefined?.files !== undefined ? userDefined.files : (resMap.file_access === 'granted')
          };
          setPermissions(updated);
          localStorage.setItem('gonnng_permissions', JSON.stringify(updated));
        }).catch(err => console.warn('Foreground permissions sync note:', err));
      }
    };

    document.addEventListener('visibilitychange', syncForegroundPermissions);
    window.addEventListener('focus', syncForegroundPermissions);

    return () => {
      document.removeEventListener('visibilitychange', syncForegroundPermissions);
      window.removeEventListener('focus', syncForegroundPermissions);
    };
  }, [currentUser?.id]);

  const handleUpdatePermissions = (updated: AppPermissions) => {
    setPermissions(updated);
    localStorage.setItem('gonnng_permissions', JSON.stringify(updated));
  };

  const handleApproveAllPermissions = () => {
    const allApproved = { camera: true, microphone: true, files: true };
    setPermissions(allApproved);
    localStorage.setItem('gonnng_permissions', JSON.stringify(allApproved));
    localStorage.setItem('gonnng_permissions_prompted', 'true');
    setShowPermissionsPromptModal(false);

    if (currentUser?.id) {
      permissionService.upsertPermission(currentUser.id, 'camera', 'granted');
      permissionService.upsertPermission(currentUser.id, 'microphone', 'granted');
      permissionService.upsertPermission(currentUser.id, 'file_access', 'granted');
    }
  };

  const handleCustomPermissions = (custom: AppPermissions) => {
    setPermissions(custom);
    localStorage.setItem('gonnng_permissions', JSON.stringify(custom));
    localStorage.setItem('gonnng_permissions_prompted', 'true');
    setShowPermissionsPromptModal(false);

    if (currentUser?.id) {
      permissionService.upsertPermission(currentUser.id, 'camera', custom.camera ? 'granted' : 'denied');
      permissionService.upsertPermission(currentUser.id, 'microphone', custom.microphone ? 'granted' : 'denied');
      permissionService.upsertPermission(currentUser.id, 'file_access', custom.files ? 'granted' : 'denied');
    }
  };

  const handleNavigateToPermissions = () => {
    setViewMode('workspace');
    setActiveTab('profile');
    setIsProfileSettingsOpen(true);
    setTimeout(() => {
      const el = document.getElementById('permissions-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 350);
  };

  const handleRequestDevicePermissions = () => {
    // Access request check only happens inside the launched app
    if (viewMode !== 'workspace') return;

    // Always check user's defined permissions before prompting for access
    const saved = localStorage.getItem('gonnng_permissions');
    if (saved) {
      try {
        const userDefined: AppPermissions = JSON.parse(saved);
        setPermissions(userDefined);
        // If user defined permissions have explicitly disabled camera/mic, navigate to settings to manage them
        if (userDefined.camera === false && userDefined.microphone === false) {
          handleNavigateToPermissions();
          return;
        }
      } catch {}
    }

    setShowPermissionsPromptModal(true);
  };

  const [activeTab, setActiveTab] = useState<'updates' | 'recipes' | 'coach' | 'social' | 'profile'>(initialRoute.activeTab);
  const [processTab, setProcessTab] = useState<'projects' | 'focus' | 'library'>(initialRoute.processTab || 'projects');
  const [feedFilter, setFeedFilter] = useState<'all' | 'internal' | 'private'>('internal');
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  // Overlay / Inline Views state
  const [homeViewCreatorProfile, setHomeViewCreatorProfile] = useState<Creator | null>(null);
  const [profileSuperimposedPostId, setProfileSuperimposedPostId] = useState<string | null>(initialRoute.postId || null);
  const [homeSuperimposedPostId, setHomeSuperimposedPostId] = useState<string | null>(initialRoute.postId || null);
  const [autoOpenCommentsPostId, setAutoOpenCommentsPostId] = useState<string | null>(null);

  // Updates View Navigation States
  const [updatesCategory, setUpdatesCategory] = useState<null | 'updates' | 'followers' | 'appinfo'>(initialRoute.updatesCategory ?? null);
  const [updatesChatUser, setUpdatesChatUser] = useState<Creator | null>(null);

  const [selectedRecipeModal, setSelectedRecipeModal] = useState<Recipe | null>(null);
  const [selectedPostModal, setSelectedPostModal] = useState<FeedPost | null>(null);
  const [recipeModalCopied, setRecipeModalCopied] = useState<boolean>(false);

  const updateRoute = (
    newViewMode?: 'website' | 'workspace',
    newWebsiteTab?: string,
    newActiveTab?: 'updates' | 'recipes' | 'coach' | 'social' | 'profile',
    subState?: {
      updatesCategory?: null | 'updates' | 'followers' | 'appinfo';
      updatesChatUser?: Creator | null;
      processTab?: 'projects' | 'focus' | 'library';
      viewedCreator?: Creator | null | string;
      postId?: string | null;
      recipeId?: string | null;
      projectId?: string | null;
    },
    push: boolean = true
  ) => {
    let targetViewMode = newViewMode ?? viewMode;
    let targetWebsiteTab = newWebsiteTab ?? websiteTab;
    let targetActiveTab = newActiveTab ?? activeTab;

    const effUpdatesCat = subState?.updatesCategory !== undefined ? subState.updatesCategory : updatesCategory;
    const effUpdatesUser = subState?.updatesChatUser !== undefined ? subState.updatesChatUser : updatesChatUser;
    const effProcessTab = subState?.processTab !== undefined ? subState.processTab : processTab;
    const effViewedCreator = subState?.viewedCreator !== undefined ? subState.viewedCreator : (homeViewCreatorProfile || viewedCreatorId);
    const effPostId = subState?.postId !== undefined ? subState.postId : (homeSuperimposedPostId || profileSuperimposedPostId);
    const effRecipeId = subState?.recipeId !== undefined ? subState.recipeId : (selectedRecipeModal ? (selectedRecipeModal.publicId || selectedRecipeModal.id) : null);
    const effProjectId = subState?.projectId !== undefined ? subState.projectId : (targetActiveTab === 'coach' && effProcessTab === 'projects' ? (activeProject?.publicId || activeProject?.id || selectedProjectId) : null);

    let targetPath = getPathFromState(targetViewMode, targetWebsiteTab, targetActiveTab, {
      updatesCategory: effUpdatesCat,
      updatesChatUser: effUpdatesUser,
      processTab: effProcessTab,
      viewedCreator: effViewedCreator,
      postId: effPostId,
      recipeId: effRecipeId,
      projectId: effProjectId
    });

    const currentSession = authSession || authService.getCurrentSession();
    if (!currentSession && isRestrictedPath(targetPath)) {
      targetViewMode = 'website';
      targetWebsiteTab = 'login';
      targetPath = '/login';
    }

    setViewMode(targetViewMode);
    if (newWebsiteTab !== undefined || targetPath === '/login') setWebsiteTab(targetWebsiteTab);
    if (newActiveTab !== undefined) setActiveTab(targetActiveTab);

    if (push && typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  useEffect(() => {
    const syncFromRoute = () => {
      const currentPath = window.location.pathname;
      const currentSession = authSession || authService.getCurrentSession();
      const isNative = Capacitor.isNativePlatform();

      // On native platform (iOS/Android) or when landing on root URL / index.html
      if (isNative && (currentPath === '/' || currentPath === '/index.html' || currentPath === '')) {
        if (currentSession && currentSession.id) {
          window.history.replaceState({}, '', '/profile');
          setViewMode('workspace');
          setActiveTab('profile');
          return;
        } else {
          window.history.replaceState({}, '', '/login');
          setViewMode('website');
          setWebsiteTab('login');
          return;
        }
      }

      if (!currentSession && isRestrictedPath(currentPath)) {
        if (currentPath !== '/login') {
          window.history.replaceState({}, '', '/login');
        }
        setViewMode('website');
        setWebsiteTab('login');
        return;
      }

      const route = parsePath(currentPath);
      setViewMode(route.viewMode);
      setWebsiteTab(route.websiteTab);
      setActiveTab(route.activeTab);

      if (route.processTab) {
        setProcessTab(route.processTab);
      }

      setUpdatesCategory(route.updatesCategory ?? null);

      if (route.updatesChatUserId) {
        const found = creators.find(c => c.id === route.updatesChatUserId || c.username === route.updatesChatUserId);
        setUpdatesChatUser(found || null);
      } else {
        setUpdatesChatUser(null);
      }

      if (route.viewedCreatorIdentifier) {
        const handle = (route.viewedCreatorIdentifier || '').toLowerCase();
        const found = creators.find(c => 
          c.id === route.viewedCreatorIdentifier || 
          (c.username && c.username.toLowerCase() === handle) || 
          (c.name && c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === handle)
        );
        if (found) {
          if (currentUser && found.id === currentUser.id) {
            setHomeViewCreatorProfile(null);
            setViewedCreatorId(null);
          } else {
            setHomeViewCreatorProfile(found);
          }
        } else {
          setViewedCreatorId(route.viewedCreatorIdentifier);
        }
      } else {
        setHomeViewCreatorProfile(null);
        setViewedCreatorId(null);
      }

      if (route.postId) {
        setHomeSuperimposedPostId(route.postId);
        setProfileSuperimposedPostId(route.postId);
      } else {
        setHomeSuperimposedPostId(null);
        setProfileSuperimposedPostId(null);
      }

      if (route.projectId) {
        const foundProj = projects.find(p => 
          p.id === route.projectId || 
          p.publicId === route.projectId || 
          (p.title && p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === route.projectId?.toLowerCase())
        );
        if (foundProj) {
          setSelectedProjectId(foundProj.id);
        } else {
          setSelectedProjectId(route.projectId);
        }
      }

      if (route.recipeId) {
        const foundRec = recipes.find(r => 
          r.id === route.recipeId || 
          r.publicId === route.recipeId || 
          (r.title && r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === route.recipeId?.toLowerCase())
        );
        if (foundRec) {
          setSelectedRecipeModal(foundRec);
        }
      } else {
        setSelectedRecipeModal(null);
      }
    };

    syncFromRoute();

    window.addEventListener('popstate', syncFromRoute);
    return () => window.removeEventListener('popstate', syncFromRoute);
  }, [authSession, creators, currentUser, recipes, projects]);

  const handleLoginSuccess = (user: UserSession) => {
    setAuthSession(user);
    setCurrentUser(prev => {
      const base: Creator = prev || {
        id: user.id,
        publicId: user.publicId || Math.random().toString(36).substring(2, 11).toUpperCase(),
        username: user.username || (user.name ? user.name.toLowerCase().replace(/[^a-z0-9]/g, '') : '') || `user_${user.id?.substring(0, 6) || Date.now()}`,
        name: user.name || 'User',
        email: user.email,
        avatarUrl: user.avatarUrl || '',
        bio: '',
        goals: '',
        privacyDefault: 'public',
        followersCount: 0,
        followingCount: 0,
        followerIds: [],
        followingIds: []
      };
      return {
        ...base,
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || base.avatarUrl
      };
    });

    dataService.getProjects(user.id).then(userProjects => {
      if (userProjects && userProjects.length > 0) {
        setProjects(userProjects);
        setSelectedProjectId(userProjects[0].id);
      }
    });
    dataService.getUserSavedRecipeIds(user.id).then(savedIds => {
      if (savedIds) {
        setSavedRecipeIds(savedIds);
      }
    });
    dataService.getRecipes().then(allRecipes => {
      if (allRecipes && allRecipes.length > 0) {
        setRecipes(allRecipes);
      }
    });

    if (user.isOnboarded) {
      setShowTutorial(false);
      localStorage.setItem('gonnng_tutorial_done', 'true');
      updateRoute('workspace', undefined, 'profile');
    } else {
      setShowTutorial(true);
      localStorage.removeItem('gonnng_tutorial_done');
      updateRoute('workspace', undefined, 'profile');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setAuthSession(null);
    setCurrentUser(null);
    localStorage.removeItem('gonnng_current_user');
    updateRoute('website', 'login');
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.history.replaceState({}, '', '/login');
    }
  };

  const handleNavigateWebsite = (tab: string) => {
    updateRoute('website', tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenWorkspace = () => {
    if (isAuthFeatureEnabled() && !authSession) {
      updateRoute('website', 'login');
    } else {
      updateRoute('workspace', undefined, activeTab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = (e?: Event) => {
      let currentTop = window.scrollY || 0;
      const profileContainer = document.getElementById('profile-scroll-container');
      if (profileContainer && profileContainer.scrollTop > currentTop) {
        currentTop = profileContainer.scrollTop;
      }
      const feedContainer = document.getElementById('feed-root')?.querySelector('.overflow-y-scroll');
      if (feedContainer && (feedContainer as HTMLElement).scrollTop > currentTop) {
        currentTop = (feedContainer as HTMLElement).scrollTop;
      }
      if (e?.target && (e.target as HTMLElement).scrollTop !== undefined) {
        currentTop = Math.max(currentTop, (e.target as HTMLElement).scrollTop);
      }

      if (currentTop > 15) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, []);

  const handleTabChange = (tab: 'updates' | 'recipes' | 'coach' | 'social' | 'profile', options?: { keepCreatorProfile?: boolean }) => {
    setShowTutorial(false);
    if (tab === 'updates') {
      setUpdatesCategory(null);
      setUpdatesChatUser(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'profile') {
      setProfileSuperimposedPostId(null);
      document.getElementById('profile-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'social') {
      if (!options?.keepCreatorProfile) {
        setHomeViewCreatorProfile(null);
      }
      const feedContainer = document.getElementById('feed-root')?.querySelector('.overflow-y-scroll');
      if (feedContainer) {
        feedContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setActiveTab(tab);
    updateRoute('workspace', undefined, tab, {
      updatesCategory: null,
      updatesChatUser: null,
      processTab: tab === 'recipes' ? 'library' : tab === 'coach' ? 'projects' : undefined,
      viewedCreator: options?.keepCreatorProfile ? homeViewCreatorProfile : null,
      postId: null,
      recipeId: null
    });
  };

  const handleUpdatesCategoryChange = (cat: null | 'updates' | 'followers' | 'appinfo') => {
    setUpdatesCategory(cat);
    setUpdatesChatUser(null);
    updateRoute('workspace', undefined, 'updates', { updatesCategory: cat, updatesChatUser: null, viewedCreator: null, postId: null, recipeId: null });
  };

  const handleUpdatesChatUserChange = (user: Creator | null) => {
    setUpdatesChatUser(user);
    setUpdatesCategory(null);
    updateRoute('workspace', undefined, 'updates', { updatesCategory: null, updatesChatUser: user, viewedCreator: null, postId: null, recipeId: null });
  };

  const handleSelectProject = (projectId: string | null) => {
    setSelectedProjectId(projectId);
    if (projectId) {
      const targetProject = projects.find(p => p.id === projectId || p.publicId === projectId);
      const identifier = targetProject?.publicId || targetProject?.id || projectId;
      updateRoute('workspace', undefined, 'coach', { 
        processTab: 'projects', 
        projectId: identifier,
        recipeId: null,
        postId: null,
        viewedCreator: null 
      });
    } else {
      updateRoute('workspace', undefined, 'coach', { 
        processTab: 'projects', 
        projectId: null,
        recipeId: null,
        postId: null,
        viewedCreator: null 
      });
    }
  };

  const handleProcessTabChange = (tab: 'projects' | 'focus' | 'library') => {
    setProcessTab(tab);
    const targetAppTab = tab === 'library' ? 'recipes' : 'coach';
    const effectiveProjectId = tab === 'projects' ? (activeProject?.publicId || activeProject?.id || selectedProjectId) : null;
    updateRoute('workspace', undefined, targetAppTab, { 
      processTab: tab, 
      projectId: effectiveProjectId, 
      viewedCreator: null, 
      postId: null, 
      recipeId: null 
    });
  };

  const getActiveViewTitle = () => {
    if (activeTab === 'profile') return 'Profile';
    if (activeTab === 'updates') return 'Updates';
    if (activeTab === 'social') return 'My Circle';
    if (activeTab === 'coach' || activeTab === 'recipes') return 'Process';
    return 'Gonnng';
  };

  // Message Threads & Share Drawer States
  const [shareDrawerPost, setShareDrawerPost] = useState<FeedPost | null>(null);
  const [isShareDrawerOpen, setIsShareDrawerOpen] = useState<boolean>(false);

  const [messageDrawerPartner, setMessageDrawerPartner] = useState<Creator | null>(null);
  const [isMessageDrawerOpen, setIsMessageDrawerOpen] = useState<boolean>(false);
  const [messageDrawerInitialItem, setMessageDrawerInitialItem] = useState<{ text: string; postId?: string; postThumbnail?: string } | undefined>(undefined);

  const handleOpenMessageDrawer = (partner: Creator, initialSharedItem?: { text: string; postId?: string; postThumbnail?: string }) => {
    setMessageDrawerPartner(partner);
    setMessageDrawerInitialItem(initialSharedItem);
    setIsMessageDrawerOpen(true);
  };

  const handleSelectPost = (postId: string, actionType?: 'comment' | 'vote' | 'shared_message') => {
    setShowTutorial(false);
    const targetLower = (postId || '').toLowerCase();
    const match = posts.find(p => p.id === postId || (p.title && targetLower && p.title.toLowerCase().includes(targetLower))) || posts[0];
    const actualPostId = match ? match.id : postId;

    if (activeTab === 'updates') {
      setSelectedPostModal(match || posts[0]);
      if (actionType === 'comment') {
        setAutoOpenCommentsPostId(actualPostId);
      } else {
        setAutoOpenCommentsPostId(null);
      }
      return;
    }

    setProfileSuperimposedPostId(actualPostId);
    setHomeSuperimposedPostId(actualPostId);
    if (actionType === 'comment') {
      setAutoOpenCommentsPostId(actualPostId);
    } else {
      setAutoOpenCommentsPostId(null);
    }
    updateRoute('workspace', undefined, 'social', { postId: actualPostId });
    setTimeout(() => {
      document.getElementById('profile-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleSelectRecipe = (recipeId: string) => {
    setShowTutorial(false);
    const targetRecipe = recipes.find(r => 
      r.id === recipeId || 
      r.publicId === recipeId || 
      (r.title && r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === recipeId.toLowerCase())
    ) || recipes[0];
    if (targetRecipe) {
      setSelectedRecipeModal(targetRecipe);
      if (activeTab === 'updates') {
        return;
      }
      const identifier = targetRecipe.publicId || targetRecipe.id;
      updateRoute('workspace', undefined, 'recipes', { 
        recipeId: identifier, 
        processTab: 'library',
        projectId: null,
        postId: null,
        viewedCreator: null 
      });
    }
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleCloseRecipeModal = () => {
    setSelectedRecipeModal(null);
    updateRoute(undefined, undefined, undefined, { recipeId: null });
  };

  const handleSelectUser = (creatorId: string) => {
    setShowTutorial(false);
    handleOpenCreatorProfile(creatorId);
  };

  const [messageThreads, setMessageThreads] = useState<MessageThread[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadThreads = async () => {
      const threads = await dataService.getDirectMessageThreads(currentUser?.id || 'user-current', creators);
      if (isMounted) {
        setMessageThreads(threads);
      }
    };
    loadThreads();
    return () => { isMounted = false; };
  }, [currentUser?.id, creators]);

  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const computeInitialUnreadNotifs = async () => {
      try {
        const uid = currentUser?.id || 'user-current';
        const readsMap = await dataService.getUserUpdateReads(uid);

        // 1. App Info unread
        const appUpdates = await dataService.getAppUpdates();
        const unreadAppInfo = (appUpdates || []).filter(u => !readsMap[u.id]).length;

        // 2. Post notifications unread
        let postNotifs: any[] = [];
        const dbNotifs = await dataService.getPostNotifications(uid);
        if (dbNotifs && dbNotifs.length > 0) {
          postNotifs = dbNotifs.map(n => ({ ...n, isRead: Boolean(readsMap[n.id]) }));
        } else {
          const saved = localStorage.getItem('gonnng_post_notifs');
          if (saved) {
            try { postNotifs = JSON.parse(saved); } catch (e) {}
          }
        }
        const unreadPosts = (postNotifs || []).filter(n => !n.isRead).length;

        // 3. Follower notifications unread
        let followerNotifs: any[] = [];
        const dbFollowers = await dataService.getFollowerNotifications(uid);
        if (dbFollowers && dbFollowers.length > 0) {
          followerNotifs = dbFollowers.map(f => ({ ...f, isRead: Boolean(readsMap[f.id]) }));
        } else {
          const saved = localStorage.getItem('gonnng_follower_notifs');
          if (saved) {
            try { followerNotifs = JSON.parse(saved); } catch (e) {}
          }
        }
        const unreadFollowers = (followerNotifs || []).filter(f => !f.isRead).length;

        if (isMounted) {
          setUnreadNotifsCount(unreadAppInfo + unreadPosts + unreadFollowers);
        }
      } catch (e) {
        if (isMounted) setUnreadNotifsCount(0);
      }
    };

    computeInitialUnreadNotifs();
    return () => { isMounted = false; };
  }, [currentUser?.id]);

  const unreadMessageCount = messageThreads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
  const totalUnreadNotifications = unreadMessageCount + unreadNotifsCount;

  const handleMarkThreadAsRead = async (creatorId: string) => {
    const currentUserId = currentUser?.id || 'user-current';
    setMessageThreads(prev => prev.map(t => {
      if (t.creator.id === creatorId) {
        return {
          ...t,
          unreadCount: 0,
          messages: t.messages.map(m => ({ ...m, isRead: true }))
        };
      }
      return t;
    }));

    await dataService.markDirectMessagesAsRead(currentUserId, creatorId);
    const refreshed = await dataService.getDirectMessageThreads(currentUserId, creators);
    setMessageThreads(refreshed);
  };

  const handleSendMessage = async (targetUserId: string, messageText: string, postThumbnail?: string, postId?: string) => {
    const currentUserId = currentUser?.id || 'user-current';
    await dataService.sendDirectMessage(currentUserId, targetUserId, messageText.slice(0, 1400), postThumbnail, postId, 'accepted');
    const refreshed = await dataService.getDirectMessageThreads(currentUserId, creators);
    setMessageThreads(refreshed);
  };
  const [showPhilosophyModal, setShowPhilosophyModal] = useState<boolean>(() => {
    return !localStorage.getItem('gonnng_philosophy_seen');
  });
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    return !localStorage.getItem('gonnng_tutorial_done');
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingBlankProject, setEditingBlankProject] = useState<Project | null>(null);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [searchModalInitialCategory, setSearchModalInitialCategory] = useState<string>('All');

  const handleOpenSearchModal = (show: boolean = true, category: string = 'All') => {
    setSearchModalInitialCategory(category);
    setShowSearchModal(show);
  };
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState<boolean>(false);
  const [forkInitialData, setForkInitialData] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [editingRecipeForExploreModal, setEditingRecipeForExploreModal] = useState<Recipe | null>(null);

  const handleOpenCreateRecipeModal = () => {
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
    setEditingRecipeForExploreModal(blankRecipe);
  };

  const handleOpenNewBlankProjectModal = () => {
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
    setEditingBlankProject(blankProject);
  };
  const [congratulateProject, setCongratulateProject] = useState<string | null>(null);

  // Initial loader
  useEffect(() => {
    const uid = currentUser?.id || 'user-current';
    dataService.getCreators().then(c => c && c.length > 0 && setCreators(c));
    dataService.getRecipes().then(r => {
      if (r && r.length > 0) {
        setRecipes(r);
      }
    });
    dataService.getCollections().then(col => col && col.length > 0 && setCollections(col));
    dataService.getProjects(uid).then(p => p && setProjects(p));
    dataService.getPosts().then(pst => pst && pst.length > 0 && setPosts(pst));
  }, [currentUser?.id]);

  // Persistence side-effects via dataService (handles both Supabase and LocalStorage)
  useEffect(() => {
    dataService.saveRecipes(recipes);
  }, [recipes]);

  useEffect(() => {
    dataService.saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    dataService.saveCollections(collections);
  }, [collections]);

  useEffect(() => {
    dataService.savePosts(posts);
  }, [posts]);

  useEffect(() => {
    dataService.saveCreators(creators);
  }, [creators]);

  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem('gonnng_current_user', JSON.stringify(currentUser));
      } catch {}
    } else {
      localStorage.removeItem('gonnng_current_user');
    }
  }, [currentUser]);

  const handleUpdateUser = async (updated: Creator) => {
    const previousName = currentUser?.name || '';
    setCurrentUser(updated);

    // Persist changes across creators, users, posts, and recipes tables in database
    const result = await dataService.updateUserProfile(updated, previousName);

    if (result.creators?.length) setCreators(result.creators);
    if (result.posts?.length) setPosts(result.posts);
    if (result.recipes?.length) setRecipes(result.recipes);

    setAuthSession(prev => prev ? {
      ...prev,
      name: updated.name,
      avatarUrl: updated.avatarUrl,
      avatarPath: updated.avatarPath || updated.avatarStoragePath,
      avatarStoragePath: updated.avatarPath || updated.avatarStoragePath,
      username: updated.username || prev.username,
      privacyDefault: updated.privacyDefault,
      bio: updated.bio
    } : prev);
  };

  // Set default selected project
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Compute overall progress percentage of active Projects
  const overallProgress = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;
    projects.forEach(p => {
      p.phases.forEach(ph => {
        totalTasks += ph.tasks.length;
        completedTasks += ph.tasks.filter(t => t.completed).length;
      });
    });
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }, [projects]);

  const activeProject = projects.find(p => p.id === selectedProjectId || p.publicId === selectedProjectId);

  // Toggle tasks inside project phase
  const handleToggleTask = (projectId: string, phaseId: string, taskId: string) => {
    let taskPostToAdd: FeedPost | null = null;
    let completionPostToAdd: FeedPost | null = null;
    let congratulationsTitle: string | null = null;

    setProjects(prevProjects => {
      return prevProjects.map(p => {
        if (p.id !== projectId) return p;

        let allCompletedBefore = p.phases.every(ph => ph.tasks.every(t => t.completed));

        const updatedPhases = p.phases.map(ph => {
          if (ph.id !== phaseId) return ph;
          return {
            ...ph,
            tasks: ph.tasks.map(t => {
              if (t.id !== taskId) return t;
              const newCompleted = !t.completed;

              if (newCompleted) {
                taskPostToAdd = {
                  id: `post-task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                  type: 'task_completed',
                  userId: currentUser?.id || 'user-current',
                  userName: currentUser?.name || 'Creator',
                  userAvatar: currentUser?.avatarUrl || '',
                  timeString: 'Just now',
                  title: `Completed action item on: ${p.title}`,
                  content: `✓ Checked off "${t.title}" under phase "${ph.title}"! Progress is building.`,
                  attachedId: p.id,
                  attachedName: p.title,
                  privacy: p.privacy || 'public',
                  createdAt: new Date().toISOString(),
                  gongs: { continue: 0, refine: 0, reconsider: 0 }
                };
              }
              return { ...t, completed: newCompleted, completedAt: newCompleted ? new Date().toISOString() : undefined };
            })
          };
        });

        const updatedProject = { ...p, phases: updatedPhases };
        const allCompletedAfter = updatedProject.phases.every(ph => ph.tasks.every(t => t.completed));

        if (!allCompletedBefore && allCompletedAfter) {
          congratulationsTitle = updatedProject.title;
          updatedProject.completedAt = new Date().toISOString();

          completionPostToAdd = {
            id: `post-comp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: 'project_completed',
            userId: currentUser?.id || 'user-current',
            userName: currentUser?.name || 'Creator',
            userAvatar: currentUser?.avatarUrl || '',
            timeString: 'Just now',
            title: `🏆 PROJECT COMPLETE: "${updatedProject.title}"`,
            content: `The whole is a sum of its parts! Successfully checked off every single phase and milestone for "${updatedProject.title}". Send constructive feedback!`,
            attachedId: updatedProject.id,
            attachedName: updatedProject.title,
            privacy: updatedProject.privacy || 'public',
            createdAt: new Date().toISOString(),
            gongs: { continue: 1, refine: 0, reconsider: 0 }
          };
        }

        return updatedProject;
      });
    });

    if (congratulationsTitle) {
      setCongratulateProject(congratulationsTitle);
    }

    if (taskPostToAdd) {
      const newPost: FeedPost = taskPostToAdd;
      setPosts(prev => [newPost, ...prev.filter(p => p.id !== newPost.id)]);
    }

    if (completionPostToAdd) {
      const compPost: FeedPost = completionPostToAdd;
      setPosts(prev => [compPost, ...prev.filter(p => p.id !== compPost.id)]);
    }
  };

  // Delete Project handler
  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selectedProjectId === id) {
      setSelectedProjectId(null);
    }
  };

  // Delete Collection (Focus) handler
  const handleDeleteCollection = (id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
  };

  // Creator profile modal overlay state
  const [viewedCreatorId, setViewedCreatorId] = useState<string | null>(null);

  const handleOpenCreatorProfile = (creatorIdOrName: string) => {
    if (!creatorIdOrName) return;

    // Close any active post or recipe modals and drawers
    setSelectedPostModal(null);
    setAutoOpenCommentsPostId(null);
    setSelectedRecipeModal(null);
    setViewedCreatorId(null);
    setIsShareDrawerOpen(false);
    setShareDrawerPost(null);
    setShowSearchModal(false);
    setHomeSuperimposedPostId(null);
    setProfileSuperimposedPostId(null);

    const found = creators.find(c => c.id === creatorIdOrName || c.username === creatorIdOrName || c.name === creatorIdOrName);
    const cleanCreatorName = typeof creatorIdOrName === 'string' ? creatorIdOrName : String(creatorIdOrName || 'creator');
    const targetCreator: Creator = found || {
      id: cleanCreatorName,
      name: cleanCreatorName,
      username: cleanCreatorName.toLowerCase().replace(/\s+/g, ''),
      email: `${cleanCreatorName.toLowerCase().replace(/\s+/g, '')}@gonnng.com`,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanCreatorName)}&background=F59E0B&color=fff`,
      bio: 'Creative collaborator on Gonnng.',
      goals: 'Documenting projects & sharing ideas.',
      privacyDefault: 'public' as const,
      followersCount: 1,
      followingCount: 1,
      isFollowing: false,
      isInCircle: false,
      followerIds: [],
      followingIds: []
    };

    if (currentUser && targetCreator.id === currentUser.id) {
      setHomeViewCreatorProfile(null);
      handleTabChange('profile');
      updateRoute('workspace', undefined, 'profile', { viewedCreator: null });
    } else {
      setHomeViewCreatorProfile(targetCreator);
      handleTabChange('social', { keepCreatorProfile: true });
      updateRoute('workspace', undefined, 'social', { viewedCreator: targetCreator });
    }

    setTimeout(() => {
      document.getElementById('home-profile-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const viewedCreator = useMemo(() => {
    if (!viewedCreatorId) return null;
    if (currentUser && (viewedCreatorId === currentUser.id || viewedCreatorId === currentUser.name)) {
      return currentUser;
    }
    const found = creators.find(c => c.id === viewedCreatorId || c.name === viewedCreatorId);
    if (found) return found;

    return {
      id: viewedCreatorId,
      name: viewedCreatorId,
      email: '',
      avatarUrl: '',
      bio: '',
      goals: '',
      privacyDefault: null as any,
      followersCount: 0,
      followingCount: 0,
      isFollowing: false,
      isInCircle: false
    };
  }, [viewedCreatorId, creators, currentUser]);

  // Creator following toggle (updates bidirectional followerIds & followingIds in DB & local state)
  const handleToggleFollowCreator = async (targetUserId: string) => {
    if (!currentUser || currentUser.id === targetUserId) return;

    const currentUserId = currentUser.id;

    // Persist follow/unfollow in database (or local storage fallback)
    try {
      await dataService.toggleFollowUser(currentUserId, targetUserId);
    } catch (err) {
      console.error('Error toggling follow in database:', err);
    }

    setCreators(prevCreators => {
      const activeUser = prevCreators.find(c => c.id === currentUserId);
      const targetUser = prevCreators.find(c => c.id === targetUserId);

      const activeFollowing = activeUser?.followingIds ? [...activeUser.followingIds] : [];
      const targetFollowers = targetUser?.followerIds ? [...targetUser.followerIds] : [];

      const isCurrentlyFollowing = activeFollowing.includes(targetUserId);

      let newActiveFollowing: string[];
      let newTargetFollowers: string[];

      if (isCurrentlyFollowing) {
        newActiveFollowing = activeFollowing.filter(id => id !== targetUserId);
        newTargetFollowers = targetFollowers.filter(id => id !== currentUserId);
      } else {
        newActiveFollowing = Array.from(new Set([...activeFollowing, targetUserId]));
        newTargetFollowers = Array.from(new Set([...targetFollowers, currentUserId]));
      }

      const updated = prevCreators.map(c => {
        if (c.id === currentUserId) {
          return {
            ...c,
            followingIds: newActiveFollowing,
            followingCount: newActiveFollowing.length
          };
        }
        if (c.id === targetUserId) {
          return {
            ...c,
            followerIds: newTargetFollowers,
            followersCount: newTargetFollowers.length,
            isFollowing: !isCurrentlyFollowing
          };
        }
        return c;
      });

      dataService.saveCreators(updated);
      return updated;
    });
  };

  const handleToggleCircleCreator = (id: string) => {
    handleToggleFollowCreator(id);
  };

  const handleSaveCommunityRecipe = (recipe: Recipe) => {
    const clone: Recipe = {
      ...recipe,
      id: `recipe-custom-${Date.now()}`,
      isCustom: true
    };
    setRecipes(prev => [clone, ...prev]);

    // Create social feed log
    const newPost: FeedPost = {
      id: `post-save-${Date.now()}`,
      type: 'project_created',
      userId: currentUser?.id || 'user-current',
      userName: currentUser?.name || 'Creator',
      userAvatar: currentUser?.avatarUrl || '',
      timeString: 'Just now',
      title: `Saved Blueprint: "${recipe.title}"`,
      content: `Just added ${recipe.authorName}'s blueprint to my personal Process Library! Preparing to start it soon.`,
      attachedId: clone.id,
      attachedName: clone.title,
      privacy: 'public',
      gongs: { continue: 0, refine: 0, reconsider: 0 }
    };
    setPosts(prev => [newPost, ...prev]);
  };

  const handleForkCommunityRecipe = (recipe: Recipe) => {
    setShowSearchModal(false);
    handleInstantiateRecipe(recipe);
  };

  // Gong voting calculation for Social Feed
  const handleUpdatePostGong = (postId: string, voteType: 'continue' | 'refine' | 'reconsider') => {
    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id !== postId) return p;

      const currentVote = p.gongs.userVoted;
      const updatedGongs = { ...p.gongs };

      // Deduct previous vote if any
      if (currentVote) {
        updatedGongs[currentVote] = Math.max(0, updatedGongs[currentVote] - 1);
      }

      // If user is clicking the same option, they are toggling/removing it
      if (currentVote === voteType) {
        updatedGongs.userVoted = undefined;
      } else {
        updatedGongs[voteType] += 1;
        updatedGongs.userVoted = voteType;
      }

      return { ...p, gongs: updatedGongs };
    }));
  };

  const handleAddComment = (postId: string, commentContent: string, parentId?: string, replyToUser?: string) => {
    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id !== postId) return p;
      const currentComments = p.comments || [];
      const newComment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        userId: currentUser?.id || 'user-current',
        userName: currentUser?.name || 'Creator',
        userAvatar: currentUser?.avatarUrl || '',
        content: commentContent,
        timeString: 'Just now',
        likes: 0,
        userLiked: false,
        parentId,
        replyToUser
      };
      return {
        ...p,
        comments: [...currentComments, newComment]
      };
    }));
  };

  const handleToggleCommentHeart = (postId: string, commentId: string) => {
    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id !== postId) return p;
      const currentComments = p.comments || [];
      const updatedComments = currentComments.map(c => {
        if (c.id !== commentId) return c;
        const willLike = !c.userLiked;
        const currentLikes = c.likes || 0;
        return {
          ...c,
          userLiked: willLike,
          likes: willLike ? currentLikes + 1 : Math.max(0, currentLikes - 1)
        };
      });
      return {
        ...p,
        comments: updatedComments
      };
    }));
  };

  // Collection Sand Mode controller update
  const handleUpdateCollectionMode = (id: string, mode: 'sequential' | 'parallel' | 'hybrid') => {
    setCollections(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, workMode: mode };
      }
      return c;
    }));
  };

  const handleUpdateCollectionBudget = (id: string, hours: number) => {
    setCollections(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, budgetedHours: hours };
      }
      return c;
    }));
  };

  const handleAddRecipe = async (r: Recipe) => {
    setRecipes(prev => {
      const exists = prev.some(item => item.id === r.id);
      if (exists) return prev.map(item => item.id === r.id ? r : item);
      return [r, ...prev];
    });
    setSavedRecipeIds(prev => {
      if (prev.includes(r.id)) return prev;
      const next = [...prev, r.id];
      try {
        localStorage.setItem('gonnng_recipe_bookmarks', JSON.stringify(next));
      } catch {}
      return next;
    });
    await dataService.saveRecipe(r, currentUser?.id);
  };

  const handleUpdateRecipe = async (updatedR: Recipe) => {
    setRecipes(prev => {
      const exists = prev.some(r => r.id === updatedR.id);
      if (exists) return prev.map(r => r.id === updatedR.id ? updatedR : r);
      return [updatedR, ...prev];
    });
    await dataService.saveRecipe(updatedR, currentUser?.id);
  };

  const handleAddProject = async (p: Project) => {
    setProjects(prev => {
      const exists = prev.some(item => item.id === p.id);
      if (exists) return prev.map(item => item.id === p.id ? p : item);
      return [p, ...prev];
    });
    setSelectedProjectId(p.id);
    await dataService.updateProject(p, currentUser?.id);
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    setProjects(prev => {
      const exists = prev.some(p => p.id === updatedProject.id);
      if (exists) {
        return prev.map(p => p.id === updatedProject.id ? updatedProject : p);
      }
      return [updatedProject, ...prev];
    });
    await dataService.updateProject(updatedProject, currentUser?.id);
  };

  const handleUpdateCollection = (updatedCol: Collection) => {
    setCollections(prev => prev.map(c => c.id === updatedCol.id ? updatedCol : c));
  };

  const handleMarkProjectComplete = (projectId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          isCompleted: true,
          completedAt: p.completedAt || new Date().toISOString()
        };
      }
      return p;
    }));
  };

  // Instantiate standard Recipe into new active Project
  const handleInstantiateRecipe = (recipe: Recipe) => {
    const mappedPhases = recipe.phases.map((ph, phIdx) => ({
      id: `phase-${phIdx}-${Date.now()}`,
      title: ph.title,
      tasks: ph.tasks.map((t, tIdx) => ({
        id: `task-${phIdx}-${tIdx}-${Date.now()}`,
        title: t.title,
        completed: false,
        estimatedHours: t.estimatedHours || 1
      }))
    }));

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      title: `My ${recipe.title}`,
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      phases: mappedPhases,
      createdAt: new Date().toISOString(),
      privacy: currentUser?.privacyDefault || 'public',
      progressPhotos: []
    };

    setProjects(prev => [...prev, newProject]);
    setSelectedProjectId(newProject.id);
    updateRoute('workspace', undefined, 'profile');

    // Create Feed Log
    const newPost: FeedPost = {
      id: `post-inst-${Date.now()}`,
      type: 'project_created',
      userId: currentUser?.id || 'user-current',
      userName: currentUser?.name || 'Creator',
      userAvatar: currentUser?.avatarUrl || '',
      timeString: 'Just now',
      title: `Started Project: "${newProject.title}"`,
      content: `Let's break down the creative parts of "${recipe.title}". Starting step 1 today!`,
      attachedId: newProject.id,
      attachedName: newProject.title,
      privacy: currentUser?.privacyDefault || 'public',
      gongs: { continue: 0, refine: 0, reconsider: 0 }
    };
    setPosts(prev => [newPost, ...prev]);
  };

  // Project checklist statistics
  const getProjectProgress = (proj: Project) => {
    const total = proj.phases.reduce((sum, ph) => sum + ph.tasks.length, 0);
    const completed = proj.phases.reduce((sum, ph) => sum + ph.tasks.filter(t => t.completed).length, 0);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  // Website View Render
  if (viewMode === 'website') {
    return (
      <div className="min-h-screen bg-[#F3F4F6] text-gray-900 font-sans flex flex-col antialiased overflow-x-hidden w-full">
        <WebsiteHeader 
          currentTab={websiteTab} 
          onNavigate={handleNavigateWebsite} 
          currentUser={authSession} 
          onLogout={handleLogout}
          onOpenWorkspace={handleOpenWorkspace}
        />
        
        <main className="flex-1">
          {websiteTab === 'home' && (
            <HomePage onNavigate={handleNavigateWebsite} onOpenWorkspace={handleOpenWorkspace} recipes={recipes} />
          )}
          {(websiteTab === 'features' || websiteTab === 'download') && (
            <DownloadPage onOpenWorkspace={handleOpenWorkspace} />
          )}
          {websiteTab === 'support' && (
            <SupportPage />
          )}
          {websiteTab === 'privacy' && (
            <PrivacyPage onOpenCookiePreferences={handleOpenCookieModal} />
          )}
          {websiteTab === 'terms' && (
            <TermsPage />
          )}
          {websiteTab === 'contact' && (
            <ContactPage />
          )}
          {(websiteTab === 'login' || websiteTab === 'register') && (
            authSession && !authSession.isOnboarded ? (
              <OnboardingWizard 
                user={authSession} 
                onComplete={() => {
                  const updated = { ...authSession, isOnboarded: true };
                  authService.completeOnboarding();
                  setAuthSession(updated);
                  setViewMode('workspace');
                  setShowTutorial(true);
                  localStorage.removeItem('gonnng_tutorial_done');
                }} 
              />
            ) : (
              <LoginPage 
                initialMode={websiteTab === 'register' ? 'register' : 'login'}
                onLoginSuccess={handleLoginSuccess} 
                onNavigate={handleNavigateWebsite} 
              />
            )
          )}
        </main>

        {/* Promotional & Application Cookie Infrastructure Components */}
        <CookieBanner
          isVisible={!hasAnsweredCookieConsent}
          attribution={cookieAttribution}
          onAcceptAll={handleAcceptAllCookies}
          onRejectOptional={handleRejectOptionalCookies}
          onManagePreferences={handleOpenCookieModal}
        />

        <CookiePreferencesModal
          isOpen={isCookieModalOpen}
          preferences={cookiePreferences}
          governanceItems={cookieGovernanceItems}
          onClose={handleCloseCookieModal}
          onSavePreferences={handleSaveCookiePreferences}
          onAcceptAll={handleAcceptAllCookies}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans flex flex-col antialiased pb-0 overflow-x-hidden w-full transition-colors duration-200 bg-[#F3F4F6] text-gray-900">
      
      {/* Dynamic Global Top Bar - Fixed top position with scroll shrink */}
      <header className="backdrop-blur-md fixed top-0 left-0 right-0 z-40 border-b shrink-0 transition-all duration-300 shadow-2xl bg-white/95 text-gray-900 border-gray-200 shadow-sm safe-area-header">
        
        {/* Mobile Global Header Progress Bar - Fills entire vertical space of header, no vertical sizing animation */}
        <div 
          className="md:hidden absolute inset-0 z-0 overflow-hidden pointer-events-none bg-gray-100/80"
          id="mobile-header-progress-bar-container" 
          title={`Active Projects: ${overallProgress}% Completed`}
        >
          <div 
            className={`h-full transition-all duration-500 opacity-20 ${
              overallProgress < 30 ? 'bg-red-500' : overallProgress < 60 ? 'bg-yellow-400' : overallProgress < 80 ? 'bg-orange-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${overallProgress}%` }}
            id="mobile-header-progress-bar-fill"
          />
        </div>

        <div className={`max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-12 flex items-center justify-between transition-all duration-300 relative z-10 ${
          isScrolled ? 'h-11 sm:h-12 py-1.5' : 'h-13 sm:h-15 py-2.5'
        }`}>
          
          {/* Logo Brand Area */}
          <div 
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              document.getElementById('profile-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
              const feedContainer = document.getElementById('feed-root')?.querySelector('.overflow-y-scroll');
              if (feedContainer) {
                feedContainer.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex items-center cursor-pointer group shrink-0"
            title="Get things done, and be noisy about it!"
          >
            {/* Mobile & Tablet Layout Logo (Gonnng G Icon) */}
            <div className="lg:hidden flex items-center justify-center cursor-pointer group-hover:scale-105 transition-transform">
              <GonnngGIcon className="w-8 h-8 text-black" />
            </div>

            {/* Desktop Layout Logo (Gonnng G Logo with text built-in) */}
            <div className="hidden lg:flex items-center justify-center cursor-pointer group-hover:scale-105 transition-transform">
              <GonnngGLogo className="h-[42px] w-[190px] -my-[4px] text-black" />
            </div>
          </div>


          {/* Mobile Center View Title */}
          <div className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 text-center max-w-[180px] sm:max-w-[220px] truncate">
            <span className="font-mono font-bold text-xs uppercase tracking-wider text-gray-900">
              {getActiveViewTitle()}
            </span>
          </div>

          {/* Center Navigation tabs */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl shadow-inner md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-10 transition-colors bg-gray-200/80 border border-gray-300">
            <button
              id="nav-profile-tab"
              onClick={() => handleTabChange('profile')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'profile' && !showTutorial 
                  ? 'bg-[#F59E0B] text-black font-black border border-[#F59E0B] shadow-[0_0_14px_rgba(245,158,11,0.35)]' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300/60 border border-transparent'
              }`}
            >
              {currentUser?.avatarUrl && currentUser.avatarUrl.trim() !== '' ? (
                <img 
                  src={getPublicMediaUrl('Gonnng', currentUser.avatarUrl.trim())} 
                  alt={currentUser.name || 'Profile'} 
                  className="w-4.5 h-4.5 rounded-full object-cover border border-white/30 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-4 h-4" />
              )}
              <span>Profile</span>
            </button>
            <button
              id="nav-coach-tab"
              onClick={() => handleTabChange('coach')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                (activeTab === 'coach' || activeTab === 'recipes') && !showTutorial 
                  ? 'bg-[#F59E0B] text-black font-black border border-[#F59E0B] shadow-[0_0_14px_rgba(245,158,11,0.35)]' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300/60 border border-transparent'
              }`}
            >
              <FileSliders className="w-4 h-4" /> Process
            </button>

            {/* Centered plus action button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-1.5 mx-1 bg-[#F59E0B] hover:bg-[#FF751A] text-black font-black rounded-full transition-all shadow-md flex items-center justify-center cursor-pointer shrink-0 hover:scale-110 active:scale-95"
              title="New Post"
            >
              <Plus className="w-4.5 h-4.5 font-black" />
            </button>

            <button
              id="nav-updates-tab"
              onClick={() => handleTabChange('updates')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
                activeTab === 'updates' && !showTutorial 
                  ? 'bg-[#F59E0B] text-black font-black border border-[#F59E0B] shadow-[0_0_14px_rgba(245,158,11,0.35)]' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300/60 border border-transparent'
              }`}
            >
              <Bell className="w-4 h-4" /> Updates
              {totalUnreadNotifications > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-[#F59E0B] text-black shadow-sm">
                  {totalUnreadNotifications}
                </span>
              )}
            </button>
            <button
              id="nav-social-tab"
              onClick={() => handleTabChange('social')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'social' && !showTutorial 
                  ? 'bg-[#F59E0B] text-black font-black border border-[#F59E0B] shadow-[0_0_14px_rgba(245,158,11,0.35)]' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300/60 border border-transparent'
              }`}
            >
              <CircleDotDashed className="w-4 h-4" /> Circle
            </button>
          </nav>

          {/* Action Area on the Right */}
          <div className="flex items-center gap-2 sm:gap-3">
            {(activeTab === 'coach' || activeTab === 'recipes') && processTab === 'projects' && (
              <button
                type="button"
                id="header-new-project-btn"
                onClick={handleOpenNewBlankProjectModal}
                className="p-1.5 sm:p-2 text-black transition-all flex items-center justify-center cursor-pointer hover:opacity-75 hover:scale-110 active:scale-95 rounded-xl border border-transparent hover:bg-gray-200/60"
                title="New Project"
              >
                <BookPlus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              </button>
            )}

            {(activeTab === 'coach' || activeTab === 'recipes') && processTab === 'library' && (
              <button
                type="button"
                id="header-library-search-btn"
                onClick={() => handleOpenSearchModal(true, 'Recipes')}
                className="p-1.5 sm:p-2 text-black transition-all flex items-center justify-center cursor-pointer hover:opacity-75 hover:scale-110 active:scale-95 rounded-xl border border-transparent hover:bg-gray-200/60"
                title="Search Recipes"
              >
                <Search className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              </button>
            )}

            {activeTab === 'profile' && (
              <button
                type="button"
                id="header-profile-menu-btn"
                onClick={() => {
                  setIsProfileSettingsOpen(prev => !prev);
                }}
                className="p-1.5 sm:p-2 text-black transition-all flex items-center justify-center cursor-pointer hover:opacity-75 hover:scale-110 active:scale-95"
                title="Profile Settings"
              >
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              </button>
            )}

            {activeTab === 'social' && (
              <button
                type="button"
                id="circle-search-btn"
                onClick={() => handleOpenSearchModal(true, 'Users')}
                className="p-1.5 sm:p-2 text-black transition-all flex items-center justify-center cursor-pointer hover:opacity-75 hover:scale-110 active:scale-95"
                title="Search Circle"
              >
                <Search className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              </button>
            )}
          </div>

        </div>

        {/* Desktop Global Header Progress Bar - Shrinks on scroll */}
        <div 
          className={`hidden md:block w-full relative overflow-hidden transition-all duration-300 bg-gray-200 ${
            isScrolled ? 'h-1.5' : 'h-4'
          }`}
          id="header-progress-bar-container" 
          title={`Active Projects: ${overallProgress}% Completed`}
        >
          <div 
            className={`h-full transition-all duration-500 ${
              overallProgress < 30 ? 'bg-red-500' : overallProgress < 60 ? 'bg-yellow-400' : overallProgress < 80 ? 'bg-orange-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${overallProgress}%` }}
            id="header-progress-bar-fill"
          />
        </div>
      </header>

      {/* Fixed Mobile Navigation Bar at the Bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 py-2 px-3 safe-area-bottom-nav flex justify-around items-center z-50 shadow-2xl transition-colors border-t bg-white/95 backdrop-blur-md border-gray-200 text-gray-900">
        <button 
          id="mobile-nav-profile-tab"
          onClick={() => handleTabChange('profile')}
          className={`relative flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl text-[9px] font-bold transition-all cursor-pointer ${
            activeTab === 'profile' && !showTutorial 
              ? 'text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {activeTab === 'profile' && !showTutorial && (
            <span className="absolute -top-1 w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]" />
          )}
          {currentUser?.avatarUrl && currentUser.avatarUrl.trim() !== '' ? (
            <img 
              src={getPublicMediaUrl('Gonnng', currentUser.avatarUrl.trim())} 
              alt={currentUser.name || 'Profile'} 
              className="w-4.5 h-4.5 rounded-full object-cover border border-white/30 shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <User className="w-4.5 h-4.5" />
          )}
          <span>Profile</span>
        </button>
        <button 
          id="mobile-nav-process-tab"
          onClick={() => handleTabChange('coach')}
          className={`relative flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl text-[9px] font-bold transition-all cursor-pointer ${
            (activeTab === 'coach' || activeTab === 'recipes') && !showTutorial 
              ? 'text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {(activeTab === 'coach' || activeTab === 'recipes') && !showTutorial && (
            <span className="absolute -top-1 w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]" />
          )}
          <FileSliders className="w-4.5 h-4.5" /> Process
        </button>

        {/* Centered circle plus button */}
        <button 
          id="mobile-nav-create-btn"
          onClick={() => setShowCreateModal(true)}
          className="w-11 h-11 rounded-full bg-[#F59E0B] text-black flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer hover:scale-105"
          title="New Post"
        >
          <Plus className="w-5.5 h-5.5 font-black" />
        </button>

        <button 
          id="mobile-nav-updates-tab"
          onClick={() => handleTabChange('updates')}
          className={`relative flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl text-[9px] font-bold transition-all cursor-pointer ${
            activeTab === 'updates' && !showTutorial 
              ? 'text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {totalUnreadNotifications > 0 ? (
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 min-w-[18px] h-4 px-1 rounded-full text-[9px] font-mono font-black bg-[#F59E0B] text-black flex items-center justify-center shadow-md z-10">
              {totalUnreadNotifications}
            </span>
          ) : (
            activeTab === 'updates' && !showTutorial && (
              <span className="absolute -top-1 w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]" />
            )
          )}
          <Bell className="w-4.5 h-4.5" /> Updates
        </button>
        <button 
          id="mobile-nav-social-tab"
          onClick={() => handleTabChange('social')}
          className={`relative flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl text-[9px] font-bold transition-all cursor-pointer ${
            activeTab === 'social' && !showTutorial 
              ? 'text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {activeTab === 'social' && !showTutorial && (
            <span className="absolute -top-1 w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]" />
          )}
          <CircleDotDashed className="w-4.5 h-4.5" /> Circle
        </button>
      </div>

      {/* Main Container Workspace */}
      <main className={`flex-1 max-w-7xl mx-auto w-full min-w-0 px-0 transition-all duration-300 md:pb-8 ${
        isScrolled 
          ? 'safe-area-main-scrolled sm:pt-[48px] md:pt-[52px]' 
          : 'safe-area-main-normal sm:pt-[72px] md:pt-[72px]'
      }`}>
        
        {/* Force Guided Tutorial screen or selected tab view */}
        {showTutorial ? (
          <Onboarding 
            onCompleteTutorial={() => {
              setShowTutorial(false);
              localStorage.setItem('gonnng_tutorial_done', 'true');
              updateRoute('workspace', undefined, 'profile');
            }} 
          />
        ) : (
          <AnimatePresence mode="wait">
            


            {/* Sand Engine View (Includes PROJECTS, FOCUS, and LIBRARY) */}
            {(activeTab === 'coach' || activeTab === 'recipes') && (
              <motion.div
                key="sand-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <SandEngine 
                  collections={collections}
                  sessionProjects={projects}
                  onUpdateCollectionMode={handleUpdateCollectionMode}
                  onUpdateCollectionBudget={handleUpdateCollectionBudget}
                  onUpdateProject={handleUpdateProject}
                  onUpdateCollection={handleUpdateCollection}
                  onMarkProjectComplete={handleMarkProjectComplete}
                  selectedProjectId={selectedProjectId}
                  setSelectedProjectId={handleSelectProject}
                  getProjectProgress={getProjectProgress}
                  handleDeleteProject={handleDeleteProject}
                  onDeleteCollection={handleDeleteCollection}
                  handleToggleTask={handleToggleTask}
                  setShowCreateModal={setShowCreateModal}
                  activeProject={activeProject}
                  recipes={recipes}
                  onAddRecipe={handleAddRecipe}
                  onUpdateRecipe={handleUpdateRecipe}
                  savedRecipeIds={savedRecipeIds}
                  onToggleSaveRecipe={handleToggleSaveRecipe}
                  initialTab={activeTab === 'recipes' ? 'library' : (processTab || 'projects')}
                  onTabChange={handleProcessTabChange}
                  currentUser={currentUser}
                  setShowSearchModal={handleOpenSearchModal}
                  setEditingRecipe={setEditingRecipe}
                  setForkInitialData={setForkInitialData}
                  handleInstantiateRecipe={handleInstantiateRecipe}
                  onOpenCreatorProfile={handleOpenCreatorProfile}
                />
              </motion.div>
            )}

            {/* Updates View */}
            {activeTab === 'updates' && (
              <motion.div
                key="updates-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <UpdatesView 
                  currentUser={currentUser}
                  creators={creators}
                  posts={posts}
                  onFollowToggle={handleToggleFollowCreator}
                  messageThreads={messageThreads}
                  onSendMessage={handleSendMessage}
                  onSelectPost={handleSelectPost}
                  onSelectRecipe={handleSelectRecipe}
                  onSelectUser={handleSelectUser}
                  activeCategory={updatesCategory}
                  setActiveCategory={handleUpdatesCategoryChange}
                  activeChatUser={updatesChatUser}
                  setActiveChatUser={handleUpdatesChatUserChange}
                  onMarkThreadAsRead={handleMarkThreadAsRead}
                  onNotificationRead={() => setUnreadNotifsCount(prev => Math.max(0, prev - 1))}
                  onUnreadNotifsCountChange={setUnreadNotifsCount}
                />
              </motion.div>
            )}

            {/* 4. Social Feed view */}
            {activeTab === 'social' && (
              <motion.div
                key={homeViewCreatorProfile ? `home-profile-${homeViewCreatorProfile.id}` : 'social-view'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {homeViewCreatorProfile ? (
                  <HomeCreatorProfileView
                    creator={homeViewCreatorProfile}
                    allCreators={creators}
                    posts={posts}
                    currentUserId={currentUser?.id || ''}
                    currentUser={currentUser}
                    onBackToHome={() => handleTabChange('social')}
                    onToggleFollow={handleToggleFollowCreator}
                    onUpdatePostGong={handleUpdatePostGong}
                    onAddComment={handleAddComment}
                    onToggleCommentHeart={handleToggleCommentHeart}
                    onOpenShareDrawer={(post) => {
                      setShareDrawerPost(post);
                      setIsShareDrawerOpen(true);
                    }}
                    onOpenCreatorProfile={handleOpenCreatorProfile}
                    onOpenMessageDrawer={handleOpenMessageDrawer}
                  />
                ) : (
                  <Feed 
                    posts={posts}
                    currentUserId={currentUser?.id || ''}
                    currentUser={currentUser}
                    creators={creators}
                    projects={projects}
                    recipes={recipes}
                    filter={feedFilter}
                    onUpdatePostGong={handleUpdatePostGong}
                    onAddComment={handleAddComment}
                    onToggleCommentHeart={handleToggleCommentHeart}
                    onToggleFollow={handleToggleFollowCreator}
                    onFeedScroll={(scrolled) => setIsScrolled(scrolled)}
                    onOpenCreatorProfile={handleOpenCreatorProfile}
                    superimposedPostId={homeSuperimposedPostId}
                    autoOpenCommentsPostId={autoOpenCommentsPostId}
                    onClearSuperimposedPost={() => {
                      setHomeSuperimposedPostId(null);
                      setAutoOpenCommentsPostId(null);
                    }}
                    onOpenShareDrawer={(post) => {
                      setShareDrawerPost(post);
                      setIsShareDrawerOpen(true);
                    }}
                    onOpenPostModal={(post) => {
                      if (post) {
                        setHomeSuperimposedPostId(post.id);
                        updateRoute('workspace', undefined, activeTab, { postId: post.id });
                      } else {
                        setHomeSuperimposedPostId(null);
                        updateRoute('workspace', undefined, activeTab, { postId: null });
                      }
                    }}
                  />
                )}
              </motion.div>
            )}

            {/* 5. Account Profile view */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <UserProfile 
                  currentUser={currentUser}
                  onUpdateUser={handleUpdateUser}
                  allCreators={creators}
                  onToggleFollowCreator={handleToggleFollowCreator}
                  onToggleCircleCreator={handleToggleCircleCreator}
                  onOpenPhilosophy={() => setShowPhilosophyModal(true)}
                  onOpenCreatorProfile={handleOpenCreatorProfile}
                  onSignOut={handleLogout}
                  onOpenCookiePreferences={handleOpenCookieModal}
                  permissions={permissions}
                  onUpdatePermissions={handleUpdatePermissions}
                  isSettingsDrawerOpen={isProfileSettingsOpen}
                  setIsSettingsDrawerOpen={setIsProfileSettingsOpen}
                  posts={posts}
                  onUpdatePostGong={handleUpdatePostGong}
                  onAddComment={handleAddComment}
                  onToggleCommentHeart={handleToggleCommentHeart}
                  setShowTutorial={setShowTutorial}
                  superimposedPost={(() => {
                    if (!profileSuperimposedPostId) return null;
                    const direct = posts.find(p => p.id === profileSuperimposedPostId);
                    if (direct) return direct;
                    const fuzzy = posts.find(p => p.id.includes(profileSuperimposedPostId) || profileSuperimposedPostId.includes(p.id));
                    if (fuzzy) return fuzzy;
                    return posts[0] || null;
                  })()}
                  autoOpenCommentsPostId={autoOpenCommentsPostId}
                  onClearSuperimposedPost={() => {
                    setProfileSuperimposedPostId(null);
                    setAutoOpenCommentsPostId(null);
                  }}
                  onOpenShareDrawer={(post) => {
                    setShareDrawerPost(post);
                    setIsShareDrawerOpen(true);
                  }}
                  projects={projects}
                  recipes={recipes}
                  onStartProject={handleOpenNewBlankProjectModal}
                  onCreateRecipe={handleOpenCreateRecipeModal}
                />
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </main>

      {/* Device Permissions Initial Prompt Modal (Logged in workspace mode only) */}
      <PermissionsPromptModal
        isOpen={showPermissionsPromptModal && Boolean(currentUser?.id) && viewMode === 'workspace'}
        currentPermissions={permissions}
        onClose={() => {
          localStorage.setItem('gonnng_permissions_prompted', 'true');
          setShowPermissionsPromptModal(false);
        }}
        onSavePermissions={handleCustomPermissions}
      />

      {/* Blank Project Explore Modal in Edit Mode */}
      {editingBlankProject && (
        <ProjectExploreModal
          project={editingBlankProject}
          isOpen={Boolean(editingBlankProject)}
          initialEditMode={true}
          currentUser={currentUser}
          onClose={() => setEditingBlankProject(null)}
          onAddRecipe={handleAddRecipe}
          onUpdateProject={(updated) => {
            handleUpdateProject(updated);
            setSelectedProjectId(updated.id);
            setProcessTab('projects');
            setEditingBlankProject(null);
          }}
          onDeleteProject={(id) => {
            handleDeleteProject(id);
            setEditingBlankProject(null);
          }}
        />
      )}

      {/* Recipe Explore Modal in Edit Mode (from Profile / Empty States) */}
      {editingRecipeForExploreModal && (
        <RecipeExploreModal
          recipe={editingRecipeForExploreModal}
          isOpen={Boolean(editingRecipeForExploreModal)}
          onClose={() => setEditingRecipeForExploreModal(null)}
          onUpdateRecipe={async (updated) => {
            await handleUpdateRecipe(updated);
            setEditingRecipeForExploreModal(null);
          }}
          currentUser={currentUser}
          initialEditMode={true}
        />
      )}

      {/* CreationStation Modular Modal Overlay */}
      {showCreateModal && (
        <CreateHub 
          onClose={() => {
            setShowCreateModal(false);
            setForkInitialData(null);
            setEditingRecipe(null);
          }}
          recipes={recipes}
          collections={collections}
          projects={projects}
          currentUser={currentUser}
          privacyDefault={currentUser?.privacyDefault || 'public'}
          permissions={permissions}
          onNavigateToPermissions={handleNavigateToPermissions}
          onUpdatePermissions={handleUpdatePermissions}
          onRequestDevicePermissions={handleRequestDevicePermissions}
          onAddRecipe={handleAddRecipe}
          onUpdateRecipe={handleUpdateRecipe}
          onAddProject={handleAddProject}
          onAddCollection={(col) => {
            setCollections(prev => [col, ...prev]);
          }}
          onUpdateProject={handleUpdateProject}
          onAddPost={async (post) => {
            setPosts(prev => [post, ...prev]);
            try {
              await dataService.addPost(post);
              const freshPosts = await dataService.getPosts();
              if (freshPosts && freshPosts.length > 0) {
                setPosts(freshPosts);
              }
            } catch (err) {
              console.error('Failed to persist post to Supabase database/storage:', err);
            }
          }}
          forkInitialData={forkInitialData}
          editingRecipe={editingRecipe}
        />
      )}

      {/* Search recipes modal */}
      {showSearchModal && (
        <SearchRecipesModal
          initialCategory={searchModalInitialCategory}
          onClose={() => setShowSearchModal(false)}
          recipes={recipes}
          creators={creators}
          communityRecipes={recipes}
          posts={posts}
          projects={projects}
          savedRecipeIds={savedRecipeIds}
          currentUser={currentUser}
          onSaveRecipe={handleSaveCommunityRecipe}
          onForkRecipe={handleForkCommunityRecipe}
          onToggleSaveRecipe={handleToggleSaveRecipe}
          onToggleFollowCreator={handleToggleFollowCreator}
          onToggleCircleCreator={handleToggleCircleCreator}
          onOpenCreatorProfile={handleOpenCreatorProfile}
          onSelectProject={(project) => {
            handleSelectProject(project.id);
            setShowSearchModal(false);
          }}
          onEditProject={(project) => {
            handleSelectProject(project.id);
            setShowSearchModal(false);
          }}
          onDeleteProject={(projectId) => {
            handleDeleteProject(projectId);
          }}
        />
      )}

      {/* Gonnng Feedback Philosophy Manual Modal */}
      {showPhilosophyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-gray-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-none sm:rounded-3xl p-6 md:p-8 max-w-none sm:max-w-xl w-full h-full sm:h-auto max-h-full sm:max-h-[90vh] overflow-y-auto border shadow-2xl space-y-6 bg-white border-gray-200 text-gray-900 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="bg-[#F59E0B]/15 text-[#F59E0B] font-mono text-[9px] uppercase px-2 py-0.5 rounded font-bold tracking-wider">
                  Brand Mantra — Keep Gonnng.
                </span>
                <h3 className="text-xl font-display font-black text-gray-900 mt-1.5 uppercase tracking-tight">
                  Your Ideas Deserve To Get Done
                </h3>
              </div>
                <IconOnlySubButton
                  icon={X}
                  onClick={() => {
                    setShowPhilosophyModal(false);
                    localStorage.setItem('gonnng_philosophy_seen', 'true');
                  }}
                  title="Close"
                />
            </div>

            <div className="text-xs text-gray-600 leading-relaxed space-y-3 font-sans">
              <p className="text-sm font-bold text-gray-900 italic">
                "Progress over perfection. Make. Improve. Finish."
              </p>
              <p>
                Gonnng is a <strong className="text-gray-900 font-semibold">process journal for creative work.</strong> Instead of only showcasing finished projects, Gonnng is here to help you document and organize ideas while you develop and improve your process. And most of all, get them done.
              </p>
              <p>
              Visibility starts with your Circle which is made up of Followers that Follow you back. Insead of sharing your work with the world, share with people you know will give insight and push you to give out your best. Your circle becomes a rich, digital network of creatives you trust.
                Ideas become skills. Skills become craftsmanship. Craftsmanship becomes confidence. And confidence will help you make sure your ideas come to life.
              </p>
              <p className="text-gray-800 font-medium">
                Every post, every update, is a chance for your Circle to give feedback and encouragement, not just empty applause:
              </p>
            </div>

            <div className="grid gap-3.5 pt-1">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-start gap-3">
                <span className="text-xl shrink-0" role="img" aria-label="perfect">
                  <Disc3 className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                </span>
                <div>
                  <h4 className="text-xs font-mono font-black uppercase text-emerald-800">Perfect</h4>
                  <p className="text-[11px] text-emerald-900/80 leading-normal mt-0.5 font-medium">
                    <b>You've got it!</b> Cheer ons current step or technique is dialed in.
                  </p>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 p-3.5 rounded-2xl flex items-start gap-3">
                <span className="text-xl shrink-0" role="img" aria-label="potential">
                  <Pencil className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                </span>
                <div>
                  <h4 className="text-xs font-mono font-black uppercase text-[#F59E0B]">Potential</h4>
                  <p className="text-[11px] text-orange-950/80 leading-normal mt-0.5 font-medium">
                    Keep Going! You're on to something, stay after it.
                  </p>
                </div>
              </div>

              <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex items-start gap-3">
                <span className="text-xl shrink-0" role="img" aria-label="promise">
                  <Octagon className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                </span>
                <div>
                  <h4 className="text-xs font-mono font-black uppercase text-rose-700">Promise</h4>
                  <p className="text-[11px] text-rose-950/80 leading-normal mt-0.5 font-medium">
                    Try something new. Head back to the drawing board for a fresh angle.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setShowPhilosophyModal(false);
                  localStorage.setItem('gonnng_philosophy_seen', 'true');
                }}
                className="w-full py-3 bg-[#F59E0B] hover:bg-[#FF751A] text-black font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer tracking-wider uppercase"
              >
                Acknowledge & Sync Blueprint
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Complete Project Celebration Modal */}
      {congratulateProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-gray-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-none sm:rounded-3xl p-6 sm:p-8 max-w-none sm:max-w-md w-full h-full sm:h-auto max-h-full sm:max-h-[85vh] overflow-y-auto text-center space-y-6 shadow-2xl border bg-white border-gray-200 text-gray-900 flex flex-col justify-between"
          >
            <div className="inline-flex w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 items-center justify-center text-3xl mx-auto">
              🏆
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-display font-bold text-gray-900">Gonnng! Finished.</h3>
              <p className="text-xs font-mono text-emerald-600 uppercase font-bold tracking-wider">
                Accountability Loop Complete
              </p>
              <h4 className="text-base font-bold text-emerald-600 font-mono pt-2">"{congratulateProject}"</h4>
              <p className="text-xs text-gray-600 leading-relaxed pt-1.5">
                You checked off every phase, stayed aligned to your core goals, and successfully finished what you started. The whole is indeed a sum of its parts!
              </p>
            </div>
            
            <button
              onClick={() => setCongratulateProject(null)}
              className="w-full py-3 bg-[#F59E0B] hover:bg-[#FF751A] text-black font-black text-xs rounded-xl shadow transition-all cursor-pointer"
            >
              Exquisite. Proceed
            </button>
          </motion.div>
        </div>
      )}

      {/* Recipe Modal Overlay (Process View Permalinks) */}
      {selectedRecipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-gray-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full h-full sm:h-auto max-w-none sm:max-w-2xl max-h-full sm:max-h-[90vh] rounded-none sm:rounded-3xl p-5 sm:p-7 flex flex-col justify-between shadow-2xl border bg-white border-gray-200 text-gray-900 overflow-y-auto"
          >
            <div className="flex justify-between items-start pb-4 border-b border-gray-200">
              <div className="space-y-1 min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <span className="bg-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border border-[#F59E0B]/30">
                    {selectedRecipeModal.category}
                  </span>
                  <span className="text-xs font-mono text-gray-500">
                    by {selectedRecipeModal.authorName}
                  </span>
                  {selectedRecipeModal.forkedFrom && (
                    <span className="text-[10px] font-mono text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-flex items-center gap-1">
                      <GitFork className="w-3 h-3" /> Forked from {selectedRecipeModal.forkedFrom}
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-bold leading-tight">
                  {selectedRecipeModal.title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  {selectedRecipeModal.description}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseRecipeModal}
                className="p-2 rounded-full transition-colors cursor-pointer shrink-0 hover:bg-gray-100 text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F59E0B] flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Recipe Phases & Blueprint Tasks
              </h3>
              {selectedRecipeModal.phases && selectedRecipeModal.phases.map((ph, pIdx) => (
                <div 
                  key={`app-recipe-modal-phase-${ph.id || pIdx}-${pIdx}`} 
                  className="p-3.5 rounded-2xl border space-y-2 bg-gray-50 border-gray-200"
                >
                  <h4 className="text-xs font-mono font-bold uppercase text-[#F59E0B]">
                    Phase {pIdx + 1}: {ph.title}
                  </h4>
                  <div className="space-y-1.5 pl-2">
                    {ph.tasks.map((t, tIdx) => (
                      <div key={`app-recipe-modal-task-${t.id || tIdx}-${pIdx}-${tIdx}`} className="flex items-center gap-2 text-xs opacity-80">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                        <span>{t.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-2.5 border-gray-200">
              <button
                type="button"
                onClick={() => {
                  const permalink = `${window.location.origin}/recipe/${encodeURIComponent(selectedRecipeModal.publicId || selectedRecipeModal.id)}`;
                  navigator.clipboard.writeText(permalink);
                  setRecipeModalCopied(true);
                  setTimeout(() => setRecipeModalCopied(false), 2000);
                }}
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                title="Copy shareable permalink"
              >
                {recipeModalCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                <span>{recipeModalCopied ? 'LINK COPIED' : 'COPY PERMALINK'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const rec = selectedRecipeModal;
                  handleCloseRecipeModal();
                  if (rec) handleInstantiateRecipe(rec);
                }}
                className="px-4 py-2.5 bg-[#F59E0B] hover:bg-[#FF751A] text-black font-bold text-xs rounded-xl transition-all cursor-pointer shadow flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Instantiate as Project
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Creator Profile Overlay Modal */}
      {viewedCreator && (
        <CreatorProfileModal 
          creator={viewedCreator}
          onClose={() => setViewedCreatorId(null)}
          onToggleFollow={handleToggleFollowCreator}
          posts={posts}
          currentUserId={currentUser?.id || ''}
          onOpenMessageDrawer={handleOpenMessageDrawer}
        />
      )}

      {/* Share Drawer Modal */}
      <ShareDrawer
        post={shareDrawerPost}
        isOpen={isShareDrawerOpen}
        onClose={() => setIsShareDrawerOpen(false)}
        isSignedIn={!!authSession}
        followingUsers={creators.filter(c => c.isFollowing || c.isInCircle || true)}
        onSendMessage={handleSendMessage}
        onOpenAuth={() => {
          updateRoute('website', 'login');
        }}
        onOpenMessageDrawer={handleOpenMessageDrawer}
      />

      {/* Message Drawer Modal */}
      <MessageDrawer
        isOpen={isMessageDrawerOpen}
        onClose={() => {
          setIsMessageDrawerOpen(false);
          setMessageDrawerPartner(null);
          setMessageDrawerInitialItem(undefined);
        }}
        partnerUser={messageDrawerPartner}
        currentUser={currentUser}
        allCreators={creators}
        posts={posts}
        onSelectPost={handleSelectPost}
        onSelectUser={handleOpenCreatorProfile}
        initialSharedItem={messageDrawerInitialItem}
      />

      {/* Selected Post Modal (For Updates View & Notification Clicks) */}
      <PostDetailModal
        isOpen={!!selectedPostModal}
        post={selectedPostModal}
        onClose={() => {
          setSelectedPostModal(null);
          setAutoOpenCommentsPostId(null);
        }}
        currentUser={currentUser}
        allCreators={creators}
        onUpdatePostGong={handleUpdatePostGong}
        onAddComment={handleAddComment}
        onToggleCommentHeart={handleToggleCommentHeart}
        onOpenShareDrawer={(p) => {
          setShareDrawerPost(p);
          setIsShareDrawerOpen(true);
        }}
        onOpenCreatorProfile={handleOpenCreatorProfile}
        onOpenRecipeModal={(rId) => {
          const foundRec = recipes.find(r => r.id === rId || r.title === rId);
          if (foundRec) setSelectedRecipeModal(foundRec);
        }}
        autoOpenComments={autoOpenCommentsPostId === selectedPostModal?.id}
      />

      {/* Global Cookie Infrastructure Components */}
      <CookieBanner
        isVisible={!hasAnsweredCookieConsent}
        attribution={cookieAttribution}
        onAcceptAll={handleAcceptAllCookies}
        onRejectOptional={handleRejectOptionalCookies}
        onManagePreferences={handleOpenCookieModal}
      />

      <CookiePreferencesModal
        isOpen={isCookieModalOpen}
        preferences={cookiePreferences}
        governanceItems={cookieGovernanceItems}
        onClose={handleCloseCookieModal}
        onSavePreferences={handleSaveCookiePreferences}
        onAcceptAll={handleAcceptAllCookies}
      />
    </div>
  );
}
