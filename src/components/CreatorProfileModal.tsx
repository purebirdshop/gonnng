import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Creator, FeedPost } from '../types';
import { getPublicMediaUrl } from '../services/uploadService';
import { X, UserPlus, UserCheck, Users, Goal, BookOpen, Layers, User } from 'lucide-react';

interface CreatorProfileModalProps {
  creator: Creator | null;
  onClose: () => void;
  onToggleFollow: (id: string) => void;
  posts: FeedPost[];
  currentUserId: string;
}

export default function CreatorProfileModal({
  creator,
  onClose,
  onToggleFollow,
  posts,
  currentUserId,
}: CreatorProfileModalProps) {
  if (!creator) return null;

  const isSelf = creator.id === currentUserId;
  const creatorPosts = posts.filter(p => p.userId === creator.id || p.userName === creator.name);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-gray-900/40 backdrop-blur-sm">
        {/* Backdrop overlay click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 cursor-pointer"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative border rounded-none sm:rounded-3xl w-full h-full sm:h-auto max-w-none sm:max-w-xl max-h-full sm:max-h-[85vh] overflow-y-auto p-4 sm:p-6 space-y-6 shadow-2xl z-10 flex flex-col justify-between bg-white border-gray-200 text-gray-900"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <span className="text-xs font-mono font-bold text-[#FF5C00] uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Creator Profile
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
              title="Close Profile"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Bio Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="relative shrink-0">
                {creator.avatarUrl && creator.avatarUrl.trim() !== '' ? (
                  <img
                    src={getPublicMediaUrl('Gonnng', creator.avatarUrl.trim())}
                    alt={creator.name}
                    className={`w-20 h-20 rounded-full object-cover border border-white/20 ${
                      creator.isFollowing ? 'ring-2 ring-[#FF5C00] ring-offset-2 ring-offset-[#141414]' : ''
                    }`}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border border-white/20 ${
                    creator.isFollowing ? 'ring-2 ring-[#FF5C00] ring-offset-2 ring-offset-[#141414]' : ''
                  }`}>
                    <User className="w-10 h-10 text-white/70" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1 min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-white truncate">{creator.name}</h3>
                  {creator.isFollowing && creator.followsYou && (
                    <span className="text-[10px] font-mono font-bold bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#FF5C00]" /> In Circle
                    </span>
                  )}
                  {!creator.isFollowing && creator.followsYou && (
                    <span className="text-[10px] font-mono text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
                      Follows You
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-[#FF5C00] truncate">
                  @{creator.username || creator.name.toLowerCase().replace(/\s+/g, '')}
                </p>
                <p className="text-xs text-white/60 leading-relaxed font-sans">{creator.bio && creator.bio.trim() !== '' ? creator.bio : ""}</p>

                {/* Follower Stats & Action */}
                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <div className="text-xs font-mono text-white/60">
                    <strong className="text-white font-sans">{creator.followersCount || 0}</strong> Followers
                  </div>
                  <div className="text-xs font-mono text-white/60">
                    <strong className="text-white font-sans">{creator.followingCount || 0}</strong> Following
                  </div>

                  {!isSelf && (
                    <button
                      type="button"
                      onClick={() => onToggleFollow(creator.id)}
                      className={`ml-auto px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        creator.isFollowing
                          ? 'bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 border border-white/10'
                          : 'bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black shadow-md'
                      }`}
                    >
                      {creator.isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" /> Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" /> Follow
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 text-xs">
              <span className="text-white/40 font-mono uppercase tracking-wider block text-[10px] mb-1">Creative Goal</span>
              <p className="text-white/90 italic font-sans flex items-start gap-1.5">
                <Goal className="w-3.5 h-3.5 text-[#FF5C00] shrink-0 mt-0.5" /> "{creator.goals && creator.goals.trim() !== '' ? creator.goals : ""}"
              </p>
            </div>
          </div>

          {/* Posts Activity Stream */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#FF5C00]" /> Recent Activity ({creatorPosts.length})
            </h4>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {creatorPosts.length > 0 ? (
                creatorPosts.map(post => (
                  <div key={post.id} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-white/40 font-mono">
                      <span>{post.timeString}</span>
                      <span className="uppercase text-[#FF5C00] font-bold">{post.type.replace('_', ' ')}</span>
                    </div>
                    <h5 className="text-xs font-bold text-white line-clamp-1">{post.title}</h5>
                    {post.content && <p className="text-[11px] text-white/70 line-clamp-2">{post.content}</p>}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-white/40 text-xs font-sans">
                  No public feed posts logged by this creator yet.
                </div>
              )}
            </div>
          </div>

          {/* Footer close */}
          <div className="pt-3 border-t border-white/10 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
