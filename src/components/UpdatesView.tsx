import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Creator, FeedPost } from '../types';
import { 
  Bell, 
  UserPlus, 
  Info, 
  MessageSquare, 
  ArrowLeft, 
  ChevronRight, 
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
  Clock,
  ExternalLink,
  Link,
  ArrowUpRight,
  Bookmark,
  GitFork
} from 'lucide-react';

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
  isRead: boolean;
}

export interface FollowerNotification {
  id: string;
  creator: Creator;
  timeString: string;
  isRead: boolean;
}

export interface AppInfoNotification {
  id: string;
  title: string;
  subtitle: string;
  category: 'System Update' | 'Account Notice' | 'Gonnng Announcement';
  timeString: string;
  isRead: boolean;
}

export interface DirectMessage {
  id: string;
  senderId: string; // 'user-current' or creator ID
  text: string;
  timestamp: string; // ISO string or relative time
  isRead: boolean;
  postThumbnail?: string;
  postId?: string;
}

export interface MessageThread {
  creator: Creator;
  messages: DirectMessage[];
  lastUpdated: number; // timestamp in ms for sorting
  unreadCount: number;
}

interface UpdatesViewProps {
  currentUser: Creator;
  creators: Creator[];
  posts: FeedPost[];
  theme?: 'dark' | 'light';
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
}

