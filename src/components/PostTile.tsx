import React, { useState } from 'react';
import { 
  Globe, 
  CircleDotDashed, 
  Album, 
  MessageSquareShare, 
  Disc3, 
  Pencil, 
  Octagon, 
  MessageSquare, 
  User, 
  ChevronLeft, 
  ChevronRight,
  X
} from 'lucide-react';
import { FeedPost, Creator } from '../types';

export interface PostTileProps {
  post: FeedPost;
  idx?: number;
  totalPosts?: number;
  currentUser?: Creator;
  allCreators?: Creator[];
  onUpdatePostGong: (postId: string, gongType: 'continue' | 'refine' | 'reconsider') => void;
  onOpenComments: (post: FeedPost) => void;
  onOpenShareDrawer?: (post: FeedPost) => void;
  onOpenCreatorProfile?: (creatorId: string) => void;
  onSelectPostDetails?: (post: FeedPost) => void;
  isSuperimposed?: boolean;
  onClearSuperimposedPost?: () => void;
}

function formatCount(num: number): string {
  if (!num || num <= 0) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(2).replace(/\.?0+$/, '') + 'k';
  return num.toString();
}

function formatMonthDay(timeStr?: string, createdAt?: string): string {
  if (createdAt) {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) {
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }
  }

  if (timeStr) {
    const trimmed = timeStr.trim();
    if (/^\d{1,2}\/\d{1,2}$/.test(trimmed)) {
      return trimmed;
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }
    const dAgoMatch = trimmed.match(/(\d+)\s*d\s*ago/i);
    if (dAgoMatch) {
      const daysAgo = parseInt(dAgoMatch[1], 10);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  }

  const today = new Date();
  return `${today.getMonth() + 1}/${today.getDate()}`;
}

