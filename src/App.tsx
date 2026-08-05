import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Layers, 
  BookOpen, 
  Hourglass, 
  Users, 
  User, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Award, 
  Clock, 
  Calendar, 
  Maximize2, 
  Sliders,
  ChevronRight,
  Sparkles,
  Search,
  GitFork,
  Menu,
  Home,
  CircleDotDashed,
  Edit2,
  X
} from 'lucide-react';

import { Recipe, Project, Collection, Creator, FeedPost, Task, Phase } from './types';
import { GonnngGIcon, GonnngGLogo } from './components/GonnngLogo';
import { dataService } from './services/dataService';
import { uploadService, getPublicMediaUrl } from './services/uploadService';
import { permissionService } from './services/permissionService';
import { authService, isAuthFeatureEnabled, UserSession } from './services/authService';
import { hydrateCreators } from './utils/followUtils';

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
import HomeCreatorProfileView from './components/HomeCreatorProfileView';
import PermissionsPromptModal from './components/PermissionsPromptModal';

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

const DEFAULT_USER: Creator = {
  id: '4c0ab90e-6ec5-4a14-bb46-f10d4dc7bcb2',
  publicId: '4c0ab90e-6ec5-4a14-bb46-f10d4dc7bcb2',
  username: 'gyro_gearloose',
  name: 'Gyro Gearloose',
  email: 'test@gonnng.com',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
  bio: 'Process creator and workflow explorer.',
  goals: 'Executing clear process blueprints.',
  privacyDefault: 'public',
  followerIds: [],
  followingIds: [],
  followersCount: 0,
  followingCount: 0
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
    return [DEFAULT_USER];
  });

  const [currentUser, setCurrentUser] = useState<Creator>(() => {
    const saved = localStorage.getItem('gonnng_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          const followerIds = Array.isArray(parsed.followerIds) ? parsed.followerIds : [];
          const followingIds = Array.isArray(parsed.followingIds) ? parsed.followingIds : [];

          return {
            ...DEFAULT_USER,
            ...parsed,
            followerIds,
            followingIds,
            followersCount: followerIds.length,
            followingCount: followingIds.length
          };
        }
      } catch {}
    }
    return DEFAULT_USER;
  });

  // Routing logic helpers
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
  } => {
    const path = pathname.toLowerCase().replace(/\/$/, '') || '/';
    const parts = path.split('/').filter(Boolean);

    if (parts.length === 0) {
      return { viewMode: 'website', websiteTab: 'home', activeTab: 'profile' };
    }

    const root = parts[0];

    if (['download', 'support', 'contact', 'privacy', 'terms', 'login'].includes(root)) {
      return { viewMode: 'website', websiteTab: root, activeTab: 'profile' };
    }

    if (root === 'circle') {
      return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'social' };
    }

    if (root === 'p' || root === 'post' || root === 'project') {
      const postId = parts[1] || null;
      return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'social', postId };
    }

    if (root === 'recipe') {
      const recipeId = parts[1] || null;
      return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'recipes', processTab: 'library', recipeId };
    }

    if (root === 'updates') {
      const sub = parts[1];
      if (sub === 'notifications' || sub === 'activity') {
        return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'updates', updatesCategory: 'updates' };
      }
      if (sub === 'followers') {
        return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'updates', updatesCategory: 'followers' };
      }
      if (sub === 'system' || sub === 'appinfo' || sub === 'announcements') {
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
      if (sub === 'library') {
        return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'recipes', processTab: 'library' };
      }
      if (sub === 'recipe' && parts[2]) {
        return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'recipes', processTab: 'library', recipeId: parts[2] };
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
    }
  ): string => {
    if (mode === 'workspace') {
      if (subState?.postId) {
        return `/p/${subState.postId}`;
      }
      if (subState?.recipeId) {
        return `/recipe/${subState.recipeId}`;
      }
      if (subState?.viewedCreator) {
        const creatorObj = typeof subState.viewedCreator === 'object' ? subState.viewedCreator : null;
        const handle = creatorObj 
          ? (creatorObj.username || creatorObj.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || creatorObj.id)
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
          return '/process/projects';
        case 'recipes':
          return '/process/library';
        case 'social':
          return '/circle';
        case 'profile':
          return '/profile';
        default:
          return '/profile';
      }
    } else {
      switch (webTab) {
        case 'home': return '/';
        case 'download': return '/download';
        case 'support': return '/support';
        case 'contact': return '/contact';
        case 'privacy': return '/privacy';
        case 'terms': return '/terms';
        case 'login': return '/login';
        default: return '/';
      }
    }
  };

  const initialRoute = parsePath(window.location.pathname);

  // Local UI controller states
  const [viewMode, setViewMode] = useState<'website' | 'workspace'>(initialRoute.viewMode);
  const [websiteTab, setWebsiteTab] = useState<string>(initialRoute.websiteTab);
  const [authSession, setAuthSession] = useState<UserSession | null>(() => authService.getCurrentSession());

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

  // On mount: check server authentication session via gonnng_session cookie
  useEffect(() => {
    authService.checkServerSession().then((user) => {
      if (user) {
        setAuthSession(user);
      }
    });
  }, []);

  // Ensure currentUser state is synced when authSession or creators change
  useEffect(() => {
    const activeUserId = authSession?.id || currentUser.id || 'user-current';
    const activeEmail = authSession?.email;

    const matchingCreator = creators.find(
      c => c.id === activeUserId || (activeEmail && c.email?.toLowerCase() === activeEmail.toLowerCase())
    );

    if (matchingCreator) {
      setCurrentUser(prev => {
        const isDifferent =
          prev.id !== matchingCreator.id ||
          prev.followersCount !== matchingCreator.followersCount ||
          prev.followingCount !== matchingCreator.followingCount ||
          JSON.stringify(prev.followerIds) !== JSON.stringify(matchingCreator.followerIds) ||
          JSON.stringify(prev.followingIds) !== JSON.stringify(matchingCreator.followingIds);

        if (isDifferent) {
          return {
            ...matchingCreator,
            avatarUrl: authSession?.avatarUrl || matchingCreator.avatarUrl
          };
        }
        return prev;
      });
    } else if (authSession) {
      const newCreator: Creator = {
        id: authSession.id,
        publicId: authSession.publicId || Math.random().toString(36).substring(2, 11).toUpperCase(),
        username: authSession.username || authSession.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        name: authSession.name,
        email: authSession.email,
        avatarUrl: authSession.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        bio: 'Process creator and workflow explorer.',
        goals: 'Executing clear process blueprints.',
        privacyDefault: 'public',
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
      if (websiteTab === 'download') trackAnalyticsEvent('Download Page Visit');
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

  // Flow 1: Cold start / login permission check
  useEffect(() => {
    if (!currentUser?.id) return;

    permissionService.onLoginOrColdStart(currentUser.id).then(resMap => {
      const updated: AppPermissions = {
        camera: resMap.camera === 'granted',
        microphone: resMap.microphone === 'granted',
        files: resMap.file_access === 'granted'
      };
      setPermissions(updated);
      localStorage.setItem('gonnng_permissions', JSON.stringify(updated));
    }).catch(err => console.warn('Permission cold start sync error:', err));
  }, [currentUser?.id]);

  // Flow 2: Sync permissions on app foreground / resume
  useEffect(() => {
    if (!currentUser?.id) return;

    const syncForegroundPermissions = () => {
      if (document.visibilityState === 'visible') {
        permissionService.onForegroundSync(currentUser.id).then(resMap => {
          const updated: AppPermissions = {
            camera: resMap.camera === 'granted',
            microphone: resMap.microphone === 'granted',
            files: resMap.file_access === 'granted'
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
  };

  const handleCustomPermissions = (custom: AppPermissions) => {
    setPermissions(custom);
    localStorage.setItem('gonnng_permissions', JSON.stringify(custom));
    localStorage.setItem('gonnng_permissions_prompted', 'true');
    setShowPermissionsPromptModal(false);
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
    },
    push: boolean = true
  ) => {
    const targetViewMode = newViewMode ?? viewMode;
    const targetWebsiteTab = newWebsiteTab ?? websiteTab;
    const targetActiveTab = newActiveTab ?? activeTab;

    setViewMode(targetViewMode);
    if (newWebsiteTab !== undefined) setWebsiteTab(targetWebsiteTab);
    if (newActiveTab !== undefined) setActiveTab(targetActiveTab);

    const effUpdatesCat = subState?.updatesCategory !== undefined ? subState.updatesCategory : updatesCategory;
    const effUpdatesUser = subState?.updatesChatUser !== undefined ? subState.updatesChatUser : updatesChatUser;
    const effProcessTab = subState?.processTab !== undefined ? subState.processTab : processTab;
    const effViewedCreator = subState?.viewedCreator !== undefined ? subState.viewedCreator : (homeViewCreatorProfile || viewedCreatorId);
    const effPostId = subState?.postId !== undefined ? subState.postId : (homeSuperimposedPostId || profileSuperimposedPostId);
    const effRecipeId = subState?.recipeId !== undefined ? subState.recipeId : selectedRecipeModal?.id;

    const targetPath = getPathFromState(targetViewMode, targetWebsiteTab, targetActiveTab, {
      updatesCategory: effUpdatesCat,
      updatesChatUser: effUpdatesUser,
      processTab: effProcessTab,
      viewedCreator: effViewedCreator,
      postId: effPostId,
      recipeId: effRecipeId
    });

    if (push && typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  useEffect(() => {
    const syncFromRoute = () => {
      const route = parsePath(window.location.pathname);
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
        const handle = route.viewedCreatorIdentifier.toLowerCase();
        const found = creators.find(c => c.id === route.viewedCreatorIdentifier || c.username?.toLowerCase() === handle || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === handle);
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

      if (route.recipeId) {
        const foundRec = recipes.find(r => r.id === route.recipeId);
        if (foundRec) setSelectedRecipeModal(foundRec);
      } else {
        setSelectedRecipeModal(null);
      }
    };

    syncFromRoute();

    window.addEventListener('popstate', syncFromRoute);
    return () => window.removeEventListener('popstate', syncFromRoute);
  }, [creators, currentUser, recipes]);

  const handleLoginSuccess = (user: UserSession) => {
    setAuthSession(user);
    setCurrentUser(prev => ({
      ...prev,
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || prev.avatarUrl
    }));
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
    updateRoute('website', 'home');
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

  const handleTabChange = (tab: 'updates' | 'recipes' | 'coach' | 'social' | 'profile') => {
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
      setHomeViewCreatorProfile(null);
      const feedContainer = document.getElementById('feed-root')?.querySelector('.overflow-y-scroll');
      if (feedContainer) {
        feedContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    updateRoute('workspace', undefined, tab, {
      updatesCategory: null,
      updatesChatUser: null,
      processTab: tab === 'recipes' ? 'library' : tab === 'coach' ? 'projects' : undefined,
      viewedCreator: null,
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

  const handleProcessTabChange = (tab: 'projects' | 'focus' | 'library') => {
    setProcessTab(tab);
    const targetAppTab = tab === 'library' ? 'recipes' : 'coach';
    updateRoute('workspace', undefined, targetAppTab, { processTab: tab, viewedCreator: null, postId: null, recipeId: null });
  };

  // Message Threads & Share Drawer States
  const [shareDrawerPost, setShareDrawerPost] = useState<FeedPost | null>(null);
  const [isShareDrawerOpen, setIsShareDrawerOpen] = useState<boolean>(false);

  const handleSelectPost = (postId: string, actionType?: 'comment' | 'vote' | 'shared_message') => {
    setShowTutorial(false);
    const match = posts.find(p => p.id === postId || (p.title && p.title.toLowerCase().includes(postId.toLowerCase()))) || posts[0];
    const actualPostId = match ? match.id : postId;

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
    const targetRecipe = recipes.find(r => r.id === recipeId) || recipes[0];
    if (targetRecipe) {
      setSelectedRecipeModal(targetRecipe);
      updateRoute('workspace', undefined, 'recipes', { recipeId: targetRecipe.id, processTab: 'library' });
    }
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleSelectUser = (creatorId: string) => {
    setShowTutorial(false);
    const targetCreator = creators.find(c => c.id === creatorId || c.username === creatorId || c.name === creatorId);
    if (targetCreator) {
      if (currentUser && targetCreator.id === currentUser.id) {
        setHomeViewCreatorProfile(null);
        setViewedCreatorId(null);
        updateRoute('workspace', undefined, 'profile', { viewedCreator: null });
      } else {
        setHomeViewCreatorProfile(targetCreator);
        updateRoute('workspace', undefined, 'social', { viewedCreator: targetCreator });
      }
      setTimeout(() => {
        document.getElementById('home-profile-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      setViewedCreatorId(creatorId);
      updateRoute('workspace', undefined, 'social', { viewedCreator: creatorId });
    }
  };

  const [messageThreads, setMessageThreads] = useState<MessageThread[]>(() => {
    const saved = localStorage.getItem('gonnng_message_threads');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('gonnng_message_threads', JSON.stringify(messageThreads));
  }, [messageThreads]);

  const [unreadNotifsCount, setUnreadNotifsCount] = useState(7); // default 4 post + 2 follower + 1 appinfo unread
  const unreadMessageCount = messageThreads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
  const totalUnreadNotifications = unreadMessageCount + unreadNotifsCount;

  const handleMarkThreadAsRead = (creatorId: string) => {
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
  };

  const handleSendMessage = (targetUserId: string, messageText: string, postThumbnail?: string, postId?: string) => {
    setMessageThreads(prev => {
      const existingIndex = prev.findIndex(t => t.creator.id === targetUserId);
      const targetCreator = creators.find(c => c.id === targetUserId);

      if (!targetCreator) return prev;

      const newMsg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        senderId: 'user-current',
        text: messageText,
        timestamp: 'Just now',
        isRead: true,
        postThumbnail,
        postId
      };

      if (existingIndex >= 0) {
        const existingThread = prev[existingIndex];
        const updatedThread: MessageThread = {
          ...existingThread,
          messages: [...existingThread.messages, newMsg],
          lastUpdated: Date.now()
        };
        const filtered = prev.filter((_, idx) => idx !== existingIndex);
        return [updatedThread, ...filtered];
      } else {
        const newThread: MessageThread = {
          creator: targetCreator,
          messages: [newMsg],
          lastUpdated: Date.now(),
          unreadCount: 0
        };
        return [newThread, ...prev];
      }
    });
  };
  const [showPhilosophyModal, setShowPhilosophyModal] = useState<boolean>(() => {
    return !localStorage.getItem('gonnng_philosophy_seen');
  });
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    return !localStorage.getItem('gonnng_tutorial_done');
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState<boolean>(false);
  const [forkInitialData, setForkInitialData] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [congratulateProject, setCongratulateProject] = useState<string | null>(null);

  // Initial loader if Supabase is active
  useEffect(() => {
    if (dataService.isSupabaseActive()) {
      dataService.getCreators().then(c => c.length > 0 && setCreators(c));
      dataService.getRecipes().then(r => r.length > 0 && setRecipes(r));
      dataService.getCollections().then(col => col.length > 0 && setCollections(col));
      dataService.getProjects().then(p => p.length > 0 && setProjects(p));
      dataService.getPosts().then(pst => pst.length > 0 && setPosts(pst));
    }
  }, []);

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
    localStorage.setItem('gonnng_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const handleUpdateUser = async (updated: Creator) => {
    const previousName = currentUser.name;
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
      username: updated.username || prev.username
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

  const activeProject = projects.find(p => p.id === selectedProjectId);

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
                  userId: currentUser.id,
                  userName: currentUser.name,
                  userAvatar: currentUser.avatarUrl,
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
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatarUrl,
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
      setSelectedProjectId('');
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
    const found = creators.find(c => c.id === creatorIdOrName || c.username === creatorIdOrName || c.name === creatorIdOrName);
    if (found) {
      if (currentUser && found.id === currentUser.id) {
        setHomeViewCreatorProfile(null);
        setViewedCreatorId(null);
        updateRoute('workspace', undefined, 'profile', { viewedCreator: null });
      } else {
        setHomeViewCreatorProfile(found);
        updateRoute('workspace', undefined, activeTab === 'social' ? 'social' : 'profile', { viewedCreator: found });
      }
      setTimeout(() => {
        document.getElementById('home-profile-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      setViewedCreatorId(creatorIdOrName);
      updateRoute('workspace', undefined, 'profile', { viewedCreator: creatorIdOrName });
    }
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
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
      bio: 'Gonnng Community Creator',
      goals: 'Building creative projects.',
      privacyDefault: 'public' as const,
      followersCount: 0,
      followingCount: 0,
      isFollowing: false,
      isInCircle: false
    };
  }, [viewedCreatorId, creators, currentUser]);

  // Creator following toggle (updates bidirectional followerIds & followingIds)
  const handleToggleFollowCreator = (targetUserId: string) => {
    if (!currentUser || currentUser.id === targetUserId) return;

    const currentUserId = currentUser.id;

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

      return prevCreators.map(c => {
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
            followersCount: newTargetFollowers.length
          };
        }
        return c;
      });
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
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatarUrl,
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
    setForkInitialData(recipe);
    setShowSearchModal(false);
    setShowCreateModal(true);
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
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatarUrl,
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

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
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
      privacy: currentUser.privacyDefault,
      progressPhotos: []
    };

    setProjects(prev => [...prev, newProject]);
    setSelectedProjectId(newProject.id);
    updateRoute('workspace', undefined, 'profile');

    // Create Feed Log
    const newPost: FeedPost = {
      id: `post-inst-${Date.now()}`,
      type: 'project_created',
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatarUrl,
      timeString: 'Just now',
      title: `Started Project: "${newProject.title}"`,
      content: `Let's break down the creative parts of "${recipe.title}". Starting step 1 today!`,
      attachedId: newProject.id,
      attachedName: newProject.title,
      privacy: currentUser.privacyDefault,
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
            <HomePage onNavigate={handleNavigateWebsite} onOpenWorkspace={handleOpenWorkspace} />
          )}
          {websiteTab === 'download' && (
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
          {websiteTab === 'login' && (
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
      <header className="backdrop-blur-md fixed top-0 left-0 right-0 z-40 border-b shrink-0 transition-all duration-300 shadow-2xl bg-white/95 text-gray-900 border-gray-200 shadow-sm">
        <div className={`max-w-7xl mx-auto px-3 sm:px-4 md:px-8 flex items-center justify-between transition-all duration-300 relative ${
          isScrolled ? 'h-9 sm:h-10' : 'h-9 sm:h-14'
        }`}>
          
          {/* Logo Brand Area */}
          <div 
            onClick={() => handleTabChange(activeTab)}
            className="flex items-center cursor-pointer group shrink-0"
            title="Click to return to top"
          >
            {/* Mobile & Tablet Layout Logo (Gonnng G Icon) */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setShowTutorial(true);
                localStorage.removeItem('gonnng_tutorial_done');
              }}
              className="lg:hidden flex items-center justify-center cursor-pointer group-hover:scale-105 transition-transform"
              title="Click to reset tutorial"
            >
              <GonnngGIcon className="w-8 h-8" />
            </div>

            {/* Desktop Layout Logo (Gonnng G Logo with text built-in) */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setShowTutorial(true);
                localStorage.removeItem('gonnng_tutorial_done');
              }}
              className="hidden lg:flex items-center justify-center cursor-pointer group-hover:scale-105 transition-transform"
              title="Click to reset tutorial"
            >
              <GonnngGLogo />
            </div>
          </div>


          {/* Center Navigation tabs */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl shadow-inner md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-10 transition-colors bg-gray-200/80 border border-gray-300">
            <button
              id="nav-profile-tab"
              onClick={() => handleTabChange('profile')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'profile' && !showTutorial 
                  ? 'bg-[#FF5C00] text-black font-black border border-[#FF5C00] shadow-[0_0_14px_rgba(255,92,0,0.35)]' 
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
                activeTab === 'coach' && !showTutorial 
                  ? 'bg-[#FF5C00] text-black font-black border border-[#FF5C00] shadow-[0_0_14px_rgba(255,92,0,0.35)]' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300/60 border border-transparent'
              }`}
            >
              <Hourglass className="w-4 h-4" /> Process
            </button>

            {/* Centered plus action button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-1.5 mx-1 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black rounded-full transition-all shadow-md flex items-center justify-center cursor-pointer shrink-0 hover:scale-110 active:scale-95"
              title="Start New Recipe"
            >
              <Plus className="w-4.5 h-4.5 font-black" />
            </button>

            <button
              id="nav-updates-tab"
              onClick={() => handleTabChange('updates')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
                activeTab === 'updates' && !showTutorial 
                  ? 'bg-[#FF5C00] text-black font-black border border-[#FF5C00] shadow-[0_0_14px_rgba(255,92,0,0.35)]' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300/60 border border-transparent'
              }`}
            >
              <Bell className="w-4 h-4" /> Updates
              {totalUnreadNotifications > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-[#FF5C00] text-black shadow-sm">
                  {totalUnreadNotifications}
                </span>
              )}
            </button>
            <button
              id="nav-social-tab"
              onClick={() => handleTabChange('social')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'social' && !showTutorial 
                  ? 'bg-[#FF5C00] text-black font-black border border-[#FF5C00] shadow-[0_0_14px_rgba(255,92,0,0.35)]' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300/60 border border-transparent'
              }`}
            >
              <CircleDotDashed className="w-4 h-4" /> Circle
            </button>
          </nav>

          {/* Action Area on the Right */}
          <div className="flex items-center gap-2 sm:gap-3">
            {activeTab === 'profile' ? (
              <button
                type="button"
                id="header-profile-menu-btn"
                onClick={() => {
                  setIsProfileSettingsOpen(prev => !prev);
                }}
                className="p-1.5 sm:p-2 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black rounded-xl transition-all shadow-md flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
                title="Profile Settings"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </button>
            ) : activeTab === 'social' ? (
              <button
                type="button"
                id="circle-search-btn"
                onClick={() => setShowSearchModal(true)}
                className="p-1.5 sm:p-2 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black rounded-xl transition-all shadow-md flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
                title="Search Circle"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </button>
            ) : null}
          </div>

        </div>

        {/* Global Header Progress Bar - Shrinks on scroll, number hides on scroll */}
        <div 
          className={`w-full relative overflow-hidden transition-all duration-300 bg-gray-200 ${
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 py-2 px-3 flex justify-around items-center z-50 shadow-2xl transition-colors border-t bg-white/95 backdrop-blur-md border-gray-200 text-gray-900">
        <button 
          onClick={() => handleTabChange('profile')}
          className={`relative flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl text-[9px] font-bold transition-all cursor-pointer ${
            activeTab === 'profile' && !showTutorial 
              ? 'text-[#FF5C00] bg-[#FF5C00]/10 border border-[#FF5C00]/50 shadow-[0_0_10px_rgba(255,92,0,0.2)]' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {activeTab === 'profile' && !showTutorial && (
            <span className="absolute -top-1 w-2 h-2 rounded-full bg-[#FF5C00] shadow-[0_0_8px_#FF5C00]" />
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
          onClick={() => handleTabChange('coach')}
          className={`relative flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl text-[9px] font-bold transition-all cursor-pointer ${
            activeTab === 'coach' && !showTutorial 
              ? 'text-[#FF5C00] bg-[#FF5C00]/10 border border-[#FF5C00]/50 shadow-[0_0_10px_rgba(255,92,0,0.2)]' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {activeTab === 'coach' && !showTutorial && (
            <span className="absolute -top-1 w-2 h-2 rounded-full bg-[#FF5C00] shadow-[0_0_8px_#FF5C00]" />
          )}
          <Hourglass className="w-4.5 h-4.5" /> Process
        </button>

        {/* Centered circle plus button */}
        <button 
          onClick={() => setShowCreateModal(true)}
          className="w-11 h-11 rounded-full bg-[#FF5C00] text-black flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer hover:scale-105"
          title="Start New Recipe"
        >
          <Plus className="w-5.5 h-5.5 font-black" />
        </button>

        <button 
          onClick={() => handleTabChange('updates')}
          className={`relative flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl text-[9px] font-bold transition-all cursor-pointer ${
            activeTab === 'updates' && !showTutorial 
              ? 'text-[#FF5C00] bg-[#FF5C00]/10 border border-[#FF5C00]/50 shadow-[0_0_10px_rgba(255,92,0,0.2)]' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {totalUnreadNotifications > 0 ? (
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 min-w-[18px] h-4 px-1 rounded-full text-[9px] font-mono font-black bg-[#FF5C00] text-black flex items-center justify-center shadow-md z-10">
              {totalUnreadNotifications}
            </span>
          ) : (
            activeTab === 'updates' && !showTutorial && (
              <span className="absolute -top-1 w-2 h-2 rounded-full bg-[#FF5C00] shadow-[0_0_8px_#FF5C00]" />
            )
          )}
          <Bell className="w-4.5 h-4.5" /> Updates
        </button>
        <button 
          onClick={() => handleTabChange('social')}
          className={`relative flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl text-[9px] font-bold transition-all cursor-pointer ${
            activeTab === 'social' && !showTutorial 
              ? 'text-[#FF5C00] bg-[#FF5C00]/10 border border-[#FF5C00]/50 shadow-[0_0_10px_rgba(255,92,0,0.2)]' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {activeTab === 'social' && !showTutorial && (
            <span className="absolute -top-1 w-2 h-2 rounded-full bg-[#FF5C00] shadow-[0_0_8px_#FF5C00]" />
          )}
          <CircleDotDashed className="w-4.5 h-4.5" /> Circle
        </button>
      </div>

      {/* Main Container Workspace */}
      <main className={`flex-1 max-w-7xl mx-auto w-full min-w-0 px-0 transition-all duration-300 pb-24 md:pb-8 ${
        isScrolled ? 'pt-[42px] sm:pt-[48px] md:pt-[52px]' : 'pt-[52px] sm:pt-[72px] md:pt-[72px]'
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
                  allProjects={projects}
                  onUpdateCollectionMode={handleUpdateCollectionMode}
                  onUpdateCollectionBudget={handleUpdateCollectionBudget}
                  onUpdateProject={handleUpdateProject}
                  onUpdateCollection={handleUpdateCollection}
                  onMarkProjectComplete={handleMarkProjectComplete}
                  selectedProjectId={selectedProjectId}
                  setSelectedProjectId={setSelectedProjectId}
                  getProjectProgress={getProjectProgress}
                  handleDeleteProject={handleDeleteProject}
                  onDeleteCollection={handleDeleteCollection}
                  handleToggleTask={handleToggleTask}
                  setShowCreateModal={setShowCreateModal}
                  activeProject={activeProject}
                  recipes={recipes}
                  onAddRecipe={(r) => setRecipes(prev => [r, ...prev])}
                  initialTab={activeTab === 'recipes' ? 'library' : (processTab || 'projects')}
                  onTabChange={handleProcessTabChange}
                  currentUser={currentUser}
                  setShowSearchModal={setShowSearchModal}
                  setEditingRecipe={setEditingRecipe}
                  setForkInitialData={setForkInitialData}
                  handleInstantiateRecipe={handleInstantiateRecipe}
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
                    currentUserId={currentUser.id}
                    currentUser={currentUser}
                    onBackToHome={() => setHomeViewCreatorProfile(null)}
                    onToggleFollow={handleToggleFollowCreator}
                    onUpdatePostGong={handleUpdatePostGong}
                    onAddComment={handleAddComment}
                    onToggleCommentHeart={handleToggleCommentHeart}
                    onOpenShareDrawer={(post) => {
                      setShareDrawerPost(post);
                      setIsShareDrawerOpen(true);
                    }}
                    onOpenCreatorProfile={(id) => setViewedCreatorId(id)}
                  />
                ) : (
                  <Feed 
                    posts={posts}
                    currentUserId={currentUser.id}
                    currentUser={currentUser}
                    creators={creators}
                    filter={feedFilter}
                    onUpdatePostGong={handleUpdatePostGong}
                    onAddComment={handleAddComment}
                    onToggleCommentHeart={handleToggleCommentHeart}
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
                />
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </main>

      {/* Device Permissions Initial Prompt Modal (Logged in workspace mode only) */}
      <PermissionsPromptModal
        isOpen={showPermissionsPromptModal && viewMode === 'workspace'}
        currentPermissions={permissions}
        onClose={() => setShowPermissionsPromptModal(false)}
        onSavePermissions={handleCustomPermissions}
      />

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
          privacyDefault={currentUser.privacyDefault}
          permissions={permissions}
          onNavigateToPermissions={handleNavigateToPermissions}
          onUpdatePermissions={handleUpdatePermissions}
          onRequestDevicePermissions={() => setShowPermissionsPromptModal(true)}
          onAddRecipe={(r) => setRecipes(prev => [r, ...prev])}
          onUpdateRecipe={(updatedR) => {
            setRecipes(prev => prev.map(r => r.id === updatedR.id ? updatedR : r));
          }}
          onAddProject={(p) => {
            setProjects(prev => [...prev, p]);
            setSelectedProjectId(p.id);
          }}
          onAddCollection={(col) => {
            setCollections(prev => [col, ...prev]);
          }}
          onUpdateProject={(updatedProj) => {
            setProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p));
          }}
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
          onClose={() => setShowSearchModal(false)}
          recipes={recipes}
          creators={creators}
          communityRecipes={recipes}
          posts={posts}
          onSaveRecipe={handleSaveCommunityRecipe}
          onForkRecipe={handleForkCommunityRecipe}
          onToggleFollowCreator={handleToggleFollowCreator}
          onToggleCircleCreator={handleToggleCircleCreator}
        />
      )}

      {/* Gonnng Feedback Philosophy Manual Modal */}
      {showPhilosophyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-3xl p-6 md:p-8 max-w-xl w-full border shadow-2xl space-y-6 bg-white border-gray-200 text-gray-900"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="bg-[#FF5C00]/15 text-[#FF5C00] font-mono text-[9px] uppercase px-2 py-0.5 rounded font-bold tracking-wider">
                  The Gonnng Way
                </span>
                <h3 className="text-xl font-display font-black text-white mt-1.5 uppercase tracking-tight">
                  Feedback Philosophy Manual
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowPhilosophyModal(false);
                  localStorage.setItem('gonnng_philosophy_seen', 'true');
                }}
                className="text-white/40 hover:text-white transition-all font-mono text-sm cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="text-xs text-white/60 leading-relaxed space-y-3 font-sans">
              <p>
                Gonnng is built on a single, uncompromising belief: <strong className="text-white font-semibold">"The whole is a sum of its parts."</strong>
              </p>
              <p>
                Too often, we only notice final, shiny outcomes and ignore the microscopic blocks of labor that made them real. Gonnng exists to expose that effort and give creators a framework to keep going. We use the structured simplicity of making a BLT sandwich as our blueprint model for executing great creative work.
              </p>
              <p className="text-white/80">
                To keep our community highly productive and direct, our feed rejects empty praise. Instead, we use three surgical <strong className="text-white">"Gong Checks"</strong> to evaluate progress logs:
              </p>
            </div>

            <div className="grid gap-3.5 pt-2">
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-2xl flex items-start gap-3">
                <span className="text-xl shrink-0" role="img" aria-label="continue">🟢</span>
                <div>
                  <h4 className="text-xs font-mono font-black uppercase text-emerald-400">Continue</h4>
                  <p className="text-[11px] text-white/60 leading-normal mt-0.5">
                    Signal that the creator's sequence is incredibly effective. Urge them to proceed down this active path without distraction.
                  </p>
                </div>
              </div>

              <div className="bg-yellow-400/5 border border-yellow-400/10 p-3.5 rounded-2xl flex items-start gap-3">
                <span className="text-xl shrink-0" role="img" aria-label="refine">🟡</span>
                <div>
                  <h4 className="text-xs font-mono font-black uppercase text-yellow-400">Refine</h4>
                  <p className="text-[11px] text-white/60 leading-normal mt-0.5">
                    Highlight micro-adjustments or polish. Suggest small tweaks to the active phase without derailing the overall creative schedule.
                  </p>
                </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/10 p-3.5 rounded-2xl flex items-start gap-3">
                <span className="text-xl shrink-0" role="img" aria-label="reconsider">🔴</span>
                <div>
                  <h4 className="text-xs font-mono font-black uppercase text-red-500">Reconsider</h4>
                  <p className="text-[11px] text-white/60 leading-normal mt-0.5">
                    Trigger a constructive pause. Flag highly redundant steps, structural bottlenecks, or misalignment with core project goals.
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
                className="w-full py-3 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer tracking-wider uppercase"
              >
                Acknowledge & Sync Blueprint
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Complete Project Celebration Modal */}
      {congratulateProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl border bg-white border-gray-200 text-gray-900"
          >
            <div className="inline-flex w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 items-center justify-center text-3xl">
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
              className="w-full py-3 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black text-xs rounded-xl shadow transition-all cursor-pointer"
            >
              Exquisite. Proceed
            </button>
          </motion.div>
        </div>
      )}

      {/* Recipe Modal Overlay (Process View Permalinks) */}
      {selectedRecipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-gray-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-2xl max-h-[90vh] rounded-3xl p-5 sm:p-7 flex flex-col justify-between shadow-2xl border bg-white border-gray-200 text-gray-900"
          >
            <div className="flex justify-between items-start pb-4 border-b border-gray-200">
              <div className="space-y-1 min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <span className="bg-[#FF5C00]/20 text-[#FF5C00] text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border border-[#FF5C00]/30">
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
                onClick={() => setSelectedRecipeModal(null)}
                className="p-2 rounded-full transition-colors cursor-pointer shrink-0 hover:bg-gray-100 text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5C00] flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Recipe Phases & Blueprint Tasks
              </h3>
              {selectedRecipeModal.phases && selectedRecipeModal.phases.map((ph, pIdx) => (
                <div 
                  key={ph.id || pIdx} 
                  className="p-3.5 rounded-2xl border space-y-2 bg-gray-50 border-gray-200"
                >
                  <h4 className="text-xs font-mono font-bold uppercase text-[#FF5C00]">
                    Phase {pIdx + 1}: {ph.title}
                  </h4>
                  <div className="space-y-1.5 pl-2">
                    {ph.tasks.map((t, tIdx) => (
                      <div key={t.id || tIdx} className="flex items-center gap-2 text-xs opacity-80">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C00]" />
                        <span>{t.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t flex flex-wrap items-center justify-end gap-2.5 border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setForkInitialData(selectedRecipeModal);
                  setEditingRecipe(null);
                  setShowCreateModal(true);
                  setSelectedRecipeModal(null);
                }}
                className="px-4 py-2.5 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-bold text-xs rounded-xl transition-all cursor-pointer shadow flex items-center gap-1.5"
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
          currentUserId={currentUser.id}
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
