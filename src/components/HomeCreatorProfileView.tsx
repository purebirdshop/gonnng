import React from 'react';
import { Creator, FeedPost } from '../types';
import { ArrowLeft, UserPlus, UserCheck, Goal, Link, User, ArrowUpRight } from 'lucide-react';
import Feed from './Feed';

interface HomeCreatorProfileViewProps {
  creator: Creator;
  allCreators: Creator[];
  posts: FeedPost[];
  currentUserId: string;
  currentUser: Creator;
  theme?: 'dark' | 'light';
  onBackToHome: () => void;
  onToggleFollow: (creatorId: string) => void;
  onUpdatePostGong: (postId: string, voteType: 'continue' | 'refine' | 'reconsider') => void;
  onAddComment?: (postId: string, commentContent: string, parentId?: string, replyToUser?: string) => void;
  onToggleCommentHeart?: (postId: string, commentId: string) => void;
  onOpenShareDrawer?: (post: FeedPost) => void;
}

export default function HomeCreatorProfileView({
  creator,
  allCreators,
  posts,
  currentUserId,
  currentUser,
  theme = 'dark',
  onBackToHome,
  onToggleFollow,
  onUpdatePostGong,
  onAddComment,
  onToggleCommentHeart,
  onOpenShareDrawer
}: HomeCreatorProfileViewProps) {
  // Filter posts to only show this creator's posts
  const userPosts = posts.filter(p => p.userId === creator.id || p.userName === creator.name);

  // Latest creator data from state if available
  const activeCreator = allCreators.find(c => c.id === creator.id) || creator;

  return (
    <div 
      className="max-w-4xl mx-auto text-white px-2 sm:px-4 md:px-0 w-full min-w-0 h-[calc(100vh-130px)] sm:h-auto overflow-y-scroll sm:overflow-visible snap-y snap-mandatory scroll-smooth sm:scroll-auto no-scrollbar space-y-0 sm:space-y-6"
      id="home-profile-scroll-container"
    >
      {/* Top Bar Navigation to Return to Main Home Feed */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 bg-black/60 backdrop-blur-md sticky top-0 z-30 p-2 sm:p-0">
        <button
          type="button"
          onClick={onBackToHome}
          className="px-3.5 py-1.5 bg-[#FF5C00]/15 hover:bg-[#FF5C00]/25 text-[#FF5C00] border border-[#FF5C00]/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home Feed
        </button>

        <div className="flex items-center gap-1.5 text-xs font-mono text-white/50">
          <Link className="w-3.5 h-3.5 text-[#FF5C00]" />
          <span>gonnng.com/u/{activeCreator.name.toLowerCase().replace(/\s+/g, '')}</span>
        </div>
      </div>

      {/* Creator Profile First Tile */}
      <div 
        className={`snap-start snap-always w-full h-[calc(100vh-140px)] sm:h-auto shrink-0 flex flex-col justify-between ${
          theme === 'light' ? 'bg-white text-gray-900' : 'bg-black text-white'
        } border border-white/10 p-5 sm:p-6 shadow-2xl relative mb-0 sm:mb-6 rounded-none`}
      >
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 min-w-0 w-full">
          <div className={`w-28 h-28 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-display font-bold shadow-lg border-4 relative overflow-hidden shrink-0 mx-auto sm:mx-0 ${
            activeCreator.isFollowing ? 'border-[#FF5C00] shadow-[0_0_20px_rgba(255,92,0,0.3)]' : 'border-white/20'
          }`}>
            {activeCreator.avatarUrl ? (
              <img src={activeCreator.avatarUrl} alt={activeCreator.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                className="p-1.5 bg-[#FF5C00] hover:bg-[#FF751A] text-black rounded-xl transition-all shadow cursor-pointer shrink-0"
                title="Share Profile"
              >
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
            <p className="text-xs font-mono text-[#FF5C00] truncate">
              @{activeCreator.name.toLowerCase().replace(/\s+/g, '')}
            </p>
          </div>
        </div>

        {/* Bio & Goal */}
        <div className="my-auto py-4 space-y-3 bg-white/5 border border-white/10 p-4 rounded-2xl">
          <p className="text-xs text-white/80 leading-relaxed italic">
            "{activeCreator.bio || 'Gonnng Community Creator'}"
          </p>
          {activeCreator.goals && (
            <div className="text-[11px] font-mono text-white/60 pt-2 border-t border-white/10 flex items-center gap-1.5">
              <Goal className="w-3.5 h-3.5 text-[#FF5C00]" />
              <span>Current Goal: <strong className="text-white font-sans">{activeCreator.goals}</strong></span>
            </div>
          )}
        </div>

        {/* Stats & Follow Button */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10 w-full">
          <div className="flex items-center gap-4 text-xs font-mono text-white/70">
            <div>
              <strong className="text-white font-sans text-sm">{activeCreator.followersCount || 0}</strong> Followers
            </div>
            <div>
              <strong className="text-white font-sans text-sm">{activeCreator.followingCount || 0}</strong> Following
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleFollow(activeCreator.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow ${
              activeCreator.isFollowing
                ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                : 'bg-[#FF5C00] text-black font-black hover:bg-[#FF751A]'
            }`}
          >
            {activeCreator.isFollowing ? (
              <>
                <UserCheck className="w-4 h-4 text-[#FF5C00]" /> Following
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Follow
              </>
            )}
          </button>
        </div>
      </div>

      {/* User's Individual Posts Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10 px-2 sm:px-0">
          <h3 className="text-sm font-display font-bold text-white flex items-center gap-2">
            <span>Posts by {activeCreator.name}</span>
            <span className="text-xs font-mono font-bold bg-[#FF5C00]/20 text-[#FF5C00] px-2.5 py-0.5 rounded-full">
              {userPosts.length} POSTS
            </span>
          </h3>
        </div>

        <Feed 
          posts={userPosts}
          currentUserId={currentUserId}
          currentUser={currentUser}
          creators={allCreators}
          filter="all"
          onUpdatePostGong={onUpdatePostGong}
          onAddComment={onAddComment}
          onToggleCommentHeart={onToggleCommentHeart}
          onOpenShareDrawer={onOpenShareDrawer}
        />
      </div>
    </div>
  );
}
