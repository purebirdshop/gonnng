import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Creator, FeedPost } from '../types';
import { dataService } from '../services/dataService';
import { isFollowingUser, isUserInCircle } from '../utils/followUtils';
import { 
  Bell, 
  UserPlus, 
  Info, 
  MessageSquare, 
  ArrowLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Send, 
  Check, 
  CheckCheck, 
  Sparkles, 
  Disc3, 
  Pencil, 
  Octagon, 
  ShieldCheck, 
  UserCheck, 
  MessageCircle,
  ShieldAlert,
  Lock,
  Clock,
  ExternalLink,
  Link,
  ArrowUpRight,
  Bookmark,
  GitFork,
  User,
  X
} from 'lucide-react';

function resolveCreatorAvatar(
  name?: string,
  id?: string,
  explicitUrl?: string,
  creators?: Creator[],
  currentUser?: Creator
): string {
  const isRealAvatar = (url?: string) => Boolean(url && url.trim() !== '' && !url.includes('ui-avatars.com'));

  if (isRealAvatar(explicitUrl)) {
    return explicitUrl!.trim();
  }

  const cleanName = name?.trim().toLowerCase();
  const cleanId = id?.trim();

  if (currentUser) {
    const isUserMatch = (cleanId && currentUser.id === cleanId) ||
      (cleanName && currentUser.name?.trim().toLowerCase() === cleanName) ||
      (cleanName && currentUser.username?.trim().toLowerCase() === cleanName);
    if (isUserMatch && isRealAvatar(currentUser.avatarUrl)) {
      return currentUser.avatarUrl!.trim();
    }
  }

  if (creators && creators.length > 0) {
    const match = creators.find(c => 
      (cleanId && c.id === cleanId) ||
      (cleanName && c.name?.trim().toLowerCase() === cleanName) ||
      (cleanName && c.username?.trim().toLowerCase() === cleanName)
    );
    if (match && isRealAvatar(match.avatarUrl)) {
      return match.avatarUrl!.trim();
    }
  }

  if (explicitUrl && explicitUrl.trim() !== '') {
    return explicitUrl.trim();
  }

  const displayName = name || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=F59E0B&color=fff`;
}

function InViewTile({
  isRead,
  onMarkRead,
  children,
  className,
  onClick
}: {
  key?: React.Key;
  isRead: boolean;
  onMarkRead: () => void;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const tileRef = React.useRef<HTMLDivElement | null>(null);
  const onMarkReadRef = React.useRef(onMarkRead);

  React.useEffect(() => {
    onMarkReadRef.current = onMarkRead;
  }, [onMarkRead]);

  React.useEffect(() => {
    if (isRead || !tileRef.current) return;

    const element = tileRef.current;
    if (typeof IntersectionObserver === 'undefined') {
      onMarkReadRef.current();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onMarkReadRef.current();
          }
        });
      },
      {
        threshold: 0.15
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [isRead]);

  return (
    <div ref={tileRef} className={className} onClick={onClick}>
      {children}
    </div>
  );
}

export interface PostNotification {
  id: string;
  postId: string;
  postTitle: string;
  postImage?: string;
  actorName: string;
  actorAvatar: string;
  actionType: 'comment' | 'gong_continue' | 'gong_refine' | 'gong_reconsider' | 'recipe_save' | 'recipe_fork';
  commentSnippet?: string;
  recipeId?: string;
  originalRecipeId?: string;
  timeString: string;
  timestamp: number;
  isRead: boolean;
}

export interface FollowerNotification {
  id: string;
  creator: Creator;
  timeString: string;
  timestamp: number;
  isRead: boolean;
}

export interface AppInfoNotification {
  id: string;
  title: string;
  subtitle: string;
  details?: string;
  category: 'Platform Release' | 'Feature Launch' | 'Account Notice' | 'System Update' | 'Gonnng Announcement';
  timeString: string;
  timestamp: number;
  isRead: boolean;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  status?: 'pending' | 'accepted';
  postThumbnail?: string;
  postId?: string;
}

export interface MessageThread {
  creator: Creator;
  messages: DirectMessage[];
  lastUpdated: number;
  unreadCount: number;
}

interface UpdatesViewProps {
  currentUser: Creator;
  creators: Creator[];
  posts: FeedPost[];
  onFollowToggle?: (creatorId: string) => void;
  messageThreads: MessageThread[];
  onSendMessage: (creatorId: string, text: string, postThumbnail?: string, postId?: string) => void;
  onSelectPost?: (postId: string, actionType?: 'comment' | 'vote' | 'shared_message') => void;
  onSelectRecipe?: (recipeId: string) => void;
  onSelectUser?: (creatorId: string) => void;
  activeCategory: null | 'updates' | 'followers' | 'appinfo';
  setActiveCategory: (cat: null | 'updates' | 'followers' | 'appinfo') => void;
  activeChatUser: Creator | null;
  setActiveChatUser: (user: Creator | null) => void;
  onMarkThreadAsRead?: (creatorId: string) => void;
  onNotificationRead?: (type: 'post' | 'follower' | 'appinfo', id: string) => void;
  onUnreadNotifsCountChange?: (count: number) => void;
}

export default function UpdatesView({
  currentUser,
  creators,
  posts,
  onFollowToggle,
  messageThreads,
  onSendMessage,
  onSelectPost,
  onSelectRecipe,
  onSelectUser,
  activeCategory,
  setActiveCategory,
  activeChatUser,
  setActiveChatUser,
  onMarkThreadAsRead,
  onNotificationRead,
  onUnreadNotifsCountChange
}: UpdatesViewProps) {

  // Base timestamp for test data calculations
  const baseTime = React.useMemo(() => Date.now(), []);

  // Default Post Notifications
  const defaultPostNotifications = React.useMemo<PostNotification[]>(() => [], []);

  // Default Follower Notifications
  const defaultFollowerNotifications = React.useMemo<FollowerNotification[]>(() => [], []);

  // Default App Info Notifications
  const defaultAppInfoNotifications = React.useMemo<AppInfoNotification[]>(() => [
    {
      id: 'anotif-1',
      title: 'Version 1.4 Released',
      subtitle: 'Introducing Recipe Forking and Project Sharing',
      details: 'Full Release Notes v1.4:\n• Process Blueprint Library fully synchronized with workspace state.\n• Unique post permalinks generated for direct sharing across public circles.\n• Integrated 1-on-1 direct messaging threads with post preview links.\n• Enhanced drill-down navigation and real-time activity filters.',
      category: 'Platform Release',
      timeString: '1h ago',
      timestamp: baseTime - 60 * 60 * 1000,
      isRead: false
    },
    {
      id: 'anotif-capacity',
      title: 'Process Engine Capacity Expanded',
      subtitle: 'Sand computation quotas increased by 500% for active creative architects.',
      details: 'Your workspace container now supports high-throughput real-time process monitoring and multi-step recipe executions without speed caps.',
      category: 'Feature Launch',
      timeString: '4h ago',
      timestamp: baseTime - 4 * 60 * 60 * 1000,
      isRead: false
    },
    {
      id: 'anotif-sync',
      title: 'Creative Architect Account Sync',
      subtitle: 'Your workspace state, Sand capacity metrics, and custom recipes are fully backed up.',
      details: 'Automated cloud snapshots are running smoothly. All project stages and process logs are cryptographically hashed and verified.',
      category: 'Account Notice',
      timeString: '1d ago',
      timestamp: baseTime - 24 * 60 * 60 * 1000,
      isRead: true
    },
    {
      id: 'anotif-community',
      title: 'Community Process Library Launch',
      subtitle: 'Explore 500+ curated workflow blueprints and fork recipes directly to your workspace.',
      details: 'Discover community blueprints across software design, mechanical engineering, fine art, and literature.',
      category: 'Gonnng Announcement',
      timeString: '3d ago',
      timestamp: baseTime - 3 * 24 * 60 * 60 * 1000,
      isRead: true
    }
  ], [baseTime]);

  // Persistent States
  const [postNotifications, setPostNotifications] = useState<PostNotification[]>(() => {
    const saved = localStorage.getItem('gonnng_post_notifs');
    if (saved) {
      try {
        const parsed: PostNotification[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const upgraded = parsed.filter(Boolean).map(item => {
            if (!item) return item;
            if (item.postId === 'post-[#1]') return { ...item, postId: 'post-user-1' };
            if (item.postId === 'post-[#2]') return { ...item, postId: 'post-user-1', recipeId: 'recipe-sandwich' };
            if (item.postId === 'post-[#3]') return { ...item, postId: 'post-user-1', recipeId: 'recipe-paint' };
            if (item.postId === 'post-[#4]') return { ...item, postId: 'post-viral-2' };
            if (item.postId === 'post-[#5]') return { ...item, postId: 'post-viral-3' };
            return item;
          }).filter(Boolean);
          return upgraded;
        }
      } catch (e) {}
    }
    return defaultPostNotifications;
  });

  const [followerNotifications, setFollowerNotifications] = useState<FollowerNotification[]>(() => {
    const saved = localStorage.getItem('gonnng_follower_notifs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return defaultFollowerNotifications;
  });

  const [appInfoNotifications, setAppInfoNotifications] = useState<AppInfoNotification[]>(() => {
    const saved = localStorage.getItem('gonnng_appinfo_notifs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return defaultAppInfoNotifications;
  });

  const [expandedAppInfoId, setExpandedAppInfoId] = useState<string | null>(null);
  const [chatInputText, setChatInputText] = useState('');

  // Track session unclicked unreads so tiles maintain "new" highlight when scrolled into view until clicked or view is re-opened
  const [sessionUnclickedUnreadIds, setSessionUnclickedUnreadIds] = useState<Set<string>>(new Set());
  const [userClickedIds, setUserClickedIds] = useState<Set<string>>(new Set());

  // Internal category state fallback to guarantee responsive UI click handling
  const [localCategory, setLocalCategory] = useState<null | 'updates' | 'followers' | 'appinfo'>(activeCategory);

  React.useEffect(() => {
    setLocalCategory(activeCategory);
  }, [activeCategory]);

  const effectiveCategory = localCategory !== undefined && localCategory !== null ? localCategory : activeCategory;

  React.useEffect(() => {
    setSessionUnclickedUnreadIds(new Set());
    setUserClickedIds(new Set());
  }, [effectiveCategory]);

  // Derive notifications from post_feedback table / local storage for authenticated user
  React.useEffect(() => {
    try {
      const storedFeedback = localStorage.getItem('gonnng_post_feedback');
      if (storedFeedback) {
        const feedbackList: any[] = JSON.parse(storedFeedback);
        if (Array.isArray(feedbackList) && feedbackList.length > 0) {
          const userPostIds = new Set(
            posts
              .filter(p => p && (p.userId === currentUser.id || (p as any).user_id === currentUser.id || p.userName === currentUser.name))
              .map(p => p.id)
          );
          
          const derivedNotifs: PostNotification[] = feedbackList
            .filter(f => f && typeof f === 'object' && (userPostIds.size === 0 || userPostIds.has(f.postId || f.post_id)))
            .map((f, idx) => {
              const fUserId = f.userId || f.user_id;
              const fPostId = f.postId || f.post_id;
              const fType = f.feedbackType || f.feedback_type;
              const actor = creators.find(c => c && (c.id === fUserId || c.publicId === fUserId || c.username === fUserId));
              const post = posts.find(p => p && p.id === fPostId);
              const actionType = fType === 'success' || fType === 'continue' ? 'gong_continue' : fType === 'promise' || fType === 'refine' ? 'gong_refine' : 'gong_reconsider';
              const createdTs = f.createdAt || f.created_at ? new Date(f.createdAt || f.created_at).getTime() : Date.now() - idx * 60000;
              const postImg = post?.media?.[0]?.resolvedUrl || post?.image || (post?.images && post.images[0]);
              return {
                id: `post-fb-${fPostId}-${fUserId}-${idx}`,
                actorName: actor?.name || 'Community Member',
                actorAvatar: actor?.avatarUrl || '',
                actionType: actionType as any,
                postTitle: post?.title || post?.description || 'Project Post',
                postImage: postImg,
                postId: fPostId,
                timeString: 'Recently',
                timestamp: createdTs,
                isRead: false
              };
            });

          if (derivedNotifs.length > 0) {
            setPostNotifications(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newItems = derivedNotifs.filter(d => !existingIds.has(d.id));
              if (newItems.length > 0) {
                return [...newItems, ...prev].sort((a, b) => b.timestamp - a.timestamp);
              }
              return prev;
            });
          }
        }
      }
    } catch (e) {
      console.error('Error deriving post_feedback notifications:', e);
    }
  }, [currentUser, posts, creators]);

  // Derive follower notifications from creators / followerIds for authenticated user
  React.useEffect(() => {
    if (currentUser && Array.isArray(creators)) {
      const myFollowers = creators.filter(c => 
        (currentUser.followerIds && currentUser.followerIds.includes(c.id)) ||
        (c.followingIds && c.followingIds.includes(currentUser.id))
      );

      if (myFollowers.length > 0) {
        const derivedFollowers: FollowerNotification[] = myFollowers.map((c, i) => ({
          id: `follower-derived-${c.id}`,
          creator: c,
          timeString: 'Recently',
          timestamp: Date.now() - i * 120000,
          isRead: false
        }));

        setFollowerNotifications(prev => {
          const existingCreatorIds = new Set(prev.map(p => p.creator.id));
          const newItems = derivedFollowers.filter(d => !existingCreatorIds.has(d.creator.id));
          if (newItems.length > 0) {
            return [...newItems, ...prev].sort((a, b) => b.timestamp - a.timestamp);
          }
          return prev;
        });
      }
    }
  }, [currentUser, creators]);

  // Fetch server-driven notifications and user read states from database
  React.useEffect(() => {
    const uid = currentUser?.id || 'user-current';

    dataService.getUserUpdateReads(uid).then(readsMap => {
      // 1. App Updates
      dataService.getAppUpdates().then(updates => {
        if (updates && updates.length > 0) {
          setAppInfoNotifications(updates.map(u => ({
            ...u,
            isRead: Boolean(readsMap[u.id])
          })));
        }
      });

      // 2. Post Notifications from database view
      dataService.getPostNotifications(uid).then(dbNotifs => {
        if (dbNotifs && dbNotifs.length > 0) {
          const mapped: PostNotification[] = dbNotifs.map(n => ({
            ...n,
            isRead: Boolean(readsMap[n.id])
          }));
          setPostNotifications(prev => {
            const serverIds = new Set(mapped.map(m => m.id));
            const localOnly = prev.filter(p => !serverIds.has(p.id));
            return [...mapped, ...localOnly].sort((a, b) => b.timestamp - a.timestamp);
          });
        }
      });

      // 3. Follower Notifications from database view
      dataService.getFollowerNotifications(uid).then(dbFollowers => {
        if (dbFollowers && dbFollowers.length > 0) {
          const mapped: FollowerNotification[] = dbFollowers.map(f => {
            const creatorMatch = creators.find(c => c.id === f.creatorId || c.name === f.actorName) || {
              id: f.creatorId,
              name: f.actorName,
              username: f.actorName.toLowerCase().replace(/\s+/g, ''),
              email: `${f.actorName.toLowerCase().replace(/\s+/g, '')}@gonnng.app`,
              avatarUrl: f.actorAvatar,
              bio: 'Creative member',
              goals: '',
              privacyDefault: 'public',
              followersCount: 1,
              followingCount: 0,
              isFollowing: true
            };
            return {
              id: f.id,
              creator: creatorMatch,
              timeString: f.timeString,
              timestamp: f.timestamp,
              isRead: Boolean(readsMap[f.id])
            };
          });
          setFollowerNotifications(prev => {
            const serverIds = new Set(mapped.map(m => m.id));
            const localOnly = prev.filter(p => !serverIds.has(p.id));
            return [...mapped, ...localOnly].sort((a, b) => b.timestamp - a.timestamp);
          });
        }
      });
    });
  }, [currentUser?.id, creators]);

  // Auto mark chat thread as read when activeChatUser is opened
  const onMarkThreadAsReadRef = React.useRef(onMarkThreadAsRead);
  React.useEffect(() => {
    onMarkThreadAsReadRef.current = onMarkThreadAsRead;
  });

  React.useEffect(() => {
    if (activeChatUser && onMarkThreadAsReadRef.current) {
      onMarkThreadAsReadRef.current(activeChatUser.id);
    }
  }, [activeChatUser]);

  // Save updates to localStorage on change
  React.useEffect(() => {
    localStorage.setItem('gonnng_post_notifs', JSON.stringify(postNotifications));
  }, [postNotifications]);

  React.useEffect(() => {
    localStorage.setItem('gonnng_follower_notifs', JSON.stringify(followerNotifications));
  }, [followerNotifications]);

  React.useEffect(() => {
    localStorage.setItem('gonnng_appinfo_notifs', JSON.stringify(appInfoNotifications));
  }, [appInfoNotifications]);

  // Unread Count Calculations
  const unreadUpdatesCount = postNotifications.filter(n => !n.isRead).length;
  const unreadFollowersCount = followerNotifications.filter(n => !n.isRead).length;
  const unreadAppInfoCount = appInfoNotifications.filter(n => !n.isRead).length;
  const totalUnreadNotifs = unreadUpdatesCount + unreadFollowersCount + unreadAppInfoCount;

  const onUnreadNotifsCountChangeRef = React.useRef(onUnreadNotifsCountChange);
  React.useEffect(() => {
    onUnreadNotifsCountChangeRef.current = onUnreadNotifsCountChange;
  });

  React.useEffect(() => {
    if (onUnreadNotifsCountChangeRef.current) {
      onUnreadNotifsCountChangeRef.current(totalUnreadNotifs);
    }
  }, [totalUnreadNotifs]);

  // Open Category Handler
  const handleOpenCategory = (cat: 'updates' | 'followers' | 'appinfo') => {
    setLocalCategory(cat);
    setActiveCategory(cat);
    setActiveChatUser(null);
  };

  const handleBackToMain = () => {
    setLocalCategory(null);
    setActiveCategory(null);
    setActiveChatUser(null);
  };

  // Helper to mark an individual item as read when clicked
  const handleMarkItemRead = (type: 'post' | 'follower' | 'appinfo', id: string) => {
    const uid = currentUser?.id || 'user-current';
    const updateTypeMap = { post: 'post_feedback', follower: 'follower', appinfo: 'app_info' } as const;
    dataService.markUpdateAsRead(uid, updateTypeMap[type], id);

    if (type === 'post') {
      setPostNotifications(prev => prev.map(item => item.id === id ? { ...item, isRead: true } : item));
    } else if (type === 'follower') {
      setFollowerNotifications(prev => prev.map(item => item.id === id ? { ...item, isRead: true } : item));
    } else if (type === 'appinfo') {
      setAppInfoNotifications(prev => prev.map(item => item.id === id ? { ...item, isRead: true } : item));
    }
    if (onNotificationRead) onNotificationRead(type, id);
  };

  // Sort Message Threads dynamically based on most recent activity
  const sortedThreads = React.useMemo(() => {
    return [...messageThreads].sort((a, b) => b.lastUpdated - a.lastUpdated);
  }, [messageThreads]);

  // Sorted notification categories (most recent at the top)
  const sortedPostNotifications = React.useMemo(() => {
    return [...postNotifications].sort((a, b) => b.timestamp - a.timestamp);
  }, [postNotifications]);

  const sortedFollowerNotifications = React.useMemo(() => {
    return [...followerNotifications].sort((a, b) => b.timestamp - a.timestamp);
  }, [followerNotifications]);

  const sortedAppInfoNotifications = React.useMemo(() => {
    return [...appInfoNotifications].sort((a, b) => b.timestamp - a.timestamp);
  }, [appInfoNotifications]);

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatUser || !chatInputText.trim()) return;

    onSendMessage(activeChatUser.id, chatInputText.trim());
    setChatInputText('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28 sm:pb-8 text-gray-900" id="updates-view-root">
      
      {/* Main Outer Container */}
      <div className="p-[18px] w-full min-w-0 rounded-none bg-white border-0 shadow-sm">
        
        <AnimatePresence mode="wait">
          {/* LEVEL 0: Main Updates Root View */}
          {effectiveCategory === null && activeChatUser === null && (
            <motion.div
              key="updates-level-0"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >

              {/* Parent Items & Conversations List */}
              <div className="space-y-3" id="updates-main-list">
                
                {/* 1. NOTIFICATIONS */}
                <div
                  id="parent-item-notifications"
                  onClick={() => handleOpenCategory('updates')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                    unreadUpdatesCount > 0
                      ? 'bg-orange-50/90 border-2 border-[#F59E0B] shadow-sm hover:bg-orange-100/90'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      unreadUpdatesCount > 0 ? 'bg-[#F59E0B] text-black font-black' : 'bg-gray-200 text-gray-800'
                    }`}>
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className={`text-sm ${unreadUpdatesCount > 0 ? 'font-black text-[#F59E0B]' : 'font-bold text-gray-900'}`}>
                        NOTIFICATIONS
                      </h3>
                      <p className="text-xs truncate text-gray-500">Activity on your posts, comments, saves & recipe forks</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {unreadUpdatesCount > 0 && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-black bg-[#F59E0B] text-black shadow-sm">
                        {unreadUpdatesCount}
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 transition-colors text-gray-400 group-hover:text-gray-900" />
                  </div>
                </div>

                {/* 2. NEW FOLLOWERS */}
                <div
                  id="parent-item-followers"
                  onClick={() => handleOpenCategory('followers')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                    unreadFollowersCount > 0
                      ? 'bg-orange-50/90 border-2 border-[#F59E0B] shadow-sm hover:bg-orange-100/90'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      unreadFollowersCount > 0 ? 'bg-[#F59E0B] text-black font-black' : 'bg-gray-200 text-gray-800'
                    }`}>
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className={`text-sm ${unreadFollowersCount > 0 ? 'font-black text-[#F59E0B]' : 'font-bold text-gray-900'}`}>
                        NEW FOLLOWERS
                      </h3>
                      <p className="text-xs truncate text-gray-500">Creators who recently started following your profile</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {unreadFollowersCount > 0 && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-black bg-[#F59E0B] text-black shadow-sm">
                        {unreadFollowersCount}
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 transition-colors text-gray-400 group-hover:text-gray-900" />
                  </div>
                </div>

                {/* 3. APP INFO */}
                <div
                  id="parent-item-appinfo"
                  onClick={() => handleOpenCategory('appinfo')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                    unreadAppInfoCount > 0
                      ? 'bg-orange-50/90 border-2 border-[#F59E0B] shadow-sm hover:bg-orange-100/90'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      unreadAppInfoCount > 0 ? 'bg-[#F59E0B] text-black font-black' : 'bg-gray-200 text-gray-800'
                    }`}>
                      <Info className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className={`text-sm ${unreadAppInfoCount > 0 ? 'font-black text-[#F59E0B]' : 'font-bold text-gray-900'}`}>
                        APP INFO
                      </h3>
                      <p className="text-xs truncate text-gray-500">Platform releases, feature launches & account notices</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {unreadAppInfoCount > 0 && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-black bg-[#F59E0B] text-black shadow-sm">
                        {unreadAppInfoCount}
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 transition-colors text-gray-400 group-hover:text-gray-900" />
                  </div>
                </div>

                {/* 4. DIRECT CONVERSATIONS (ORDERED BY MOST RECENT ACTIVITY) */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  {sortedThreads.length > 0 ? (
                    sortedThreads.map(thread => {
                      const lastMsg = thread.messages[thread.messages.length - 1];
                      const sharedMsg = [...thread.messages].reverse().find(m => m.postThumbnail || m.text.includes('gonnng.com/g/'));
                      const postThumbnail = sharedMsg?.postThumbnail || (
                        sharedMsg?.text.includes('The Great Wave') ? 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=800' : undefined
                      );

                      const threadAvatar = resolveCreatorAvatar(
                        thread.creator.name,
                        thread.creator.id,
                        thread.creator.avatarUrl,
                        creators,
                        currentUser
                      );

                      return (
                        <div
                          key={thread.creator.id}
                          id={`msg-thread-${thread.creator.id}`}
                          onClick={() => setActiveChatUser(thread.creator)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                            thread.unreadCount > 0
                              ? 'bg-orange-50/90 border-2 border-[#F59E0B] shadow-sm'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <img
                              src={threadAvatar}
                              alt={thread.creator.name}
                              className="w-10 h-10 rounded-full object-cover border border-gray-300 shrink-0"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(thread.creator.name || 'User')}&background=F59E0B&color=fff`;
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-xs font-bold truncate text-gray-900">{thread.creator.name}</h4>
                                <span className="text-[10px] font-mono text-gray-400 shrink-0">{lastMsg?.timestamp || 'Just now'}</span>
                              </div>
                              <p className="text-xs truncate text-gray-600 mt-0.5">
                                {lastMsg ? lastMsg.text : 'Click to start chatting...'}
                              </p>
                            </div>
                          </div>

                          {postThumbnail && (
                            <div className="ml-3 shrink-0 relative group-hover:scale-105 transition-transform">
                              <img
                                src={postThumbnail}
                                alt="Shared Post"
                                className="w-10 h-10 rounded-xl object-cover border border-[#F59E0B]/50"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute -bottom-1 -right-1 bg-[#F59E0B] text-black p-0.5 rounded-full shadow">
                                <ArrowUpRight className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {thread.unreadCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-[#F59E0B] text-black shadow">
                                {thread.unreadCount}
                              </span>
                            )}
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-gray-400 text-xs bg-gray-50 rounded-2xl border border-gray-200">
                      No active message threads.
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}

          {/* LEVEL 1: DRILL-DOWN CATEGORY VIEWS & DIRECT CHAT */}
          {(effectiveCategory !== null || activeChatUser !== null) && (
            <motion.div
              key={`updates-drilldown-${effectiveCategory || 'chat'}-${activeChatUser?.id || 'none'}`}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              {/* Header Toolbar for Category Views (Hidden in Direct Chat thread) */}
              {!activeChatUser && (
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <button
                    type="button"
                    id="updates-back-button"
                    onClick={handleBackToMain}
                    aria-label="Back"
                    title="Back"
                    className="p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer border bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300 shadow-sm"
                  >
                    <ArrowLeft className="w-5 h-5 text-[#F59E0B]" />
                  </button>

                  <h3 className="text-sm font-display font-black tracking-wider uppercase truncate max-w-[200px] sm:max-w-xs text-gray-900 text-center">
                    {effectiveCategory === 'updates'
                      ? 'Notifications'
                      : effectiveCategory === 'followers'
                      ? 'New Followers'
                      : 'App Info'}
                  </h3>

                  <div className="w-9" />
                </div>
              )}

              {/* 1. DRILL DOWN: NOTIFICATIONS (SORTED NEWEST FIRST) */}
              {effectiveCategory === 'updates' && !activeChatUser && (
                <div className="space-y-3" id="drilldown-updates-list">
                  {sortedPostNotifications.length > 0 ? (
                    sortedPostNotifications.map(n => {
                      const isUnread = (!n.isRead || sessionUnclickedUnreadIds.has(n.id)) && !userClickedIds.has(n.id);
                      const actorAvatar = resolveCreatorAvatar(
                        n.actorName,
                        (n as any).actorId,
                        n.actorAvatar,
                        creators,
                        currentUser
                      );
                      return (
                        <InViewTile
                          key={n.id}
                          isRead={n.isRead}
                          onMarkRead={() => {
                            handleMarkItemRead('post', n.id);
                            setSessionUnclickedUnreadIds(prev => new Set(prev).add(n.id));
                          }}
                          onClick={() => {
                            setUserClickedIds(prev => new Set(prev).add(n.id));
                            handleMarkItemRead('post', n.id);
                            if (n.actionType === 'recipe_save' || n.actionType === 'recipe_fork') {
                              if (onSelectRecipe) onSelectRecipe(n.originalRecipeId || n.recipeId || n.postId);
                            } else {
                              if (onSelectPost) onSelectPost(n.postId, n.actionType === 'comment' ? 'comment' : 'vote');
                            }
                          }}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 group ${
                            isUnread
                              ? 'bg-orange-50/90 border-2 border-[#F59E0B] shadow-sm hover:bg-orange-100/90'
                              : 'bg-gray-50 border-gray-200 hover:border-[#F59E0B]/50 hover:bg-gray-100/80'
                          } text-gray-900 relative`}
                        >
                          {isUnread && (
                            <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-sm animate-pulse" />
                          )}
                          <img
                            src={actorAvatar}
                            alt={n.actorName}
                            onClick={(e) => {
                              if (onSelectUser) {
                                e.stopPropagation();
                                const foundCreator = creators.find(c => c.name.toLowerCase() === n.actorName.toLowerCase() || c.username === n.actorName);
                                onSelectUser(foundCreator ? foundCreator.id : n.actorName);
                              }
                            }}
                            className="w-10 h-10 rounded-full object-cover border border-gray-300 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(n.actorName || 'User')}&background=F59E0B&color=fff`;
                            }}
                          />
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex items-center justify-between gap-2 pr-4">
                              <span 
                                onClick={(e) => {
                                  if (onSelectUser) {
                                    e.stopPropagation();
                                    const foundCreator = creators.find(c => c.name.toLowerCase() === n.actorName.toLowerCase() || c.username === n.actorName);
                                    onSelectUser(foundCreator ? foundCreator.id : n.actorName);
                                  }
                                }}
                                className="text-xs font-bold truncate text-gray-900 cursor-pointer hover:underline hover:text-[#F59E0B]"
                              >
                                {n.actorName}
                              </span>
                              <span className="text-[10px] font-mono shrink-0 text-gray-500">{n.timeString}</span>
                            </div>

                            <p className="text-xs leading-snug text-gray-700">
                              {n.actionType === 'comment' && (
                                <span>
                                  {n.commentSnippet?.startsWith('Replied') ? (
                                    <>
                                      {n.commentSnippet} on <strong className="text-gray-900 font-semibold">"{n.postTitle}"</strong>
                                    </>
                                  ) : (
                                    <>
                                      commented on <strong className="text-gray-900 font-semibold">"{n.postTitle}"</strong>
                                      {n.commentSnippet && <>: <span className="text-gray-800">"{n.commentSnippet}"</span></>}
                                    </>
                                  )}
                                </span>
                              )}
                              {n.actionType === 'recipe_save' && (
                                <span className="text-[#F59E0B] font-bold inline-flex items-center gap-1 flex-wrap">
                                  <Bookmark className="w-3.5 h-3.5 shrink-0" /> saved your recipe <strong className="text-gray-900 font-semibold">"{n.postTitle}"</strong> to Process Library
                                </span>
                              )}
                              {n.actionType === 'recipe_fork' && (
                                <span className="text-purple-600 font-bold inline-flex items-center gap-1 flex-wrap">
                                  <GitFork className="w-3.5 h-3.5 shrink-0" /> forked your recipe <strong className="text-gray-900 font-semibold">"{n.postTitle}"</strong> for her workspace
                                </span>
                              )}
                              {n.actionType === 'gong_continue' && (
                                <span className="text-emerald-600 font-bold inline-flex items-center gap-1 flex-wrap">
                                  <Disc3 className="w-3.5 h-3.5 shrink-0" /> cheered for you on <strong className="text-gray-900 font-semibold">"{n.postTitle}"</strong>
                                </span>
                              )}
                              {n.actionType === 'gong_refine' && (
                                <span className="text-[#F59E0B] font-bold inline-flex items-center gap-1 flex-wrap">
                                  <Pencil className="w-3.5 h-3.5 shrink-0" /> encouraged you to keep going on <strong className="text-gray-900 font-semibold">"{n.postTitle}"</strong>
                                </span>
                              )}
                              {n.actionType === 'gong_reconsider' && (
                                <span className="text-red-500 font-bold inline-flex items-center gap-1 flex-wrap">
                                  <Octagon className="w-3.5 h-3.5 shrink-0" /> suggested you try something new on <strong className="text-gray-900 font-semibold">"{n.postTitle}"</strong>
                                </span>
                              )}
                            </p>

                          </div>

                          {n.postImage && (
                            <img
                              src={n.postImage}
                              alt={n.postTitle}
                              className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </InViewTile>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 text-xs text-gray-400">No notifications yet.</div>
                  )}
                </div>
              )}

              {/* 2. DRILL DOWN: NEW FOLLOWERS (SORTED NEWEST FIRST) */}
              {effectiveCategory === 'followers' && !activeChatUser && (
                <div className="space-y-3" id="drilldown-followers-list">
                  {sortedFollowerNotifications.length > 0 ? (
                    sortedFollowerNotifications.map(f => {
                      const isUnread = (!f.isRead || sessionUnclickedUnreadIds.has(f.id)) && !userClickedIds.has(f.id);
                      const liveCreator = creators.find(c => 
                        c.id === f.creator.id || 
                        (c.username && f.creator.username && c.username.toLowerCase() === f.creator.username.toLowerCase()) ||
                        c.name.toLowerCase() === f.creator.name.toLowerCase()
                      ) || f.creator;

                      const isFollowing = isFollowingUser(currentUser, liveCreator.id, creators);
                      const username = `@${liveCreator.username || f.creator.username || liveCreator.name.toLowerCase().replace(/\s+/g, '')}`;

                      const followerAvatar = resolveCreatorAvatar(
                        liveCreator.name || f.creator.name,
                        liveCreator.id || f.creator.id,
                        liveCreator.avatarUrl || f.creator.avatarUrl,
                        creators,
                        currentUser
                      );

                      return (
                        <InViewTile
                          key={f.id}
                          isRead={f.isRead}
                          onMarkRead={() => {
                            handleMarkItemRead('follower', f.id);
                            setSessionUnclickedUnreadIds(prev => new Set(prev).add(f.id));
                          }}
                          onClick={() => {
                            setUserClickedIds(prev => new Set(prev).add(f.id));
                            handleMarkItemRead('follower', f.id);
                            if (onSelectUser) onSelectUser(liveCreator.id);
                          }}
                          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all cursor-pointer group ${
                            isUnread
                              ? 'bg-orange-50/90 border-2 border-[#F59E0B] shadow-sm hover:bg-orange-100/90'
                              : 'bg-gray-50 border-gray-200 hover:border-[#F59E0B]/50 hover:bg-gray-100/80'
                          } text-gray-900 relative`}
                        >
                          {isUnread && (
                            <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-sm animate-pulse" />
                          )}
                          <div className="flex items-center gap-3.5 min-w-0 pr-2">
                            <img
                              src={followerAvatar}
                              alt={liveCreator.name || f.creator.name}
                              className="w-11 h-11 rounded-full object-cover border border-gray-300 shrink-0"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(liveCreator.name || f.creator.name || 'User')}&background=F59E0B&color=fff`;
                              }}
                            />
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-bold truncate text-gray-900">{liveCreator.name || f.creator.name}</h4>
                                <span className="text-[11px] font-mono text-gray-500">{username}</span>
                              </div>
                              <p className="text-xs font-medium text-[#F59E0B] flex items-center gap-1.5">
                                <span>Started following you</span>
                                <span className="text-gray-400 font-mono text-[10px]">• {f.timeString}</span>
                              </p>
                              {(liveCreator.bio || f.creator.bio) && (
                                <p className="text-[11px] text-gray-600 line-clamp-1">{liveCreator.bio || f.creator.bio}</p>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUserClickedIds(prev => new Set(prev).add(f.id));
                              handleMarkItemRead('follower', f.id);
                              if (onFollowToggle) {
                                onFollowToggle(liveCreator.id);
                              }
                              setFollowerNotifications(prev => prev.map(item => {
                                if (item.id === f.id || item.creator.id === liveCreator.id) {
                                  return {
                                    ...item,
                                    creator: {
                                      ...item.creator,
                                      isFollowing: !isFollowing
                                    }
                                  };
                                }
                                return item;
                              }));
                            }}
                            className={`p-2 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                              isFollowing
                                ? 'bg-gray-200 text-gray-800 border border-gray-300 hover:bg-gray-300'
                                : 'bg-[#F59E0B] text-black font-black hover:bg-[#FF751A] shadow-sm'
                            }`}
                          >
                            {isFollowing ? (
                              <>
                                <UserCheck className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                <span className="hidden sm:inline">Following</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                <span className="hidden sm:inline">Follow Back</span>
                              </>
                            )}
                          </button>
                        </InViewTile>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 text-xs text-gray-400">No new followers yet.</div>
                  )}
                </div>
              )}

              {/* 3. DRILL DOWN: APP INFO (SORTED NEWEST FIRST) */}
              {effectiveCategory === 'appinfo' && !activeChatUser && (
                <div className="space-y-3" id="drilldown-appinfo-list">
                  {sortedAppInfoNotifications.length > 0 ? (
                    sortedAppInfoNotifications.map(a => {
                      const isExpanded = expandedAppInfoId === a.id;
                      const isUnread = (!a.isRead || sessionUnclickedUnreadIds.has(a.id)) && !userClickedIds.has(a.id);
                      return (
                        <InViewTile
                          key={a.id}
                          isRead={a.isRead}
                          onMarkRead={() => {
                            handleMarkItemRead('appinfo', a.id);
                            setSessionUnclickedUnreadIds(prev => new Set(prev).add(a.id));
                          }}
                          onClick={() => {
                            setUserClickedIds(prev => new Set(prev).add(a.id));
                            setExpandedAppInfoId(prev => prev === a.id ? null : a.id);
                            handleMarkItemRead('appinfo', a.id);
                          }}
                          className={`p-4 rounded-2xl border space-y-2 cursor-pointer transition-all ${
                            isUnread
                              ? 'bg-orange-50/90 border-2 border-[#F59E0B] shadow-sm hover:bg-orange-100/90'
                              : 'bg-gray-50 border-gray-200 hover:border-[#F59E0B]/40 hover:bg-gray-100/80'
                          } text-gray-900 relative`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                                {a.category}
                              </span>
                              {isUnread && (
                                <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-[#F59E0B] text-black">
                                  NEW
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-gray-500">{a.timeString}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                          </div>

                          <h4 className="text-sm font-bold text-gray-900">{a.title}</h4>
                          <p className="text-xs leading-relaxed text-gray-600">{a.subtitle}</p>

                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="pt-3 mt-2 border-t border-gray-200 text-xs text-gray-800 leading-relaxed font-sans bg-white/80 p-3 rounded-xl border border-gray-200 space-y-1.5"
                            >
                              <div className="whitespace-pre-line">
                                {a.details || "Full release notes: Process Blueprint library integrated, live messaging enabled, and circle updates synchronized across all workspaces."}
                              </div>
                            </motion.div>
                          )}
                        </InViewTile>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 px-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center mx-auto">
                        <Info className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-gray-900">No App Updates Yet</h4>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                          This view will display system notifications from Gonnng about platform releases, feature launches, and account notices.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* DIRECT CHAT SCREEN */}
              {activeChatUser && (
                <div className="space-y-4" id="drilldown-chat-screen">
                  {/* Chat User Header Bar (Centered user info with Left Chevron back button) */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl border bg-gray-100 border-gray-200 text-gray-900 shadow-sm">
                    <button
                      type="button"
                      id="chat-back-button"
                      onClick={() => setActiveChatUser(null)}
                      title="Back to Conversations"
                      className="p-2 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-200/80 transition-all cursor-pointer flex items-center justify-center shrink-0 border border-transparent hover:border-gray-300"
                    >
                      <ChevronLeft className="w-6 h-6 text-[#F59E0B] stroke-[2.5]" />
                    </button>

                    <div 
                      onClick={() => {
                        if (onSelectUser && activeChatUser) onSelectUser(activeChatUser.id);
                      }}
                      className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity mx-auto"
                    >
                      <img
                        src={resolveCreatorAvatar(
                          activeChatUser.name,
                          activeChatUser.id,
                          activeChatUser.avatarUrl,
                          creators,
                          currentUser
                        )}
                        alt={activeChatUser.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-[#F59E0B]/40 group-hover:border-[#F59E0B] transition-colors shrink-0 shadow-sm"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChatUser.name || 'User')}&background=F59E0B&color=fff`;
                        }}
                      />
                      <div className="text-center sm:text-left">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-[#F59E0B] transition-colors leading-tight">
                          {activeChatUser.name}
                        </h4>
                        <p className="text-[10px] sm:text-[11px] font-mono text-gray-500">
                          @{activeChatUser.username || activeChatUser.name.toLowerCase().replace(/\s+/g, '')}
                        </p>
                      </div>
                    </div>

                    <div className="w-10 shrink-0" />
                  </div>

                  {/* Message History */}
                  <div className="rounded-2xl p-4 min-h-[300px] max-h-[450px] overflow-y-auto space-y-3 border bg-gray-50 border-gray-200">
                    {(() => {
                      const thread = messageThreads.find(t => t.creator.id === activeChatUser.id);
                      const msgs = thread?.messages || [];
                      if (msgs.length === 0) {
                        return (
                          <div className="text-center py-12 text-xs text-gray-400">
                            No previous messages. Type a message below to start chatting!
                          </div>
                        );
                      }
                      return msgs.map(m => {
                        const isMe = m.senderId === currentUser.id || (currentUser.id === 'user-current' && m.senderId === 'user-current');
                        const isSharedPost = Boolean(m.postThumbnail || m.postId);
                        const postObj = m.postId ? posts.find(p => p.id === m.postId) : null;
                        const postTitle = postObj?.title || 'Shared Gonnng Blueprint';
                        const postImage = postObj?.image || m.postThumbnail;
                        const permalink = `gonnng.com/g/${m.postId || 'post-1'}`;

                        if (isSharedPost) {
                          return (
                            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div 
                                onClick={() => {
                                  if (onSelectPost) {
                                    onSelectPost(m.postId || 'post-1', 'shared_message');
                                  }
                                }}
                                className={`w-full max-w-sm rounded-2xl p-3 border transition-all cursor-pointer group shadow-md hover:border-[#F59E0B] ${
                                  isMe
                                    ? 'bg-[#F59E0B]/10 border-[#F59E0B]/50 text-black'
                                    : 'bg-white border-gray-300 text-gray-900 hover:shadow-lg'
                                }`}
                              >
                                {postImage && (
                                  <div className="w-full h-44 sm:h-52 rounded-xl overflow-hidden mb-2.5 border border-black/10 bg-black/50 relative">
                                    <img
                                      src={postImage}
                                      alt={postTitle}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono font-bold text-[#F59E0B] border border-[#F59E0B]/30 uppercase">
                                      Shared from {isMe ? 'You' : (activeChatUser ? activeChatUser.name : 'Message Thread')}
                                    </div>
                                  </div>
                                )}

                                <h4 className="text-xs sm:text-sm font-bold leading-tight mb-1.5 group-hover:text-[#F59E0B] transition-colors text-gray-900">
                                  {postTitle}
                                </h4>

                                <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-[#F59E0B] pt-1">
                                  <div className="flex items-center gap-1 min-w-0">
                                    <Link className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{permalink}</span>
                                  </div>
                                  <div className="flex items-center gap-0.5 shrink-0 font-sans font-bold group-hover:translate-x-0.5 transition-transform">
                                    <span>View</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  </div>
                                </div>

                                <div className={`text-[9px] font-mono text-right mt-1.5 ${
                                  isMe ? 'text-black/60' : 'text-gray-400'
                                }`}>
                                  {m.timestamp}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={m.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed space-y-1.5 ${
                              isMe
                                ? 'bg-[#F59E0B] text-black font-semibold rounded-br-none shadow'
                                : 'bg-white text-gray-900 border border-gray-200 shadow-sm rounded-bl-none'
                            }`}>
                              <p>{m.text}</p>

                              <div className={`text-[9px] font-mono text-right ${
                                isMe ? 'text-black/60' : 'text-gray-400'
                              }`}>
                                {m.timestamp}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Chat Input Bar */}
                  <form onSubmit={handleSendChatMessage} className="flex flex-col gap-1">
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          maxLength={1400}
                          value={chatInputText}
                          onChange={(e) => setChatInputText(e.target.value)}
                          placeholder={`Message @${activeChatUser?.username || activeChatUser?.name.toLowerCase().replace(/\s+/g, '')}...`}
                          className="w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-[#F59E0B] bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 pr-16"
                        />
                        {chatInputText.length > 0 && (
                          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono select-none pointer-events-none transition-colors ${
                            chatInputText.length >= 1350 ? 'text-amber-600 font-bold' : 'text-gray-400'
                          }`}>
                            {chatInputText.length}/1400
                          </span>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={!chatInputText.trim()}
                        className="px-4 py-2.5 bg-[#F59E0B] hover:bg-[#FF751A] disabled:opacity-40 text-black font-black rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow shrink-0"
                      >
                        <Send className="w-4 h-4" /> Send
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