export const PostTile: React.FC<PostTileProps> = ({
  post,
  currentUser,
  allCreators = [],
  onUpdatePostGong,
  onOpenComments,
  onOpenShareDrawer,
  onOpenCreatorProfile,
  onSelectPostDetails,
  isSuperimposed = false,
  onClearSuperimposedPost,
}) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [brightness, setBrightness] = useState<{
    isDarkTop: boolean;
    isDarkBottom: boolean;
    overallDark: boolean;
    averageLuminance: number;
  }>({
    isDarkTop: true,
    isDarkBottom: true,
    overallDark: true,
    averageLuminance: 100
  });

  const getUserName = (userId?: string, fallbackName?: string) => {
    if (userId) {
      const found = allCreators.find(c => c.id === userId || c.name === userId);
      if (found) return found.name;
    }
    return fallbackName || 'Creator';
  };

  const getUserAvatar = (userId?: string, fallbackAvatar?: string) => {
    if (userId) {
      const found = allCreators.find(c => c.id === userId || c.name === userId);
      if (found && found.avatarUrl) return found.avatarUrl;
    }
    return fallbackAvatar || '';
  };

  const isUserFollowed = (userId?: string, fallbackName?: string) => {
    if (userId) {
      const found = allCreators.find(c => c.id === userId || c.name === userId);
      if (found) return found.isFollowing;
    }
    return false;
  };

  const postImages = React.useMemo(() => {
    if (post.images && post.images.length > 0) return post.images;
    if (post.media && post.media.length > 0) {
      return post.media.map(m => m.resolvedUrl || m.previewUrl || '').filter(Boolean);
    }
    if (post.image) return [post.image];
    return ['https://images.unsplash.com/photo-1612178537253-bccd437b730e?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'];
  }, [post]);

  const displayImage = postImages[currentImgIndex] || postImages[0];
  const commentsCount = post.comments?.length || 0;

  // Detect image brightness dynamically across top & bottom regions
  React.useEffect(() => {
    if (!displayImage) return;

    let isMounted = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = 64;
        const height = 64;
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        // 1. Top region (top 35% where author chip sits)
        const topHeight = Math.floor(height * 0.35);
        const topData = ctx.getImageData(0, 0, width, topHeight).data;
        let topLum = 0;
        for (let i = 0; i < topData.length; i += 4) {
          topLum += 0.299 * topData[i] + 0.587 * topData[i + 1] + 0.114 * topData[i + 2];
        }
        const topAvg = topLum / (topData.length / 4);

        // 2. Bottom region (bottom 45% where text & scrim sit)
        const bottomStartY = Math.floor(height * 0.55);
        const bottomHeight = height - bottomStartY;
        const bottomData = ctx.getImageData(0, bottomStartY, width, bottomHeight).data;
        let bottomLum = 0;
        for (let i = 0; i < bottomData.length; i += 4) {
          bottomLum += 0.299 * bottomData[i] + 0.587 * bottomData[i + 1] + 0.114 * bottomData[i + 2];
        }
        const bottomAvg = bottomLum / (bottomData.length / 4);

        const overallAvg = (topAvg + bottomAvg) / 2;

        if (isMounted) {
          setBrightness({
            isDarkTop: topAvg < 140,
            isDarkBottom: bottomAvg < 140,
            overallDark: overallAvg < 140,
            averageLuminance: overallAvg
          });
        }
      } catch {
        // Fallback for CORS restricted canvases
        if (isMounted) {
          setBrightness({
            isDarkTop: true,
            isDarkBottom: true,
            overallDark: true,
            averageLuminance: 100
          });
        }
      }
    };

    img.onerror = () => {
      if (isMounted) {
        setBrightness({
          isDarkTop: true,
          isDarkBottom: true,
          overallDark: true,
          averageLuminance: 100
        });
      }
    };

    img.src = displayImage;

    return () => {
      isMounted = false;
    };
  }, [displayImage]);

  const rawAuthorName = getUserName(post.userId, post.userName);
  const handleName = rawAuthorName.startsWith('@') 
    ? rawAuthorName 
    : `@${rawAuthorName.toLowerCase().replace(/\s+/g, '')}`;

  return (
    <div 
      id={`post-tile-${post.id}`}
      className="snap-start snap-always w-full h-[calc(100vh-140px)] sm:h-[500px] shrink-0 sm:shrink flex flex-col justify-between bg-gray-950 border border-gray-200/80 rounded-2xl relative overflow-hidden shadow-xl hover:border-[#F59E0B]/50 transition-all text-white group"
    >
      {/* 1. Full Vertical Space Image (Cover) */}
      <div 
        onClick={() => onSelectPostDetails && onSelectPostDetails(post)}
        className="absolute inset-0 w-full h-full cursor-pointer z-0 bg-gray-950"
        title="Click to view full post details"
      >
        <img 
          src={displayImage} 
          alt={post.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Adaptive Linear Gradient Scrim over photo based on bottom luminance */}
      <div 
        className={`absolute inset-x-0 bottom-0 z-[1] h-3/5 pointer-events-none transition-opacity duration-500 ${
          brightness.isDarkBottom 
            ? 'bg-gradient-to-t from-[#0a0f1d]/95 via-[#0a0f1d]/75 via-45% to-transparent' 
            : 'bg-gradient-to-t from-[#030712]/98 via-[#030712]/85 via-50% to-transparent'
        }`} 
      />

      {/* Superimposed Badge if post is highlighted */}
      {isSuperimposed && (
        <div className="relative z-20 flex items-center justify-between bg-[#F59E0B] text-black px-3 py-1 m-2 rounded-full text-[10px] font-mono font-bold shadow-lg">
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

      {/* Top Metadata Header & Share Button — Adaptively styled based on top brightness */}
      <div className="relative z-10 flex items-center justify-between gap-2 p-3 sm:p-3.5 w-full">
        {/* Author Chip: avatar, @username, small inline visibility icon, date */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenCreatorProfile) {
              onOpenCreatorProfile(post.userId || post.userName);
            }
          }}
          className={`flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-all group/user px-2.5 py-1 rounded-full shadow-lg backdrop-blur-md ${
            brightness.isDarkTop
              ? 'bg-[#111827]/60 hover:bg-[#111827]/85'
              : 'bg-[#0f172a]/85 hover:bg-[#0f172a]/95 shadow-xl'
          }`}
          title={`View ${getUserName(post.userId, post.userName)}'s profile`}
        >
          {getUserAvatar(post.userId, post.userAvatar) ? (
            <img 
              src={getUserAvatar(post.userId, post.userAvatar)} 
              alt={getUserName(post.userId, post.userName)} 
              className={`w-5 h-5 rounded-full object-cover shrink-0 ${
                isUserFollowed(post.userId, post.userName) ? 'ring-2 ring-[#F59E0B] ring-offset-1 ring-offset-black' : ''
              }`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={`w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center shrink-0 ${
              isUserFollowed(post.userId, post.userName) ? 'ring-2 ring-[#F59E0B] ring-offset-1 ring-offset-black' : ''
            }`}>
              <User className="w-3 h-3 text-gray-300" />
            </div>
          )}

          {/* @username: Light Mayo ultra-light (#FFFDF2) */}
          <span className="font-bold text-xs truncate max-w-[100px] sm:max-w-[140px] group-hover/user:underline text-[#FFFDF2]">
            {handleName}
          </span>

          {/* Small Inline Visibility Icon: Shady Crust soft (#A1A1AA) */}
          <span className="inline-flex items-center shrink-0 text-[#A1A1AA]">
            {post.privacy === 'public' && <Globe className="w-[11px] h-[11px]" title="Public" />}
            {post.privacy === 'internal' && <CircleDotDashed className="w-[11px] h-[11px]" title="Circle" />}
            {post.privacy === 'private' && <Album className="w-[11px] h-[11px]" title="Private" />}
          </span>

          {/* Date: Light Mayo ultra-light (#FFFDF2) formatted in M/D (e.g. 8/9) */}
          <span className="text-[10px] font-mono shrink-0 text-[#FFFDF2]">• {formatMonthDay(post.timeString, post.createdAt)}</span>
        </div>

        {/* Share Button with message-square-share icon: icon in Light Mayo ultra-light (#FFFDF2) */}
        <button
          type="button"
          id={`share-post-btn-${post.id}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenShareDrawer) onOpenShareDrawer(post);
          }}
          className={`p-2 rounded-full transition-all cursor-pointer z-30 shadow-lg flex items-center justify-center backdrop-blur-md hover:scale-105 active:scale-95 ${
            brightness.isDarkTop
              ? 'bg-[#111827]/60 hover:bg-[#111827]/85'
              : 'bg-[#0f172a]/85 hover:bg-[#0f172a]/95'
          }`}
          title="Share post & copy permalink"
        >
          <MessageSquareShare className="w-4 h-4 stroke-[2] text-[#FFFDF2]" />
        </button>
      </div>

      {/* Media Carousel Navigation Chevrons */}
      {postImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImgIndex(prev => (prev - 1 + postImages.length) % postImages.length);
            }}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-[#111827]/70 hover:bg-[#111827]/90 text-white shadow-lg backdrop-blur-md transition-all cursor-pointer hover:scale-110 active:scale-95"
            title="Previous media"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImgIndex(prev => (prev + 1) % postImages.length);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-[#111827]/70 hover:bg-[#111827]/90 text-white shadow-lg backdrop-blur-md transition-all cursor-pointer hover:scale-110 active:scale-95"
            title="Next media"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </>
      )}

      {/* Bottom Content Container (Single Collapsed Element) */}
      <div className="relative z-10 mt-auto p-3.5 sm:p-4 space-y-2 pointer-events-auto">
        
        {/* Carousel Breadcrumbs / Dots if multi-image */}
        {postImages.length > 1 && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="flex justify-center w-full mb-1"
          >
            <div className="inline-flex items-center gap-1.5 bg-[#111827]/60 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md">
              {postImages.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImgIndex(dotIdx);
                  }}
                  className={`transition-all duration-300 cursor-pointer ${
                    dotIdx === currentImgIndex
                      ? 'w-4 h-1.5 bg-[#F59E0B] rounded-full shadow-sm'
                      : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/80 rounded-full'
                  }`}
                  title={`Jump to media ${dotIdx + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Title — Full width, bold, single line, truncated with an ellipsis, strictly white */}
        <h3 
          onClick={() => onSelectPostDetails && onSelectPostDetails(post)}
          className="text-base sm:text-lg leading-snug font-display font-bold cursor-pointer !text-white text-white hover:text-white/90 transition-colors truncate w-full block drop-shadow"
          style={{ color: '#ffffff' }}
          title={post.title}
        >
          {post.title}
        </h3>

        {/* Description + Feedback split into two columns beneath the title */}
        <div className="flex items-end justify-between gap-3 w-full pt-0.5">
          
          {/* Left Column: Description text clamped to 3 lines with an ellipsis */}
          <div 
            onClick={() => onSelectPostDetails && onSelectPostDetails(post)}
            className="flex-1 min-w-0 space-y-1 cursor-pointer"
          >
            <p className="text-xs sm:text-sm font-sans leading-relaxed line-clamp-3 text-gray-200 whitespace-pre-wrap break-words drop-shadow-sm">
              {post.content}
            </p>
            {post.hashtags && (
              <span className="block text-[#F59E0B] font-mono text-xs font-bold truncate pt-0.5">
                {Array.isArray(post.hashtags)
                  ? post.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')
                  : post.hashtags}
              </span>
            )}
            {post.attachedName && (
              <span className="block text-[10px] font-mono text-[#F59E0B] truncate pt-0.5">
                📂 {post.attachedName}
              </span>
            )}
          </div>

          {/* Right Column: Feedback / Comment Cluster (3 reactions + comment count) — No border, no gap */}
          <div className="shrink-0 flex items-center gap-0 p-1 rounded-2xl bg-[#111827]/70 backdrop-blur-md shadow-xl border-0">
            {/* 1. Perfect — You've got it! (Gonnng Gold primary #F59E0B, bg-transparent unvoted, swap to Shady Crust dark #18181B on gold when voted) */}
            <button
              id={`gong-continue-btn-${post.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdatePostGong(post.id, 'continue');
              }}
              className={`flex flex-col items-center justify-center min-w-[36px] sm:min-w-[40px] px-2 py-1 rounded-xl transition-all cursor-pointer m-0 border-0 ${
                post.gongs?.userVoted === 'continue'
                  ? 'bg-[#F59E0B] text-[#18181B] font-black shadow-md scale-105'
                  : 'bg-transparent text-[#F59E0B] hover:bg-[#F59E0B]/15'
              }`}
              title="Perfect — You've got it!"
            >
              <Disc3 className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
              <span className="text-[10px] font-mono leading-tight mt-0.5 font-bold">
                {formatCount(post.gongs?.continue || 0)}
              </span>
            </button>

            {/* 2. Potential — Keep working on it (Deep Teal light #99F6E4, bg-transparent unvoted, swap to Shady Crust dark #18181B on teal when voted) */}
            <button
              id={`gong-refine-btn-${post.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdatePostGong(post.id, 'refine');
              }}
              className={`flex flex-col items-center justify-center min-w-[36px] sm:min-w-[40px] px-2 py-1 rounded-xl transition-all cursor-pointer m-0 border-0 ${
                post.gongs?.userVoted === 'refine'
                  ? 'bg-[#99F6E4] text-[#18181B] font-black shadow-md scale-105'
                  : 'bg-transparent text-[#99F6E4] hover:bg-[#99F6E4]/15'
              }`}
              title="Potential — Keep working on it"
            >
              <Pencil className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
              <span className="text-[10px] font-mono leading-tight mt-0.5 font-bold">
                {formatCount(post.gongs?.refine || 0)}
              </span>
            </button>

            {/* 3. Promise — Try another approach (Tomato Pink primary #FF9A84, bg-transparent unvoted, swap to Shady Crust dark #18181B on pink when voted) */}
            <button
              id={`gong-reconsider-btn-${post.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdatePostGong(post.id, 'reconsider');
              }}
              className={`flex flex-col items-center justify-center min-w-[36px] sm:min-w-[40px] px-2 py-1 rounded-xl transition-all cursor-pointer m-0 border-0 ${
                post.gongs?.userVoted === 'reconsider'
                  ? 'bg-[#FF9A84] text-[#18181B] font-black shadow-md scale-105'
                  : 'bg-transparent text-[#FF9A84] hover:bg-[#FF9A84]/15'
              }`}
              title="Promise — Try another approach"
            >
              <Octagon className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
              <span className="text-[10px] font-mono leading-tight mt-0.5 font-bold">
                {formatCount(post.gongs?.reconsider || 0)}
              </span>
            </button>

            {/* 4. View & add comments (Light Mayo ultra-light #FFFDF2, bg-transparent default, swap to Shady Crust dark #18181B on mayo on active/hover) */}
            <button
              id={`comments-trigger-btn-${post.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenComments(post);
              }}
              className="flex flex-col items-center justify-center min-w-[36px] sm:min-w-[40px] px-2 py-1 rounded-xl transition-all cursor-pointer m-0 border-0 bg-transparent text-[#FFFDF2] hover:bg-[#FFFDF2] hover:text-[#18181B] active:bg-[#FFFDF2] active:text-[#18181B] shadow-none"
              title="View & add comments"
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[10px] font-mono leading-tight mt-0.5 font-bold">
                {formatCount(commentsCount)}
              </span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PostTile;
