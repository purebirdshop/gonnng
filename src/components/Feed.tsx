import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FeedPost, PostComment, Creator } from '../types';
import { 
  Globe, 
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
  ArrowUpRight
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
  filter: 'all' | 'internal' | 'private';
  onUpdatePostGong: (postId: string, voteType: 'continue' | 'refine' | 'reconsider') => void;
  onAddComment?: (postId: string, commentContent: string, parentId?: string, replyToUser?: string) => void;
  onToggleCommentHeart?: (postId: string, commentId: string) => void;
  onFeedScroll?: (scrolled: boolean) => void;
  onOpenCreatorProfile?: (userIdOrName: string) => void;
  onOpenShareDrawer?: (post: FeedPost) => void;
  isEmbedded?: boolean;
  theme?: 'dark' | 'light';
  superimposedPostId?: string | null;
  autoOpenCommentsPostId?: string | null;
  onClearSuperimposedPost?: () => void;
}

export default function Feed({ 
  posts, 
  currentUserId, 
  currentUser, 
  creators, 
  filter, 
  onUpdatePostGong, 
  onAddComment, 
  onToggleCommentHeart, 
  onFeedScroll, 
  onOpenCreatorProfile, 
  onOpenShareDrawer, 
  isEmbedded = false, 
  theme = 'dark',
  superimposedPostId,
  autoOpenCommentsPostId,
  onClearSuperimposedPost
}: FeedProps) {
  const [modalPost, setModalPost] = useState<FeedPost | null>(null);
  const [modalType, setModalType] = useState<'description' | 'comments' | null>(null);
  const [fullPostModal, setFullPostModal] = useState<FeedPost | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [carouselIndices, setCarouselIndices] = useState<Record<string, number>>({});
  const [replyTarget, setReplyTarget] = useState<{
    commentId: string;
    userName: string;
    rootParentId: string;
  } | null>(null);

  // Auto-open comments drawer if autoOpenCommentsPostId is provided
  React.useEffect(() => {
    if (autoOpenCommentsPostId) {
      const targetPost = posts.find(p => p.id === autoOpenCommentsPostId);
      if (targetPost) {
        setModalPost(targetPost);
        setModalType('comments');
      }
    }
  }, [autoOpenCommentsPostId, posts]);

  // Pagination state: initial 30 posts, +12 on scroll near bottom
  const [visibleCount, setVisibleCount] = useState<number>(30);

  // Disable parent page scrolling when any modal or drawer is open
  React.useEffect(() => {
    if (modalType || fullPostModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalType, fullPostModal]);

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

  const getUserAvatar = (userId: string, fallbackAvatar: string) => {
    if (currentUser && (userId === currentUser.id || userId === 'user-1')) {
      return currentUser.avatarUrl || fallbackAvatar;
    }
    if (creators) {
      const creator = creators.find(c => c.id === userId);
      if (creator?.avatarUrl) return creator.avatarUrl;
    }
    return fallbackAvatar;
  };

  const isUserFollowed = (userId?: string, userName?: string) => {
    if (!userId && !userName) return false;
    if (currentUser && (userId === currentUser.id || userName === currentUser.name)) return false;
    return creators?.some(c => c.isFollowing && (c.id === userId || c.name === userName));
  };

  const isUserInCircle = (userId?: string, userName?: string) => {
    if (!userId && !userName) return false;
    if (currentUser && (userId === currentUser.id || userName === currentUser.name)) return false;
    return creators?.some(c => c.isFollowing && (c.followsYou || c.isInCircle) && (c.id === userId || c.name === userName));
  };

  // Content Visibility Filtering:
  // "All": Public community posts (excluding my own posts)
  // "Circle" (internal): Internal/Circle scope posts ONLY from users in your circle (mutual follow: you follow them & they follow you)
  // "Mine" (private): My own posts
  const filteredPosts = posts.filter(post => {
    const isMyPost = 
      post.userId === currentUserId || 
      (currentUser && post.userId === currentUser.id) ||
      post.userId === 'user-current' ||
      (currentUser && post.userName && currentUser.name && post.userName.toLowerCase() === currentUser.name.toLowerCase());
    if (filter === 'all') {
      return post.privacy !== 'private' && !isMyPost;
    } else if (filter === 'internal') {
      // Circle filter: ONLY show internal/circle posts from mutual circle members
      return !isMyPost && post.privacy === 'internal' && (isUserInCircle(post.userId, post.userName) || !creators);
    } else {
      // 'private' represents 'Mine'
      return isMyPost;
    }
  });

  // Sort posts: NEWEST POST FIRST
  const getPostTimeValue = (p: FeedPost): number => {
    if ((p as any).createdAt) {
      const t = new Date((p as any).createdAt).getTime();
      if (!isNaN(t)) return t;
    }
    if ((p as any).timestamp) {
      const t = Number((p as any).timestamp);
      if (!isNaN(t)) return t;
    }
    const idMatch = p.id.match(/post-(\d+)/);
    if (idMatch && idMatch[1].length >= 10) {
      return parseInt(idMatch[1], 10);
    }
    if (p.timeString) {
      const lower = p.timeString.toLowerCase();
      if (lower.includes('just now')) return Date.now();
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
    setModalPost(post);
    setModalType('description');
  };

  const handleOpenComments = (post: FeedPost) => {
    setModalPost(post);
    setModalType('comments');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setModalPost(null);
    setNewCommentText('');
    setReplyTarget(null);
  };

  const handleToggleHeart = (commentId: string) => {
    if (!modalPost) return;

    const updatedComments = (modalPost.comments || []).map(c => {
      if (c.id !== commentId) return c;
      const willLike = !c.userLiked;
      const currentLikes = c.likes || 0;
      return {
        ...c,
        userLiked: willLike,
        likes: willLike ? currentLikes + 1 : Math.max(0, currentLikes - 1)
      };
    });

    setModalPost({
      ...modalPost,
      comments: updatedComments
    });

    if (onToggleCommentHeart) {
      onToggleCommentHeart(modalPost.id, commentId);
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
    if (modalPost && newCommentText.trim() && onAddComment) {
      const parentId = replyTarget ? replyTarget.rootParentId : undefined;
      const replyToUser = replyTarget ? replyTarget.userName : undefined;

      onAddComment(modalPost.id, newCommentText.trim(), parentId, replyToUser);

      // Update local modal state to show new comment immediately
      const newCommentObj: PostComment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: currentUserId,
        userName: 'You',
        userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
        content: newCommentText.trim(),
        timeString: 'Just now',
        likes: 0,
        userLiked: false,
        parentId,
        replyToUser
      };

      setModalPost({
        ...modalPost,
        comments: [...(modalPost.comments || []), newCommentObj]
      });

      setNewCommentText('');
      setReplyTarget(null);
    }
  };

  return (
    <div className={`w-full max-w-7xl mx-auto ${theme === 'light' ? 'text-gray-900' : 'text-white'}`} id="feed-root">
      {sortedPosts.length > 0 ? (
        <div 
          onScroll={handleContainerScroll}
          className={
            isEmbedded
              ? `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 h-auto overflow-visible p-0 shadow-none border-0 ${
                  theme === 'light' ? 'bg-[#f8fafc]' : 'bg-transparent'
                }`
              : `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 h-[calc(100vh-130px)] sm:h-auto overflow-y-scroll sm:overflow-visible snap-y snap-mandatory scroll-smooth sm:scroll-auto no-scrollbar rounded-none border-0 p-0 shadow-2xl sm:shadow-none ${
                  theme === 'light' ? 'bg-[#f8fafc] sm:bg-transparent' : 'bg-transparent'
                }`
          }
        >
          {displayedPosts.map((post, idx) => {
            const fallbackImage = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=800';
            const postImages: string[] = (post.images && post.images.length > 0)
              ? post.images
              : (post.image ? [post.image] : [fallbackImage]);
            const currentImgIndex = (carouselIndices[post.id] || 0) % postImages.length;
            const displayImage = postImages[currentImgIndex] || fallbackImage;
            const commentsCount = post.comments?.length || 0;

            return (
              <div 
                key={post.id} 
                id={`feed-post-${post.id}`}
                className={
                  theme === 'light'
                    ? "snap-start snap-always w-full h-[calc(100vh-140px)] sm:h-[500px] shrink-0 sm:shrink flex flex-col justify-between bg-white border border-gray-200 rounded-none p-3.5 relative overflow-hidden shadow-md hover:border-[#FF5C00]/50 transition-all gap-2 text-gray-900 group"
                    : "snap-start snap-always w-full h-[calc(100vh-140px)] sm:h-[500px] shrink-0 sm:shrink flex flex-col justify-between bg-[#121212] border border-white/10 rounded-none p-3.5 relative overflow-hidden shadow-xl hover:border-white/20 transition-all gap-2 text-white group"
                }
              >
                {/* 1. Full Vertical Space Image (Cover) behind post content */}
                <div 
                  onClick={() => setFullPostModal(post)}
                  className="absolute inset-0 w-full h-full cursor-pointer z-0 bg-black"
                  title="Click image to open full post details"
                >
                  <img 
                    src={displayImage} 
                    alt={post.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Taller Gradients for contrast while keeping image visible */}
                  <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black via-black/75 to-transparent pointer-events-none" />
                </div>

                {/* Superimposed Badge if this post was selected from Updates */}
                {superimposedPost && post.id === superimposedPost.id && (
                  <div className="relative z-20 flex items-center justify-between bg-[#FF5C00] text-black px-3 py-1 rounded-full text-[10px] font-mono font-bold shadow-lg mb-1">
                    <span className="flex items-center gap-1">SUPERIMPOSED UPDATE POST</span>
                    {onClearSuperimposedPost && (
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearSuperimposedPost();
                        }}
                        className="p-0.5 hover:bg-black/20 rounded-full cursor-pointer ml-2"
                        title="Dismiss superimposed view"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Top Metadata & Share Button (z-10 over absolute image) */}
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCreatorProfile?.(post.userId || post.userName);
                    }}
                    className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-all group/user bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20"
                    title={`View ${getUserName(post.userId, post.userName)}'s profile`}
                  >
                    <img 
                      src={getUserAvatar(post.userId, post.userAvatar)} 
                      alt={getUserName(post.userId, post.userName)} 
                      className={`w-5 h-5 rounded-full object-cover border border-white/20 shrink-0 ${
                        isUserFollowed(post.userId, post.userName) ? 'ring-2 ring-[#FF5C00] ring-offset-1 ring-offset-black' : ''
                      }`}
                      referrerPolicy="no-referrer"
                    />
                    <span className="font-bold text-xs text-white truncate max-w-[110px] sm:max-w-[150px] group-hover/user:underline">
                      {getUserName(post.userId, post.userName)}
                    </span>
                    <span className="text-[10px] font-mono text-white/60 shrink-0">• {post.timeString}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md border border-white/20 px-2 py-1 rounded-full text-[10px] font-mono text-white/80">
                      {post.privacy === 'public' && <><Globe className="w-3 h-3 text-[#FF5C00]" /><span className="uppercase">Public</span></>}
                      {post.privacy === 'internal' && <><Users className="w-3 h-3 text-[#FF5C00]" /><span className="uppercase">Circle</span></>}
                      {post.privacy === 'private' && <><Lock className="w-3 h-3 text-[#FF5C00]" /><span className="uppercase">Private</span></>}
                    </div>

                    <button
                      type="button"
                      id={`share-post-btn-${post.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenShareDrawer && onOpenShareDrawer(post);
                      }}
                      className="bg-black/80 hover:bg-[#FF5C00] text-white hover:text-black p-1.5 rounded-full transition-all cursor-pointer z-30 border border-white/20 shadow-lg flex items-center justify-center"
                      title="Share post & copy permalink"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* Carousel Controls if multiple images */}
                {postImages.length > 1 && (
                  <div className="relative z-10 flex items-center justify-between pointer-events-none px-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCarouselIndices(prev => ({
                          ...prev,
                          [post.id]: ((prev[post.id] || 0) - 1 + postImages.length) % postImages.length
                        }));
                      }}
                      className="pointer-events-auto bg-black/70 hover:bg-black p-1.5 rounded-full text-white/80 hover:text-white transition-all cursor-pointer border border-white/20 shadow-lg"
                      title="Previous image"
                    >
                      <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                    </button>

                    <div className="bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-white border border-white/20">
                      {currentImgIndex + 1} / {postImages.length}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCarouselIndices(prev => ({
                          ...prev,
                          [post.id]: ((prev[post.id] || 0) + 1) % postImages.length
                        }));
                      }}
                      className="pointer-events-auto bg-black/70 hover:bg-black p-1.5 rounded-full text-white/80 hover:text-white transition-all cursor-pointer border border-white/20 shadow-lg"
                      title="Next image"
                    >
                      <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                )}

                {/* Bottom Content Area (z-10 over absolute image) */}
                <div className="relative z-10 space-y-2 mt-auto">
                  
                  {/* Title - Clicking title opens Full Post Detail Modal */}
                  <h3 
                    onClick={() => setFullPostModal(post)}
                    className="text-base sm:text-lg leading-snug font-display font-bold text-white break-words cursor-pointer hover:text-[#FF5C00] transition-colors line-clamp-2 drop-shadow-md"
                  >
                    {post.title}
                  </h3>

                  {/* Description Preview Block */}
                  <div className="bg-black/60 backdrop-blur-md border border-white/15 p-2.5 sm:p-3 rounded-2xl text-white space-y-1.5">
                    <p className="text-xs sm:text-sm font-sans leading-relaxed line-clamp-2 text-white/90">
                      {post.content}
                      {post.hashtags && (
                        <span className="block mt-0.5 text-[#FF5C00] font-mono text-xs font-bold break-words">
                          {Array.isArray(post.hashtags)
                            ? post.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')
                            : post.hashtags}
                        </span>
                      )}
                    </p>

                    <div className="flex justify-between items-center pt-1 border-t border-white/10">
                      {post.attachedName ? (
                        <span className="text-[10px] font-mono text-[#FF5C00] truncate max-w-[160px]">
                          📂 {post.attachedName}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-white/40">
                          {idx + 1} of {sortedPosts.length}
                        </span>
                      )}

                      <button
                        id={`keep-reading-btn-${post.id}`}
                        type="button"
                        onClick={() => handleOpenDescription(post)}
                        className="text-xs font-bold text-[#FF5C00] hover:text-[#FF751A] hover:underline cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        Keep reading <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Gong Buttons Cluster + Comments Trigger */}
                  <div className="flex items-center justify-between bg-black/85 backdrop-blur-md p-1.5 sm:p-2 rounded-2xl border border-white/20 shadow-2xl gap-1">
                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                      {/* Continue */}
                      <button
                        id={`gong-continue-btn-${post.id}`}
                        type="button"
                        onClick={() => onUpdatePostGong(post.id, 'continue')}
                        className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                          post.gongs.userVoted === 'continue'
                            ? 'bg-emerald-500 text-black font-black shadow-md'
                            : 'bg-white/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                        }`}
                        title="Keep going / Continue"
                      >
                        <Disc3 className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                        <span className="text-[10px] sm:text-[11px]">{formatCount(post.gongs.continue)}</span>
                      </button>

                      {/* Refine */}
                      <button
                        id={`gong-refine-btn-${post.id}`}
                        type="button"
                        onClick={() => onUpdatePostGong(post.id, 'refine')}
                        className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                          post.gongs.userVoted === 'refine'
                            ? 'bg-[#FF5C00] text-black font-black shadow-md'
                            : 'bg-white/10 text-[#FF5C00] hover:bg-[#FF5C00]/20 border border-[#FF5C00]/30'
                        }`}
                        title="Needs work / Refine"
                      >
                        <Pencil className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                        <span className="text-[10px] sm:text-[11px]">{formatCount(post.gongs.refine)}</span>
                      </button>

                      {/* Reconsider */}
                      <button
                        id={`gong-reconsider-btn-${post.id}`}
                        type="button"
                        onClick={() => onUpdatePostGong(post.id, 'reconsider')}
                        className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                          post.gongs.userVoted === 'reconsider'
                            ? 'bg-red-500 text-white font-black shadow-md'
                            : 'bg-white/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                        }`}
                        title="Stop / Reconsider"
                      >
                        <Octagon className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                        <span className="text-[10px] sm:text-[11px]">{formatCount(post.gongs.reconsider)}</span>
                      </button>
                    </div>

                    {/* Comments Button */}
                    <button
                      id={`comments-trigger-btn-${post.id}`}
                      type="button"
                      onClick={() => handleOpenComments(post)}
                      className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold font-mono bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer border border-white/20 shadow-md shrink-0"
                      title="View & add comments"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-white shrink-0" />
                      <span className="text-[10px] sm:text-[11px]">{formatCount(commentsCount)}</span>
                    </button>
                  </div>

                </div>

              </div>
            );
          })}

          {visibleCount < sortedPosts.length && (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 py-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-white/60 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-[#FF5C00] animate-ping" />
                <span>Loading more posts ({visibleCount} of {sortedPosts.length})...</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full py-20 flex flex-col items-center justify-center p-8 text-center bg-[#121212] border border-white/10 rounded-3xl">
          <BookOpen className="w-10 h-10 text-white/20 mb-3" />
          <p className="text-white/50 text-sm font-sans">
            {filter === 'private' 
              ? 'You have not created any project posts yet.' 
              : 'No project posts found under this filter.'}
          </p>
        </div>
      )}

      {/* Lower Two Thirds Slide-Up Modal / Sheet */}
      <AnimatePresence>
        {modalType && modalPost && (
          <div className="fixed inset-0 bg-black/25 backdrop-blur-[1px] z-50 flex items-end justify-center px-0 sm:px-4">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={handleCloseModal} />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="relative w-full max-w-3xl h-[68vh] bg-[#141414]/95 backdrop-blur-md border-t border-x border-white/20 rounded-t-3xl p-4 sm:p-6 shadow-2xl flex flex-col justify-between z-10 overflow-hidden"
            >
              {/* Modal Drag handle & Header */}
              <div className="flex justify-between items-center pb-2.5 border-b border-white/10 shrink-0">
                <div 
                  onClick={() => {
                    const authorId = modalPost.userId || modalPost.userName;
                    handleCloseModal();
                    onOpenCreatorProfile?.(authorId);
                  }}
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-all group"
                  title={`View ${getUserName(modalPost.userId, modalPost.userName)}'s profile`}
                >
                  <img 
                    src={getUserAvatar(modalPost.userId, modalPost.userAvatar)} 
                    alt={getUserName(modalPost.userId, modalPost.userName)} 
                    className={`w-8 h-8 rounded-full object-cover border border-white/20 ${
                      isUserFollowed(modalPost.userId, modalPost.userName) ? 'ring-2 ring-[#FF5C00] ring-offset-1 ring-offset-black' : ''
                    }`}
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight group-hover:underline">
                      {getUserName(modalPost.userId, modalPost.userName)}
                    </h4>
                    <p className="text-[10px] font-mono text-white/40">{modalPost.timeString}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* MODAL BODY 1: FULL DESCRIPTION */}
              {modalType === 'description' && (
                <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-[#FF5C00] uppercase font-bold tracking-wider">
                      Full Project Overview
                    </span>
                    <h2 className="text-lg sm:text-xl font-display font-bold text-white">{modalPost.title}</h2>
                  </div>

                  <p className="text-sm sm:text-base text-white/90 font-sans leading-relaxed whitespace-pre-line bg-white/5 p-3.5 rounded-2xl border border-white/10">
                    {modalPost.content}
                    {modalPost.hashtags && (
                      <span className="block mt-2 text-[#FF5C00] font-mono text-xs font-bold break-words">
                        {Array.isArray(modalPost.hashtags)
                          ? modalPost.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')
                          : modalPost.hashtags}
                      </span>
                    )}
                  </p>

                  {modalPost.attachedName && (
                    <div className="bg-[#FF5C00]/10 border border-[#FF5C00]/30 p-2.5 rounded-xl flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#FF5C00]" />
                      <span className="text-xs font-mono font-bold text-[#FF5C00]">
                        Bound Recipe: {modalPost.attachedName}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* MODAL BODY 2: COMMENTS LIST & INPUT */}
              {modalType === 'comments' && (
                <div className="flex-1 flex flex-col justify-between overflow-hidden py-2 space-y-2">
                  
                  {/* Simplified GONG DIRECTIONAL CHECK cluster inside comments modal header */}
                  <div className="shrink-0 flex items-center justify-between bg-black/60 backdrop-blur-md p-1.5 sm:p-2 rounded-xl border border-white/15 shadow-md my-0.5">
                    <div className="flex items-center gap-1.5">
                      {/* Continue */}
                      <button
                        type="button"
                        onClick={() => {
                          onUpdatePostGong(modalPost.id, 'continue');
                          setModalPost(prev => {
                            if (!prev) return null;
                            const userVoted = prev.gongs.userVoted === 'continue' ? undefined : 'continue';
                            const isPrevContinue = prev.gongs.userVoted === 'continue';
                            const isPrevRefine = prev.gongs.userVoted === 'refine';
                            const isPrevReconsider = prev.gongs.userVoted === 'reconsider';
                            return {
                              ...prev,
                              gongs: {
                                ...prev.gongs,
                                userVoted,
                                continue: isPrevContinue ? prev.gongs.continue - 1 : prev.gongs.continue + 1,
                                refine: isPrevRefine ? Math.max(0, prev.gongs.refine - 1) : prev.gongs.refine,
                                reconsider: isPrevReconsider ? Math.max(0, prev.gongs.reconsider - 1) : prev.gongs.reconsider
                              }
                            };
                          });
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer ${
                          modalPost.gongs.userVoted === 'continue'
                            ? 'bg-emerald-500 text-black font-black'
                            : 'bg-white/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                        }`}
                        title="Keep going / Continue"
                      >
                        <Disc3 className="w-3 h-3 shrink-0 stroke-[2.5]" />
                        <span>{formatCount(modalPost.gongs.continue)}</span>
                      </button>

                      {/* Refine */}
                      <button
                        type="button"
                        onClick={() => {
                          onUpdatePostGong(modalPost.id, 'refine');
                          setModalPost(prev => {
                            if (!prev) return null;
                            const userVoted = prev.gongs.userVoted === 'refine' ? undefined : 'refine';
                            const isPrevContinue = prev.gongs.userVoted === 'continue';
                            const isPrevRefine = prev.gongs.userVoted === 'refine';
                            const isPrevReconsider = prev.gongs.userVoted === 'reconsider';
                            return {
                              ...prev,
                              gongs: {
                                ...prev.gongs,
                                userVoted,
                                continue: isPrevContinue ? Math.max(0, prev.gongs.continue - 1) : prev.gongs.continue,
                                refine: isPrevRefine ? prev.gongs.refine - 1 : prev.gongs.refine + 1,
                                reconsider: isPrevReconsider ? Math.max(0, prev.gongs.reconsider - 1) : prev.gongs.reconsider
                              }
                            };
                          });
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer ${
                          modalPost.gongs.userVoted === 'refine'
                            ? 'bg-[#FF5C00] text-black font-black'
                            : 'bg-white/10 text-[#FF5C00] hover:bg-[#FF5C00]/20 border border-[#FF5C00]/30'
                        }`}
                        title="Needs work / Refine"
                      >
                        <Pencil className="w-3 h-3 shrink-0 stroke-[2.5]" />
                        <span>{formatCount(modalPost.gongs.refine)}</span>
                      </button>

                      {/* Reconsider */}
                      <button
                        type="button"
                        onClick={() => {
                          onUpdatePostGong(modalPost.id, 'reconsider');
                          setModalPost(prev => {
                            if (!prev) return null;
                            const userVoted = prev.gongs.userVoted === 'reconsider' ? undefined : 'reconsider';
                            const isPrevContinue = prev.gongs.userVoted === 'continue';
                            const isPrevRefine = prev.gongs.userVoted === 'refine';
                            const isPrevReconsider = prev.gongs.userVoted === 'reconsider';
                            return {
                              ...prev,
                              gongs: {
                                ...prev.gongs,
                                userVoted,
                                continue: isPrevContinue ? Math.max(0, prev.gongs.continue - 1) : prev.gongs.continue,
                                refine: isPrevRefine ? Math.max(0, prev.gongs.refine - 1) : prev.gongs.refine,
                                reconsider: isPrevReconsider ? prev.gongs.reconsider - 1 : prev.gongs.reconsider + 1
                              }
                            };
                          });
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer ${
                          modalPost.gongs.userVoted === 'reconsider'
                            ? 'bg-red-500 text-white font-black'
                            : 'bg-white/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                        }`}
                        title="Stop / Reconsider"
                      >
                        <Octagon className="w-3 h-3 shrink-0 stroke-[2.5]" />
                        <span>{formatCount(modalPost.gongs.reconsider)}</span>
                      </button>
                    </div>

                    {/* Display-only Comments Count Badge */}
                    <div 
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono bg-white/10 text-white/80 border border-white/15 select-none pointer-events-none"
                      title="Total comments"
                    >
                      <MessageSquare className="w-3 h-3 text-white/70 shrink-0" />
                      <span>{formatCount(modalPost.comments?.length || 0)}</span>
                    </div>
                  </div>

                  {/* Scrollable comment list with sub-comment pagination rule */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {(() => {
                      const allComments = modalPost.comments || [];
                      const topLevelComments = allComments.filter(c => !c.parentId);

                      // Sort top-level comments so threads with replies or user interactions appear at the top
                      const sortedTopLevel = [...topLevelComments].sort((a, b) => {
                        const aHasReplies = allComments.some(c => c.parentId === a.id);
                        const bHasReplies = allComments.some(c => c.parentId === b.id);
                        if (aHasReplies && !bHasReplies) return -1;
                        if (!aHasReplies && bHasReplies) return 1;
                        return 0;
                      });

                      if (allComments.length === 0) {
                        return (
                          <div className="p-6 text-center text-white/40 text-xs font-sans">
                            No comments yet. Start the conversation!
                          </div>
                        );
                      }

                      return sortedTopLevel.map(parentComment => {
                        const replies = allComments.filter(c => c.parentId === parentComment.id);
                        
                        // Rule: Only show 3 sub-comments at a time.
                        // If there are > 3 sub-comments, initially display 2 comments and a more button.
                        // Every time click "more", reveal 3 more comments from that thread.
                        const limit = visibleReplyCounts[parentComment.id] ?? (replies.length > 3 ? 2 : replies.length);
                        const visibleReplies = replies.slice(0, limit);
                        const remainingCount = replies.length - visibleReplies.length;

                        return (
                          <div key={parentComment.id} className="space-y-1.5">
                            {/* Top-level Comment Card */}
                            <CommentCard
                              comment={parentComment}
                              onHeart={() => handleToggleHeart(parentComment.id)}
                              onReply={() => handleStartReply(parentComment)}
                              getUserName={getUserName}
                              getUserAvatar={getUserAvatar}
                              isFollowed={isUserFollowed(parentComment.userId, parentComment.userName)}
                              onOpenProfile={() => {
                                handleCloseModal();
                                onOpenCreatorProfile?.(parentComment.userId || parentComment.userName);
                              }}
                            />

                            {/* Single-Indented Container for Replies */}
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
                                      handleCloseModal();
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
                                    className="text-[11px] font-mono text-[#FF5C00] hover:text-[#FF751A] hover:underline flex items-center gap-1 pt-1 font-bold cursor-pointer"
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
                  <div className="shrink-0 pt-2 border-t border-white/10 space-y-1.5">
                    {replyTarget && (
                      <div className="flex items-center justify-between bg-white/10 px-3 py-1 rounded-lg text-xs font-mono text-white/70">
                        <span>
                          Replying to <span className="text-[#FF5C00] font-bold">@{replyTarget.userName}</span>
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
                        className="flex-1 px-3.5 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF5C00]"
                      />
                      <button
                        type="submit"
                        disabled={!newCommentText.trim()}
                        className="px-4 py-2 bg-[#FF5C00] hover:bg-[#FF751A] disabled:opacity-40 text-black font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" /> Send
                      </button>
                    </form>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL POST DETAIL MODAL (Triggered by clicking post image or title) */}
      <AnimatePresence>
        {fullPostModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            {/* Click backdrop to close */}
            <div className="absolute inset-0" onClick={() => setFullPostModal(null)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-full max-w-2xl max-h-[90vh] bg-[#121212] border border-white/20 rounded-3xl p-4 sm:p-6 shadow-2xl z-10 flex flex-col overflow-hidden text-white"
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
              <div className="flex-1 overflow-y-auto overscroll-contain pr-1 space-y-4 pt-1 touch-pan-y">
                
                {/* 1. Gong button cluster + Comments button all next to each other at the very top */}
                <div className="flex items-center justify-between bg-black/80 backdrop-blur-md p-2 rounded-2xl border border-white/15 gap-2 pr-12 sm:pr-14">
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
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                        fullPostModal.gongs.userVoted === 'continue'
                          ? 'bg-emerald-500 text-black font-black'
                          : 'bg-white/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                      }`}
                      title="Continue / Keep going"
                    >
                      <Disc3 className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                      <span>{formatCount(fullPostModal.gongs.continue)}</span>
                    </button>

                    {/* Refine */}
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
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                        fullPostModal.gongs.userVoted === 'refine'
                          ? 'bg-[#FF5C00] text-black font-black'
                          : 'bg-white/10 text-[#FF5C00] hover:bg-[#FF5C00]/20 border border-[#FF5C00]/30'
                      }`}
                      title="Refine / Needs work"
                    >
                      <Pencil className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                      <span>{formatCount(fullPostModal.gongs.refine)}</span>
                    </button>

                    {/* Reconsider */}
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
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                        fullPostModal.gongs.userVoted === 'reconsider'
                          ? 'bg-red-500 text-white font-black'
                          : 'bg-white/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                      }`}
                      title="Reconsider / Stop"
                    >
                      <Octagon className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                      <span>{formatCount(fullPostModal.gongs.reconsider)}</span>
                    </button>
                  </div>

                  {/* Comments button right next to gongs */}
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenComments(fullPostModal);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono bg-[#FF5C00] text-black hover:bg-[#FF751A] transition-all cursor-pointer shadow-md shrink-0"
                    title="Open comments drawer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-black shrink-0" />
                    <span>{formatCount(fullPostModal.comments?.length || 0)}</span>
                  </button>
                </div>

                {/* 2. Post Title with Share Button to the right of the title */}
                <div className="flex items-start justify-between gap-3 pt-1">
                  <h2 className="text-lg sm:text-xl font-display font-bold text-white leading-tight">
                    {fullPostModal.title}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenShareDrawer && onOpenShareDrawer(fullPostModal);
                    }}
                    className="p-2 bg-[#FF5C00] hover:bg-[#FF751A] text-black rounded-xl transition-all cursor-pointer shrink-0 shadow-md flex items-center gap-1 text-xs font-bold font-mono"
                    title="Share post"
                  >
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>

                {/* 3. Poster avatar and name below */}
                <div 
                  onClick={() => {
                    const authorId = fullPostModal.userId || fullPostModal.userName;
                    setFullPostModal(null);
                    onOpenCreatorProfile?.(authorId);
                  }}
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-all group pb-1 border-b border-white/10"
                  title={`View ${getUserName(fullPostModal.userId, fullPostModal.userName)}'s profile`}
                >
                  <img 
                    src={getUserAvatar(fullPostModal.userId, fullPostModal.userAvatar)} 
                    alt={getUserName(fullPostModal.userId, fullPostModal.userName)} 
                    className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white leading-tight group-hover:underline">
                      {getUserName(fullPostModal.userId, fullPostModal.userName)}
                    </h4>
                    <p className="text-[10px] font-mono text-white/50">{fullPostModal.timeString}</p>
                  </div>
                </div>

                {/* 4. Gallery of all media in the post */}
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-mono text-[#FF5C00] uppercase font-bold tracking-wider block">
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

                {/* 5. Full description at the bottom */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <span className="text-[10px] font-mono text-[#FF5C00] uppercase font-bold tracking-wider block">
                    Full Description
                  </span>
                  <p className="text-sm text-white/90 font-sans leading-relaxed whitespace-pre-line bg-white/5 p-4 rounded-2xl border border-white/10">
                    {fullPostModal.content}
                    {fullPostModal.hashtags && (
                      <span className="block mt-2 text-[#FF5C00] font-mono text-xs font-bold break-words">
                        {Array.isArray(fullPostModal.hashtags)
                          ? fullPostModal.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')
                          : fullPostModal.hashtags}
                      </span>
                    )}
                  </p>

                  {fullPostModal.attachedName && (
                    <div className="bg-[#FF5C00]/10 border border-[#FF5C00]/30 p-3 rounded-xl flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#FF5C00]" />
                      <span className="text-xs font-mono font-bold text-[#FF5C00]">
                        Attached Recipe: {fullPostModal.attachedName}
                      </span>
                    </div>
                  )}
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
          <img 
            src={displayAvatar} 
            alt={displayName} 
            className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full object-cover shrink-0 border border-white/20 ${
              isFollowed ? 'ring-2 ring-[#FF5C00] ring-offset-1 ring-offset-black' : ''
            }`}
            referrerPolicy="no-referrer"
          />
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
          className="flex items-center gap-1 text-white/40 hover:text-[#FF5C00] transition-all cursor-pointer"
          title="Reply to comment"
        >
          <CornerDownRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>Reply</span>
        </button>
      </div>
    </div>
  );
}

