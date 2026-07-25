import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FeedPost, Creator } from '../types';
import { 
  X, 
  Copy, 
  Check, 
  Send, 
  Link, 
  User, 
  LogIn, 
  UserPlus, 
  ArrowUpRight, 
  CheckCircle2 
} from 'lucide-react';

interface ShareDrawerProps {
  post: FeedPost | null;
  isOpen: boolean;
  onClose: () => void;
  isSignedIn: boolean;
  followingUsers: Creator[];
  onSendMessage: (targetUserId: string, messageText: string, postThumbnail?: string, postId?: string) => void;
  onOpenAuth: () => void;
  theme?: 'dark' | 'light';
}

export default function ShareDrawer({
  post,
  isOpen,
  onClose,
  isSignedIn,
  followingUsers,
  onSendMessage,
  onOpenAuth,
  theme = 'dark'
}: ShareDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  if (!isOpen || !post) return null;

  // FR-003 Public URL Structure formatting
  let permalink = `gonnng.com/p/${post.publicId || post.id}`;
  if (post.title.toLowerCase().includes('profile') || post.username) {
    const handle = post.username || post.userName.toLowerCase().replace(/[^a-z0-9]/g, '');
    permalink = `gonnng.com/u/${handle}`;
  } else if (post.attachedName?.toLowerCase().includes('recipe')) {
    permalink = `gonnng.com/recipe/${post.publicId || post.id}`;
  } else if (post.attachedName) {
    permalink = `gonnng.com/project/${post.publicId || post.id}`;
  }

  const fullUrl = `https://${permalink}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendToUser = (user: Creator) => {
    const msg = `Check out this post: ${post.title} - ${fullUrl}`;
    onSendMessage(user.id, msg, post.image, post.id);
    setSentMap(prev => ({ ...prev, [user.id]: true }));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end md:items-stretch justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40"
        />

        {/* Responsive Drawer Container */}
        <motion.div
          initial={{ y: '100%', x: 0 }}
          animate={{ y: 0, x: 0 }}
          exit={{ y: '100%', x: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className={`relative z-50 w-full md:w-96 border-t md:border-t-0 md:border-l p-5 sm:p-6 shadow-2xl flex flex-col justify-between max-h-[85vh] md:max-h-none md:h-full overflow-y-auto rounded-t-3xl md:rounded-none ${
            theme === 'light'
              ? 'bg-white border-gray-200 text-gray-900'
              : 'bg-[#141414] border-white/15 text-white'
          }`}
          id="share-drawer-container"
        >
          {/* Header */}
          <div className="space-y-4">
            <div className={`flex justify-between items-center pb-3 border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-[#FF5C00]" />
                <h3 className={`text-sm font-display font-bold uppercase tracking-wider ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Share Post</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                    : 'bg-white/5 hover:bg-white/15 text-white/70 hover:text-white'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Post Preview Card */}
            <div className={`flex gap-3 p-3 border rounded-2xl items-center ${
              theme === 'light'
                ? 'bg-gray-50 border-gray-200 text-gray-900'
                : 'bg-black/60 border-white/10 text-white'
            }`}>
              {post.image && (
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="min-w-0 flex-1">
                <h4 className={`text-xs font-bold truncate ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{post.title}</h4>
                <p className={`text-[10px] font-mono truncate ${theme === 'light' ? 'text-gray-500' : 'text-white/50'}`}>by {post.userName}</p>
              </div>
            </div>

            {/* Permalink Section */}
            <div className="space-y-1.5">
              <label className={`text-[10px] font-mono uppercase tracking-wider ${theme === 'light' ? 'text-gray-500' : 'text-white/50'}`}>Unique Post Permalink</label>
              <div className={`flex items-center gap-2 border p-2 rounded-xl ${
                theme === 'light'
                  ? 'bg-gray-100 border-gray-300 text-gray-900'
                  : 'bg-black border-white/15 text-white'
              }`}>
                <Link className="w-4 h-4 text-[#FF5C00] shrink-0" />
                <span className={`text-xs font-mono truncate flex-1 ${theme === 'light' ? 'text-gray-800' : 'text-white/80'}`}>{permalink}</span>
                <button
                  type="button"
                  id="share-drawer-copy-btn"
                  onClick={handleCopyLink}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    copied
                      ? 'bg-emerald-500 text-black font-black'
                      : 'bg-[#FF5C00] hover:bg-[#FF751A] text-black font-bold'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Direct Message Section */}
            <div className="pt-2 space-y-3">
              <label className={`text-[10px] font-mono uppercase tracking-wider block ${theme === 'light' ? 'text-gray-500' : 'text-white/50'}`}>
                Send to Followers via Direct Message
              </label>

              {isSignedIn ? (
                followingUsers.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {followingUsers.map(user => {
                      const isSent = sentMap[user.id];
                      return (
                        <div
                          key={user.id}
                          className={`flex justify-between items-center p-2.5 border rounded-xl transition-all ${
                            theme === 'light'
                              ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-900'
                              : 'bg-white/5 border-white/10 hover:border-white/20 text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <h5 className={`text-xs font-bold truncate ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{user.name}</h5>
                              <p className={`text-[10px] font-mono truncate ${theme === 'light' ? 'text-gray-500' : 'text-white/40'}`}>@{user.name.toLowerCase().replace(/\s+/g, '')}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            id={`send-post-to-${user.id}`}
                            onClick={() => handleSendToUser(user)}
                            disabled={isSent}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                              isSent
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-[#FF5C00] hover:bg-[#FF751A] text-black font-bold shadow'
                            }`}
                          >
                            {isSent ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" /> Send
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-white/5 border border-white/10 rounded-2xl text-xs text-white/50 space-y-1">
                    <User className="w-6 h-6 mx-auto text-white/30" />
                    <p>No followers found to message.</p>
                  </div>
                )
              ) : (
                /* Unauthenticated View */
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 text-center">
                  <p className="text-xs text-white/70">
                    Sign in or create an account to message posts directly to creators and followers.
                  </p>
                  <div className="flex gap-2 justify-center pt-1">
                    <button
                      type="button"
                      id="share-drawer-signin-btn"
                      onClick={() => {
                        onClose();
                        onOpenAuth();
                      }}
                      className="px-4 py-2 bg-[#FF5C00] hover:bg-[#FF751A] text-black font-black text-xs rounded-xl transition-all shadow flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" /> Sign In
                    </button>
                    <button
                      type="button"
                      id="share-drawer-register-btn"
                      onClick={() => {
                        onClose();
                        onOpenAuth();
                      }}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all border border-white/15 flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Create Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-4 border-t border-white/10 text-center">
            <span className="text-[10px] font-mono text-white/40">gonnng.com • universal human blueprint sharing</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
