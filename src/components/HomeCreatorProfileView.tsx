import React, { useState } from 'react';
import { Creator, FeedPost } from '../types';
import { ArrowLeft, UserPlus, UserCheck, Goal, Link, User, ArrowUpRight, X, Search, CircleDotDashed, MessageSquare, MessageSquareShare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Feed from './Feed';
import { getFollowersOfUser, getFollowingOfUser, isFollowingUser, isFollowedByUser, isUserInCircle } from '../utils/followUtils';
import { getPublicMediaUrl } from '../services/uploadService';

interface HomeCreatorProfileViewProps {
  creator: Creator;
  allCreators: Creator[];
  posts: FeedPost[];
  currentUserId: string;
  currentUser: Creator;
  onBackToHome: () => void;
  onToggleFollow: (creatorId: string) => void;
  onUpdatePostGong: (postId: string, voteType: 'continue' | 'refine' | 'reconsider') => void;
  onAddComment?: (postId: string, commentContent: string, parentId?: string, replyToUser?: string) => void;
  onToggleCommentHeart?: (postId: string, commentId: string) => void;
  onOpenShareDrawer?: (post: FeedPost) => void;
  onOpenCreatorProfile?: (creatorId: string) => void;
  onOpenMessageDrawer?: (creator: Creator) => void;
}

export default function HomeCreatorProfileView({
  creator,
  allCreators,
  posts,
  currentUserId,
  currentUser,
  onBackToHome,
  onToggleFollow,
  onUpdatePostGong,
  onAddComment,
  onToggleCommentHeart,
  onOpenShareDrawer,
  onOpenCreatorProfile,
  onOpenMessageDrawer
}: HomeCreatorProfileViewProps) {
  const [showUserListModal, setShowUserListModal] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'followers' | 'following'>('followers');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [modalSnapshotIds, setModalSnapshotIds] = useState<string[] | null>(null);

  // Latest creator data from state if available
  const activeCreator = allCreators.find(c => c.id === creator.id) || creator;
  const isSelf = activeCreator.id === currentUserId;

  // Snapshot list when modal opens or tab changes so unfollowed users stay in list for safety/re-following
  React.useEffect(() => {
    if (showUserListModal) {
      const list = modalTab === 'following'
        ? getFollowingOfUser(activeCreator, allCreators)
        : getFollowersOfUser(activeCreator, allCreators);
      setModalSnapshotIds(list.map(c => c.id));
    } else {
      setModalSnapshotIds(null);
    }
  }, [showUserListModal, modalTab]);

  // Filter posts to only show this creator's posts
  const userPosts = posts.filter(p => {
    if (!p) return false;
    const pUserId = p.userId || (p as any).user_id;
    const belongsToCreator = 
      pUserId === activeCreator.id || 
      p.userName === activeCreator.name || 
      (activeCreator.username && p.userName === activeCreator.username);
    if (!belongsToCreator) return false;
    if (isSelf) return true;
    if (p.privacy === 'private') return false;
    if (p.privacy === 'internal') return isUserInCircle(currentUser, activeCreator.id, allCreators);
    return true;
  });

  const followersList = getFollowersOfUser(activeCreator, allCreators);
  const followingList = getFollowingOfUser(activeCreator, allCreators);

  const liveTabList = modalTab === 'following' ? followingList : followersList;

  const currentTabList = (showUserListModal && modalSnapshotIds !== null)
    ? modalSnapshotIds.map(id => allCreators.find(c => c.id === id)).filter((c): c is Creator => Boolean(c))
    : liveTabList;

  const displayedModalCreators = currentTabList.filter(c => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    const handle = (c.username || c.name.toLowerCase().replace(/\s+/g, '')).toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.bio && c.bio.toLowerCase().includes(q)) || handle.includes(q);
  });

  const amIFollowingHeader = isFollowingUser(currentUser, activeCreator.id, allCreators);
  const doesHeaderUserFollowMe = isFollowedByUser(currentUser, activeCreator.id, allCreators);
  const isHeaderMutual = amIFollowingHeader && doesHeaderUserFollowMe;

  return (
    <div 
      className="max-w-4xl mx-auto text-white px-2 sm:px-4 md:px-0 w-full min-w-0 h-[calc(100vh-130px)] sm:h-auto overflow-y-scroll sm:overflow-visible snap-y snap-mandatory scroll-smooth sm:scroll-auto no-scrollbar space-y-0 sm:space-y-6"
      id="home-profile-scroll-container"
    >
      {/* Top Bar Navigation to Return to Main Home Feed */}
      <div className="flex items-center justify-between pb-3 mb-0 border-b border-white/10 sticky top-0 z-30 p-2 sm:p-0">
        <button
          type="button"
          onClick={onBackToHome}
          title="Back"
          aria-label="Back"
          className="p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer border bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-[#F59E0B]" />
        </button>
      </div>

      {/* Creator Profile First Tile */}
      <div 
        className="snap-start snap-always w-full h-[calc(100vh-140px)] sm:h-auto shrink-0 flex flex-col justify-between bg-white text-gray-900 border border-gray-200 p-5 sm:p-6 shadow-2xl relative mb-0 sm:mb-6 rounded-none"
      >
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 min-w-0 w-full">
          <div className={`w-28 h-28 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-display font-bold shadow-lg border-4 relative overflow-hidden shrink-0 mx-auto sm:mx-0 ${
            isHeaderMutual 
              ? 'border-[#F59E0B] shadow-[0_0_20px_rgba(255,92,0,0.4)]' 
              : amIFollowingHeader 
              ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
              : 'border-white/20'
          }`}>
            {activeCreator.avatarUrl && activeCreator.avatarUrl.trim() !== '' ? (
              <img src={getPublicMediaUrl('Gonnng', activeCreator.avatarUrl.trim())} alt={activeCreator.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-14 h-14 sm:w-10 sm:h-10 text-white/70" />
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-display font-black truncate text-white">
                {activeCreator.name}
              </h2>
              <button
                type="button"
                id="creator-profile-share-btn"
                onClick={() => {
                  if (onOpenShareDrawer) {
                    onOpenShareDrawer({
                      id: activeCreator.id,
                      type: 'update_logged',
                      userId: activeCreator.id,
                      title: `${activeCreator.name}'s Profile`,
                      content: activeCreator.bio || 'Gonnng Creator Profile',
                      userName: activeCreator.name,
                      userAvatar: activeCreator.avatarUrl,
                      timeString: 'Active now',
                      privacy: 'public',
                      gongs: { continue: 0, refine: 0, reconsider: 0 }
                    });
                  }
                }}
                className="p-1.5 bg-[#F59E0B] hover:bg-[#FF751A] text-black rounded-xl transition-all shadow cursor-pointer shrink-0"
                title="Share Profile"
              >
                <MessageSquareShare className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              {!isSelf && onOpenMessageDrawer && (
                <button
                  type="button"
                  id="creator-profile-message-btn"
                  onClick={() => onOpenMessageDrawer(activeCreator)}
                  className="p-1.5 bg-[#F59E0B] hover:bg-[#FF751A] text-black rounded-xl transition-all shadow cursor-pointer shrink-0"
                  title={`Message ${activeCreator.name}`}
                >
                  <MessageSquare className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              )}
            </div>
            <p className="text-xs font-mono text-[#F59E0B] truncate">
              @{activeCreator.name.toLowerCase().replace(/\s+/g, '')}
            </p>
          </div>
        </div>

        {/* Bio & Goal */}
        <div className="my-auto py-4 space-y-3 bg-white/5 border border-white/10 p-4 rounded-2xl">
          <p className="text-xs text-white/80 leading-relaxed italic">
            "{activeCreator.bio && activeCreator.bio.trim() !== '' ? activeCreator.bio : ""}"
          </p>
          <div className="text-[11px] font-mono text-white/60 pt-2 border-t border-white/10 flex items-center gap-1.5">
            <Goal className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Current Goal: <strong className="text-white font-sans">{activeCreator.goals && activeCreator.goals.trim() !== '' ? activeCreator.goals : ""}</strong></span>
          </div>
        </div>

        {/* Stats & Follow Button */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10 w-full">
          <div className="flex items-center gap-4 text-xs font-mono text-white/70">
            <button
              type="button"
              id="creator-followers-btn"
              onClick={() => {
                setModalTab('followers');
                setUserSearchQuery('');
                setShowUserListModal(true);
              }}
              className="hover:text-[#F59E0B] transition-colors cursor-pointer text-left flex items-center gap-1"
            >
              <strong className="text-white font-sans text-sm">{followersList.length || activeCreator.followersCount || 0}</strong> Followers
            </button>
            <button
              type="button"
              id="creator-following-btn"
              onClick={() => {
                setModalTab('following');
                setUserSearchQuery('');
                setShowUserListModal(true);
              }}
              className="hover:text-[#F59E0B] transition-colors cursor-pointer text-left flex items-center gap-1"
            >
              <strong className="text-white font-sans text-sm">{followingList.length || activeCreator.followingCount || 0}</strong> Following
            </button>
          </div>

          {!isSelf && (
            <button
              type="button"
              onClick={() => onToggleFollow(activeCreator.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow ${
                isHeaderMutual
                  ? 'bg-[#F59E0B]/20 hover:bg-red-500/20 text-[#F59E0B] hover:text-red-400 border border-[#F59E0B]/40 hover:border-red-500/30'
                  : amIFollowingHeader
                  ? 'bg-white/10 text-white border border-white/20 hover:bg-red-500/20 hover:text-red-400'
                  : doesHeaderUserFollowMe
                  ? 'bg-[#F59E0B] text-black font-black hover:bg-[#FF751A]'
                  : 'bg-[#F59E0B] text-black font-black hover:bg-[#FF751A]'
              }`}
            >
              {isHeaderMutual ? (
                <>
                  <CircleDotDashed className="w-4 h-4 text-[#F59E0B]" /> In Circle
                </>
              ) : amIFollowingHeader ? (
                <>
                  <UserCheck className="w-4 h-4" /> Following
                </>
              ) : doesHeaderUserFollowMe ? (
                <>
                  <UserPlus className="w-4 h-4" /> Follow Back
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Follow
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* User's Individual Posts Feed */}
      <div className="space-y-4">
        <Feed 
          posts={userPosts}
          currentUserId={currentUserId}
          currentUser={currentUser}
          creators={allCreators}
          filter="creator"
          isEmbedded={true}
          onUpdatePostGong={onUpdatePostGong}
          onAddComment={onAddComment}
          onToggleCommentHeart={onToggleCommentHeart}
          onOpenShareDrawer={onOpenShareDrawer}
          onOpenCreatorProfile={onOpenCreatorProfile}
        />
      </div>

      {/* Followers & Following Modal */}
      <AnimatePresence>
        {showUserListModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-[#141414] border border-white/10 text-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] space-y-4"
            >
              {/* Modal Header with Tabs */}
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setModalTab('followers');
                      setUserSearchQuery('');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      modalTab === 'followers'
                        ? 'bg-[#F59E0B] text-black shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Followers ({followersList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalTab('following');
                      setUserSearchQuery('');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      modalTab === 'following'
                        ? 'bg-[#F59E0B] text-black shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Following ({followingList.length})
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
                  className="w-full pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#F59E0B]"
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
                  displayedModalCreators.map((item, idx) => {
                    const isMe = item.id === currentUserId;
                    const amIFollowingItem = isFollowingUser(currentUser, item.id, allCreators);
                    const doesItemFollowMe = isFollowedByUser(currentUser, item.id, allCreators);
                    const isItemMutual = amIFollowingItem && doesItemFollowMe;

                    return (
                      <div
                        key={`home-profile-item-${item.id || idx}-${idx}`}
                        className="bg-white/5 border border-white/10 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-3 hover:border-white/20 transition-all"
                      >
                        <div 
                          onClick={() => {
                            setShowUserListModal(false);
                            if (onOpenCreatorProfile) onOpenCreatorProfile(item.id);
                          }}
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer hover:opacity-80 transition-all group"
                          title={`View ${item.name}'s profile`}
                        >
                          {item.avatarUrl && item.avatarUrl.trim() !== '' ? (
                            <img
                              src={getPublicMediaUrl('Gonnng', item.avatarUrl.trim())}
                              alt={item.name}
                              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-white/10 shrink-0 ${
                                amIFollowingItem ? 'ring-2 ring-[#F59E0B] ring-offset-1 ring-offset-[#141414]' : ''
                              }`}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 shrink-0 ${
                              amIFollowingItem ? 'ring-2 ring-[#F59E0B] ring-offset-1 ring-offset-[#141414]' : ''
                            }`}>
                              <User className="w-5 h-5 text-white/70" />
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-bold text-white truncate group-hover:underline">{item.name}</h4>
                              {isMe && (
                                <span className="text-[9px] font-mono font-bold bg-white/20 text-white border border-white/30 px-1.5 py-0.2 rounded-full">
                                  You
                                </span>
                              )}
                              {!isMe && isItemMutual && (
                                <span className="text-[9px] font-mono font-bold bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 px-1.5 py-0.2 rounded-full">
                                  In Circle
                                </span>
                              )}
                              {!isMe && !amIFollowingItem && doesItemFollowMe && (
                                <span className="text-[9px] font-mono text-white/60 bg-white/10 px-1.5 py-0.2 rounded-full">
                                  Follows you
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-mono text-white/50 truncate">
                              @{item.username || item.name.toLowerCase().replace(/\s+/g, '')}
                            </p>
                          </div>
                        </div>

                        {!isMe ? (
                          <button
                            type="button"
                            onClick={() => onToggleFollow(item.id)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                              isItemMutual
                                ? 'bg-[#F59E0B]/20 hover:bg-red-500/20 text-[#F59E0B] hover:text-red-400 border border-[#F59E0B]/40 hover:border-red-500/30'
                                : amIFollowingItem
                                ? 'bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 border border-white/10'
                                : doesItemFollowMe
                                ? 'bg-[#F59E0B] hover:bg-[#FF751A] text-black font-black shadow-sm'
                                : 'bg-[#F59E0B] hover:bg-[#FF751A] text-black font-black shadow-sm'
                            }`}
                          >
                            {isItemMutual ? (
                              <>
                                <CircleDotDashed className="w-3 h-3 text-[#F59E0B]" /> Circle
                              </>
                            ) : amIFollowingItem ? (
                              <>
                                <UserCheck className="w-3 h-3" /> Following
                              </>
                            ) : doesItemFollowMe ? (
                              <>
                                <UserPlus className="w-3 h-3" /> Follow Back
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3 h-3" /> Follow
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-white/40 italic px-2">Account</span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-white/40 text-xs font-sans">
                    <p>
                      {userSearchQuery
                        ? `No ${modalTab} matching "${userSearchQuery}"`
                        : modalTab === 'following'
                        ? 'Not following anyone yet.'
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
    </div>
  );
}
