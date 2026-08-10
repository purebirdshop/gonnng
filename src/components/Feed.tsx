import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FeedPost, PostComment, Creator, Project, Recipe } from '../types';
import { isFollowingUser, isUserInCircle as checkCircleRelation } from '../utils/followUtils';
import { getPublicMediaUrl } from '../services/uploadService';
import CircleCategoryDiscovery from './CircleCategoryDiscovery';
import PostTile from './PostTile';
import { 
  Globe, 
  CircleDotDashed,
  Album,
  Users, 
  Lock, 
  Disc3, 
  Pencil, 
  Octagon, 
  MessageSquare, 
  X, 
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Send,
  BookOpen,
  Heart,
  CornerDownRight,
  ArrowUpRight,
  User,
  FolderPlus,
  Sparkles
} from 'lucide-react';

export function formatCount(num: number): string {
  if (!num || num <= 0) return '0';
  if (num >= 1_000_000) {
    const val = (num / 1_000_000).toFixed(1);
    return `${val.endsWith('.0') ? val.slice(0, -2) : val}m`;
  }
  if (num >= 1000) {
    const val = (num / 1000).toFixed(2);
    const trimmed = val.replace(/\.?0+$/, '');
    return `${trimmed}k`;
  }
  return num.toString();
}

interface FeedProps {
  posts: FeedPost[];
  currentUserId: string;
  currentUser?: Creator;
  creators?: Creator[];
  projects?: Project[];
  recipes?: Recipe[];
  filter: 'all' | 'internal' | 'private' | 'creator';
  onUpdatePostGong: (postId: string, voteType: 'continue' | 'refine' | 'reconsider') => void;
  onAddComment?: (postId: string, commentContent: string, parentId?: string, replyToUser?: string) => void;
  onToggleCommentHeart?: (postId: string, commentId: string) => void;
  onToggleFollow?: (creatorId: string) => void;
  onFeedScroll?: (scrolled: boolean) => void;
  onOpenCreatorProfile?: (userIdOrName: string) => void;
  onOpenShareDrawer?: (post: FeedPost) => void;
  isEmbedded?: boolean;
  superimposedPostId?: string | null;
  autoOpenCommentsPostId?: string | null;
  onClearSuperimposedPost?: () => void;
  onOpenPostModal?: (post: FeedPost | null) => void;
  onStartProject?: () => void;
  onCreateRecipe?: () => void;
}

