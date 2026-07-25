import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Creator, FeedPost } from '../types';
import { User, Shield, Users, Save, Globe, Lock, Goal, BookOpen, Star, X, Search, UserPlus, UserCheck, Upload, File, LogOut, Sun, Moon, Camera, Image as ImageIcon, Disc3, Pencil, Octagon, ArrowUpRight, MessageSquare } from 'lucide-react';
import Feed from './Feed';
import FileUploadZone from './FileUploadZone';
import { UploadedFile, uploadService } from '../services/uploadService';
import { authService } from '../services/authService';

interface UserProfileProps {
  currentUser: Creator;
  onUpdateUser: (updated: Creator) => void;
  allCreators: Creator[];
  onToggleFollowCreator: (id: string) => void;
  onToggleCircleCreator?: (id: string) => void;
  onOpenPhilosophy?: () => void;
  onOpenCreatorProfile?: (creatorId: string) => void;
  onSignOut?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: (theme: 'dark' | 'light') => void;

  // Settings Drawer State
  isSettingsDrawerOpen: boolean;
  setIsSettingsDrawerOpen: (open: boolean) => void;

  // Feed props for MINE filter feed in Profile
  posts: FeedPost[];
  onUpdatePostGong: (postId: string, gongType: 'continue' | 'refine' | 'reconsider') => void;
  onAddComment?: (postId: string, commentContent: string, parentId?: string, replyToUser?: string) => void;
  onToggleCommentHeart?: (postId: string, commentId: string) => void;
  setShowTutorial: (show: boolean) => void;

  // Superimposed Post from Updates
  superimposedPost?: FeedPost | null;
  onClearSuperimposedPost?: () => void;
  onOpenShareDrawer?: (post: FeedPost) => void;
  autoOpenCommentsPostId?: string | null;
}

