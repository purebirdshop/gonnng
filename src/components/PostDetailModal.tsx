import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Disc3, 
  Pencil, 
  Octagon, 
  MessageSquare, 
  User, 
  ArrowUpRight, 
  BookOpen, 
  Send, 
  Heart, 
  CornerDownRight 
} from 'lucide-react';
import { FeedPost, Creator, PostComment } from '../types';

interface PostDetailModalProps {
  isOpen: boolean;
  post: FeedPost | null;
  onClose: () => void;
  currentUser: Creator;
  allCreators: Creator[];
  onUpdatePostGong: (postId: string, gongType: 'continue' | 'refine' | 'reconsider') => void;
  onAddComment: (postId: string, commentText: string, parentId?: string, replyToUser?: string) => void;
  onToggleCommentHeart: (postId: string, commentId: string) => void;
  onOpenShareDrawer?: (post: FeedPost) => void;
  onOpenCreatorProfile?: (creatorId: string) => void;
  onOpenRecipeModal?: (recipeId: string) => void;
  autoOpenComments?: boolean;
}

function formatCount(num: number): string {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export default function PostDetailModal({
  isOpen,
  post,
  onClose,
  currentUser,
  allCreators,
  onUpdatePostGong,
  onAddComment,
  onToggleCommentHeart,
  onOpenShareDrawer,
  onOpenCreatorProfile,
  onOpenRecipeModal,
  autoOpenComments = false
}: PostDetailModalProps) {
  const [localPost, setLocalPost] = useState<FeedPost | null>(post);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTarget, setReplyTarget] = useState<PostComment | null>(null);
  const [visibleReplyCounts, setVisibleReplyCounts] = useState<{ [commentId: string]: number }>({});

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  useEffect(() => {
    if (isOpen && autoOpenComments) {
      setTimeout(() => {
        document.getElementById('post-modal-comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [isOpen, autoOpenComments]);

  useEffect(() => {
    if (isOpen && localPost) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen, Boolean(localPost)]);

  if (!isOpen || !localPost) return null;

  const getUserName = (userId?: string, fallbackName?: string) => {
    if (userId) {
      const found = allCreators.find(c => c.id === userId || c.name === userId);
      if (found) return found.name;
    }
    return fallbackName || 'Anonymous Creator';
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

  const handleGongClick = (gongType: 'continue' | 'refine' | 'reconsider') => {
    onUpdatePostGong(localPost.id, gongType);
    setLocalPost(prev => {
      if (!prev) return null;
      const currentVote = prev.gongs?.userVoted;
      const newVote = currentVote === gongType ? undefined : gongType;

      return {
        ...prev,
        gongs: {
          ...prev.gongs,
          userVoted: newVote,
          continue: currentVote === 'continue' ? Math.max(0, prev.gongs.continue - 1) : (newVote === 'continue' ? prev.gongs.continue + 1 : prev.gongs.continue),
          refine: currentVote === 'refine' ? Math.max(0, prev.gongs.refine - 1) : (newVote === 'refine' ? prev.gongs.refine + 1 : prev.gongs.refine),
          reconsider: currentVote === 'reconsider' ? Math.max(0, prev.gongs.reconsider - 1) : (newVote === 'reconsider' ? prev.gongs.reconsider + 1 : prev.gongs.reconsider),
        }
      };
    });
  };

  const handleToggleHeart = (commentId: string) => {
    onToggleCommentHeart(localPost.id, commentId);
    setLocalPost(prev => {
      if (!prev) return null;
      const updatedComments = (prev.comments || []).map(c => {
        if (c.id === commentId) {
          const userLiked = !c.userLiked;
          const likes = userLiked ? (c.likes || 0) + 1 : Math.max(0, (c.likes || 0) - 1);
          return { ...c, userLiked, likes };
        }
        return c;
      });
      return { ...prev, comments: updatedComments };
    });
  };

  const handleStartReply = (targetComment: PostComment) => {
    if (!targetComment) return;
    const targetUid = targetComment.userId || (targetComment as any).user_id;
    const targetUserName = getUserName(targetUid, targetComment.userName);
    setReplyTarget({
      ...targetComment,
      userName: targetUserName
    });
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const parentId = replyTarget ? (replyTarget.parentId || replyTarget.id) : undefined;
    const replyToUser = replyTarget ? replyTarget.userName : undefined;

    onAddComment(localPost.id, newCommentText.trim(), parentId, replyToUser);

    const newCommentObj: PostComment = {
      id: `c-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatarUrl,
      content: newCommentText.trim(),
      timeString: 'Just now',
      likes: 0,
      userLiked: false,
      parentId,
      replyToUser
    };

    setLocalPost(prev => {
      if (!prev) return null;
      return {
        ...prev,
        comments: [...(prev.comments || []), newCommentObj]
      };
    });

    setNewCommentText('');
    setReplyTarget(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 overflow-y-auto bg-gray-900/40 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={onClose} />

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
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-all cursor-pointer z-20 shadow-md border border-gray-200"
            title="Close modal"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>

          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto overscroll-contain pr-1 space-y-4 pt-1 touch-pan-y scroll-smooth">
            
            {/* 1. Gong button cluster + Comments button */}
            <div className="flex items-center justify-between bg-transparent p-2 gap-2 pr-12 sm:pr-14">
              <div className="flex items-center gap-1.5">
                {/* 1. Perfect — You've got it! (Gonnng Gold #F59E0B) */}
                <button
                  type="button"
                  onClick={() => handleGongClick('continue')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer m-0 border-0 ${
                    localPost.gongs?.userVoted === 'continue'
                      ? 'bg-[#F59E0B] text-[#18181B] font-black'
                      : 'bg-transparent text-[#F59E0B] hover:bg-[#F59E0B]/15'
                  }`}
                  title="Perfect — You've got it!"
                >
                  <Disc3 className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                  <span>{formatCount(localPost.gongs?.continue || 0)}</span>
                </button>

                {/* 2. Potential — Keep working on it (Deep Teal light #99F6E4) */}
                <button
                  type="button"
                  onClick={() => handleGongClick('refine')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer m-0 border-0 ${
                    localPost.gongs?.userVoted === 'refine'
                      ? 'bg-[#99F6E4] text-[#18181B] font-black'
                      : 'bg-transparent text-[#99F6E4] hover:bg-[#99F6E4]/15'
                  }`}
                  title="Potential — Keep working on it"
                >
                  <Pencil className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                  <span>{formatCount(localPost.gongs?.refine || 0)}</span>
                </button>

                {/* 3. Promise — Try another approach (Tomato Pink #FF9A84) */}
                <button
                  type="button"
                  onClick={() => handleGongClick('reconsider')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer m-0 border-0 ${
                    localPost.gongs?.userVoted === 'reconsider'
                      ? 'bg-[#FF9A84] text-[#18181B] font-black'
                      : 'bg-transparent text-[#FF9A84] hover:bg-[#FF9A84]/15'
                  }`}
                  title="Promise — Try another approach"
                >
                  <Octagon className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                  <span>{formatCount(localPost.gongs?.reconsider || 0)}</span>
                </button>
              </div>

              {/* Comments shortcut button */}
              <button
                type="button"
                onClick={() => {
                  document.getElementById('post-modal-comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono bg-[#F59E0B] text-black hover:bg-[#FF751A] transition-all cursor-pointer shadow-md shrink-0"
                title="Jump to comments"
              >
                <MessageSquare className="w-3.5 h-3.5 text-black shrink-0" />
                <span>{formatCount(localPost.comments?.length || 0)}</span>
              </button>
            </div>

            {/* 2. Poster avatar, name & share button */}
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-gray-200 pt-1">
              <div 
                onClick={() => {
                  const authorId = localPost.userId || (localPost as any).user_id || localPost.userName;
                  if (onOpenCreatorProfile) onOpenCreatorProfile(authorId);
                }}
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-all group"
                title={`View ${getUserName(localPost.userId || (localPost as any).user_id, localPost.userName)}'s profile`}
              >
                {getUserAvatar(localPost.userId || (localPost as any).user_id, localPost.userAvatar) ? (
                  <img 
                    src={getUserAvatar(localPost.userId || (localPost as any).user_id, localPost.userAvatar)} 
                    alt={getUserName(localPost.userId || (localPost as any).user_id, localPost.userName)} 
                    className="w-8 h-8 rounded-full object-cover border border-gray-300 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-300 shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-gray-900 leading-tight group-hover:underline">
                    {getUserName(localPost.userId || (localPost as any).user_id, localPost.userName)}
                  </h4>
                  <p className="text-[10px] font-mono text-gray-500">{localPost.timeString}</p>
                </div>
              </div>

              {onOpenShareDrawer && (
                <button
                  type="button"
                  onClick={() => onOpenShareDrawer(localPost)}
                  className="p-2 bg-[#F59E0B] hover:bg-[#FF751A] text-black rounded-xl transition-all cursor-pointer shrink-0 shadow-md flex items-center gap-1.5 text-xs font-bold font-mono"
                  title="Share post"
                >
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  <span>Share</span>
                </button>
              )}
            </div>

            {/* 3. Gallery of media in the post */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-mono text-[#F59E0B] uppercase font-bold tracking-wider block">
                Media Gallery
              </span>
              <div className="grid grid-cols-1 gap-3">
                {((localPost.images && localPost.images.length > 0)
                  ? localPost.images
                  : [localPost.image || 'https://images.unsplash.com/photo-1612178537253-bccd437b730e?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D']
                ).map((imgUrl, imgIdx) => (
                  <div key={imgIdx} className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-900 shadow-md">
                    <img 
                      src={imgUrl} 
                      alt={`${localPost.title} - ${imgIdx + 1}`} 
                      className="w-full max-h-[420px] object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Title & content section */}
            <div id="post-modal-description-section" className="space-y-2 pt-3 border-t border-gray-200 scroll-mt-4">
              <span className="text-[10px] font-mono text-[#F59E0B] uppercase font-bold tracking-wider block">
                Project Overview
              </span>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                <h2 className="text-lg sm:text-xl font-display font-bold text-gray-900 leading-snug break-words">
                  {localPost.title}
                </h2>
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-sm text-gray-800 font-sans leading-relaxed whitespace-pre-line">
                    {localPost.content}
                    {localPost.hashtags && (
                      <span className="block mt-2 text-[#F59E0B] font-mono text-xs font-bold break-words">
                        {Array.isArray(localPost.hashtags)
                          ? localPost.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')
                          : localPost.hashtags}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {(localPost.attachedName || localPost.attachedRecipeId) && (
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenRecipeModal) {
                      onOpenRecipeModal(localPost.attachedRecipeId || localPost.attachedName || '');
                    }
                  }}
                  className="w-full bg-orange-50 hover:bg-orange-100 border border-orange-200 p-3 rounded-xl flex items-center gap-2 cursor-pointer transition-all text-left"
                >
                  <BookOpen className="w-4 h-4 text-[#F59E0B]" />
                  <span className="text-xs font-mono font-bold text-[#F59E0B]">
                    Attached Recipe: {localPost.attachedName || localPost.attachedRecipeId}
                  </span>
                </button>
              )}
            </div>

            {/* 5. Comments section */}
            <div id="post-modal-comments-section" className="space-y-3 pt-3 border-t border-gray-200 scroll-mt-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#F59E0B] uppercase font-bold tracking-wider block">
                  Comments ({localPost.comments?.length || 0})
                </span>
              </div>

              {/* Comments list */}
              <div className="space-y-2">
                {(() => {
                  const allComments = localPost.comments || [];
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
                      <div className="p-4 text-center text-gray-500 text-xs font-sans bg-gray-50 rounded-2xl border border-gray-200">
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
                        <ModalCommentCard
                          comment={parentComment}
                          onHeart={() => handleToggleHeart(parentComment.id)}
                          onReply={() => handleStartReply(parentComment)}
                          getUserName={getUserName}
                          getUserAvatar={getUserAvatar}
                          isFollowed={isUserFollowed(parentComment.userId, parentComment.userName)}
                          onOpenProfile={() => {
                            if (onOpenCreatorProfile) {
                              onOpenCreatorProfile(parentComment.userId || parentComment.userName);
                            }
                          }}
                        />

                        {replies.length > 0 && (
                          <div className="pl-3 sm:pl-4 border-l-2 border-gray-200 ml-2.5 sm:ml-3 space-y-1.5 my-1">
                            {visibleReplies.map(reply => (
                              <ModalCommentCard
                                key={reply.id}
                                comment={reply}
                                isReply={true}
                                onHeart={() => handleToggleHeart(reply.id)}
                                onReply={() => handleStartReply(reply)}
                                getUserName={getUserName}
                                getUserAvatar={getUserAvatar}
                                isFollowed={isUserFollowed(reply.userId, reply.userName)}
                                onOpenProfile={() => {
                                  if (onOpenCreatorProfile) {
                                    onOpenCreatorProfile(reply.userId || reply.userName);
                                  }
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
                  <div className="flex items-center justify-between bg-orange-50 border border-orange-200 px-3 py-1 rounded-lg text-xs font-mono text-gray-700">
                    <span>
                      Replying to <span className="text-[#F59E0B] font-bold">@{replyTarget.userName}</span>
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setReplyTarget(null)}
                      className="text-gray-500 hover:text-gray-900 p-0.5 cursor-pointer"
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
                    placeholder={replyTarget ? `Reply to @${replyTarget.userName}...` : "Write a comment..."}
                    className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#F59E0B]"
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
    </AnimatePresence>
  );
}

function ModalCommentCard({
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
  getUserName: (userId?: string, fallbackName?: string) => string;
  getUserAvatar: (userId?: string, fallbackAvatar?: string) => string;
  isFollowed?: boolean;
  onOpenProfile?: () => void;
}) {
  const displayName = getUserName(comment.userId || '', comment.userName);
  const displayAvatar = getUserAvatar(comment.userId || '', comment.userAvatar);

  return (
    <div className={`p-2.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1 ${isReply ? 'bg-gray-100/60' : ''}`}>
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
              className={`w-5 h-5 rounded-full object-cover shrink-0 border border-gray-300 ${
                isFollowed ? 'ring-2 ring-[#F59E0B] ring-offset-1 ring-offset-white' : ''
              }`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={`w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center shrink-0 border border-gray-300 ${
              isFollowed ? 'ring-2 ring-[#F59E0B] ring-offset-1 ring-offset-white' : ''
            }`}>
              <User className="w-3 h-3 text-gray-600" />
            </div>
          )}
          <span className="text-xs font-bold text-gray-900 truncate max-w-[140px] group-hover:underline">{displayName}</span>
          
          {comment.replyToUser && (
            <span className="text-[10px] font-normal text-gray-500 font-sans truncate max-w-[130px]">
              replying to <span className="text-gray-700 font-medium">@{comment.replyToUser}</span>
            </span>
          )}

          <span className="text-[10px] font-mono text-gray-400 shrink-0">• {comment.timeString}</span>
        </div>
      </div>

      <p className="text-xs text-gray-800 font-sans leading-snug pl-6 break-words">
        {comment.content}
      </p>

      <div className="flex items-center gap-3 pt-0.5 pl-6 text-[10px] font-mono">
        <button
          type="button"
          onClick={onHeart}
          className={`flex items-center gap-1 transition-all cursor-pointer ${
            comment.userLiked 
              ? 'text-red-500 font-bold' 
              : 'text-gray-400 hover:text-gray-700'
          }`}
          title={comment.userLiked ? 'Unlike comment' : 'Heart comment'}
        >
          <Heart className={`w-3 h-3 ${comment.userLiked ? 'fill-red-500 text-red-500' : ''}`} />
          <span>{formatCount(comment.likes || 0)}</span>
        </button>

        <button
          type="button"
          onClick={onReply}
          className="flex items-center gap-1 text-gray-400 hover:text-[#F59E0B] transition-all cursor-pointer"
          title="Reply to comment"
        >
          <CornerDownRight className="w-3 h-3" />
          <span>Reply</span>
        </button>
      </div>
    </div>
  );
}