export default function Feed({ 
  posts, 
  currentUserId, 
  currentUser, 
  creators, 
  projects = [],
  recipes = [],
  filter, 
  onUpdatePostGong, 
  onAddComment, 
  onToggleCommentHeart, 
  onToggleFollow,
  onFeedScroll, 
  onOpenCreatorProfile, 
  onOpenShareDrawer, 
  isEmbedded = false, 
  superimposedPostId,
  autoOpenCommentsPostId,
  onClearSuperimposedPost,
  onOpenPostModal,
  onStartProject,
  onCreateRecipe
}: FeedProps) {
  const [fullPostModal, setFullPostModal] = useState<FeedPost | null>(null);

  // Notify parent of modal open/close for URL routing permalinks
  const prevModalIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const currentId = fullPostModal?.id || null;
    if (currentId !== prevModalIdRef.current) {
      prevModalIdRef.current = currentId;
      if (onOpenPostModal) {
        onOpenPostModal(fullPostModal);
      }
    }
  }, [fullPostModal, onOpenPostModal]);
  const [newCommentText, setNewCommentText] = useState('');
  const [carouselIndices, setCarouselIndices] = useState<Record<string, number>>({});
  const [replyTarget, setReplyTarget] = useState<{
    commentId: string;
    userName: string;
    rootParentId: string;
  } | null>(null);

  // Auto-open modal when superimposedPostId or autoOpenCommentsPostId is provided
  React.useEffect(() => {
    if (superimposedPostId) {
      const targetPost = posts.find(p => p.id === superimposedPostId || p.title?.toLowerCase().includes(superimposedPostId.toLowerCase())) || posts[0];
      if (targetPost) {
        setFullPostModal(targetPost);
      }
    }
  }, [superimposedPostId, posts]);

  // Auto-open comments section in gallery modal if autoOpenCommentsPostId is provided
  React.useEffect(() => {
    if (autoOpenCommentsPostId) {
      const targetPost = posts.find(p => p.id === autoOpenCommentsPostId);
      if (targetPost) {
        setFullPostModal(targetPost);
        setTimeout(() => {
          document.getElementById('gallery-comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }
    }
  }, [autoOpenCommentsPostId, posts]);

  // Sync fullPostModal with updated posts from props
  React.useEffect(() => {
    if (fullPostModal) {
      const latest = posts.find(p => p.id === fullPostModal.id);
      if (latest) {
        setFullPostModal(prev => {
          if (!prev) return null;
          const mergedComments = latest.comments || prev.comments || [];
          return {
            ...latest,
            comments: mergedComments.length > (latest.comments?.length || 0) ? prev.comments : latest.comments
          };
        });
      }
    }
  }, [posts]);

  // Pagination state: initial 30 posts, +12 on scroll near bottom
  const [visibleCount, setVisibleCount] = useState<number>(30);

  // Disable parent page scrolling when fullPostModal is open
  React.useEffect(() => {
    if (fullPostModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [fullPostModal]);

  // Reset pagination when filter or posts list changes
  React.useEffect(() => {
    setVisibleCount(30);
  }, [filter, posts.length]);

  // Pagination tracker for sub-comment replies per top-level comment ID
  const [visibleReplyCounts, setVisibleReplyCounts] = useState<Record<string, number>>({});

  const getUserName = (userId: string, fallbackName: string) => {
    if (currentUser && (userId === currentUser.id || userId === 'user-1')) {
      return currentUser.name;
    }
    if (creators) {
      const creator = creators.find(c => c.id === userId);
      if (creator) return creator.name;
    }
    return fallbackName;
  };

  const getUserAvatar = (userId: string, fallbackAvatar?: string) => {
    let avatarCandidate = '';
    if (currentUser && (userId === currentUser.id || userId === 'user-1')) {
      avatarCandidate = currentUser.avatarUrl?.trim() || '';
    }
    if (!avatarCandidate && creators) {
      const creator = creators.find(c => c.id === userId);
      avatarCandidate = creator?.avatarUrl?.trim() || '';
    }
    if (!avatarCandidate) {
      avatarCandidate = fallbackAvatar?.trim() || '';
    }
    if (!avatarCandidate) return '';
    return getPublicMediaUrl('Gonnng', avatarCandidate);
  };

  const isUserFollowed = (userId?: string, userName?: string) => {
    if (!userId && !userName) return false;
    if (!currentUser) return false;
    let targetId = userId;
    if (!targetId && userName && creators) {
      const match = creators.find(c => c.name === userName || c.username === userName);
      if (match) targetId = match.id;
    }
    if (!targetId) return false;
    return isFollowingUser(currentUser, targetId, creators);
  };

  const isUserInCircle = (userId?: string, userName?: string) => {
    if (!userId && !userName) return false;
    if (!currentUser) return false;
    let targetId = userId;
    if (creators) {
      const match = creators.find(c => 
        (userId && (c.id === userId || c.publicId === userId)) ||
        (userName && (c.name?.trim().toLowerCase() === userName.trim().toLowerCase() || c.username?.trim().toLowerCase() === userName.trim().toLowerCase()))
      );
      if (match) targetId = match.id;
    }
    if (!targetId) return false;
    if (targetId === currentUser.id || (currentUser.publicId && targetId === currentUser.publicId)) return false;
    return checkCircleRelation(currentUser, targetId, creators);
  };

  // Content Visibility Filtering:
  // "All": Public community posts (excluding my own posts)
  // "Circle" (internal): Posts from all other users in the authenticated user's circle (mutual follow: you follow them & they follow you)
  // "Mine" (private): My own posts
  const filteredPosts = posts.filter(post => {
    if (!post) return false;
    const pUserId = post.userId || (post as any).user_id;
    if (filter === 'creator') {
      return true;
    }
    const isMyPost = Boolean(
      (currentUserId && pUserId === currentUserId) ||
      (currentUser && pUserId === currentUser.id) ||
      (currentUser && currentUser.publicId && post.publicId === currentUser.publicId) ||
      (currentUser && post.userName && currentUser.name && post.userName.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
    );
    if (filter === 'all') {
      if (isMyPost) return false;
      if (post.privacy === 'public') return true;
      if (post.privacy === 'internal') return isUserInCircle(pUserId, post.userName);
      return false;
    } else if (filter === 'internal') {
      // Circle filter: show posts from all other users in the authenticated user's circle
      return !isMyPost && post.privacy !== 'private' && isUserInCircle(pUserId, post.userName);
    } else {
      // 'private' represents 'Mine' / Profile feed
      return isMyPost;
    }
  });

  // Sort posts: NEWEST POST FIRST
  const getPostTimeValue = (p: FeedPost): number => {
    if (p.timeString && p.timeString.toLowerCase().includes('just now')) {
      return Date.now();
    }
    if ((p as any).createdAt) {
      const t = new Date((p as any).createdAt).getTime();
      if (!isNaN(t)) return t;
    }
    if ((p as any).timestamp) {
      const t = Number((p as any).timestamp);
      if (!isNaN(t)) return t;
    }
    const idMatch = p.id.match(/(\d{10,})/);
    if (idMatch) {
      return parseInt(idMatch[1], 10);
    }
    if (p.timeString) {
      const lower = p.timeString.toLowerCase();
      const match = lower.match(/(\d+)\s*(min|hour|day|week|month)/);
      if (match) {
        const val = parseInt(match[1], 10);
        const unit = match[2];
        const now = Date.now();
        if (unit.startsWith('min')) return now - val * 60 * 1000;
        if (unit.startsWith('hour')) return now - val * 3600 * 1000;
        if (unit.startsWith('day')) return now - val * 86400 * 1000;
        if (unit.startsWith('week')) return now - val * 7 * 86400 * 1000;
        if (unit.startsWith('month')) return now - val * 30 * 86400 * 1000;
      }
    }
    return 0;
  };

  const baseSorted = [...filteredPosts].sort((a, b) => getPostTimeValue(b) - getPostTimeValue(a));
  const superimposedPost = superimposedPostId ? (posts.find(p => p.id === superimposedPostId) || null) : null;

  let sortedPosts = baseSorted;
  if (superimposedPost) {
    sortedPosts = [
      superimposedPost,
      ...baseSorted.filter(p => p.id !== superimposedPost.id)
    ];
  }

  // Global window scroll listener for auto-loading next 12 posts near bottom
  React.useEffect(() => {
    const handleWindowScroll = () => {
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 400;
      if (scrollPosition >= threshold) {
        setVisibleCount(prev => {
          if (prev < sortedPosts.length) {
            return Math.min(prev + 12, sortedPosts.length);
          }
          return prev;
        });
      }
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, [sortedPosts.length]);

  const displayedPosts = sortedPosts.slice(0, visibleCount);

  const handleContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isEmbedded && onFeedScroll) {
      onFeedScroll(e.currentTarget.scrollTop > 10);
    }
    const target = e.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 300) {
      setVisibleCount(prev => {
        if (prev < sortedPosts.length) {
          return Math.min(prev + 12, sortedPosts.length);
        }
        return prev;
      });
    }
  };

  const handleOpenDescription = (post: FeedPost) => {
    setFullPostModal(post);
    setTimeout(() => {
      const el = document.getElementById('gallery-description-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  const handleOpenComments = (post: FeedPost) => {
    setFullPostModal(post);
    setTimeout(() => {
      const el = document.getElementById('gallery-[#gallery-comments-section]') || document.getElementById('gallery-comments-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  const handleCloseModal = () => {
    setFullPostModal(null);
    setNewCommentText('');
    setReplyTarget(null);
  };

  const handleToggleHeart = (commentId: string) => {
    if (!fullPostModal) return;

    const updatedComments = (fullPostModal.comments || []).map(c => {
      if (c.id !== commentId) return c;
      const willLike = !c.userLiked;
      const currentLikes = c.likes || 0;
      return {
        ...c,
        userLiked: willLike,
        likes: willLike ? currentLikes + 1 : Math.max(0, currentLikes - 1)
      };
    });

    setFullPostModal({
      ...fullPostModal,
      comments: updatedComments
    });

    if (onToggleCommentHeart) {
      onToggleCommentHeart(fullPostModal.id, commentId);
    }
  };

  const handleStartReply = (c: PostComment) => {
    // Single indent rule: Sub-replies do NOT add an extra indent level.
    // Point back to the root parent comment ID so all replies sit together.
    const rootParentId = c.parentId || c.id;
    setReplyTarget({
      commentId: c.id,
      userName: c.userName,
      rootParentId
    });
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullPostModal && newCommentText.trim() && onAddComment) {
      const parentId = replyTarget ? replyTarget.rootParentId : undefined;
      const replyToUser = replyTarget ? replyTarget.userName : undefined;

      onAddComment(fullPostModal.id, newCommentText.trim(), parentId, replyToUser);

      // Update local modal state to show new comment immediately
      const newCommentObj: PostComment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: currentUserId,
        userName: currentUser?.username,
        userAvatar: currentUser?.avatarStoragePath,
        content: newCommentText.trim(),
        timeString: 'Just now',
        likes: 0,
        userLiked: false,
        parentId,
        replyToUser
      };

      setFullPostModal({
        ...fullPostModal,
        comments: [...(fullPostModal.comments || []), newCommentObj]
      });

      setNewCommentText('');
      setReplyTarget(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto text-gray-900" id="feed-root">
      {sortedPosts.length > 0 ? (
        <div 
          onScroll={handleContainerScroll}
          className={
            isEmbedded
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 h-auto overflow-visible p-0 shadow-none border-0 bg-[#f8fafc]"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 h-[calc(100vh-130px)] sm:h-auto overflow-y-scroll sm:overflow-visible snap-y snap-mandatory scroll-smooth sm:scroll-auto no-scrollbar rounded-none border-0 p-0 shadow-2xl sm:shadow-none bg-[#f8fafc] sm:bg-transparent"
          }
        >
          {displayedPosts.map((post, idx) => (
            <PostTile
              key={post.id}
              post={post}
              idx={idx}
              totalPosts={sortedPosts.length}
              currentUser={currentUser}
              allCreators={creators}
              onUpdatePostGong={onUpdatePostGong}
              onOpenComments={(p) => handleOpenComments(p)}
              onOpenShareDrawer={onOpenShareDrawer}
              onOpenCreatorProfile={onOpenCreatorProfile}
              onSelectPostDetails={(p) => setFullPostModal(p)}
              isSuperimposed={Boolean(superimposedPost && post.id === superimposedPost.id)}
              onClearSuperimposedPost={onClearSuperimposedPost}
            />
          ))}

          {visibleCount < sortedPosts.length && (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 py-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-white/60 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
                <span>Loading more posts ({visibleCount} of {sortedPosts.length})...</span>
              </div>
            </div>
          )}
        </div>
      ) : filter === 'private' ? (
        <div className="w-full py-12 flex flex-col items-center justify-center p-8 text-center bg-[#151515] border border-white/10 rounded-3xl space-y-4 my-2">
          <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white font-display">Welcome to your Gonnng Workspace</h4>
            <p className="text-xs text-white/60 max-w-md mx-auto leading-relaxed">
              You haven't published any project updates or recipes yet. Start a new project or create a recipe blueprint to build your workspace!
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onStartProject && (
              <button
                type="button"
                id="profile-empty-start-project-btn"
                onClick={onStartProject}
                className="px-4 py-2.5 bg-[#F59E0B] hover:bg-[#FF751A] text-black font-extrabold text-xs rounded-xl shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" /> Start Project
              </button>
            )}
            {onCreateRecipe && (
              <button
                type="button"
                id="profile-empty-create-recipe-btn"
                onClick={onCreateRecipe}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-xl border border-white/15 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#F59E0B]" /> Create Recipe
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full py-20 flex flex-col items-center justify-center p-8 text-center bg-[#121212] border border-white/10 rounded-3xl">
          <BookOpen className="w-10 h-10 text-white/20 mb-3" />
          <p className="text-white/50 text-sm font-sans">
            {filter === 'creator'
              ? 'This creator has not posted any public projects yet.'
              : 'No project posts found in your Circle.'}
          </p>
        </div>
      )}

      {filter === 'internal' && (
        <CircleCategoryDiscovery
          currentUser={currentUser}
          creators={creators || []}
          projects={projects || []}
          recipes={recipes || []}
          onToggleFollow={onToggleFollow}
          onOpenCreatorProfile={onOpenCreatorProfile}
        />
      )}

      {/* CONSOLIDATED GALLERY MODAL */}
      <AnimatePresence>
        {fullPostModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 overflow-y-auto bg-gray-900/40 backdrop-blur-sm">
            {/* Click backdrop to close */}
            <div className="absolute inset-0" onClick={() => setFullPostModal(null)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-full h-full sm:h-auto max-w-none sm:max-w-2xl max-h-full sm:max-h-[90vh] rounded-none sm:rounded-3xl p-4 sm:p-6 shadow-2xl z-10 flex flex-col overflow-hidden border bg-white border-gray-200 text-gray-900"
            >
              {/* Close Button Upper Right Corner */}
              <button
                type="button"
                onClick={() => setFullPostModal(null)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all cursor-pointer z-20 shadow-md"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Scrollable Container */}
              <div className="flex-1 overflow-y-auto overscroll-contain pr-1 space-y-4 pt-1 touch-pan-y scroll-smooth">
                
                {/* 1. Gong button cluster + Comments button transparent background cluster */}
                <div className="flex items-center justify-between bg-transparent p-2 gap-2 pr-12 sm:pr-14">
                  <div className="flex items-center gap-1.5">
                    {/* Continue */}
                    <button
                      type="button"
                      onClick={() => {
                        onUpdatePostGong(fullPostModal.id, 'continue');
                        setFullPostModal(prev => prev ? {
                          ...prev,
                          gongs: {
                            ...prev.gongs,
                            userVoted: prev.gongs.userVoted === 'continue' ? undefined : 'continue',
                            continue: prev.gongs.userVoted === 'continue' ? prev.gongs.continue - 1 : prev.gongs.continue + 1,
                            refine: prev.gongs.userVoted === 'refine' ? Math.max(0, prev.gongs.refine - 1) : prev.gongs.refine,
                            reconsider: prev.gongs.userVoted === 'reconsider' ? Math.max(0, prev.gongs.reconsider - 1) : prev.gongs.reconsider
                          }
                        } : null);
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer m-0 border-0 ${
                        fullPostModal.gongs.userVoted === 'continue'
                          ? 'bg-[#F59E0B] text-[#18181B] font-black'
                          : 'bg-transparent text-[#F59E0B] hover:bg-[#F59E0B]/15'
                      }`}
                      title="Perfect — You've got it!"
                    >
                      <Disc3 className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                      <span>{formatCount(fullPostModal.gongs.continue)}</span>
                    </button>

                    {/* 2. Potential — Keep working on it */}
                    <button
                      type="button"
                      onClick={() => {
                        onUpdatePostGong(fullPostModal.id, 'refine');
                        setFullPostModal(prev => prev ? {
                          ...prev,
                          gongs: {
                            ...prev.gongs,
                            userVoted: prev.gongs.userVoted === 'refine' ? undefined : 'refine',
                            continue: prev.gongs.userVoted === 'continue' ? Math.max(0, prev.gongs.continue - 1) : prev.gongs.continue,
                            refine: prev.gongs.userVoted === 'refine' ? prev.gongs.refine - 1 : prev.gongs.refine + 1,
                            reconsider: prev.gongs.userVoted === 'reconsider' ? Math.max(0, prev.gongs.reconsider - 1) : prev.gongs.reconsider
                          }
                        } : null);
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer m-0 border-0 ${
                        fullPostModal.gongs.userVoted === 'refine'
                          ? 'bg-[#99F6E4] text-[#18181B] font-black'
                          : 'bg-transparent text-[#99F6E4] hover:bg-[#99F6E4]/15'
                      }`}
                      title="Potential — Keep working on it"
                    >
                      <Pencil className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                      <span>{formatCount(fullPostModal.gongs.refine)}</span>
                    </button>

                    {/* 3. Promise — Try another approach */}
                    <button
                      type="button"
                      onClick={() => {
                        onUpdatePostGong(fullPostModal.id, 'reconsider');
                        setFullPostModal(prev => prev ? {
                          ...prev,
                          gongs: {
                            ...prev.gongs,
                            userVoted: prev.gongs.userVoted === 'reconsider' ? undefined : 'reconsider',
                            continue: prev.gongs.userVoted === 'continue' ? Math.max(0, prev.gongs.continue - 1) : prev.gongs.continue,
                            refine: prev.gongs.userVoted === 'refine' ? Math.max(0, prev.gongs.refine - 1) : prev.gongs.refine,
                            reconsider: prev.gongs.userVoted === 'reconsider' ? prev.gongs.reconsider - 1 : prev.gongs.reconsider + 1
                          }
                        } : null);
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer m-0 border-0 ${
                        fullPostModal.gongs.userVoted === 'reconsider'
                          ? 'bg-[#FF9A84] text-[#18181B] font-black'
                          : 'bg-transparent text-[#FF9A84] hover:bg-[#FF9A84]/15'
                      }`}
                      title="Promise — Try another approach"
                    >
                      <Octagon className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                      <span>{formatCount(fullPostModal.gongs.reconsider)}</span>
                    </button>
                  </div>

                  {/* Comments shortcut button right next to gongs */}
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById('gallery-comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono bg-[#F59E0B] text-black hover:bg-[#FF751A] transition-all cursor-pointer shadow-md shrink-0"
                    title="Jump to comments"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-black shrink-0" />
                    <span>{formatCount(fullPostModal.comments?.length || 0)}</span>
                  </button>
                </div>

                {/* 2. Poster avatar, name & share button */}
                <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/10 pt-1">
                  <div 
                    onClick={() => {
                      const authorId = fullPostModal.userId || fullPostModal.userName;
                      setFullPostModal(null);
                      onOpenCreatorProfile?.(authorId);
                    }}
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-all group"
                    title={`View ${getUserName(fullPostModal.userId, fullPostModal.userName)}'s profile`}
                  >
                    {getUserAvatar(fullPostModal.userId, fullPostModal.userAvatar) ? (
                      <img 
                        src={getUserAvatar(fullPostModal.userId, fullPostModal.userAvatar)} 
                        alt={getUserName(fullPostModal.userId, fullPostModal.userName)} 
                        className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                        <User className="w-4 h-4 text-white/70" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white leading-tight group-hover:underline">
                        {getUserName(fullPostModal.userId, fullPostModal.userName)}
                      </h4>
                      <p className="text-[10px] font-mono text-white/50">{fullPostModal.timeString}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenShareDrawer && onOpenShareDrawer(fullPostModal);
                    }}
                    className="p-2 bg-[#F59E0B] hover:bg-[#FF751A] text-black rounded-xl transition-all cursor-pointer shrink-0 shadow-md flex items-center gap-1.5 text-xs font-bold font-mono"
                    title="Share post"
                  >
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                    <span>Share</span>
                  </button>
                </div>

                {/* 3. Gallery of all media in the post */}
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-mono text-[#F59E0B] uppercase font-bold tracking-wider block">
                    Media Gallery
                  </span>
                  <div className="grid grid-cols-1 gap-3">
                    {((fullPostModal.images && fullPostModal.images.length > 0)
                      ? fullPostModal.images
                      : [fullPostModal.image || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=800']
                    ).map((imgUrl, imgIdx) => (
                      <div key={imgIdx} className="rounded-2xl overflow-hidden border border-white/15 bg-black/60 shadow-lg">
                        <img 
                          src={imgUrl} 
                          alt={`${fullPostModal.title} - ${imgIdx + 1}`} 
                          className="w-full max-h-[420px] object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Full title & description section in same rounded box */}
                <div id="gallery-description-section" className="space-y-2 pt-3 border-t border-white/10 scroll-mt-4">
                  <span className="text-[10px] font-mono text-[#F59E0B] uppercase font-bold tracking-wider block">
                    Project Overview
                  </span>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
                    <h2 className="text-lg sm:text-xl font-display font-bold text-white leading-snug break-words">
                      {fullPostModal.title}
                    </h2>
                    <div className="border-t border-white/10 pt-3">
                      <p className="text-sm text-white/90 font-sans leading-relaxed whitespace-pre-line">
                        {fullPostModal.content}
                        {fullPostModal.hashtags && (
                          <span className="block mt-2 text-[#F59E0B] font-mono text-xs font-bold break-words">
                            {Array.isArray(fullPostModal.hashtags)
                              ? fullPostModal.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')
                              : fullPostModal.hashtags}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {fullPostModal.attachedName && (
                    <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 p-3 rounded-xl flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#F59E0B]" />
                      <span className="text-xs font-mono font-bold text-[#F59E0B]">
                        Attached Recipe: {fullPostModal.attachedName}
                      </span>
                    </div>
                  )}
                </div>

                {/* 6. Comments section */}
                <div id="gallery-comments-section" className="space-y-3 pt-3 border-t border-white/10 scroll-mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#F59E0B] uppercase font-bold tracking-wider block">
                      Comments ({fullPostModal.comments?.length || 0})
                    </span>
                  </div>

                  {/* Comments list */}
                  <div className="space-y-2">
                    {(() => {
                      const allComments = fullPostModal.comments || [];
                      const topLevelComments = allComments.filter(c => !c.parentId);

                      const sortedTopLevel = [...topLevelComments].sort((a, b) => {
                        const aHasReplies = allComments.some(c => c.parentId === a.id);
                        const bHasReplies = allComments.some(c => c.parentId === b.id);
                        if (aHasReplies && !bHasReplies) return -1;
                        if (!aHasReplies && bHasReplies) return 1;
                        return 0;
                      });

                      if (allComments.length === 0) {
                        return (
                          <div className="p-4 text-center text-white/40 text-xs font-sans bg-white/5 rounded-2xl border border-white/10">
                            No comments yet. Start the conversation!
                          </div>
                        );
                      }

                      return sortedTopLevel.map(parentComment => {
                        const replies = allComments.filter(c => c.parentId === parentComment.id);
                        const limit = visibleReplyCounts[parentComment.id] ?? (replies.length > 3 ? 2 : replies.length);
                        const visibleReplies = replies.slice(0, limit);
                        const remainingCount = replies.length - visibleReplies.length;

                        return (
                          <div key={parentComment.id} className="space-y-1.5">
                            <CommentCard
                              comment={parentComment}
                              onHeart={() => handleToggleHeart(parentComment.id)}
                              onReply={() => handleStartReply(parentComment)}
                              getUserName={getUserName}
                              getUserAvatar={getUserAvatar}
                              isFollowed={isUserFollowed(parentComment.userId, parentComment.userName)}
                              onOpenProfile={() => {
                                setFullPostModal(null);
                                onOpenCreatorProfile?.(parentComment.userId || parentComment.userName);
                              }}
                            />

                            {replies.length > 0 && (
                              <div className="pl-3 sm:pl-4 border-l-2 border-white/15 ml-2.5 sm:ml-3 space-y-1.5 my-1">
                                {visibleReplies.map(reply => (
                                  <CommentCard
                                    key={reply.id}
                                    comment={reply}
                                    isReply={true}
                                    onHeart={() => handleToggleHeart(reply.id)}
                                    onReply={() => handleStartReply(reply)}
                                    getUserName={getUserName}
                                    getUserAvatar={getUserAvatar}
                                    isFollowed={isUserFollowed(reply.userId, reply.userName)}
                                    onOpenProfile={() => {
                                      setFullPostModal(null);
                                      onOpenCreatorProfile?.(reply.userId || reply.userName);
                                    }}
                                  />
                                ))}

                                {remainingCount > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVisibleReplyCounts(prev => ({
                                        ...prev,
                                        [parentComment.id]: (prev[parentComment.id] ?? 2) + 3
                                      }));
                                    }}
                                    className="text-[11px] font-mono text-[#F59E0B] hover:text-[#FF751A] hover:underline flex items-center gap-1 pt-1 font-bold cursor-pointer"
                                  >
                                    <span>+ View {Math.min(3, remainingCount)} more {remainingCount === 1 ? 'reply' : 'replies'} ({remainingCount} hidden)</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Comment Input Form & Reply Indicator */}
                  <div className="pt-2 space-y-1.5">
                    {replyTarget && (
                      <div className="flex items-center justify-between bg-white/10 px-3 py-1 rounded-lg text-xs font-mono text-white/70">
                        <span>
                          Replying to <span className="text-[#F59E0B] font-bold">@{replyTarget.userName}</span>
                        </span>
                        <button 
                          type="button" 
                          onClick={() => setReplyTarget(null)}
                          className="text-white/50 hover:text-white p-0.5 cursor-pointer"
                          title="Cancel reply"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <form onSubmit={handleSubmitComment} className="flex gap-2">
                      <input
                        type="text"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder={replyTarget ? `Reply to @${replyTarget.userName}...` : "Write a constructive feedback comment..."}
                        className="flex-1 px-3.5 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                      />
                      <button
                        type="submit"
                        disabled={!newCommentText.trim()}
                        className="px-4 py-2 bg-[#F59E0B] hover:bg-[#FF751A] disabled:opacity-40 text-black font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" /> Send
                      </button>
                    </form>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Helper component for rendering comments with tight vertical spacing & heart/reply actions
function CommentCard({
  comment,
  isReply = false,
  onHeart,
  onReply,
  getUserName,
  getUserAvatar,
  isFollowed = false,
  onOpenProfile
}: {
  key?: string | number;
  comment: PostComment;
  isReply?: boolean;
  onHeart: () => void;
  onReply: () => void;
  getUserName: (userId: string, fallbackName: string) => string;
  getUserAvatar: (userId: string, fallbackAvatar: string) => string;
  isFollowed?: boolean;
  onOpenProfile?: () => void;
}) {
  const displayName = getUserName(comment.userId || '', comment.userName);
  const displayAvatar = getUserAvatar(comment.userId || '', comment.userAvatar);

  return (
    <div className={`p-2 sm:p-2.5 bg-white/5 border border-white/10 rounded-xl space-y-1 ${isReply ? 'bg-white/[0.03]' : ''}`}>
      <div className="flex items-center justify-between min-w-0">
        <div 
          onClick={onOpenProfile}
          className="flex items-center gap-1.5 min-w-0 flex-wrap cursor-pointer hover:opacity-80 transition-all group"
          title={`View ${displayName}'s profile`}
        >
          {displayAvatar ? (
            <img 
              src={displayAvatar} 
              alt={displayName} 
              className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full object-cover shrink-0 border border-white/20 ${
                isFollowed ? 'ring-2 ring-[#F59E0B] ring-offset-1 ring-offset-black' : ''
              }`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20 ${
              isFollowed ? 'ring-2 ring-[#F59E0B] ring-offset-1 ring-offset-black' : ''
            }`}>
              <User className="w-3 h-3 text-white/70" />
            </div>
          )}
          <span className="text-xs font-bold text-white truncate max-w-[120px] sm:max-w-[160px] group-hover:underline">{displayName}</span>
          
          {/* Softer color "replying to @User" indicator */}
          {comment.replyToUser && (
            <span className="text-[10px] sm:text-[11px] font-normal text-white/40 font-sans truncate max-w-[130px]">
              replying to <span className="text-white/60 font-medium">@{comment.replyToUser}</span>
            </span>
          )}

          <span className="text-[10px] font-mono text-white/40 shrink-0">• {comment.timeString}</span>
        </div>
      </div>

      <p className="text-xs text-white/85 font-sans leading-snug pl-6 sm:pl-7 break-words">
        {comment.content}
      </p>

      {/* Action Row: Heart & Reply Buttons */}
      <div className="flex items-center gap-3 pt-0.5 pl-6 sm:pl-7 text-[10px] sm:text-[11px] font-mono">
        <button
          type="button"
          onClick={onHeart}
          className={`flex items-center gap-1 transition-all cursor-pointer ${
            comment.userLiked 
              ? 'text-red-400 font-bold' 
              : 'text-white/40 hover:text-white/80'
          }`}
          title={comment.userLiked ? 'Unlike comment' : 'Heart comment'}
        >
          <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${comment.userLiked ? 'fill-red-500 text-red-500' : ''}`} />
          <span>{formatCount(comment.likes || 0)}</span>
        </button>

        <button
          type="button"
          onClick={onReply}
          className="flex items-center gap-1 text-white/40 hover:text-[#F59E0B] transition-all cursor-pointer"
          title="Reply to comment"
        >
          <CornerDownRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>Reply</span>
        </button>
      </div>
    </div>
  );
}

