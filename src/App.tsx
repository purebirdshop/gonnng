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
  Edit2,
  X
} from 'lucide-react';

import { Recipe, Project, Collection, Creator, FeedPost, Task, Phase } from './types';
import { 
  INITIAL_RECIPES, 
  INITIAL_PROJECTS, 
  INITIAL_COLLECTIONS, 
  INITIAL_FEED_POSTS, 
  INITIAL_CREATORS,
  COMMUNITY_RECIPES
} from './data/initialData';
import { dataService } from './services/dataService';
import { authService, isAuthFeatureEnabled, UserSession } from './services/authService';

// Component imports
import Onboarding from './components/Onboarding';
import UserProfile from './components/UserProfile';
import SandEngine from './components/SandEngine';
import Feed from './components/Feed';
import CreateHub from './components/CreateHub';
import SearchRecipesModal from './components/SearchRecipesModal';
import CreatorProfileModal from './components/CreatorProfileModal';
import UpdatesView, { MessageThread } from './components/UpdatesView';
import ShareDrawer from './components/ShareDrawer';
import HomeCreatorProfileView from './components/HomeCreatorProfileView';

// Website Component imports
import { WebsiteHeader } from './components/website/WebsiteHeader';
import { WebsiteFooter } from './components/website/WebsiteFooter';
import { HomePage } from './components/website/HomePage';
import { DownloadPage } from './components/website/DownloadPage';
import { SupportPage } from './components/website/SupportPage';
import { PrivacyPage } from './components/website/PrivacyPage';
import { TermsPage } from './components/website/TermsPage';
import { ContactPage } from './components/website/ContactPage';
import { LoginPage } from './components/website/LoginPage';
import { OnboardingWizard } from './components/website/OnboardingWizard';