export default function UpdatesView({
  currentUser,
  creators,
  posts,
  theme = 'dark',
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
  onNotificationRead
}: UpdatesViewProps) {

  // Unread Tracking States
  const [postNotifications, setPostNotifications] = useState<PostNotification[]>([
    {
      id: 'pnotif-1',
      postId: 'post-user-1',
      postTitle: 'My Custom Portfolio Framework Initiated',
      postImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800',
      actorName: 'Clara Monet',
      actorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
      actionType: 'gong_continue',
      timeString: '10m ago',
      isRead: false
    },
    {
      id: 'pnotif-recipe-save',
      postId: 'recipe-custom-1784771489038',
      recipeId: 'recipe-custom-1784771489038',
      postTitle: 'Full-Stack Web App Blueprint',
      postImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600',
      actorName: 'Ada Lovelace',
      actorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
      actionType: 'recipe_save',
      commentSnippet: 'Saved your recipe "Full-Stack Web App Blueprint" to her Process Library!',
      timeString: '15m ago',
      isRead: false
    },
    {
      id: 'pnotif-recipe-fork',
      postId: 'recipe-custom-1784771489038',
      recipeId: 'recipe-custom-1784771489038',
      originalRecipeId: 'recipe-custom-1784771489038',
      postTitle: 'Modular Design System',
      postImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=600',
      actorName: 'Clara Monet',
      actorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
      actionType: 'recipe_fork',
      commentSnippet: 'Forked your recipe "Modular Design System" for her own creative workspace!',
      timeString: '40m ago',
      isRead: false
    },
    {
      id: 'pnotif-2',
      postId: 'post-user-1',
      postTitle: 'My Custom Portfolio Framework Initiated',
      postImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800',
      actorName: 'Ada Lovelace',
      actorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
      actionType: 'comment',
      commentSnippet: 'The 3-phase structural breakdown is crisp. What font pairing are you considering for display headers?',
      timeString: '1h ago',
      isRead: false
    },
    {
      id: 'pnotif-3',
      postId: 'post-viral-2',
      postTitle: 'Analytical Engine: Universal Bernoulli Algorithm Published',
      postImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
      actorName: 'Satoshi Nakamoto',
      actorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
      actionType: 'comment',
      commentSnippet: 'Replied to your comment: Pure cryptographic logic. Mechanical state machines proving truth...',
      timeString: '3h ago',
      isRead: false
    },
    {
      id: 'pnotif-4',
      postId: 'post-user-2',
      postTitle: '✓ Select 5 best creative works to highlight',
      postImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
      actorName: 'Bruce Wayne',
      actorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
      actionType: 'gong_refine',
      timeString: '5h ago',
      isRead: false
    }
  ]);

  const [followerNotifications, setFollowerNotifications] = useState<FollowerNotification[]>([
    {
      id: 'fnotif-1',
      creator: creators.find(c => c.id === 'creator-ada') || {
        id: 'creator-ada',
        name: 'Ada Lovelace',
        email: 'ada@analytical.org',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
        bio: 'Mathematician modeling complex analytical loops.',
        goals: 'Complete simulator logic.',
        privacyDefault: 'public',
        followersCount: 2890,
        followingCount: 88,
        isFollowing: true
      },
      timeString: '2h ago',
      isRead: false
    },
    {
      id: 'fnotif-2',
      creator: creators.find(c => c.id === 'creator-clara') || {
        id: 'creator-clara',
        name: 'Clara Monet',
        email: 'clara@impressionism.art',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
        bio: 'Impressionist painter mapping natural light cycles.',
        goals: 'Exhibition of 10 water lily panels.',
        privacyDefault: 'public',
        followersCount: 1420,
        followingCount: 45,
        isFollowing: true
      },
      timeString: '1d ago',
      isRead: false
    }
  ]);

  const [appInfoNotifications, setAppInfoNotifications] = useState<AppInfoNotification[]>([
    {
      id: 'anotif-1',
      title: 'Gonnng Platform v2.4 Live Release',
      subtitle: 'Process Blueprint Library integrated into Sand Engine. Unique post permalinks and direct messaging updates now active.',
      category: 'System Update',
      timeString: '1h ago',
      isRead: false
    },
    {
      id: 'anotif-2',
      title: 'Creative Architect Account Sync',
      subtitle: 'Your workspace state, Sand capacity metrics, and custom recipes are fully backed up and secured.',
      category: 'Account Notice',
      timeString: '2d ago',
      isRead: true
    }
  ]);

  const [chatInputText, setChatInputText] = useState('');

  // Auto mark chat thread as read when activeChatUser is opened
  React.useEffect(() => {
    if (activeChatUser && onMarkThreadAsRead) {
      onMarkThreadAsRead(activeChatUser.id);
    }
  }, [activeChatUser, onMarkThreadAsRead]);

  // Unread Count Calculations
  const unreadUpdatesCount = postNotifications.filter(n => !n.isRead).length;
  const unreadFollowersCount = followerNotifications.filter(n => !n.isRead).length;
  const unreadAppInfoCount = appInfoNotifications.filter(n => !n.isRead).length;

  // Open Parent Item Handler
  const handleOpenCategory = (cat: 'updates' | 'followers' | 'appinfo') => {
    setActiveCategory(cat);
    setActiveChatUser(null);

    // Mark items as read when parent category is opened
    if (cat === 'updates') {
      setPostNotifications(prev => prev.map(p => ({ ...p, isRead: true })));
    } else if (cat === 'followers') {
      setFollowerNotifications(prev => prev.map(f => ({ ...f, isRead: true })));
    } else if (cat === 'appinfo') {
      setAppInfoNotifications(prev => prev.map(a => ({ ...a, isRead: true })));
    }
  };

  // Sort Message Threads dynamically based on most recent activity
  const sortedThreads = [...messageThreads].sort((a, b) => b.lastUpdated - a.lastUpdated);

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatUser || !chatInputText.trim()) return;

    onSendMessage(activeChatUser.id, chatInputText.trim());
    setChatInputText('');
  };

  return (
    <div className={`max-w-4xl mx-auto space-y-6 pb-28 sm:pb-8 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`} id="updates-view-root">
      
      {/* Container Box */}
      <div className={`p-4 sm:p-6 w-full min-w-0 rounded-none ${
        theme === 'light' ? 'bg-white border-4 border-gray-200 shadow-md' : 'bg-black border-[10px] border-white/5 shadow-2xl'
      }`}>
        
        {/* LEVEL 0: Main Parent View (Contains Updates, Followers, App Info, and Conversation Heading Tiles directly) */}
        {activeCategory === null && activeChatUser === null && (
          <motion.div
            key="updates-level-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Header Banner */}
            <div className={`flex justify-between items-center pb-4 border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FF5C00]/15 border border-[#FF5C00]/30 flex items-center justify-center text-[#FF5C00]">
                  <Bell className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className={`text-base font-display font-bold uppercase tracking-wider ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Updates & Activity</h2>
                  <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-white/50'}`}>Notifications, followers, announcements, and direct conversations.</p>
                </div>
              </div>
            </div>

            {/* Parent Items & Conversations in Main List */}
            <div className="space-y-3" id="updates-main-list">
              
              {/* 1. UPDATES */}
              <div
                id="parent-item-updates"
                onClick={() => handleOpenCategory('updates')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                  unreadUpdatesCount > 0
                    ? theme === 'light' ? 'bg-orange-50 border-2 border-[#FF5C00] shadow-sm' : 'bg-[#181818] border-2 border-[#FF5C00] shadow-[0_0_15px_rgba(255,92,0,0.15)]'
                    : theme === 'light' ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300' : 'bg-[#121212] border-white/10 hover:border-white/25 hover:bg-[#181818]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    unreadUpdatesCount > 0 ? 'bg-[#FF5C00] text-black font-black' : theme === 'light' ? 'bg-gray-200 text-gray-800' : 'bg-white/10 text-white'
                  }`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-sm ${unreadUpdatesCount > 0 ? 'font-black text-[#FF5C00]' : theme === 'light' ? 'font-bold text-gray-900' : 'font-bold text-white'}`}>
                      UPDATES
                    </h3>
                    <p className={`text-xs truncate ${theme === 'light' ? 'text-gray-500' : 'text-white/50'}`}>Notifications about your posts, feedback & comments</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {unreadUpdatesCount > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-black bg-[#FF5C00] text-black shadow-md">
                      {unreadUpdatesCount}
                    </span>
                  )}
                  <ChevronRight className={`w-5 h-5 transition-colors ${theme === 'light' ? 'text-gray-400 group-hover:text-gray-900' : 'text-white/40 group-hover:text-white'}`} />
                </div>
              </div>

              {/* 2. NEW FOLLOWERS */}
              <div
                id="parent-item-followers"
                onClick={() => handleOpenCategory('followers')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                  unreadFollowersCount > 0
                    ? theme === 'light' ? 'bg-orange-50 border-2 border-[#FF5C00] shadow-sm' : 'bg-[#181818] border-2 border-[#FF5C00] shadow-[0_0_15px_rgba(255,92,0,0.15)]'
                    : theme === 'light' ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300' : 'bg-[#121212] border-white/10 hover:border-white/25 hover:bg-[#181818]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    unreadFollowersCount > 0 ? 'bg-[#FF5C00] text-black font-black' : theme === 'light' ? 'bg-gray-200 text-gray-800' : 'bg-white/10 text-white'
                  }`}>
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-sm ${unreadFollowersCount > 0 ? 'font-black text-[#FF5C00]' : theme === 'light' ? 'font-bold text-gray-900' : 'font-bold text-white'}`}>
                      NEW FOLLOWERS
                    </h3>
                    <p className={`text-xs truncate ${theme === 'light' ? 'text-gray-500' : 'text-white/50'}`}>Creators who recently started following your profile</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {unreadFollowersCount > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-black bg-[#FF5C00] text-black shadow-md">
                      {unreadFollowersCount}
                    </span>
                  )}
                  <ChevronRight className={`w-5 h-5 transition-colors ${theme === 'light' ? 'text-gray-400 group-hover:text-gray-900' : 'text-white/40 group-hover:text-white'}`} />
                </div>
              </div>

              {/* 3. APP INFO */}
              <div
                id="parent-item-appinfo"
                onClick={() => handleOpenCategory('appinfo')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                  unreadAppInfoCount > 0
                    ? theme === 'light' ? 'bg-orange-50 border-2 border-[#FF5C00] shadow-sm' : 'bg-[#181818] border-2 border-[#FF5C00] shadow-[0_0_15px_rgba(255,92,0,0.15)]'
                    : theme === 'light' ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300' : 'bg-[#121212] border-white/10 hover:border-white/25 hover:bg-[#181818]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    unreadAppInfoCount > 0 ? 'bg-[#FF5C00] text-black font-black' : theme === 'light' ? 'bg-gray-200 text-gray-800' : 'bg-white/10 text-white'
                  }`}>
                    <Info className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-sm ${unreadAppInfoCount > 0 ? 'font-black text-[#FF5C00]' : theme === 'light' ? 'font-bold text-gray-900' : 'font-bold text-white'}`}>
                      APP INFO
                    </h3>
                    <p className={`text-xs truncate ${theme === 'light' ? 'text-gray-500' : 'text-white/50'}`}>System updates, Gonnng announcements & account notices</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {unreadAppInfoCount > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-black bg-[#FF5C00] text-black shadow-md">
                      {unreadAppInfoCount}
                    </span>
                  )}
                  <ChevronRight className={`w-5 h-5 transition-colors ${theme === 'light' ? 'text-gray-400 group-hover:text-gray-900' : 'text-white/40 group-hover:text-white'}`} />
                </div>
              </div>

              {/* DIRECT CONVERSATION TILES (MOVED OUT OF MESSAGES INTO MAIN LIST, SORTED BY MOST RECENT) */}
              <div className={`pt-4 border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/10'} space-y-3`}>
                <div className="flex items-center justify-between pb-1">
                  <h4 className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${theme === 'light' ? 'text-gray-500' : 'text-white/50'}`}>
                    <MessageSquare className="w-3.5 h-3.5 text-[#FF5C00]" /> Direct Conversations
                  </h4>
                  <span className={`text-[10px] font-mono ${theme === 'light' ? 'text-gray-400' : 'text-white/40'}`}>{sortedThreads.length} Active</span>
                </div>

                {sortedThreads.length > 0 ? (
                  sortedThreads.map(thread => {
                    const lastMsg = thread.messages[thread.messages.length - 1];
                    // Find if any message in thread shared a post thumbnail
                    const sharedMsg = [...thread.messages].reverse().find(m => m.postThumbnail || m.text.includes('gonnng.com/g/'));
                    const postThumbnail = sharedMsg?.postThumbnail || (
                      sharedMsg?.text.includes('The Great Wave') ? 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=800' : undefined
                    );

                    return (
                      <div
                        key={thread.creator.id}
                        id={`msg-thread-${thread.creator.id}`}
                        onClick={() => setActiveChatUser(thread.creator)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                          thread.unreadCount > 0
                            ? theme === 'light' ? 'bg-orange-50 border-2 border-[#FF5C00]' : 'bg-[#181818] border-2 border-[#FF5C00]'
                            : theme === 'light' ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300' : 'bg-[#121212] border-white/10 hover:border-white/25 hover:bg-[#181818]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={thread.creator.avatarUrl}
                            alt={thread.creator.name}
                            className={`w-11 h-11 rounded-full object-cover border shrink-0 ${theme === 'light' ? 'border-gray-300' : 'border-white/20'}`}
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className={`text-xs ${thread.unreadCount > 0 ? 'font-black text-[#FF5C00]' : theme === 'light' ? 'font-bold text-gray-900' : 'font-bold text-white'}`}>
                                {thread.creator.name}
                              </h4>
                              <span className={`text-[10px] font-mono truncate ${theme === 'light' ? 'text-gray-400' : 'text-white/40'}`}>
                                @{thread.creator.name.toLowerCase().replace(/\s+/g, '')}
                              </span>
                            </div>
                            <p className={`text-xs truncate mt-0.5 ${theme === 'light' ? 'text-gray-600' : 'text-white/70'}`}>
                              {lastMsg ? lastMsg.text : 'Tap to start conversation'}
                            </p>
                          </div>
                        </div>

                        {/* Shared Post Image Thumbnail on Conversation Tile */}
                        {postThumbnail && (
                          <div className="relative ml-2 mr-1 shrink-0 group-hover:scale-105 transition-transform">
                            <img
                              src={postThumbnail}
                              alt="Shared Post"
                              className="w-10 h-10 rounded-xl object-cover border border-[#FF5C00]/40 shadow"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-[#FF5C00] text-black p-0.5 rounded-full shadow">
                              <ArrowUpRight className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {thread.unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-[#FF5C00] text-black shadow">
                              {thread.unreadCount}
                            </span>
                          )}
                          <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-white/40 text-xs bg-white/5 rounded-2xl border border-white/10">
                    No active message threads.
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}

        {/* DRILL-DOWN VIEWS & DIRECT CHAT */}
        {(activeCategory !== null || activeChatUser !== null) && (
          <motion.div
            key={`updates-drilldown-${activeCategory || 'none'}-${activeChatUser?.id || 'none'}`}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="space-y-6"
          >
            {/* Header Toolbar: Back Button on Top Left, Centered Title */}
            <div className={`grid grid-cols-3 items-center pb-4 border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
              {/* Top Left Back Button */}
              <div className="justify-self-start">
                <button
                  type="button"
                  id="updates-back-button"
                  onClick={() => {
                    if (activeChatUser) {
                      setActiveChatUser(null);
                    } else {
                      setActiveCategory(null);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    theme === 'light' 
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300' 
                      : 'bg-white/5 hover:bg-white/15 text-white border-white/10'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4 text-[#FF5C00]" /> Back
                </button>
              </div>

              {/* Centered Title */}
              <div className="justify-self-center text-center">
                <h3 className={`text-sm font-display font-black tracking-wider uppercase truncate max-w-[180px] sm:max-w-xs ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  {activeChatUser
                    ? activeChatUser.name
                    : activeCategory === 'updates'
                    ? 'Post Updates'
                    : activeCategory === 'followers'
                    ? 'New Followers'
                    : 'App Info'}
                </h3>
              </div>

              {/* Right Spacer */}
              <div className="justify-self-end"></div>
            </div>

            {/* 1. DRILL DOWN: UPDATES (POST NOTIFICATIONS - PERMALINKS TO POST ON FEED) */}
            {activeCategory === 'updates' && !activeChatUser && (
              <div className="space-y-3" id="drilldown-updates-list">
                {postNotifications.length > 0 ? (
                  postNotifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setPostNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item));
                        if (onNotificationRead) onNotificationRead('post', n.id);
                        if (n.actionType === 'recipe_save' || n.actionType === 'recipe_fork') {
                          if (onSelectRecipe) onSelectRecipe(n.originalRecipeId || n.recipeId || n.postId);
                        }
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 group shadow-sm ${
                        theme === 'light'
                          ? 'bg-gray-50 border-gray-200 hover:border-[#FF5C00] hover:bg-gray-100/80 text-gray-900'
                          : 'bg-[#121212] border-white/10 hover:border-[#FF5C00] text-white'
                      }`}
                    >
                      <img
                        src={n.actorAvatar}
                        alt={n.actorName}
                        className={`w-10 h-10 rounded-full object-cover border shrink-0 ${theme === 'light' ? 'border-gray-300' : 'border-white/20'}`}
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-bold truncate ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{n.actorName}</span>
                          <span className={`text-[10px] font-mono shrink-0 ${theme === 'light' ? 'text-gray-400' : 'text-white/40'}`}>{n.timeString}</span>
                        </div>

                        <p className={`text-xs leading-snug ${theme === 'light' ? 'text-gray-700' : 'text-white/80'}`}>
                          {n.actionType === 'comment' && (
                            <span>
                              {n.commentSnippet?.startsWith('Replied') ? (
                                <>
                                  {n.commentSnippet} on <strong className={theme === 'light' ? 'text-gray-900 font-semibold' : 'text-white font-semibold'}>"{n.postTitle}"</strong>
                                </>
                              ) : (
                                <>
                                  commented on <strong className={theme === 'light' ? 'text-gray-900 font-semibold' : 'text-white font-semibold'}>"{n.postTitle}"</strong>
                                  {n.commentSnippet && <>: <span className={theme === 'light' ? 'text-gray-800' : 'text-white/90'}>"{n.commentSnippet}"</span></>}
                                </>
                              )}
                            </span>
                          )}
                          {n.actionType === 'recipe_save' && (
                            <span className="text-[#FF5C00] font-bold inline-flex items-center gap-1 flex-wrap">
                              <Bookmark className="w-3.5 h-3.5 shrink-0" /> saved your recipe <strong className={theme === 'light' ? 'text-gray-900 font-semibold' : 'text-white font-semibold'}>"{n.postTitle}"</strong> to Process Library
                            </span>
                          )}
                          {n.actionType === 'recipe_fork' && (
                            <span className="text-purple-400 font-bold inline-flex items-center gap-1 flex-wrap">
                              <GitFork className="w-3.5 h-3.5 shrink-0" /> forked your recipe <strong className={theme === 'light' ? 'text-gray-900 font-semibold' : 'text-white font-semibold'}>"{n.postTitle}"</strong> for her workspace
                            </span>
                          )}
                          {n.actionType === 'gong_continue' && (
                            <span className="text-emerald-600 font-bold inline-flex items-center gap-1 flex-wrap">
                              <Disc3 className="w-3.5 h-3.5 shrink-0" /> voted Continue on <strong className={theme === 'light' ? 'text-gray-900 font-semibold' : 'text-white font-semibold'}>"{n.postTitle}"</strong>
                            </span>
                          )}
                          {n.actionType === 'gong_refine' && (
                            <span className="text-[#FF5C00] font-bold inline-flex items-center gap-1 flex-wrap">
                              <Pencil className="w-3.5 h-3.5 shrink-0" /> voted Refine on <strong className={theme === 'light' ? 'text-gray-900 font-semibold' : 'text-white font-semibold'}>"{n.postTitle}"</strong>
                            </span>
                          )}
                          {n.actionType === 'gong_reconsider' && (
                            <span className="text-red-500 font-bold inline-flex items-center gap-1 flex-wrap">
                              <Octagon className="w-3.5 h-3.5 shrink-0" /> voted Reconsider on <strong className={theme === 'light' ? 'text-gray-900 font-semibold' : 'text-white font-semibold'}>"{n.postTitle}"</strong>
                            </span>
                          )}
                        </p>

                        {/* Permalink Badge */}
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#FF5C00] pt-0.5 group-hover:underline">
                          <Link className="w-3 h-3 text-[#FF5C00]" />
                          <span>
                            {n.actionType === 'recipe_save' || n.actionType === 'recipe_fork'
                              ? `gonnng.com/r/${n.originalRecipeId || n.recipeId || n.postId}`
                              : `gonnng.com/g/${n.postId}`}
                          </span>
                          {(n.actionType === 'recipe_save' || n.actionType === 'recipe_fork') && (
                            <span className={`font-sans ${theme === 'light' ? 'text-gray-400' : 'text-white/40'}`}>
                              • Click to view on Process view →
                            </span>
                          )}
                        </div>
                      </div>

                      {n.postImage && (
                        <img
                          src={n.postImage}
                          alt={n.postTitle}
                          className={`w-12 h-12 rounded-xl object-cover border shrink-0 ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <div className={`text-center py-10 text-xs ${theme === 'light' ? 'text-gray-400' : 'text-white/40'}`}>No post updates yet.</div>
                )}
              </div>
            )}

            {/* 2. DRILL DOWN: NEW FOLLOWERS (PERMALINKS TO USER PROFILE ON HOME VIEW) */}
            {activeCategory === 'followers' && !activeChatUser && (
              <div className="space-y-3" id="drilldown-followers-list">
                {followerNotifications.length > 0 ? (
                  followerNotifications.map(f => (
                    <div
                      key={f.id}
                      onClick={() => {
                        setFollowerNotifications(prev => prev.map(item => item.id === f.id ? { ...item, isRead: true } : item));
                        if (onNotificationRead) onNotificationRead('follower', f.id);
                        if (onSelectUser) onSelectUser(f.creator.id);
                      }}
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all cursor-pointer group ${
                        theme === 'light'
                          ? 'bg-gray-50 border-gray-200 hover:border-[#FF5C00] hover:bg-gray-100/80 text-gray-900'
                          : 'bg-[#121212] border-white/10 hover:border-[#FF5C00] text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={f.creator.avatarUrl}
                          alt={f.creator.name}
                          className={`w-10 h-10 rounded-full object-cover border shrink-0 ${theme === 'light' ? 'border-gray-300' : 'border-white/20'}`}
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold truncate ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{f.creator.name}</h4>
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#FF5C00] group-hover:underline">
                            <Link className="w-3 h-3 text-[#FF5C00]" />
                            <span>gonnng.com/u/{f.creator.name.toLowerCase().replace(/\s+/g, '')}</span>
                          </div>
                          <p className={`text-[11px] line-clamp-1 mt-0.5 ${theme === 'light' ? 'text-gray-600' : 'text-white/70'}`}>{f.creator.bio}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onFollowToggle && onFollowToggle(f.creator.id);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                          f.creator.isFollowing
                            ? theme === 'light' ? 'bg-gray-200 text-gray-800 border border-gray-300' : 'bg-white/10 text-white border border-white/20'
                            : 'bg-[#FF5C00] text-black font-black hover:bg-[#FF751A]'
                        }`}
                      >
                        {f.creator.isFollowing ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" /> Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" /> Follow Back
                          </>
                        )}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className={`text-center py-10 text-xs ${theme === 'light' ? 'text-gray-400' : 'text-white/40'}`}>No new followers yet.</div>
                )}
              </div>
            )}

            {/* 3. DRILL DOWN: APP INFO */}
            {activeCategory === 'appinfo' && !activeChatUser && (
              <div className="space-y-3" id="drilldown-appinfo-list">
                {appInfoNotifications.map(a => (
                  <div
                    key={a.id}
                    className={`p-4 rounded-2xl border space-y-2 ${
                      theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#121212] border-white/10 text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#FF5C00]/15 text-[#FF5C00] border border-[#FF5C00]/30">
                        {a.category}
                      </span>
                      <span className={`text-[10px] font-mono ${theme === 'light' ? 'text-gray-400' : 'text-white/40'}`}>{a.timeString}</span>
                    </div>

                    <h4 className={`text-sm font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{a.title}</h4>
                    <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-gray-600' : 'text-white/70'}`}>{a.subtitle}</p>
                  </div>
                ))}
              </div>
            )}

            {/* DIRECT CHAT SCREEN */}
            {activeChatUser && (
              <div className="space-y-4" id="drilldown-chat-screen">
                {/* Chat User Header */}
                <div className={`flex items-center gap-3 p-3 rounded-2xl border ${
                  theme === 'light' ? 'bg-gray-100 border-gray-200 text-gray-900' : 'bg-white/5 border-white/10 text-white'
                }`}>
                  <img
                    src={activeChatUser.avatarUrl}
                    alt={activeChatUser.name}
                    className={`w-10 h-10 rounded-full object-cover border shrink-0 ${theme === 'light' ? 'border-gray-300' : 'border-white/20'}`}
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className={`text-xs font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{activeChatUser.name}</h4>
                    <p className={`text-[10px] font-mono ${theme === 'light' ? 'text-gray-500' : 'text-white/50'}`}>@{activeChatUser.name.toLowerCase().replace(/\s+/g, '')}</p>
                  </div>
                </div>

                {/* Message History */}
                <div className={`rounded-2xl p-4 min-h-[300px] max-h-[450px] overflow-y-auto space-y-3 border ${
                  theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-[#101010] border-white/10'
                }`}>
                  {(() => {
                    const thread = messageThreads.find(t => t.creator.id === activeChatUser.id);
                    const msgs = thread?.messages || [];
                    if (msgs.length === 0) {
                      return (
                        <div className={`text-center py-12 text-xs ${theme === 'light' ? 'text-gray-400' : 'text-white/40'}`}>
                          No previous messages. Type a message below to start chatting!
                        </div>
                      );
                    }
                    return msgs.map(m => {
                      const isMe = m.senderId === 'user-current' || m.senderId === currentUser.id;
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
                              className={`w-full max-w-sm rounded-2xl p-3 border transition-all cursor-pointer group shadow-md hover:border-[#FF5C00] ${
                                isMe
                                  ? 'bg-[#FF5C00]/10 border-[#FF5C00]/50 text-black'
                                  : theme === 'light'
                                    ? 'bg-white border-gray-300 text-gray-900 hover:shadow-lg'
                                    : 'bg-[#181818] border-white/20 text-white hover:border-[#FF5C00]'
                              }`}
                            >
                              {/* Full-width Large Thumbnail */}
                              {postImage && (
                                <div className="w-full h-44 sm:h-52 rounded-xl overflow-hidden mb-2.5 border border-black/10 bg-black/50 relative">
                                  <img
                                    src={postImage}
                                    alt={postTitle}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono font-bold text-[#FF5C00] border border-[#FF5C00]/30 uppercase">
                                    Shared from {m.senderId === 'user-current' || m.senderId === currentUser.id ? 'You' : (activeChatUser ? activeChatUser.name : 'Message Thread')}
                                  </div>
                                </div>
                              )}

                              {/* Title */}
                              <h4 className={`text-xs sm:text-sm font-bold leading-tight mb-1.5 group-hover:text-[#FF5C00] transition-colors ${
                                theme === 'light' ? 'text-gray-900' : 'text-white'
                              }`}>
                                {postTitle}
                              </h4>

                              {/* Permalink & CTA */}
                              <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-[#FF5C00] pt-1">
                                <div className="flex items-center gap-1 min-w-0">
                                  <Link className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">{permalink}</span>
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0 font-sans font-bold group-hover:translate-x-0.5 transition-transform">
                                  <span>View</span>
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </div>
                              </div>

                              {/* Timestamp */}
                              <div className={`text-[9px] font-mono text-right mt-1.5 ${
                                isMe ? 'text-black/60' : theme === 'light' ? 'text-gray-400' : 'text-white/40'
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
                              ? 'bg-[#FF5C00] text-black font-semibold rounded-br-none shadow'
                              : theme === 'light'
                                ? 'bg-white text-gray-900 border border-gray-200 shadow-sm rounded-bl-none'
                                : 'bg-white/10 text-white border border-white/10 rounded-bl-none'
                          }`}>
                            <p>{m.text}</p>

                            <div className={`text-[9px] font-mono text-right ${
                              isMe ? 'text-black/60' : theme === 'light' ? 'text-gray-400' : 'text-white/40'
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
                <form onSubmit={handleSendChatMessage} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={chatInputText}
                    onChange={(e) => setChatInputText(e.target.value)}
                    placeholder={`Message @${activeChatUser.name.toLowerCase().replace(/\s+/g, '')}...`}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-[#FF5C00] ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
                        : 'bg-[#101010] border-white/15 text-white placeholder:text-white/40'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!chatInputText.trim()}
                    className="px-4 py-2.5 bg-[#FF5C00] hover:bg-[#FF751A] disabled:opacity-50 text-black font-black rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Send className="w-4 h-4" /> Send
                  </button>
                </form>
              </div>
            )}

          </motion.div>
        )}

      </div>
    </div>
  );
}