export default function UserProfile({ 
  currentUser, 
  onUpdateUser, 
  allCreators, 
  onToggleFollowCreator,
  onToggleCircleCreator,
  onOpenPhilosophy,
  onOpenCreatorProfile,
  onSignOut,
  theme = 'dark',
  onToggleTheme,
  isSettingsDrawerOpen,
  setIsSettingsDrawerOpen,
  posts,
  onUpdatePostGong,
  onAddComment,
  onToggleCommentHeart,
  setShowTutorial,
  superimposedPost,
  onClearSuperimposedPost,
  onOpenShareDrawer,
  autoOpenCommentsPostId
}: UserProfileProps) {
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio);
  const [goals, setGoals] = useState(currentUser.goals);
  const [privacy, setPrivacy] = useState<"public" | "internal" | "private">(currentUser.privacyDefault);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Followers / Following Modal State
  const [showUserListModal, setShowUserListModal] = useState(false);
  const [modalTab, setModalTab] = useState<'followers' | 'following'>('followers');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Comment Modal State for superimposed post
  const [commentModalPost, setCommentModalPost] = useState<FeedPost | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [replyingToComment, setReplyingToComment] = useState<{ id: string; userName: string } | null>(null);

  React.useEffect(() => {
    if (autoOpenCommentsPostId) {
      const match = posts.find(p => p.id === autoOpenCommentsPostId) || (superimposedPost?.id === autoOpenCommentsPostId ? superimposedPost : null);
      if (match) {
        setCommentModalPost(match);
      }
    }
  }, [autoOpenCommentsPostId, superimposedPost, posts]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...currentUser,
      name,
      bio,
      goals,
      privacyDefault: privacy,
      avatarUrl
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingAvatar(true);
      try {
        const uploaded = await uploadService.uploadFile(file);
        setAvatarUrl(uploaded.url);
        onUpdateUser({
          ...currentUser,
          avatarUrl: uploaded.url
        });
      } catch (err) {
        console.error('Failed to upload avatar image:', err);
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const followersList = allCreators.filter(c => c.followsYou);
  const followingList = allCreators.filter(c => c.isFollowing);

  const currentTabList = modalTab === 'following' ? followingList : followersList;

  const displayedModalCreators = currentTabList.filter(c => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.bio && c.bio.toLowerCase().includes(q));
  });

  return (
    <div 
      className="max-w-4xl mx-auto text-white px-2 sm:px-4 md:px-0 w-full min-w-0 h-[calc(100vh-130px)] sm:h-auto overflow-y-scroll sm:overflow-visible snap-y snap-mandatory scroll-smooth sm:scroll-auto no-scrollbar space-y-0 sm:space-y-6" 
      id="profile-scroll-container"
    >
      {/* Superimposed Post Modal Overlay from Updates / Shared Messages */}
      {superimposedPost && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-40 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-4 sm:p-6 shadow-2xl border-2 border-[#FF5C00] bg-[#121212] text-white space-y-4 my-auto relative"
            id="superimposed-post-container"
          >
            {/* Header Badge & Icon-only Close Action */}
            <div className="flex items-center justify-between pb-2 border-b border-[#FF5C00]/30 bg-[#FF5C00]/15 p-2.5 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5C00] animate-pulse" />
                <span className="text-xs font-mono font-black text-[#FF5C00] uppercase tracking-wider">
                  LINKED UPDATE POST
                </span>
                <span className="text-[10px] font-mono text-white/50 hidden sm:inline">
                  • gonnng.com/g/{superimposedPost.id}
                </span>
              </div>

              {onClearSuperimposedPost && (
                <button
                  type="button"
                  onClick={onClearSuperimposedPost}
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer transition-colors flex items-center justify-center"
                  title="Close Post Modal"
                  aria-label="Close Post Modal"
                >
                  <X className="w-4 h-4 text-[#FF5C00]" />
                </button>
              )}
            </div>

            {/* Embedded Post Matching Standard Structure: Image, Votes Cluster + Comments Link, Poster, Title, Description */}
            <div className="bg-black border border-white/10 p-3 sm:p-4 rounded-xl space-y-3">
              
              {/* 1. Image with Share Button & Bottom Overlay (Votes Cluster + Comments Count) */}
              <div className="relative w-full rounded-xl overflow-hidden border border-white/10 bg-black shadow-lg">
                <img 
                  src={superimposedPost.image || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=800'} 
                  alt={superimposedPost.title} 
                  className="w-full max-h-80 sm:max-h-96 object-cover" 
                  referrerPolicy="no-referrer"
                />

                {/* Upper Right Corner Share Button */}
                {onOpenShareDrawer && (
                  <button
                    type="button"
                    onClick={() => onOpenShareDrawer(superimposedPost)}
                    className="absolute top-2 right-2 bg-black/80 hover:bg-[#FF5C00] text-white hover:text-black p-2 rounded-xl transition-all cursor-pointer z-30 border border-white/20 shadow-lg flex items-center justify-center"
                    title="Share post & copy permalink"
                  >
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                )}

                {/* Gradient Overlay for bottom button readability */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                {/* Votes Cluster + Comments Link overlay at bottom of image */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-black/85 backdrop-blur-md p-1.5 sm:p-2 rounded-none border-0 shadow-2xl z-10 gap-1">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <button
                      type="button"
                      onClick={() => onUpdatePostGong(superimposedPost.id, 'continue')}
                      className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                        superimposedPost.gongs?.userVoted === 'continue'
                          ? 'bg-emerald-500 text-black font-black shadow-md'
                          : 'bg-white/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                      }`}
                      title="Keep going / Continue"
                    >
                      <Disc3 className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                      <span className="text-[10px] sm:text-[11px]">{superimposedPost.gongs?.continue || 0}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdatePostGong(superimposedPost.id, 'refine')}
                      className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                        superimposedPost.gongs?.userVoted === 'refine'
                          ? 'bg-[#FF5C00] text-black font-black shadow-md'
                          : 'bg-white/10 text-[#FF5C00] hover:bg-[#FF5C00]/20 border border-[#FF5C00]/30'
                      }`}
                      title="Needs work / Refine"
                    >
                      <Pencil className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                      <span className="text-[10px] sm:text-[11px]">{superimposedPost.gongs?.refine || 0}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdatePostGong(superimposedPost.id, 'reconsider')}
                      className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                        superimposedPost.gongs?.userVoted === 'reconsider'
                          ? 'bg-red-500 text-white font-black shadow-md'
                          : 'bg-white/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                      }`}
                      title="Stop / Reconsider"
                    >
                      <Octagon className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                      <span className="text-[10px] sm:text-[11px]">{superimposedPost.gongs?.reconsider || 0}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    id="superimposed-post-comments-btn"
                    onClick={() => setCommentModalPost(superimposedPost)}
                    className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-bold font-mono bg-white/15 hover:bg-[#FF5C00] hover:text-black text-white border border-white/20 shadow-md transition-all cursor-pointer"
                    title="View and add comments"
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[10px] sm:text-[11px]">{superimposedPost.comments?.length || 0}</span>
                  </button>
                </div>
              </div>

              {/* 2. Poster / Metadata Bar */}
              <div className="flex justify-between items-center text-xs px-1 pt-1">
                <div 
                  onClick={() => onOpenCreatorProfile?.(superimposedPost.userId || superimposedPost.userName)}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-all group"
                >
                  <img 
                    src={superimposedPost.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'} 
                    alt={superimposedPost.userName} 
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-white/20 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <span className={`font-bold group-hover:underline ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {superimposedPost.userName}
                  </span>
                  <span className={`text-[10px] font-mono ${theme === 'light' ? 'text-gray-500' : 'text-white/40'}`}>• {superimposedPost.timeString}</span>
                </div>

                <div className={`flex items-center gap-1 border px-2 py-0.5 rounded-md text-[10px] font-mono ${
                  theme === 'light' ? 'bg-gray-100 border-gray-200 text-gray-700' : 'bg-white/5 border-white/10 text-white/60'
                }`}>
                  {superimposedPost.privacy === 'public' && (
                    <>
                      <Globe className="w-3 h-3 text-[#FF5C00]" />
                      <span className="uppercase">Public</span>
                    </>
                  )}
                  {superimposedPost.privacy === 'internal' && (
                    <>
                      <Users className="w-3 h-3 text-[#FF5C00]" />
                      <span className="uppercase">Circle</span>
                    </>
                  )}
                  {superimposedPost.privacy === 'private' && (
                    <>
                      <Lock className="w-3 h-3 text-[#FF5C00]" />
                      <span className="uppercase">Private</span>
                    </>
                  )}
                </div>
              </div>

              {/* 3. Title */}
              <h3 className={`text-base font-display font-bold px-1 break-words ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                {superimposedPost.title}
              </h3>

              {/* 4. Full Description */}
              <div className={`p-3 sm:p-4 rounded-xl space-y-2 border ${
                theme === 'light' ? 'bg-white border-gray-200 text-gray-900' : 'bg-white/5 border-white/10 text-white/90'
              }`}>
                <p className="text-xs sm:text-sm font-sans leading-relaxed whitespace-pre-wrap break-words">
                  {superimposedPost.content}
                </p>
                {superimposedPost.hashtags && (
                  <p className="text-[#FF5C00] font-mono text-xs font-bold break-words pt-1">
                    {Array.isArray(superimposedPost.hashtags)
                      ? superimposedPost.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')
                      : superimposedPost.hashtags}
                  </p>
                )}
                {superimposedPost.attachedName && (
                  <div className="text-[11px] font-mono text-[#FF5C00] pt-1">
                    📂 Attached: {superimposedPost.attachedName}
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        </div>
      )}

      {/* Header Visual Panel - Full Screen First Tile on Mobile for Sticky Scroll */}
      <div 
        className={`snap-start snap-always w-full h-[calc(100vh-140px)] sm:h-auto shrink-0 flex flex-col justify-between border p-5 sm:p-6 shadow-2xl relative mb-0 sm:mb-6 rounded-none ${
          theme === 'light' ? 'bg-white border-gray-200 text-gray-900 shadow-sm' : 'bg-black border-white/10 text-white shadow-2xl'
        }`}
        id="profile-first-tile"
      >
        {/* Top Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-5 min-w-0 w-full">
          <div className={`w-28 h-28 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-display font-bold shadow-lg border-4 relative overflow-hidden shrink-0 mx-auto sm:mx-0 ${
            theme === 'light'
              ? 'bg-gray-200 border-gray-300 text-gray-800'
              : 'bg-black/80 border-[#FF5C00] text-white shadow-[0_0_20px_rgba(255,92,0,0.3)]'
          }`}>
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className={`w-14 h-14 sm:w-10 sm:h-10 ${theme === 'light' ? 'text-gray-600' : 'text-white/70'}`} />
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className={`text-xl sm:text-2xl font-display font-black truncate ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                {currentUser.name}
              </h2>
              <button
                type="button"
                id="profile-share-btn"
                onClick={() => {
                  if (onOpenShareDrawer) {
                    onOpenShareDrawer({
                      id: currentUser.id,
                      type: 'update_logged',
                      userId: currentUser.id,
                      title: `${currentUser.name}'s Profile`,
                      content: currentUser.bio || 'Gonnng Creator Profile',
                      userName: currentUser.name,
                      userAvatar: currentUser.avatarUrl,
                      timeString: 'Active now',
                      privacy: currentUser.privacyDefault,
                      gongs: { continue: 0, refine: 0, reconsider: 0 }
                    });
                  }
                }}
                className="p-1.5 bg-[#FF5C00] hover:bg-[#FF751A] text-black rounded-xl transition-all shadow cursor-pointer shrink-0"
                title="Share Profile"
              >
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
            <p className={`text-xs font-mono truncate ${theme === 'light' ? 'text-gray-600' : 'text-[#FF5C00]'}`}>
              @{currentUser.name.toLowerCase().replace(/\s+/g, '')} • {currentUser.email}
            </p>
          </div>
        </div>

        {/* Middle Section: Bio & Goal */}
        <div className={`my-auto py-4 space-y-3 border p-4 rounded-2xl ${
          theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-800' : 'bg-white/5 border-white/10 text-white'
        }`}>
          <p className={`text-xs leading-relaxed italic ${theme === 'light' ? 'text-gray-800' : 'text-white/80'}`}>
            "{currentUser.bio || 'Creative architect building process blueprints and execution sequence algorithms.'}"
          </p>
          {currentUser.goals && (
            <div className={`text-[11px] font-mono pt-2 border-t flex items-center gap-1.5 ${
              theme === 'light' ? 'border-gray-200 text-gray-600' : 'border-white/10 text-white/60'
            }`}>
              <Goal className="w-3.5 h-3.5 text-[#FF5C00]" />
              <span>Current Goal: <strong className={`font-sans ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{currentUser.goals}</strong></span>
            </div>
          )}
        </div>

        {/* Bottom Section: Followers/Following Stats & Privacy */}
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t w-full ${
          theme === 'light' ? 'border-gray-200' : 'border-white/10'
        }`}>
          <div className="flex items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
            <button
              type="button"
              id="profile-followers-btn"
              onClick={() => {
                setModalTab('followers');
                setUserSearchQuery('');
                setShowUserListModal(true);
              }}
              className={`text-xs font-mono transition-all cursor-pointer group flex items-center gap-1.5 px-3.5 py-2 rounded-xl border active:scale-95 ${
                theme === 'light'
                  ? 'bg-gray-100 border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-200'
                  : 'bg-white/10 border-white/15 text-white/70 hover:text-white hover:bg-white/15'
              }`}
              title="Click to view Followers"
            >
              <strong className={`font-sans text-sm group-hover:text-[#FF5C00] transition-colors ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{currentUser.followersCount}</strong> FOLLOWERS
            </button>
            <button
              type="button"
              id="profile-following-btn"
              onClick={() => {
                setModalTab('following');
                setUserSearchQuery('');
                setShowUserListModal(true);
              }}
              className={`text-xs font-mono transition-all cursor-pointer group flex items-center gap-1.5 px-3.5 py-2 rounded-xl border active:scale-95 ${
                theme === 'light'
                  ? 'bg-gray-100 border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-200'
                  : 'bg-white/10 border-white/15 text-white/70 hover:text-white hover:bg-white/15'
              }`}
              title="Click to view Following"
            >
              <strong className={`font-sans text-sm group-hover:text-[#FF5C00] transition-colors ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{currentUser.followingCount}</strong> FOLLOWING
            </button>
          </div>

          <div className={`flex items-center gap-2 border px-3 py-2 rounded-xl ${
            theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-white/5 border-white/10 text-white/70'
          }`}>
            <Shield className="w-3.5 h-3.5 text-[#FF5C00]" />
            <span className="text-[10px] font-mono uppercase">
              Privacy: <strong className="text-[#FF5C00] font-sans">{privacy}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Feed Component with MINE filter applied */}
      <div className="space-y-4">
        <Feed 
          posts={posts}
          currentUserId={currentUser.id}
          currentUser={currentUser}
          creators={allCreators}
          filter="private"
          isEmbedded={true}
          onUpdatePostGong={onUpdatePostGong}
          onAddComment={onAddComment}
          onToggleCommentHeart={onToggleCommentHeart}
          onOpenCreatorProfile={onOpenCreatorProfile}
        />
      </div>
      {/* Followers & Following User List Modal */}
      <AnimatePresence>
        {showUserListModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-[#141414] border border-white/10 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] space-y-4"
            >
              {/* Modal Header with Tabs */}
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10">
                  <button
                    type="button"
                    id="modal-tab-followers-btn"
                    onClick={() => {
                      setModalTab('followers');
                      setUserSearchQuery('');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      modalTab === 'followers'
                        ? 'bg-[#FF5C00] text-black shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Followers ({currentUser.followersCount})
                  </button>
                  <button
                    type="button"
                    id="modal-tab-following-btn"
                    onClick={() => {
                      setModalTab('following');
                      setUserSearchQuery('');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      modalTab === 'following'
                        ? 'bg-[#FF5C00] text-black shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Following ({currentUser.followingCount})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowUserListModal(false)}
                  className="p-1.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full text-xs font-mono cursor-pointer transition-colors"
                  title="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar inside Modal */}
              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder={`Search ${modalTab}...`}
                  className="w-full pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF5C00]"
                />
                {userSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setUserSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* User List Container */}
              <div className="overflow-y-auto flex-1 space-y-2 pr-1 max-h-[400px]">
                {displayedModalCreators.length > 0 ? (
                  displayedModalCreators.map((creator) => (
                    <div
                      key={creator.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-3 hover:border-white/20 transition-all"
                    >
                      <div 
                        onClick={() => {
                          setShowUserListModal(false);
                          onOpenCreatorProfile?.(creator.id);
                        }}
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer hover:opacity-80 transition-all group"
                        title={`View ${creator.name}'s profile`}
                      >
                        <img
                          src={creator.avatarUrl}
                          alt={creator.name}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-white/10 shrink-0 ${
                            creator.isFollowing ? 'ring-2 ring-[#FF5C00] ring-offset-1 ring-offset-[#141414]' : ''
                          }`}
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-bold text-white truncate group-hover:underline">{creator.name}</h4>
                            {creator.isFollowing && creator.followsYou && (
                              <span className="text-[9px] font-mono font-bold bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30 px-1.5 py-0.2 rounded-full">
                                In Circle
                              </span>
                            )}
                            {!creator.isFollowing && creator.followsYou && (
                              <span className="text-[9px] font-mono text-white/60 bg-white/10 px-1.5 py-0.2 rounded-full">
                                Follows you
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleFollowCreator(creator.id)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                          creator.isFollowing
                            ? 'bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 border border-white/10 hover:border-red-500/30'
                            : 'bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black shadow-sm'
                        }`}
                      >
                        {creator.isFollowing ? (
                          <>
                            <UserCheck className="w-3 h-3" /> Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3" /> Follow
                          </>
                        )}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-white/40 text-xs font-sans space-y-2">
                    <p>
                      {userSearchQuery
                        ? `No ${modalTab} matching "${userSearchQuery}"`
                        : modalTab === 'following'
                        ? "You aren't following any creators yet."
                        : 'No followers found.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-white/10 text-center text-[10px] text-white/40 font-mono">
                Showing {displayedModalCreators.length} {modalTab}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Settings Slide-out Drawer */}
      <AnimatePresence>
        {isSettingsDrawerOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex justify-end">
            {/* Backdrop click overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsDrawerOpen(false)}
              className="absolute inset-0 cursor-pointer"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative bg-[#141414] border-l border-white/10 w-full max-w-md h-full overflow-y-auto p-5 sm:p-6 space-y-6 shadow-2xl z-10 flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-[#FF5C00]" /> Profile Settings
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsSettingsDrawerOpen(false)}
                    className="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                  {/* Space at top of drawer for updating Profile Image */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3.5">
                    <label className="block text-xs font-mono text-[#FF5C00] uppercase font-bold tracking-wider flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-[#FF5C00]" /> Update Profile Picture
                    </label>

                    <div className="flex items-center gap-4">
                      <div className="relative group shrink-0">
                        <div className={`w-16 h-16 rounded-full overflow-hidden border-2 border-[#FF5C00] flex items-center justify-center font-display font-bold text-2xl shadow-md ${
                          theme === 'light' ? 'bg-gray-200 text-gray-800' : 'bg-black text-white'
                        }`}>
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            <User className={`w-8 h-8 ${theme === 'light' ? 'text-gray-600' : 'text-white/70'}`} />
                          )}
                        </div>
                        <label 
                          htmlFor="avatar-file-input" 
                          className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                          title="Upload new profile picture"
                        >
                          <Camera className="w-5 h-5" />
                        </label>
                        <input 
                          type="file" 
                          id="avatar-file-input" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleAvatarFileSelect}
                        />
                      </div>

                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <label 
                            htmlFor="avatar-file-input"
                            className="px-3 py-1.5 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black text-xs rounded-xl cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {isUploadingAvatar ? 'Uploading...' : 'Choose File'}
                          </label>
                          {avatarUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setAvatarUrl('');
                                onUpdateUser({ ...currentUser, avatarUrl: '' });
                              }}
                              className="text-[11px] text-red-400 hover:underline font-mono"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        
                        <div>
                          <input
                            type="url"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="Or paste image URL (https://...)"
                            className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-white/80 focus:outline-none focus:border-[#FF5C00]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono text-white/40 uppercase tracking-wider mb-1.5">Your Full Name</label>
                      <input
                        type="text"
                        id="drawer-profile-name-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#FF5C00] font-sans font-medium text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-white/40 uppercase tracking-wider mb-1.5">Short Creative Biography</label>
                      <textarea
                        value={bio}
                        id="drawer-profile-bio-textarea"
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#FF5C00] font-sans text-white/80 leading-relaxed"
                        placeholder="Tell us what you make (paintings, sandwiches, tech, startups)..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Goal className="w-3.5 h-3.5 text-white/40" /> Current Ultimate Project Goal
                      </label>
                      <input
                        type="text"
                        value={goals}
                        id="drawer-profile-goals-input"
                        onChange={(e) => setGoals(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#FF5C00] font-sans text-white font-medium"
                        placeholder="e.g. Host an exhibition in 10 weeks, paint sunset over bay"
                      />
                    </div>
                  </div>

                  {/* Light Mode / Dark Mode Theme Controller */}
                  <div className="space-y-2.5 pt-2 border-t border-white/10 w-full min-w-0">
                    <label className="block text-xs font-mono text-white/40 uppercase tracking-wider flex items-center justify-between">
                      <span>App Appearance & Theme Mode</span>
                      <span className="text-[10px] text-[#FF5C00] font-bold uppercase">{theme} Mode Active</span>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        id="theme-dark-btn"
                        onClick={() => onToggleTheme && onToggleTheme('dark')}
                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                          theme === 'dark'
                            ? 'bg-[#FF5C00] text-black border-[#FF5C00] shadow-md'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <Moon className="w-4 h-4" /> Dark Mode
                      </button>

                      <button
                        type="button"
                        id="theme-light-btn"
                        onClick={() => onToggleTheme && onToggleTheme('light')}
                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                          theme === 'light'
                            ? 'bg-[#FF5C00] text-black border-[#FF5C00] shadow-md'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <Sun className="w-4 h-4" /> Light Mode
                      </button>
                    </div>
                  </div>

                  {/* Privacy Default Controller */}
                  <div className="space-y-3 pt-2 w-full min-w-0">
                    <label className="block text-xs font-mono text-white/40 uppercase tracking-wider mb-1.5">
                      Privacy Control Panel (Default for New Postings)
                    </label>
                    
                    <div className="flex flex-col gap-3 w-full min-w-0">
                      <div
                        id="drawer-privacy-public-opt"
                        onClick={() => setPrivacy('public')}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 sm:gap-4 min-w-0 w-full ${
                          privacy === 'public'
                            ? 'bg-white/10 border-[#FF5C00] text-[#FF5C00] shadow-md'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                        }`}
                      >
                        <Globe className={`w-5 h-5 shrink-0 ${privacy === 'public' ? 'text-[#FF5C00]' : 'text-white/40'}`} />
                        <div className="text-left min-w-0 flex-1">
                          <span className="text-xs font-sans font-bold block text-white">Public</span>
                          <span className="text-[10px] font-mono text-white/50 block break-words">Global Feed - viewable by everyone in the community</span>
                        </div>
                      </div>

                      <div
                        id="drawer-privacy-internal-opt"
                        onClick={() => setPrivacy('internal')}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 sm:gap-4 min-w-0 w-full ${
                          privacy === 'internal'
                            ? 'bg-white/10 border-[#FF5C00] text-[#FF5C00] shadow-md'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                        }`}
                      >
                        <Users className={`w-5 h-5 shrink-0 ${privacy === 'internal' ? 'text-[#FF5C00]' : 'text-white/40'}`} />
                        <div className="text-left min-w-0 flex-1">
                          <span className="text-xs font-sans font-bold block text-white">Internal</span>
                          <span className="text-[10px] font-mono text-white/50 block break-words">Circle Only - shared only with your followers & circle members</span>
                        </div>
                      </div>

                      <div
                        id="drawer-privacy-private-opt"
                        onClick={() => setPrivacy('private')}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 sm:gap-4 min-w-0 w-full ${
                          privacy === 'private'
                            ? 'bg-white/10 border-[#FF5C00] text-[#FF5C00] shadow-md'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                        }`}
                      >
                        <Lock className={`w-5 h-5 shrink-0 ${privacy === 'private' ? 'text-[#FF5C00]' : 'text-white/40'}`} />
                        <div className="text-left min-w-0 flex-1">
                          <span className="text-xs font-sans font-bold block text-white">Private</span>
                          <span className="text-[10px] font-mono text-white/50 block break-words">Personal Log - strictly private, only you can see and track this</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User File Storage & Upload Vault */}
                  <div className="space-y-3 pt-3 border-t border-white/10 w-full min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-mono font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-[#FF5C00]" /> User File Vault & Uploads
                      </h4>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Feature Flagged
                      </span>
                    </div>

                    <p className="text-xs text-white/60 font-sans">
                      Upload and manage media files, avatars, or reference documents tied to your account.
                    </p>

                    <FileUploadZone
                      label="Upload Avatar or Project Assets"
                      accept="image/*,video/*,application/pdf"
                      onFileUploaded={(file: UploadedFile) => {
                        if (file.mimeType.startsWith('image/')) {
                          onUpdateUser({
                            ...currentUser,
                            avatarUrl: file.url
                          });
                        }
                      }}
                    />
                  </div>

                  {/* Tutorial Sandbox and Account Level inside Profile Settings Drawer */}
                  <div className="space-y-4 pt-4 border-t border-white/10 w-full min-w-0">
                    <h4 className="text-xs font-mono font-bold text-white/50 uppercase tracking-wider">System & Account Overview</h4>
                    
                    <div className="grid grid-cols-1 gap-3 w-full min-w-0">
                      {/* Tutorial Sandbox Shortcut Block */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5 w-full min-w-0">
                        <div className="flex justify-between items-center">
                          <h5 className="text-xs font-mono font-bold text-[#FF5C00] uppercase">Tutorial Sandbox</h5>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed font-sans">
                          Review the Gonnng "Sum of parts" philosophy by resetting the universal Sandwich tutorial playground.
                        </p>
                        <button
                          id="reset-tutorial-shortcut-drawer"
                          type="button"
                          onClick={() => {
                            setShowTutorial(true);
                            setIsSettingsDrawerOpen(false);
                          }}
                          className="text-xs font-bold text-[#FF5C00] underline hover:text-[#FF751A] cursor-pointer text-left pt-1 block"
                        >
                          Launch Tutorial Engine →
                        </button>
                      </div>

                      {/* Account Level Block */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5 w-full min-w-0">
                        <h5 className="text-xs font-mono font-bold text-[#FF5C00] uppercase flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-[#FF5C00]" /> Account Level
                        </h5>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5 text-[#FF5C00]">
                            <Star className="w-3.5 h-3.5 fill-[#FF5C00] text-[#FF5C00]" />
                            <Star className="w-3.5 h-3.5 fill-[#FF5C00] text-[#FF5C00]" />
                            <Star className="w-3.5 h-3.5 fill-[#FF5C00] text-[#FF5C00]" />
                          </div>
                          <span className="text-xs font-sans font-bold text-white">Gonnng Master level 3</span>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed font-sans">
                          As you complete recipes, track collections, and give reality-checks to friends, your account gains status indicators!
                        </p>
                        {onOpenPhilosophy && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenPhilosophy();
                              setIsSettingsDrawerOpen(false);
                            }}
                            className="w-full mt-2 py-2 bg-[#FF5C00]/10 hover:bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/20 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            🔔 Feedback Manual
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-4 border-t border-white/10 w-full min-w-0">
                    {isSaved ? (
                      <span className="text-emerald-400 font-mono text-xs font-bold animate-pulse text-center">
                        ✓ Profile settings saved successfully!
                      </span>
                    ) : (
                      <span className="text-white/40 text-xs text-center">Unsaved changes will be lost on refresh.</span>
                    )}
                    <button
                      type="submit"
                      id="drawer-save-profile-btn"
                      className="w-full justify-center px-6 py-3 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black rounded-xl text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" /> Save Configuration
                    </button>

                    {/* Sign Out Action Button at Bottom of Drawer */}
                    <div className="pt-3 border-t border-white/10 mt-2">
                      <button
                        type="button"
                        id="drawer-sign-out-btn"
                        onClick={() => {
                          authService.logout();
                          setIsSettingsDrawerOpen(false);
                          if (onSignOut) {
                            onSignOut();
                          } else {
                            window.location.reload();
                          }
                        }}
                        className="w-full justify-center px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Comments Modal for Superimposed or Profile Post */}
      <AnimatePresence>
        {commentModalPost && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`w-full max-w-lg max-h-[85vh] rounded-3xl p-4 sm:p-6 flex flex-col justify-between shadow-2xl border ${
                theme === 'light' ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#141414] border-white/15 text-white'
              }`}
            >
              <div className={`flex justify-between items-center pb-3 border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#FF5C00]" />
                  <h3 className="text-base font-display font-bold truncate">
                    Comments on "{commentModalPost.title}"
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCommentModalPost(null)}
                  className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                    theme === 'light' ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white/70'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* List of comments */}
              <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-1">
                {(() => {
                  const allComments = commentModalPost.comments || [];
                  if (allComments.length === 0) {
                    return (
                      <div className={`text-center py-8 text-xs font-sans ${theme === 'light' ? 'text-gray-500' : 'text-white/40'}`}>
                        No comments yet. Leave constructive feedback!
                      </div>
                    );
                  }

                  // Sort comments strictly per User Rules:
                  // 1. Reply to my comment: my comment + reply at top
                  // 2. Comment on my post: new comments at top
                  // 3. Otherwise: order of most recent
                  const sortedComments = [...allComments].sort((a, b) => {
                    const aIsMyCommentOrReplyToMe = 
                      (a.userId === currentUser.id && allComments.some(c => c.parentId === a.id || c.replyToUser === currentUser.name)) ||
                      a.replyToUser === currentUser.name ||
                      a.content.toLowerCase().includes(`@${currentUser.name?.toLowerCase()}`);

                    const bIsMyCommentOrReplyToMe = 
                      (b.userId === currentUser.id && allComments.some(c => c.parentId === b.id || c.replyToUser === currentUser.name)) ||
                      b.replyToUser === currentUser.name ||
                      b.content.toLowerCase().includes(`@${currentUser.name?.toLowerCase()}`);

                    if (aIsMyCommentOrReplyToMe && !bIsMyCommentOrReplyToMe) return -1;
                    if (!aIsMyCommentOrReplyToMe && bIsMyCommentOrReplyToMe) return 1;

                    if (commentModalPost.userId === currentUser.id) {
                      const aIsOther = a.userId !== currentUser.id;
                      const bIsOther = b.userId !== currentUser.id;
                      if (aIsOther && !bIsOther) return -1;
                      if (!aIsOther && bIsOther) return 1;
                    }

                    return 0;
                  });

                  return sortedComments.map(c => (
                    <div key={c.id} className={`p-3 border rounded-2xl space-y-1.5 ${
                      theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-white/5 border-white/10 text-white'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <img src={c.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'} alt={c.userName} className="w-5 h-5 rounded-full object-cover" />
                          <span className="text-xs font-bold">{c.userName}</span>
                          {c.replyToUser && (
                            <span className="text-[10px] font-mono text-[#FF5C00]">
                              replying to @{c.replyToUser}
                            </span>
                          )}
                          <span className={`text-[10px] font-mono ${theme === 'light' ? 'text-gray-500' : 'text-white/40'}`}>• {c.timeString}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (onToggleCommentHeart) onToggleCommentHeart(commentModalPost.id, c.id);
                            setCommentModalPost(prev => prev ? {
                              ...prev,
                              comments: prev.comments?.map(item => item.id === c.id ? { ...item, isHearted: !item.isHearted, heartCount: item.isHearted ? (item.heartCount || 1) - 1 : (item.heartCount || 0) + 1 } : item)
                            } : null);
                          }}
                          className={`text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors ${
                            c.isHearted ? 'text-red-500 font-bold' : theme === 'light' ? 'text-gray-400 hover:text-red-500' : 'text-white/40 hover:text-red-400'
                          }`}
                        >
                          ♥ {c.heartCount || 0}
                        </button>
                      </div>
                      <p className={`text-xs font-sans pl-7 ${theme === 'light' ? 'text-gray-700' : 'text-white/80'}`}>{c.content}</p>
                      
                      <div className="pl-7 pt-1 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setReplyingToComment({ id: c.id, userName: c.userName })}
                          className="text-[10px] font-mono text-[#FF5C00] hover:underline cursor-pointer"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Replying banner indicator */}
              {replyingToComment && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#FF5C00]/10 border border-[#FF5C00]/30 rounded-xl mb-2 text-xs text-[#FF5C00] font-mono">
                  <span>Replying to @{replyingToComment.userName}</span>
                  <button type="button" onClick={() => setReplyingToComment(null)} className="hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Comment input form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!commentInput.trim()) return;
                  const finalContent = replyingToComment ? `@${replyingToComment.userName} ${commentInput.trim()}` : commentInput.trim();
                  if (onAddComment) {
                    onAddComment(commentModalPost.id, finalContent, replyingToComment?.id, replyingToComment?.userName);
                    setCommentModalPost(prev => prev ? {
                      ...prev,
                      comments: [
                        ...(prev.comments || []),
                        {
                          id: `c-${Date.now()}`,
                          userId: currentUser.id,
                          userName: currentUser.name,
                          userAvatar: currentUser.avatarUrl,
                          content: finalContent,
                          parentId: replyingToComment?.id,
                          replyToUser: replyingToComment?.userName,
                          timeString: 'Just now',
                          heartCount: 0,
                          isHearted: false
                        }
                      ]
                    } : null);
                  }
                  setCommentInput('');
                  setReplyingToComment(null);
                }}
                className={`pt-3 border-t flex gap-2 ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}
              >
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Add constructive comment..."
                  className={`flex-1 px-3.5 py-2 border rounded-xl text-xs focus:outline-none focus:border-[#FF5C00] ${
                    theme === 'light' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-white/5 border-white/15 text-white'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim()}
                  className="px-4 py-2 bg-[#FF5C00] hover:bg-[#FF751A] disabled:opacity-40 text-black font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  Send
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