export default function App() {
  // Global States loaded from LocalStorage if present
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('gonnng_recipes');
    return saved ? JSON.parse(saved) : INITIAL_RECIPES;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('gonnng_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [collections, setCollections] = useState<Collection[]>(() => {
    const saved = localStorage.getItem('gonnng_collections');
    return saved ? JSON.parse(saved) : INITIAL_COLLECTIONS;
  });

  const [posts, setPosts] = useState<FeedPost[]>(() => {
    const savedStr = localStorage.getItem('gonnng_posts');
    let rawPosts: FeedPost[] = INITIAL_FEED_POSTS;

    if (savedStr) {
      try {
        const savedList: FeedPost[] = JSON.parse(savedStr);
        if (Array.isArray(savedList) && savedList.length > 0) {
          const savedMap = new Map<string, FeedPost>(savedList.map(p => [p.id, p]));
          const initialIds = new Set(INITIAL_FEED_POSTS.map(p => p.id));
          
          // Retain all 50+ initial feed posts (preserving user's votes/comments if modified)
          const mergedInitial = INITIAL_FEED_POSTS.map(p => savedMap.get(p.id) || p);
          
          // Include any newly created user posts not in INITIAL_FEED_POSTS
          const newPosts = savedList.filter(p => !initialIds.has(p.id));
          rawPosts = [...newPosts, ...mergedInitial];
        }
      } catch {
        rawPosts = INITIAL_FEED_POSTS;
      }
    }
    
    const seenPostIds = new Set<string>();
    const uniquePosts: FeedPost[] = [];

    for (const p of rawPosts) {
      let postId = p.id;
      if (!postId || seenPostIds.has(postId)) {
        postId = `post-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      }
      seenPostIds.add(postId);

      const seenCommentIds = new Set<string>();
      const comments = (p.comments && p.comments.length > 0)
        ? p.comments.map((c, cIdx) => {
            let commentId = c.id;
            if (!commentId || seenCommentIds.has(commentId)) {
              commentId = `c-${postId}-${cIdx}-${Math.random().toString(36).substring(2, 9)}`;
            }
            seenCommentIds.add(commentId);
            return { ...c, id: commentId };
          })
        : [
            {
              id: `comment-init-${postId}`,
              userName: 'Process Coach',
              userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
              content: 'The whole is indeed a sum of its parts. Excellent focus on sequence!',
              timeString: '1 day ago'
            }
          ];

      uniquePosts.push({
        ...p,
        id: postId,
        comments
      });
    }

    return uniquePosts;
  });

  const [creators, setCreators] = useState<Creator[]>(() => {
    const saved = localStorage.getItem('gonnng_creators');
    if (saved) {
      try {
        const parsed: Creator[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const initMap = new Map(INITIAL_CREATORS.map(c => [c.id, c]));
          return parsed.map(c => {
            const init = initMap.get(c.id);
            const followsYou = c.followsYou ?? init?.followsYou ?? false;
            const isFollowing = c.isFollowing ?? init?.isFollowing ?? false;
            return {
              ...c,
              followsYou,
              isFollowing,
              isInCircle: isFollowing && followsYou
            };
          });
        }
      } catch {
        return INITIAL_CREATORS;
      }
    }
    return INITIAL_CREATORS;
  });

  const [currentUser, setCurrentUser] = useState<Creator>(() => {
    const saved = localStorage.getItem('gonnng_current_user');
    return saved ? JSON.parse(saved) : {
      id: 'user-current',
      name: 'Creative Architect',
      email: 'creator@gonnng.app',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
      bio: 'Lover of artisan sourdough, conceptual canvas painting, and deep focus loops.',
      goals: 'Host French autumn oil painting exhibit. Perfect the Sandwich Master sequence.',
      privacyDefault: 'public',
      followersCount: 84,
      followingCount: 3
    };
  });

  // Routing logic helpers
  const parsePath = (pathname: string): { viewMode: 'website' | 'workspace'; websiteTab: string; activeTab: 'updates' | 'recipes' | 'coach' | 'social' | 'profile' } => {
    const path = pathname.toLowerCase().replace(/\/$/, '') || '/';
    if (path === '/home' || path.startsWith('/p/') || path.startsWith('/project/') || path.startsWith('/recipe/')) {
      return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'social' };
    } else if (path === '/sand') {
      return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'coach' };
    } else if (path === '/updates') {
      return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'updates' };
    } else if (path === '/library') {
      return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'recipes' };
    } else if (path === '/profile' || path.startsWith('/u/')) {
      return { viewMode: 'workspace', websiteTab: 'home', activeTab: 'profile' };
    } else if (path === '/download') {
      return { viewMode: 'website', websiteTab: 'download', activeTab: 'social' };
    } else if (path === '/support') {
      return { viewMode: 'website', websiteTab: 'support', activeTab: 'social' };
    } else if (path === '/contact') {
      return { viewMode: 'website', websiteTab: 'contact', activeTab: 'social' };
    } else if (path === '/privacy') {
      return { viewMode: 'website', websiteTab: 'privacy', activeTab: 'social' };
    } else if (path === '/terms') {
      return { viewMode: 'website', websiteTab: 'terms', activeTab: 'social' };
    } else if (path === '/login') {
      return { viewMode: 'website', websiteTab: 'login', activeTab: 'social' };
    } else {
      return { viewMode: 'website', websiteTab: 'home', activeTab: 'social' };
    }
  };

  const getPathFromState = (
    mode: 'website' | 'workspace', 
    webTab: string, 
    appTab: 'updates' | 'recipes' | 'coach' | 'social' | 'profile'
  ): string => {
    if (mode === 'workspace') {
      switch (appTab) {
        case 'social': return '/home';
        case 'coach': return '/sand';
        case 'updates': return '/updates';
        case 'recipes': return '/sand';
        case 'profile': return '/profile';
        default: return '/home';
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

  const [activeTab, setActiveTab] = useState<'updates' | 'recipes' | 'coach' | 'social' | 'profile'>(initialRoute.activeTab);
  const [feedFilter, setFeedFilter] = useState<'all' | 'internal' | 'private'>('all');
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  const updateRoute = (
    newViewMode: 'website' | 'workspace',
    newWebsiteTab?: string,
    newActiveTab?: 'updates' | 'recipes' | 'coach' | 'social' | 'profile',
    push: boolean = true
  ) => {
    const targetViewMode = newViewMode;
    const targetWebsiteTab = newWebsiteTab ?? websiteTab;
    const targetActiveTab = newActiveTab ?? activeTab;

    setViewMode(targetViewMode);
    if (newWebsiteTab !== undefined) setWebsiteTab(targetWebsiteTab);
    if (newActiveTab !== undefined) setActiveTab(targetActiveTab);

    const targetPath = getPathFromState(targetViewMode, targetWebsiteTab, targetActiveTab);
    if (push && window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const route = parsePath(window.location.pathname);
      setViewMode(route.viewMode);
      setWebsiteTab(route.websiteTab);
      setActiveTab(route.activeTab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
      updateRoute('workspace', undefined, 'social');
    } else {
      setShowTutorial(true);
      localStorage.removeItem('gonnng_tutorial_done');
      updateRoute('workspace', undefined, 'social');
    }
  };

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('gonnng_theme') as 'dark' | 'light') || 'dark';
  });

  const handleToggleTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('gonnng_theme', newTheme);
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

  // Overlay / Inline Views state
  const [homeViewCreatorProfile, setHomeViewCreatorProfile] = useState<Creator | null>(null);
  const [profileSuperimposedPostId, setProfileSuperimposedPostId] = useState<string | null>(null);
  const [homeSuperimposedPostId, setHomeSuperimposedPostId] = useState<string | null>(null);
  const [autoOpenCommentsPostId, setAutoOpenCommentsPostId] = useState<string | null>(null);

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
    updateRoute('workspace', undefined, tab);
  };

  // Message Threads & Share Drawer States
  const [shareDrawerPost, setShareDrawerPost] = useState<FeedPost | null>(null);
  const [isShareDrawerOpen, setIsShareDrawerOpen] = useState<boolean>(false);

  // Updates View Navigation States
  const [updatesCategory, setUpdatesCategory] = useState<null | 'updates' | 'followers' | 'appinfo'>(null);
  const [updatesChatUser, setUpdatesChatUser] = useState<Creator | null>(null);

  const [selectedRecipeModal, setSelectedRecipeModal] = useState<Recipe | null>(null);

  const handleSelectPost = (postId: string, actionType?: 'comment' | 'vote' | 'shared_message') => {
    setShowTutorial(false);
    if (actionType === 'comment') {
      // Comment notification: Permalinks to Profile view superimposed post & opens comment drawer!
      setProfileSuperimposedPostId(postId);
      setAutoOpenCommentsPostId(postId);
      handleTabChange('profile');
      setTimeout(() => {
        document.getElementById('profile-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      // Vote update, shared message post, or default: Superimpose over Profile view!
      setProfileSuperimposedPostId(postId);
      setAutoOpenCommentsPostId(null);
      handleTabChange('profile');
      setTimeout(() => {
        document.getElementById('profile-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleSelectRecipe = (recipeId: string) => {
    setShowTutorial(false);
    const targetRecipe = recipes.find(r => r.id === recipeId) || 
                         COMMUNITY_RECIPES.find(r => r.id === recipeId) ||
                         INITIAL_RECIPES.find(r => r.id === recipeId) ||
                         recipes[0];
    if (targetRecipe) {
      setSelectedRecipeModal(targetRecipe);
    }
    handleTabChange('recipes');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleSelectUser = (creatorId: string) => {
    setShowTutorial(false);
    const targetCreator = creators.find(c => c.id === creatorId || c.name === creatorId) || INITIAL_CREATORS.find(c => c.id === creatorId || c.name === creatorId);
    if (targetCreator) {
      setHomeViewCreatorProfile(targetCreator);
      updateRoute('workspace', undefined, 'social');
      setTimeout(() => {
        document.getElementById('home-profile-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const [messageThreads, setMessageThreads] = useState<MessageThread[]>(() => {
    const saved = localStorage.getItem('gonnng_message_threads');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        creator: INITIAL_CREATORS.find(c => c.id === 'creator-ada') || INITIAL_CREATORS[0],
        lastUpdated: Date.now() - 1000 * 60 * 15,
        unreadCount: 1,
        messages: [
          { id: 'm1', senderId: 'creator-ada', text: 'Hey Creative Architect! How is the Sand Engine algorithm coming along?', timestamp: '15m ago', isRead: false },
          { id: 'm2', senderId: 'user-current', text: 'Going great! Just completed phase 2 of the workspace sequence.', timestamp: '10m ago', isRead: true },
          { id: 'm3', senderId: 'creator-ada', text: 'Wonderful! Send over the blueprint permalink when ready.', timestamp: '5m ago', isRead: false }
        ]
      },
      {
        creator: INITIAL_CREATORS.find(c => c.id === 'creator-hokusai') || INITIAL_CREATORS[1],
        lastUpdated: Date.now() - 1000 * 60 * 60 * 2,
        unreadCount: 0,
        messages: [
          { id: 'm4', senderId: 'creator-hokusai', text: 'Check out the new Prussian blue pigment edition of the Great Wave!', timestamp: '2h ago', isRead: true, postThumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=800', postId: 'post-viral-1' }
        ]
      },
      {
        creator: INITIAL_CREATORS.find(c => c.id === 'creator-clara') || INITIAL_CREATORS[2],
        lastUpdated: Date.now() - 1000 * 60 * 60 * 24,
        unreadCount: 0,
        messages: [
          { id: 'm5', senderId: 'creator-clara', text: 'Have you considered adding oil glazing ratios to the art recipe?', timestamp: '1d ago', isRead: true }
        ]
      }
    ];
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
      const targetCreator = creators.find(c => c.id === targetUserId) || INITIAL_CREATORS.find(c => c.id === targetUserId);

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
    const found = creators.find(c => c.id === creatorIdOrName || c.name === creatorIdOrName) || INITIAL_CREATORS.find(c => c.id === creatorIdOrName || c.name === creatorIdOrName);
    if (found) {
      setHomeViewCreatorProfile(found);
      updateRoute('workspace', undefined, 'social');
      setTimeout(() => {
        document.getElementById('home-profile-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      setViewedCreatorId(creatorIdOrName);
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

  // Creator following toggle (In Circle = Mutual Follow: you follow them AND they follow you)
  const handleToggleFollowCreator = (id: string) => {
    let nextFollowedCount = 0;
    setCreators(prev => {
      const updated = prev.map(c => {
        if (c.id !== id) return c;
        const willFollow = !c.isFollowing;
        const followsYou = c.followsYou ?? false;
        return {
          ...c,
          isFollowing: willFollow,
          isInCircle: willFollow && followsYou,
          followersCount: willFollow ? c.followersCount + 1 : Math.max(0, c.followersCount - 1)
        };
      });
      nextFollowedCount = updated.filter(c => c.isFollowing).length;
      return updated;
    });

    setCurrentUser(prev => ({
      ...prev,
      followingCount: nextFollowedCount
    }));
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
      <div className="min-h-screen bg-[#0A0A0A] font-sans text-white flex flex-col antialiased overflow-x-hidden w-full">
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
            <PrivacyPage />
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

        <WebsiteFooter 
          onNavigate={handleNavigateWebsite} 
          onOpenWorkspace={handleOpenWorkspace} 
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col antialiased pb-0 overflow-x-hidden w-full transition-colors duration-200 ${
      theme === 'light' ? 'bg-[#F3F4F6] text-gray-900 app-light-mode' : 'bg-[#0A0A0A] text-white'
    }`}>
      
      {/* Dynamic Global Top Bar - Fixed top position with scroll shrink */}
      <header className={`backdrop-blur-md fixed top-0 left-0 right-0 z-40 border-b shrink-0 transition-all duration-300 shadow-2xl ${
        theme === 'light' 
          ? 'bg-white/95 text-gray-900 border-gray-200 shadow-sm' 
          : 'bg-[#0A0A0A]/95 text-white border-white/10'
      }`}>
        <div className={`max-w-7xl mx-auto px-3 sm:px-4 md:px-8 flex items-center justify-between transition-all duration-300 relative ${
          isScrolled ? 'h-9 sm:h-10' : 'h-9 sm:h-14'
        }`}>
          
          {/* Logo Brand Area */}
          <div 
            onClick={() => handleTabChange(activeTab)}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0"
            title="Click to return to top"
          >
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setShowTutorial(true);
                localStorage.removeItem('gonnng_tutorial_done');
              }}
              className={`bg-[#FF5C00] rounded-full flex items-center justify-center cursor-pointer group-hover:scale-105 transition-all text-black font-display font-bold italic shrink-0 ${
                isScrolled ? 'w-5.5 h-5.5 text-xs' : 'w-5.5 h-5.5 text-xs sm:w-8 sm:h-8 sm:text-base'
              }`}
              title="Click to reset tutorial"
            >
              G
            </div>
            <div className="flex items-center justify-center text-center gap-1.5">
              <span className={`font-display font-black tracking-tighter uppercase italic transition-all ${
                isScrolled ? 'text-sm' : 'text-sm sm:text-xl'
              }`}>
                Gonnng
              </span>
            </div>
          </div>


          {/* Center Navigation tabs */}
          <nav className={`hidden md:flex items-center gap-1 p-1 rounded-2xl shadow-inner md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-10 transition-colors ${
            theme === 'light' ? 'bg-gray-200/80 border border-gray-300' : 'bg-[#141414] border border-white/15'
          }`}>
            <button
              id="nav-social-tab"
              onClick={() => handleTabChange('social')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'social' && !showTutorial 
                  ? 'bg-[#FF5C00] text-black font-black border border-[#FF5C00] shadow-[0_0_14px_rgba(255,92,0,0.35)]' 
                  : theme === 'light'
                    ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-300/60 border border-transparent'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Home className="w-4 h-4" /> Home
            </button>
            <button
              id="nav-coach-tab"
              onClick={() => handleTabChange('coach')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'coach' && !showTutorial 
                  ? 'bg-[#FF5C00] text-black font-black border border-[#FF5C00] shadow-[0_0_14px_rgba(255,92,0,0.35)]' 
                  : theme === 'light'
                    ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-300/60 border border-transparent'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
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
                  : theme === 'light'
                    ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-300/60 border border-transparent'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
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
              id="nav-profile-tab"
              onClick={() => handleTabChange('profile')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'profile' && !showTutorial 
                  ? 'bg-[#FF5C00] text-black font-black border border-[#FF5C00] shadow-[0_0_14px_rgba(255,92,0,0.35)]' 
                  : theme === 'light'
                    ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-300/60 border border-transparent'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {currentUser?.avatarUrl ? (
                <img 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.name || 'Profile'} 
                  className="w-4.5 h-4.5 rounded-full object-cover border border-white/30 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-4 h-4" />
              )}
              <span>Profile</span>
            </button>
          </nav>

          {/* Action Area / Filter Controller on the Right */}
          <div className="flex items-center gap-2 sm:gap-3">
            {activeTab === 'social' ? (
              /* All | Circle Toggle Filter in Upper Right Header (Feed View Only) */
              <div className={`flex items-center gap-1 p-1 rounded-xl border shadow-inner transition-colors ${
                theme === 'light' ? 'bg-gray-200/80 border-gray-300' : 'bg-white/10 border-white/15'
              }`}>
                <button
                  id="feed-filter-all"
                  onClick={() => setFeedFilter('all')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                    feedFilter === 'all' 
                      ? 'bg-[#FF5C00] text-black shadow-sm font-black' 
                      : theme === 'light' ? 'text-gray-700 hover:text-gray-900' : 'text-white/50 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  id="feed-filter-internal"
                  onClick={() => setFeedFilter('internal')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                    feedFilter === 'internal' 
                      ? 'bg-[#FF5C00] text-black shadow-sm font-black' 
                      : theme === 'light' ? 'text-gray-700 hover:text-gray-900' : 'text-white/50 hover:text-white'
                  }`}
                >
                  Circle
                </button>
              </div>
            ) : (activeTab === 'recipes' || activeTab === 'profile') ? (
              /* Hamburger Menu Button on Upper Banner Right Hand Side (Sand, Library, Profile) */
              <button
                type="button"
                id="header-profile-menu-btn"
                onClick={() => {
                  if (activeTab !== 'profile') {
                    updateRoute('workspace', undefined, 'profile');
                    setIsProfileSettingsOpen(true);
                  } else {
                    setIsProfileSettingsOpen(prev => !prev);
                  }
                }}
                className="p-1.5 sm:p-2 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black rounded-xl transition-all shadow-md flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
                title="Profile Settings"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </button>
            ) : null}
          </div>

        </div>

        {/* Global Header Progress Bar - Shrinks on scroll, number hides on scroll */}
        <div 
          className={`w-full relative overflow-hidden transition-all duration-300 ${
            theme === 'light' ? 'bg-gray-200' : 'bg-white/5'
          } ${
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
      <div className={`md:hidden fixed bottom-0 left-0 right-0 py-2 px-3 flex justify-around items-center z-50 shadow-2xl transition-colors border-t ${
        theme === 'light'
          ? 'bg-white/95 backdrop-blur-md border-gray-200 text-gray-900'
          : 'bg-[#0F0F0F]/95 backdrop-blur-md border-white/10 text-white'
      }`}>
        <button 
          onClick={() => handleTabChange('social')}
          className={`relative flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl text-[9px] font-bold transition-all cursor-pointer ${
            activeTab === 'social' && !showTutorial 
              ? 'text-[#FF5C00] bg-[#FF5C00]/10 border border-[#FF5C00]/50 shadow-[0_0_10px_rgba(255,92,0,0.2)]' 
              : theme === 'light' ? 'text-gray-500 hover:text-gray-900' : 'text-white/40 hover:text-white/70'
          }`}
        >
          {activeTab === 'social' && !showTutorial && (
            <span className="absolute -top-1 w-2 h-2 rounded-full bg-[#FF5C00] shadow-[0_0_8px_#FF5C00]" />
          )}
          <Home className="w-4.5 h-4.5" /> Home
        </button>
        <button 
          onClick={() => handleTabChange('coach')}
          className={`relative flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl text-[9px] font-bold transition-all cursor-pointer ${
            activeTab === 'coach' && !showTutorial 
              ? 'text-[#FF5C00] bg-[#FF5C00]/10 border border-[#FF5C00]/50 shadow-[0_0_10px_rgba(255,92,0,0.2)]' 
              : theme === 'light' ? 'text-gray-500 hover:text-gray-900' : 'text-white/40 hover:text-white/70'
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
              : theme === 'light' ? 'text-gray-500 hover:text-gray-900' : 'text-white/40 hover:text-white/70'
          }`}
        >
          {totalUnreadNotifications > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-mono font-black bg-[#FF5C00] text-black flex items-center justify-center shadow-md">
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
          onClick={() => handleTabChange('profile')}
          className={`relative flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl text-[9px] font-bold transition-all cursor-pointer ${
            activeTab === 'profile' && !showTutorial 
              ? 'text-[#FF5C00] bg-[#FF5C00]/10 border border-[#FF5C00]/50 shadow-[0_0_10px_rgba(255,92,0,0.2)]' 
              : theme === 'light' ? 'text-gray-500 hover:text-gray-900' : 'text-white/40 hover:text-white/70'
          }`}
        >
          {activeTab === 'profile' && !showTutorial && (
            <span className="absolute -top-1 w-2 h-2 rounded-full bg-[#FF5C00] shadow-[0_0_8px_#FF5C00]" />
          )}
          {currentUser?.avatarUrl ? (
            <img 
              src={currentUser.avatarUrl} 
              alt={currentUser.name || 'Profile'} 
              className="w-4.5 h-4.5 rounded-full object-cover border border-white/30 shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <User className="w-4.5 h-4.5" />
          )}
          <span>Profile</span>
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
              updateRoute('workspace', undefined, 'social');
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
                  theme={theme}
                  initialTab={activeTab === 'recipes' ? 'library' : 'projects'}
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
                  theme={theme}
                  onFollowToggle={handleToggleFollowCreator}
                  messageThreads={messageThreads}
                  onSendMessage={handleSendMessage}
                  onSelectPost={handleSelectPost}
                  onSelectRecipe={handleSelectRecipe}
                  onSelectUser={handleSelectUser}
                  activeCategory={updatesCategory}
                  setActiveCategory={setUpdatesCategory}
                  activeChatUser={updatesChatUser}
                  setActiveChatUser={setUpdatesChatUser}
                  onMarkThreadAsRead={handleMarkThreadAsRead}
                  onNotificationRead={() => setUnreadNotifsCount(prev => Math.max(0, prev - 1))}
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
                    theme={theme}
                    onBackToHome={() => setHomeViewCreatorProfile(null)}
                    onToggleFollow={handleToggleFollowCreator}
                    onUpdatePostGong={handleUpdatePostGong}
                    onAddComment={handleAddComment}
                    onToggleCommentHeart={handleToggleCommentHeart}
                    onOpenShareDrawer={(post) => {
                      setShareDrawerPost(post);
                      setIsShareDrawerOpen(true);
                    }}
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
                    theme={theme}
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
                  onUpdateUser={(updated) => setCurrentUser(updated)}
                  allCreators={creators}
                  onToggleFollowCreator={handleToggleFollowCreator}
                  onToggleCircleCreator={handleToggleCircleCreator}
                  onOpenPhilosophy={() => setShowPhilosophyModal(true)}
                  onOpenCreatorProfile={handleOpenCreatorProfile}
                  onSignOut={handleLogout}
                  theme={theme}
                  onToggleTheme={handleToggleTheme}
                  isSettingsDrawerOpen={isProfileSettingsOpen}
                  setIsSettingsDrawerOpen={setIsProfileSettingsOpen}
                  posts={posts}
                  onUpdatePostGong={handleUpdatePostGong}
                  onAddComment={handleAddComment}
                  onToggleCommentHeart={handleToggleCommentHeart}
                  setShowTutorial={setShowTutorial}
                  superimposedPost={(() => {
                    if (!profileSuperimposedPostId) return null;
                    const direct = posts.find(p => p.id === profileSuperimposedPostId) || 
                                   INITIAL_FEED_POSTS.find(p => p.id === profileSuperimposedPostId);
                    if (direct) return direct;
                    const fuzzy = posts.find(p => p.id.includes(profileSuperimposedPostId) || profileSuperimposedPostId.includes(p.id)) ||
                                  INITIAL_FEED_POSTS.find(p => p.id.includes(profileSuperimposedPostId) || profileSuperimposedPostId.includes(p.id));
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
          onAddPost={(post) => setPosts(prev => [post, ...prev])}
          forkInitialData={forkInitialData}
          editingRecipe={editingRecipe}
          theme={theme}
        />
      )}

      {/* Search recipes modal */}
      {showSearchModal && (
        <SearchRecipesModal
          onClose={() => setShowSearchModal(false)}
          recipes={recipes}
          creators={creators}
          communityRecipes={COMMUNITY_RECIPES}
          onSaveRecipe={handleSaveCommunityRecipe}
          onForkRecipe={handleForkCommunityRecipe}
          onToggleFollowCreator={handleToggleFollowCreator}
          onToggleCircleCreator={handleToggleCircleCreator}
        />
      )}

      {/* Gonnng Feedback Philosophy Manual Modal */}
      {showPhilosophyModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#121212] rounded-3xl p-6 md:p-8 max-w-xl w-full border border-white/10 shadow-2xl space-y-6"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#151515] rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl border border-white/10"
          >
            <div className="inline-flex w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-400 items-center justify-center text-3xl">
              🏆
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-display font-bold text-white">Gonnng! Finished.</h3>
              <p className="text-xs font-mono text-emerald-400 uppercase font-bold tracking-wider">
                Accountability Loop Complete
              </p>
              <h4 className="text-base font-bold text-emerald-400 font-mono pt-2">"{congratulateProject}"</h4>
              <p className="text-xs text-white/60 leading-relaxed pt-1.5">
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
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className={`w-full max-w-2xl max-h-[90vh] rounded-3xl p-5 sm:p-7 flex flex-col justify-between shadow-2xl border ${
              theme === 'light' ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#141414] border-white/15 text-white'
            }`}
          >
            <div className={`flex justify-between items-start pb-4 border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
              <div className="space-y-1 min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <span className="bg-[#FF5C00]/20 text-[#FF5C00] text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border border-[#FF5C00]/30">
                    {selectedRecipeModal.category}
                  </span>
                  <span className={`text-xs font-mono ${theme === 'light' ? 'text-gray-500' : 'text-white/50'}`}>
                    by {selectedRecipeModal.authorName}
                  </span>
                  {selectedRecipeModal.forkedFrom && (
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-flex items-center gap-1">
                      <GitFork className="w-3 h-3" /> Forked from {selectedRecipeModal.forkedFrom}
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-bold leading-tight">
                  {selectedRecipeModal.title}
                </h2>
                <p className={`text-xs sm:text-sm ${theme === 'light' ? 'text-gray-600' : 'text-white/70'}`}>
                  {selectedRecipeModal.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecipeModal(null)}
                className={`p-2 rounded-full transition-colors cursor-pointer shrink-0 ${
                  theme === 'light' ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white/70'
                }`}
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
                  className={`p-3.5 rounded-2xl border space-y-2 ${
                    theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'
                  }`}
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

            <div className={`pt-4 border-t flex flex-wrap items-center justify-end gap-2.5 ${
              theme === 'light' ? 'border-gray-200' : 'border-white/10'
            }`}>
              <button
                type="button"
                onClick={() => {
                  handleInstantiateRecipe(selectedRecipeModal);
                  setSelectedRecipeModal(null);
                }}
                className="px-4 py-2.5 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-bold text-xs rounded-xl transition-all cursor-pointer shadow flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Instantiate as Project
              </button>
              <button
                type="button"
                onClick={() => {
                  setForkInitialData(selectedRecipeModal);
                  setEditingRecipe(null);
                  setShowCreateModal(true);
                  setSelectedRecipeModal(null);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                  theme === 'light' ? 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300' : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                }`}
              >
                <GitFork className="w-4 h-4" /> Fork Blueprint
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

      {/* Footer Area */}
      <footer className="hidden md:block border-t border-white/10 bg-[#0A0A0A] py-6 mt-[24px] shrink-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-lg tracking-tighter uppercase italic text-white">Gonnng</span>
            <span className="text-white/40 font-mono text-[10px]">•</span>
            <span className="text-[11px] text-white/50 font-sans">Helping humans break ideas into parts and finish projects.</span>
          </div>
          <div className="text-[10px] font-mono text-white/40">
            Crafted with absolute dedication • 2026-07-15 08:44 UTC
          </div>
        </div>
      </footer>

    </div>
  );
}
